import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const sourceDir = path.resolve('public/media/galery');
const backupDir = path.resolve('.galery_raw_backup');

async function run() {
  console.log('1. Creating backup of raw images to:', backupDir);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const rawFiles = fs.readdirSync(sourceDir);
  for (const file of rawFiles) {
    const src = path.join(sourceDir, file);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, path.join(backupDir, file));
    }
  }
  console.log(`Backed up ${rawFiles.length} files.`);

  // Clear source dir so we write clean new files
  for (const file of rawFiles) {
    fs.unlinkSync(path.join(sourceDir, file));
  }

  let totalOriginal = 0;
  let totalCompressed = 0;
  const processedFiles = [];

  console.log('2. Compressing images...');
  for (const file of rawFiles) {
    const srcPath = path.join(backupDir, file);
    if (!fs.statSync(srcPath).isFile()) continue;

    const originalSize = fs.statSync(srcPath).size;
    totalOriginal += originalSize;

    // Clean up filename: IMG_0802 copy.jpg -> IMG_0802.jpg, lowercase extension
    let cleanName = file.replace(' copy', '');
    const ext = path.extname(cleanName);
    const base = path.basename(cleanName, ext);
    const targetFilename = `${base}.jpg`;
    const destPath = path.join(sourceDir, targetFilename);

    await sharp(srcPath)
      .rotate() // preserve/apply EXIF orientation
      .resize({
        width: 2048,
        height: 2048,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
        mozjpeg: true,
      })
      .toFile(destPath);

    const compSize = fs.statSync(destPath).size;
    totalCompressed += compSize;
    processedFiles.push(targetFilename);

    console.log(
      `✓ ${file} -> ${targetFilename} (${(originalSize / (1024 * 1024)).toFixed(2)} MB -> ${(compSize / 1024).toFixed(1)} KB)`
    );
  }

  console.log('\n--- COMPRESSION SUMMARY ---');
  console.log(`Total original: ${(totalOriginal / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Total compressed: ${(totalCompressed / (1024 * 1024)).toFixed(2)} MB`);
  console.log(
    `Saved: ${((1 - totalCompressed / totalOriginal) * 100).toFixed(1)}% space!`
  );

  // Natural sort files
  processedFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  console.log('\nFinal file list:');
  console.log(JSON.stringify(processedFiles, null, 2));
}

run().catch((err) => {
  console.error('Error during compression:', err);
  process.exit(1);
});
