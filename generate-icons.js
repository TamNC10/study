const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'public', 'icon.svg');
const svg = fs.readFileSync(svgPath);

async function generateIcons() {
  await sharp(svg).resize(192, 192).png().toFile(path.join(__dirname, 'public', 'icon-192.png'));
  await sharp(svg).resize(512, 512).png().toFile(path.join(__dirname, 'public', 'icon-512.png'));
  await sharp(svg).resize(32, 32).png().toFile(path.join(__dirname, 'public', 'favicon.ico'));
  console.log('Icons generated!');
}

generateIcons();
