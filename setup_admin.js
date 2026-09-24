import bcrypt from 'bcryptjs';
import { spiderWeb } from './lib/SpiderWebService.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  try {
    const email = 'francocalegari55@gmail.com';
    const password = '137546321';
    
    console.log('Updating user...');
    const passwordHash = await bcrypt.hash(password, 10);
    await spiderWeb.query(`UPDATE users SET password_hash = '${passwordHash}', role = 'admin', status = 'active' WHERE email = '${email}'`);
    console.log('User role updated to admin successfully.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
main();
