import dotenv from 'dotenv';
dotenv.config();

import fetch from 'node-fetch';
async function test() {
   const res = await fetch('http://190.220.229.45:7256/api/v1/storage/files/853', {
      headers: { 'X-API-KEY': process.env.SPIDERWEBAPIKEY.trim() }
   });
   console.log('Status:', res.status, res.headers.get('content-type'));
}
test();
