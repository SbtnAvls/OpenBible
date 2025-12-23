const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

const SOURCE_ICON =
  process.argv[2] || '/mnt/c/Users/juans/Downloads/bibleIcon.png';
const ANDROID_RES = path.join(__dirname, '../android/app/src/main/res');
const IOS_ASSETS = path.join(
  __dirname,
  '../ios/OpenBible/Images.xcassets/AppIcon.appiconset',
);

// Padding percentage (5% = icon takes 90% of space)
const PADDING_PERCENT = 0.05;

// Android icon sizes
const ANDROID_SIZES = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

// iOS icon sizes (size * scale)
const IOS_SIZES = [
  { name: 'Icon-20@2x.png', size: 40 },
  { name: 'Icon-20@3x.png', size: 60 },
  { name: 'Icon-29@2x.png', size: 58 },
  { name: 'Icon-29@3x.png', size: 87 },
  { name: 'Icon-40@2x.png', size: 80 },
  { name: 'Icon-40@3x.png', size: 120 },
  { name: 'Icon-60@2x.png', size: 120 },
  { name: 'Icon-60@3x.png', size: 180 },
  { name: 'Icon-1024.png', size: 1024 },
];

// Find bounds of non-white content
function findContentBounds(image) {
  const width = image.width;
  const height = image.height;

  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0;
  const threshold = 250; // Consider pixels with R,G,B < 250 as content

  image.scan(0, 0, width, height, function (x, y, idx) {
    const red = this.bitmap.data[idx];
    const green = this.bitmap.data[idx + 1];
    const blue = this.bitmap.data[idx + 2];
    const alpha = this.bitmap.data[idx + 3];

    // Check if pixel is not white/transparent
    if (
      alpha > 10 &&
      (red < threshold || green < threshold || blue < threshold)
    ) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  });

  return { minX, minY, maxX, maxY };
}

async function generateIcons() {
  console.log('Generating icons from:', SOURCE_ICON);

  // Verify source exists
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error('Source icon not found:', SOURCE_ICON);
    process.exit(1);
  }

  let sourceImage = await Jimp.read(SOURCE_ICON);

  // Find and crop to content bounds
  console.log('\nAnalyzing image...');
  console.log(`  Original size: ${sourceImage.width}x${sourceImage.height}`);

  const bounds = findContentBounds(sourceImage);
  console.log(
    `  Content bounds: (${bounds.minX},${bounds.minY}) to (${bounds.maxX},${bounds.maxY})`,
  );

  const contentWidth = bounds.maxX - bounds.minX;
  const contentHeight = bounds.maxY - bounds.minY;
  console.log(`  Content size: ${contentWidth}x${contentHeight}`);

  // Crop to content with small margin
  const margin = 5;
  const cropX = Math.max(0, bounds.minX - margin);
  const cropY = Math.max(0, bounds.minY - margin);
  const cropW = Math.min(sourceImage.width - cropX, contentWidth + margin * 2);
  const cropH = Math.min(
    sourceImage.height - cropY,
    contentHeight + margin * 2,
  );

  sourceImage = sourceImage.crop({ x: cropX, y: cropY, w: cropW, h: cropH });
  console.log(`  Cropped to: ${sourceImage.width}x${sourceImage.height}`);

  // Generate Android icons
  console.log('\n--- Android Icons ---');
  for (const { folder, size } of ANDROID_SIZES) {
    const outputDir = path.join(ANDROID_RES, folder);
    const outputFile = path.join(outputDir, 'ic_launcher.png');
    const roundOutputFile = path.join(outputDir, 'ic_launcher_round.png');

    // Calculate inner size with padding
    const padding = Math.floor(size * PADDING_PERCENT);
    const innerSize = size - padding * 2;

    // Create white background
    const icon = new Jimp({ width: size, height: size, color: 0xffffffff });

    // Resize source to fit inner area
    const resized = sourceImage.clone();
    resized.contain({ w: innerSize, h: innerSize });

    // Composite centered
    const offsetX = Math.floor((size - resized.width) / 2);
    const offsetY = Math.floor((size - resized.height) / 2);
    icon.composite(resized, offsetX, offsetY);

    await icon.write(outputFile);

    // Round icon - same content (Android applies circular mask)
    const roundIcon = new Jimp({
      width: size,
      height: size,
      color: 0xffffffff,
    });
    roundIcon.composite(resized, offsetX, offsetY);
    await roundIcon.write(roundOutputFile);

    console.log(`  ${folder}: ${size}x${size} (padding: ${padding}px)`);
  }

  // Generate iOS icons
  console.log('\n--- iOS Icons ---');
  for (const { name, size } of IOS_SIZES) {
    const outputFile = path.join(IOS_ASSETS, name);

    // Calculate inner size with padding
    const padding = Math.floor(size * PADDING_PERCENT);
    const innerSize = size - padding * 2;

    // Create white background
    const icon = new Jimp({ width: size, height: size, color: 0xffffffff });

    // Resize source to fit inner area
    const resized = sourceImage.clone();
    resized.contain({ w: innerSize, h: innerSize });

    // Composite centered
    const offsetX = Math.floor((size - resized.width) / 2);
    const offsetY = Math.floor((size - resized.height) / 2);
    icon.composite(resized, offsetX, offsetY);

    await icon.write(outputFile);

    console.log(`  ${name}: ${size}x${size}`);
  }

  // Update iOS Contents.json
  const contentsJson = {
    images: [
      {
        idiom: 'iphone',
        scale: '2x',
        size: '20x20',
        filename: 'Icon-20@2x.png',
      },
      {
        idiom: 'iphone',
        scale: '3x',
        size: '20x20',
        filename: 'Icon-20@3x.png',
      },
      {
        idiom: 'iphone',
        scale: '2x',
        size: '29x29',
        filename: 'Icon-29@2x.png',
      },
      {
        idiom: 'iphone',
        scale: '3x',
        size: '29x29',
        filename: 'Icon-29@3x.png',
      },
      {
        idiom: 'iphone',
        scale: '2x',
        size: '40x40',
        filename: 'Icon-40@2x.png',
      },
      {
        idiom: 'iphone',
        scale: '3x',
        size: '40x40',
        filename: 'Icon-40@3x.png',
      },
      {
        idiom: 'iphone',
        scale: '2x',
        size: '60x60',
        filename: 'Icon-60@2x.png',
      },
      {
        idiom: 'iphone',
        scale: '3x',
        size: '60x60',
        filename: 'Icon-60@3x.png',
      },
      {
        idiom: 'ios-marketing',
        scale: '1x',
        size: '1024x1024',
        filename: 'Icon-1024.png',
      },
    ],
    info: { author: 'xcode', version: 1 },
  };

  fs.writeFileSync(
    path.join(IOS_ASSETS, 'Contents.json'),
    JSON.stringify(contentsJson, null, 2),
  );
  console.log('\n  Updated Contents.json');

  console.log('\nDone! Icons generated successfully.');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
