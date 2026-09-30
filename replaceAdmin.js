const fs = require('fs');
const path = require('path');

const targetEmail = '727824tuio046@skct.edu.in';
const oldEmail = 'tharunkarthikav21@gmail.com';

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        replaceInDir(fullPath);
      }
    } else {
      if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(oldEmail)) {
          content = content.replace(new RegExp(oldEmail, 'g'), targetEmail);
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Updated ${fullPath}`);
        }
      }
    }
  }
}

replaceInDir(path.join(__dirname, 'frontend', 'src'));
replaceInDir(path.join(__dirname, 'backend'));
console.log('Done replacing admin email!');
