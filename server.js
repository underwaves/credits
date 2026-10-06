import { config } from './src/server/config.js';
import { createApp } from './src/server/app.js';
import * as db from './src/server/services/db.js';

const app = createApp();

db.healthCheck()
  .then(() => {
    const server = app.listen(config.port, () => {
      console.log(`\n======================================================`);
      console.log(`🌤️ SUNFZENITH Web Studio is RUNNING!`);
      console.log(`🌐 Public Website: http://localhost:${config.port}`);
      console.log(`✨ Credits Feed:   http://localhost:${config.port}/credits`);
      console.log(`🔑 Admin Studio:  http://localhost:${config.port}/admin`);
      console.log(`⚡ Environment:   ${config.nodeEnv}`);
      console.log(`======================================================\n`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Error: Port ${config.port} is already in use.`);
      } else {
        console.error('\n❌ Server error:', err.message);
      }
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('\n❌ Supabase Connection Check Failed:', err.message);
    process.exit(1);
  });
