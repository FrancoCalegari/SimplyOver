const fs = require('fs');
const path = require('path');

// Load env variables from .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const url = `${env.SPIDERWEBURL}/query`;
const apiKey = env.SPIDERWEBAPIKEY;
const dbName = env.SPIDERWEBDB;

console.log(`Using DB: ${dbName}`);
console.log(`Connecting to: ${url}`);

const schemaSql = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');

// Parse statements: split by semicolon followed by newline
const rawStatements = schemaSql.split(/;[ \t\r]*\n/);

const statements = [];
for (let stmt of rawStatements) {
  stmt = stmt.trim();
  // Skip comments and empty statements
  if (!stmt) continue;
  // If it starts with `--` and has no actual SQL logic, skip it
  const lines = stmt.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('--'));
  if (lines.length === 0) continue;
  
  statements.push(stmt);
}

console.log(`Parsed ${statements.length} SQL statements to execute.`);

async function run() {
  for (let i = 0; i < statements.length; i++) {
    const query = statements[i];
    const firstLine = query.split('\n')[0].trim();
    console.log(`[${i + 1}/${statements.length}] Executing: ${firstLine}...`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey
        },
        body: JSON.stringify({
          database: dbName,
          query: query
        })
      });

      const resText = await response.text();
      let resJson;
      try {
        resJson = JSON.parse(resText);
      } catch (e) {
        resJson = null;
      }

      if (response.status !== 200 || (resJson && resJson.error)) {
        console.error(`❌ FAILED with status ${response.status}`);
        console.error(`Query: ${query}`);
        console.error(`Response: ${resText}`);
        process.exit(1);
      } else {
        console.log(`✅ Success`);
      }
    } catch (err) {
      console.error(`❌ FAILED to send request:`, err);
      process.exit(1);
    }
  }
  
  console.log('🎉 Database schema initialized successfully on MariaDB!');
}

run();
