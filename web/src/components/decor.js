/**
 * SVG Decor Elements (Cloud, Sun, Stars, Moon, Sparkle)
 */

export function StarIcon({ size = 24, className = '' } = {}) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" class="${className}">
      <path d="M12 1.5L14.7 8.3L22 9.2L16.5 14.1L18.1 21.3L12 17.6L5.9 21.3L7.5 14.1L2 9.2L9.3 8.3L12 1.5Z"/>
    </svg>
  `;
}

export function SparkleIcon({ size = 20, className = '' } = {}) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" class="${className}">
      <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"/>
    </svg>
  `;
}

export function SunIcon({ size = 32, className = '' } = {}) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" class="${className}">
      <circle cx="16" cy="16" r="8" fill="#FBBF24"/>
      <path d="M16 2V5M16 27V30M2 16H5M27 16H30M6.1 6.1L8.2 8.2M23.8 23.8L25.9 25.9M6.1 25.9L8.2 23.8M23.8 8.2L25.9 6.1" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `;
}

export function CloudIcon({ size = 48, className = '' } = {}) {
  return `
    <svg width="${size}" height="${size * 0.6}" viewBox="0 0 64 38" fill="currentColor" class="${className}">
      <path d="M48 38H14C6.268 38 0 31.732 0 24C0 16.924 5.253 11.084 12.124 10.155C14.076 4.305 19.57 0 26 0C33.722 0 40.154 5.922 41.077 13.513C43.149 12.54 45.474 12 48 12C56.837 12 64 19.163 64 28C64 33.523 57.5 38 48 38Z" opacity="0.9"/>
    </svg>
  `;
}
