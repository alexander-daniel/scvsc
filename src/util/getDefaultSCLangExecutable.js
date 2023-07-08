const fs = require('fs');
const path = require('path');

function getDefaultSCLangExecutable() {
  switch (process.platform) {
    case 'darwin':
      return '/Applications/SuperCollider.app/Contents/MacOS/sclang';
    case 'win32':
      const root = 'C:\\Program Files';
      const directories = fs.readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name.startsWith("SuperCollider-"));
      if (directories.length > 0) {
        return path.join(root, directories[0].name, 'sclang.exe');
      }
      return 'sclang';
    default:
      return 'sclang';
  }
}

module.exports = {
  getDefaultSCLangExecutable,
};