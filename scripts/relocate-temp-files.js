const fs = require('node:fs');
const path = require('node:path');

const rootDir = process.cwd();
const cacheDir = path.join(rootDir, '.cache', 'tinnhiem');
const tempFilePattern = /^tm_.*\.html$/i;

function relocateTempFiles() {
  const files = fs.readdirSync(rootDir).filter((name) => tempFilePattern.test(name));
  if (files.length === 0) return;

  fs.mkdirSync(cacheDir, { recursive: true });

  for (const fileName of files) {
    const sourcePath = path.join(rootDir, fileName);
    const targetPath = path.join(cacheDir, fileName);

    try {
      fs.renameSync(sourcePath, targetPath);
    } catch {
      try {
        fs.copyFileSync(sourcePath, targetPath);
        fs.unlinkSync(sourcePath);
      } catch {
        // Ignore relocation failures to avoid blocking app boot.
      }
    }
  }
}

relocateTempFiles();

