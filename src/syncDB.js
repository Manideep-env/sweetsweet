// scripts/syncDb.js

import { sequelize } from './lib/db.js';

// ✅ Import index.js once — this sets up all associations
import './models/index.js'; // 👈 This ensures associations are applied

async function syncDb() {
  try {
    await sequelize.sync({ force: true }); // or { alter: true } for non-destructive
    console.log('Database synced (force: true)');
    process.exit(0);
  } catch (err) {
    console.error('Sync failed:', err);
    process.exit(1);
  }
}

syncDb();
