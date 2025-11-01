#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createPngIcons() {
  const assetsDir = path.join(__dirname, '../src/assets');
  
  // Read SVG files
  const iconSvg = fs.readFileSync(path.join(assetsDir, 'icon.svg'));
  const trayIconSvg = fs.readFileSync(path.join(assetsDir, 'tray-icon.svg'));
  
  // Convert main icon to PNG
  await sharp(iconSvg)
    .resize(256, 256)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
  
  // Convert tray icon to PNG in multiple sizes
  await sharp(trayIconSvg)
    .resize(16, 16)
    .png()
    .toFile(path.join(assetsDir, 'tray-icon.png'));
    
  await sharp(trayIconSvg)
    .resize(22, 22)
    .png()
    .toFile(path.join(assetsDir, 'tray-icon@2x.png'));
  
  console.log('PNG icons created successfully!');
}

createPngIcons().catch(console.error);