import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Provide mock environment variables for Supabase initialization
process.env.SUPABASE_URL = 'https://mock-test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key-test';

// Shared spies (hoisted so the vi.mock factory can safely reference them)
const { storageRemove, updateCalls } = vi.hoisted(() => ({
  storageRemove: vi.fn(() => Promise.resolve({ data: {}, error: null })),
  updateCalls: []
}));

function defaultShopConfigResult() {
  return {
    data: {
      stats: {
        total_sales: 42, // unrelated stats key that must never be wiped
        customer_reviews: [
          { id: 'fallback-rev-1', type: '+1', customer_name: 'Fallback Customer', message: 'Good service', images: ['fallback-proof.jpg'] }
        ]
      }
    },
    error: null
  };
}

// Results per table/operation (reset in beforeEach)
let mockCustomerReviewsResult;        // select / insert on customer_reviews
let mockCustomerReviewsDeleteResult;  // delete on customer_reviews (null => same as mockCustomerReviewsResult)
let mockShopConfigResult;             // select on shop_config
let mockShopConfigUpdateResult;       // update on shop_config
let mockContactMessagesResult;        // insert on contact_messages

function resolveResult(table, op) {
  if (table === 'customer_reviews') {
    if (op === 'delete' && mockCustomerReviewsDeleteResult) return mockCustomerReviewsDeleteResult;
    return mockCustomerReviewsResult;
  }
  if (table === 'shop_config') {
    return op === 'update' ? mockShopConfigUpdateResult : mockShopConfigResult;
  }
  if (table === 'contact_messages') return mockContactMessagesResult;
  return { data: null, error: null };
}

function createChainableQuery(table) {
  let op = 'select';
  const result = () => resolveResult(table, op);
  const query = {
    select: vi.fn(() => query),
    insert: vi.fn(() => { op = 'insert'; return query; }),
    update: vi.fn((payload) => { op = 'update'; updateCalls.push({ table, payload }); return query; }),
    delete: vi.fn(() => { op = 'delete'; return query; }),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    order: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve(result())),
    maybeSingle: vi.fn(() => Promise.resolve(result())),
    then: (resolve, reject) => Promise.resolve(result()).then(resolve, reject)
  };
  return query;
}

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      from: vi.fn((table) => createChainableQuery(table)),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn(() => Promise.resolve({ data: {}, error: null })),
          getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://mock-cdn.com/test.jpg' } })),
          remove: storageRemove
        }))
      }
    }))
  };
});

const shopConfigUpdates = () => updateCalls.filter((c) => c.table === 'shop_config');

