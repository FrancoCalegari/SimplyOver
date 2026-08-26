import fs from 'fs';
import { query } from './lib/db.js';
async function run() {
  try {
    await query("ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE");
    await query("ALTER TABLE users ADD COLUMN verification_token VARCHAR(255) NULL");
    console.log('Columns added');
  } catch(e) {
    console.log('Already exists or error:', e.message);
  }
}
run().then(()=>process.exit(0));
