#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create simple placeholder icon using SVG
const iconSvg = `
<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" rx="32" fill="#111214"/>
  <rect x="32" y="32" width="192" height="192" rx="16" fill="#00E5FF" opacity="0.8"/>
  <rect x="48" y="64" width="160" height="4" fill="#ffffff"/>
  <rect x="48" y="80" width="128" height="4" fill="#ffffff" opacity="0.8"/>
  <rect x="48" y="96" width="144" height="4" fill="#ffffff" opacity="0.6"/>
  <rect x="48" y="112" width="112" height="4" fill="#ffffff" opacity="0.4"/>
</svg>
`;

const trayIconSvg = `
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="4" fill="#111214"/>
  <rect x="4" y="4" width="24" height="24" rx="2" fill="#00E5FF" opacity="0.8"/>
  <rect x="6" y="8" width="20" height="1" fill="#ffffff"/>
  <rect x="6" y="10" width="16" height="1" fill="#ffffff" opacity="0.8"/>
  <rect x="6" y="12" width="18" height="1" fill="#ffffff" opacity="0.6"/>
  <rect x="6" y="14" width="14" height="1" fill="#ffffff" opacity="0.4"/>
</svg>
`;

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, '../src/assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Write icon files
fs.writeFileSync(path.join(assetsDir, 'icon.svg'), iconSvg);
fs.writeFileSync(path.join(assetsDir, 'tray-icon.svg'), trayIconSvg);

console.log('Placeholder icons created successfully!');