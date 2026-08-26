import { query } from './lib/db.js';
async function test() {
  const users = await query("SELECT id, username, avatar_storage_id, banner_storage_id FROM users");
  console.log('Users:', users);
}
test().then(() => process.exit(0));