describe('Supabase Error Handling & Fallback Logging', () => {
  let dbService;
  let warnSpy;
  let errorSpy;

  beforeEach(async () => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Reset default mock state
    mockCustomerReviewsResult = { data: null, error: null };
    mockCustomerReviewsDeleteResult = null;
    mockShopConfigResult = defaultShopConfigResult();
    mockShopConfigUpdateResult = { data: null, error: null };
    mockContactMessagesResult = { data: null, error: null };
    updateCalls.length = 0;
    storageRemove.mockClear();

    // Dynamically import service with mocked Supabase
    dbService = await import('../src/server/services/db.js');
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('src/server/services/db.js', () => {
    it('getCustomerReviews logs warning and error object when Supabase query returns error, then successfully falls back to shop_config', async () => {
      const dbError = { message: 'relation "customer_reviews" does not exist', code: '42P01' };
      mockCustomerReviewsResult = { data: null, error: dbError };

      const reviews = await dbService.getCustomerReviews();

      // 1. Verify warning was logged with operation and error object
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[db.getCustomerReviews] Failed reading customer_reviews table'),
        dbError
      );

      // 2. Verify fallback succeeded
      expect(Array.isArray(reviews)).toBe(true);
      expect(reviews.length).toBe(1);
      expect(reviews[0].id).toBe('fallback-rev-1');
    });

    it('createCustomerReview logs warning and error object when table insert returns error, then saves to shop_config fallback', async () => {
      const insertError = { message: 'permission denied for table customer_reviews', code: '42501' };
      mockCustomerReviewsResult = { data: null, error: insertError };

      const result = await dbService.createCustomerReview({
        type: '+1',
        customerName: 'Test Buyer',
        message: 'Great transaction',
        images: []
      });

      // 1. Verify warning was logged with operation and error object
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[db.createCustomerReview] Failed inserting into customer_reviews table'),
        insertError
      );

      // 2. Verify fallback returned client review object
      expect(result).toBeDefined();
      expect(result.customerName).toBe('Test Buyer');
      expect(result.type).toBe('+1');
    });

    it('createCustomerReview fallback preserves other stats keys and existing reviews', async () => {
      mockCustomerReviewsResult = { data: null, error: { message: 'insert failed', code: '42501' } };

      const result = await dbService.createCustomerReview({ type: '+1', customerName: 'Keeper', message: 'hi', images: [] });

      const updates = shopConfigUpdates();
      expect(updates).toHaveLength(1);
      const { stats } = updates[0].payload;
      expect(stats.total_sales).toBe(42);
      expect(stats.customer_reviews.map((r) => r.id)).toEqual([result.id, 'fallback-rev-1']);
    });

    it('createCustomerReview does NOT overwrite shop_config stats and throws when the fallback read fails', async () => {
      mockCustomerReviewsResult = { data: null, error: { message: 'insert failed', code: '42501' } };
      const readError = { message: 'shop_config read timeout', code: '57014' };
      mockShopConfigResult = { data: null, error: readError };

      await expect(
        dbService.createCustomerReview({ type: '+1', customerName: 'Lost', message: 'x', images: [] })
      ).rejects.toThrow(/Failed to save customer review/);

      expect(shopConfigUpdates()).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[db.createCustomerReview] Failed reading shop_config stats for fallback insert'),
        readError
      );
    });

    it('createCustomerReview throws when the fallback update fails', async () => {
      mockCustomerReviewsResult = { data: null, error: { message: 'insert failed', code: '42501' } };
      mockShopConfigUpdateResult = { data: null, error: { message: 'update failed', code: '42501' } };

      await expect(
        dbService.createCustomerReview({ type: '-1', customerName: 'Lost', message: 'x', images: [] })
      ).rejects.toThrow(/Failed to save customer review/);
    });

    it('deleteCustomerReview logs warning and error object when delete query returns error, and continues fallback delete when primary confirms absence', async () => {
      const deleteError = { message: 'violates foreign key constraint', code: '23503' };
      mockCustomerReviewsResult = { data: null, error: null };
      mockCustomerReviewsDeleteResult = { data: null, error: deleteError };

      const success = await dbService.deleteCustomerReview('fallback-rev-1');

      // 1. Verify warning was logged with operation and error object
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[db.deleteCustomerReview] Failed deleting from customer_reviews table'),
        deleteError
      );

      // 2. Verify function returns true (review confirmed absent in primary and removed from fallback) and its images were cleaned up
      expect(success).toBe(true);
      expect(storageRemove).toHaveBeenCalledWith(['fallback-proof.jpg']);
    });

    it('deleteCustomerReview throws and keeps images when primary delete fails and primary status cannot be verified (even if fallback deletes)', async () => {
      const primaryErr = { message: 'connection reset on customer_reviews', code: '08006' };
      mockCustomerReviewsResult = { data: null, error: primaryErr };

      await expect(dbService.deleteCustomerReview('fallback-rev-1')).rejects.toThrow(/review may still exist/);
      expect(storageRemove).not.toHaveBeenCalled();
    });

    it('deleteCustomerReview succeeds when review ID is confirmed absent from both primary and fallback sources', async () => {
      mockCustomerReviewsResult = { data: null, error: null };
      mockCustomerReviewsDeleteResult = { data: null, error: { message: 'delete blocked', code: '42501' } };

      const success = await dbService.deleteCustomerReview('non-existent-review-id');
      expect(success).toBe(true);
      expect(storageRemove).not.toHaveBeenCalled();
    });

    it('deleteCustomerReview removes images and returns true when the primary delete succeeds', async () => {
      mockCustomerReviewsResult = { data: { images: ['primary-proof.jpg'] }, error: null };
      mockCustomerReviewsDeleteResult = { data: null, error: null };

      const success = await dbService.deleteCustomerReview('rev-primary');

      expect(success).toBe(true);
      expect(storageRemove).toHaveBeenCalledWith(['primary-proof.jpg']);
    });

    it('deleteCustomerReview keeps images and throws when the review exists but the primary delete fails', async () => {
      mockCustomerReviewsResult = { data: { images: ['primary-proof.jpg'] }, error: null };
      mockCustomerReviewsDeleteResult = { data: null, error: { message: 'row lock contention', code: '55P03' } };

      await expect(dbService.deleteCustomerReview('rev-primary')).rejects.toThrow(/review may still exist/);
      expect(storageRemove).not.toHaveBeenCalled();
    });

    it('deleteCustomerReview throws when deletion cannot be confirmed in either location', async () => {
      mockCustomerReviewsResult = { data: null, error: { message: 'connection reset', code: '08006' } };
      mockShopConfigResult = { data: null, error: { message: 'shop_config read timeout', code: '57014' } };

      await expect(dbService.deleteCustomerReview('rev-unknown')).rejects.toThrow(/review may still exist/);
      expect(storageRemove).not.toHaveBeenCalled();
      expect(shopConfigUpdates()).toHaveLength(0);
    });

    it('getCustomerReviews logs warning when fallback shop_config query also returns error', async () => {
      const primaryError = { message: 'relation "customer_reviews" does not exist', code: '42P01' };
      const fallbackError = { message: 'shop_config read timeout', code: '57014' };
      mockCustomerReviewsResult = { data: null, error: primaryError };
      mockShopConfigResult = { data: null, error: fallbackError };

      const reviews = await dbService.getCustomerReviews();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[db.getCustomerReviews] Failed reading customer_reviews table'),
        primaryError
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[db.getCustomerReviews] Failed reading shop_config stats customer_reviews fallback'),
        fallbackError
      );
      expect(reviews).toEqual([]);
    });

    it('saveContactMessage does NOT overwrite shop_config stats and throws when the fallback read fails', async () => {
      mockContactMessagesResult = { data: null, error: { message: 'relation "contact_messages" does not exist', code: '42P01' } };
      mockShopConfigResult = { data: null, error: { message: 'shop_config read timeout', code: '57014' } };

      await expect(
        dbService.saveContactMessage({ name: 'A', contactChannel: 'line', contactValue: 'a', service: 's', budget: 'b', details: 'd' })
      ).rejects.toThrow(/Failed to save contact message/);
      expect(shopConfigUpdates()).toHaveLength(0);
    });
  });
});
