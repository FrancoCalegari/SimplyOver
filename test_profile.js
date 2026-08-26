import { query } from './lib/db.js';
async function test() {
  const sets = ['display_name = ?', 'bio = ?', 'updated_at = NOW()'];
  const params = ['Santi Changed', 'New Bio', 'ef86663b-6596-11f1-8ab1-02420a000104'];
  
  try {
    await query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);
    const users = await query("SELECT id, username, display_name, bio FROM users WHERE username = 'santi'");
    console.log('Users after:', users);
  } catch (err) {
    console.error('Error:', err);
  }
}
test().then(() => process.exit(0));
