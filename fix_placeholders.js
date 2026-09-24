import fs from 'fs';
import path from 'path';

const VIEWS_DIR = './views';
const SERVER_FILE = './server.js';

const regex = /'https:\/\/via\.placeholder\.com\/[^']+'/g;
const replacement = "'/images/placeholder.svg'";

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ejs')) {
      processFile(fullPath);
    }
  }
}

walkDir(VIEWS_DIR);
processFile(SERVER_FILE);
console.log('Done.');
