import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import ffmpegPath from 'ffmpeg-static';

const mediaDir = path.resolve('public/media');

const videoConfigs = [
  {
    name: '1.mp4',
    scale: 'scale=480:480',
    crf: '26',
    preset: 'medium',
  },
  {
    name: '2.mp4',
    scale: null, // already 576x1024
    crf: '26',
    preset: 'medium',
  },
  {
    name: 'background/date.mp4',
    scale: null, // Full HD 1080x1920 preserved
    crf: '23',
    preset: 'slow',
  },
  {
    name: 'background/event.mp4',
    scale: null, // already 720x1280
    crf: '26',
    preset: 'medium',
  },
  {
    name: 'background/comments.mp4',
    scale: null, // already 720x1280
    crf: '23',
    preset: 'slow',
  },
  {
    name: 'background/galery.mp4',
    scale: null, // already 720x1280
    crf: '23',
    preset: 'slow',
  },
  {
    name: 'background/last.mp4',
    scale: null, // Full HD 1080x1920 preserved
    crf: '23',
    preset: 'slow',
  },
  {
    name: 'background/reservations.mp4',
    scale: null, // Full HD 1080x1920 preserved
    crf: '23',
    preset: 'slow',
  },
];

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`));
    });
    proc.on('error', reject);
  });
}

async function main() {
  console.log('=== STARTING VIDEO COMPRESSION ===\n');

  let totalOriginalSize = 0;
  let totalCompressedSize = 0;

  for (const config of videoConfigs) {
    const inputPath = path.join(mediaDir, config.name);
    if (!fs.existsSync(inputPath)) {
      console.warn(`File not found: ${config.name}, skipping.`);
      continue;
    }

    const originalSize = fs.statSync(inputPath).size;
    totalOriginalSize += originalSize;

    const tmpPath = path.join(mediaDir, `${config.name}.tmp.mp4`);

    const args = ['-y', '-i', inputPath];

    if (config.scale) {
      args.push('-vf', config.scale);
    }

    args.push(
      '-c:v',
      'libx264',
      '-crf',
      config.crf,
      '-preset',
      config.preset,
      '-pix_fmt',
      'yuv420p',
      '-an', // Strip audio track since all background videos are muted
      '-movflags',
      '+faststart', // Web streaming optimization
      tmpPath
    );

    process.stdout.write(`Compressing ${config.name} (${(originalSize / (1024 * 1024)).toFixed(2)} MB)... `);
    const start = Date.now();

    try {
      await runFfmpeg(args);
      const newSize = fs.statSync(tmpPath).size;
      totalCompressedSize += newSize;

      // Replace original with compressed version
      fs.unlinkSync(inputPath);
      fs.renameSync(tmpPath, inputPath);

      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      const savedPct = (((originalSize - newSize) / originalSize) * 100).toFixed(1);
      console.log(
        `Done in ${elapsed}s -> ${(newSize / (1024 * 1024)).toFixed(2)} MB (${savedPct}% reduction)`
      );
    } catch (err) {
      console.error(`\nFailed to compress ${config.name}:`, err.message);
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
    }
  }

  console.log('\n=== COMPRESSION SUMMARY ===');
  console.log(`Original total size:   ${(totalOriginalSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Compressed total size: ${(totalCompressedSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(
    `Total space saved:     ${(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100).toFixed(1)}% (${((totalOriginalSize - totalCompressedSize) / (1024 * 1024)).toFixed(2)} MB saved)`
  );
}

main().catch((err) => {
  console.error('Compression script failed:', err);
  process.exit(1);
});
