const fs = require('fs');
const path = require('path');

const targetDirs = [
  'c:/github/trazalga/trazalga-web/src/components/dashboard',
  'c:/github/trazalga/trazalga-web/src/components/layout',
  'c:/github/trazalga/trazalga-web/src/pages',
  'c:/github/trazalga/trazalga-web/src/components/admin'
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Replace 1px solid borders
  content = content.replace(/border:\s*'1px solid #e2e8f0'/g, "border: 1, borderColor: 'divider'");
  content = content.replace(/borderBottom:\s*'1px solid #e2e8f0'/g, "borderBottom: 1, borderColor: 'divider'");
  content = content.replace(/borderTop:\s*'1px solid #e2e8f0'/g, "borderTop: 1, borderColor: 'divider'");
  content = content.replace(/borderLeft:\s*'1px solid #e2e8f0'/g, "borderLeft: 1, borderColor: 'divider'");
  content = content.replace(/borderRight:\s*'1px solid #e2e8f0'/g, "borderRight: 1, borderColor: 'divider'");

  content = content.replace(/border:\s*'1px solid #f1f5f9'/g, "border: 1, borderColor: 'divider'");
  content = content.replace(/borderBottom:\s*'1px solid #f1f5f9'/g, "borderBottom: 1, borderColor: 'divider'");
  content = content.replace(/borderTop:\s*'1px solid #f1f5f9'/g, "borderTop: 1, borderColor: 'divider'");
  content = content.replace(/borderLeft:\s*'1px solid #f1f5f9'/g, "borderLeft: 1, borderColor: 'divider'");
  content = content.replace(/borderRight:\s*'1px solid #f1f5f9'/g, "borderRight: 1, borderColor: 'divider'");

  content = content.replace(/borderBottom:\s*'2px solid #e2e8f0'/g, "borderBottom: 2, borderColor: 'divider'");
  
  content = content.replace(/border:\s*'1px solid #cbd5e1'/g, "border: 1, borderColor: 'divider'");

  // Replace standalone color hex values without quotes in strings
  // but we can't blindly do this unless they are standalone or we know the property.
  const colorMap = {
    // Backgrounds
    "'#ffffff'": "'background.paper'",
    '"#ffffff"': "'background.paper'",
    "'#f8fafc'": "'background.default'",
    '"#f8fafc"': "'background.default'",
    "'#fbfbfb'": "'background.default'",
    '"#fbfbfb"': "'background.default'",
    "'#f1f5f9'": "'divider'",
    '"#f1f5f9"': "'divider'",
    
    // Text & Icons
    "'#0f172a'": "'text.primary'",
    '"#0f172a"': "'text.primary'",
    "'#334155'": "'text.primary'",
    '"#334155"': "'text.primary'",
    "'#475569'": "'text.primary'",
    '"#475569"': "'text.primary'",
    
    "'#64748b'": "'text.secondary'",
    '"#64748b"': "'text.secondary'",
    "'#94a3b8'": "'text.disabled'",
    '"#94a3b8"': "'text.disabled'",
    
    // Borders
    "'#e2e8f0'": "'divider'",
    '"#e2e8f0"': "'divider'",
    "'#cbd5e1'": "'divider'",
    '"#cbd5e1"': "'divider'",
    
    // Primary
    "'#0a192f'": "'primary.main'",
    '"#0a192f"': "'primary.main'",
    "'#172a45'": "'primary.light'",
    '"#172a45"': "'primary.light'",
    
    // Accents / Actions
    "'#0ea5e9'": "'secondary.main'",
    '"#0ea5e9"': "'secondary.main'",
    "'#10b981'": "'success.main'",
    '"#10b981"': "'success.main'",
    "'#ef4444'": "'error.main'",
    '"#ef4444"': "'error.main'",
    "'#dc2626'": "'error.dark'",
    '"#dc2626"': "'error.dark'",
    "'#fee2e2'": "'error.light'",
    '"#fee2e2"': "'error.light'",
    "'#fca5a5'": "'error.light'",
    '"#fca5a5"': "'error.light'",
    
    "'#f59e0b'": "'warning.main'",
    '"#f59e0b"': "'warning.main'",
  };

  Object.keys(colorMap).forEach(hex => {
    const regex = new RegExp(hex.replace(/"/g, '\\"').replace(/'/g, "\\'"), 'gi');
    content = content.replace(regex, colorMap[hex]);
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated borders and colors in ${filePath}`);
  }
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

targetDirs.forEach(dir => processDirectory(dir));
console.log('Done fixing borders and additional hex values.');
