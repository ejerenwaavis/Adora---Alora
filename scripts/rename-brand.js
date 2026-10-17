const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

const excludeDirs = ['node_modules', '.git', 'public', 'public_html', 'dist'];
const excludeExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.woff', '.woff2'];

// The regexes and their replacements
const replacements = [
  // HTML encoded versions
  { regex: /Adora\s*&amp;\s*Alora/gi, replace: 'Aora House' },
  // Standard versions
  { regex: /Adora\s*&\s*Alora/gi, replace: 'Aora House' },
  { regex: /Adora\s*and\s*Alora/gi, replace: 'Aora House' },
  // URL / package-friendly versions
  { regex: /aora-house/g, replace: 'aora-house' },
  { regex: /Adora\s*Alora/gi, replace: 'Aora House' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        processDirectory(fullPath);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (!excludeExts.includes(ext) && stat.size < 5 * 1024 * 1024) { // skip large files > 5MB
        processFile(fullPath);
      }
    }
  }
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let modified = false;

    for (const r of replacements) {
      if (r.regex.test(content)) {
        content = content.replace(r.regex, r.replace);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${path.relative(projectRoot, filePath)}`);
    }
  } catch (err) {
    // silently skip binary files or unreadable files
  }
}

processDirectory(projectRoot);
console.log('Done.');
