import fs from 'fs';
import { query } from './lib/db.js';
async function run() {
  const sql = fs.readFileSync('create_follows.js', 'utf8');
  console.log('Running:', sql);
  await query(sql);
  console.log('Done');
}
run().then(()=>process.exit(0)).catch(e=>console.error(e));
