const sharp = require('sharp');
const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../lingjing_server/icons/lingjing_todo.svg');
const iconsDir = path.join(__dirname, '../lingjing_server/icons');

const sizes = [32, 128, 256];

async function generateIcons() {
  console.log('开始生成图标文件...');
  
  // 生成不同尺寸的PNG
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `${size}x${size}.png`);
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✓ 生成 ${size}x${size}.png`);
  }
  
  // 生成 128x128@2x.png (256x256)
  const outputPath2x = path.join(iconsDir, '128x128@2x.png');
  await sharp(svgPath)
    .resize(256, 256)
    .png()
    .toFile(outputPath2x);
  console.log('✓ 生成 128x128@2x.png');
  
  // 生成 icon.png (256x256)
  const iconPngPath = path.join(iconsDir, 'icon.png');
  await sharp(svgPath)
    .resize(256, 256)
    .png()
    .toFile(iconPngPath);
  console.log('✓ 生成 icon.png');
  
  // 生成 icon.ico
  const icoSizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = [];
  
  for (const size of icoSizes) {
    const buffer = await sharp(svgPath)
      .resize(size, size)
      .png()
      .toBuffer();
    pngBuffers.push(buffer);
  }
  
  const icoBuffer = await pngToIco.default(pngBuffers);
  const icoPath = path.join(iconsDir, 'icon.ico');
  fs.writeFileSync(icoPath, icoBuffer);
  console.log('✓ 生成 icon.ico');
  
  // 生成 Windows 磁贴图标
  const tileSizes = [
    { name: 'Square30x30Logo', size: 30 },
    { name: 'Square44x44Logo', size: 44 },
    { name: 'Square71x71Logo', size: 71 },
    { name: 'Square89x89Logo', size: 89 },
    { name: 'Square107x107Logo', size: 107 },
    { name: 'Square142x142Logo', size: 142 },
    { name: 'Square150x150Logo', size: 150 },
    { name: 'Square284x284Logo', size: 284 },
    { name: 'Square310x310Logo', size: 310 },
    { name: 'StoreLogo', size: 50 }
  ];
  
  for (const tile of tileSizes) {
    const tilePath = path.join(iconsDir, `${tile.name}.png`);
    await sharp(svgPath)
      .resize(tile.size, tile.size)
      .png()
      .toFile(tilePath);
    console.log(`✓ 生成 ${tile.name}.png`);
  }
  
  console.log('✅ 所有图标文件生成完成！');
}

generateIcons().catch(err => {
  console.error('生成图标失败:', err);
  process.exit(1);
});
