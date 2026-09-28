const fs = require('fs');
const c = fs.readFileSync('routes/index.ts', 'utf8');
let fixed = '';
const lines = c.split('\n');
for (let i = 0; i < lines.length; i++) {
  let l = lines[i];
  if (l.match(/^  ".*$/)) {
    l = l.replace(/^ "/, ' ');
    l = l.replace(/";$/, ';');
  }
  fixed += l + (i < lines.length - 1 ? '\n' : '');
}
fs.writeFileSync('routes/index.ts', fixed, 'utf8');
console.log('Fixed');
