import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sourceImage = 'C:\\Users\\Ashwin\\Downloads\\favicon.ico.png';
const publicDir = './public';
const assetsDir = './src/assets';

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

async function generateIcons() {
  try {
    // Save main logo to src/assets
    await sharp(sourceImage)
      .toFile(path.join(assetsDir, 'logo.png'));
    
    // SVG version (we can't convert png to svg easily, but we can replace svg imports with png in code)
    // Actually just copy it as a standard png for public too
    await sharp(sourceImage)
      .resize(512, 512)
      .toFile(path.join(publicDir, 'logo.png'));

    // Generate favicons
    await sharp(sourceImage).resize(16, 16).toFile(path.join(publicDir, 'favicon-16x16.png'));
    await sharp(sourceImage).resize(32, 32).toFile(path.join(publicDir, 'favicon-32x32.png'));
    await sharp(sourceImage).resize(180, 180).toFile(path.join(publicDir, 'apple-touch-icon.png'));
    await sharp(sourceImage).resize(192, 192).toFile(path.join(publicDir, 'android-chrome-192x192.png'));
    await sharp(sourceImage).resize(512, 512).toFile(path.join(publicDir, 'android-chrome-512x512.png'));

    // For favicon.ico, we can just use a 32x32 png renamed (many browsers accept this)
    // or properly convert. Let's just create a 32x32 png and rename it to .ico
    const icoBuffer = await sharp(sourceImage).resize(32, 32).png().toBuffer();
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
