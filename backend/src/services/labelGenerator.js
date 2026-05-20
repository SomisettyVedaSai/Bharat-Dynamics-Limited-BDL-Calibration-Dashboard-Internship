const puppeteer = require('puppeteer');
const qrGenerator = require('./qrGenerator');
const fs = require('fs');
const path = require('path');

exports.generateIndustrialLabel = async (calibrationData) => {
  const { equipment, result, next_due_date, calibration_date } = calibrationData;
  
  // Minimal QR code data for the label (just the Equipment No and Status)
  const qrDataUrl = await qrGenerator.generateQRCode(`${equipment.equipment_no}:${result}`);

  // 2x1 Inch Label (192x96 pixels roughly at 96 DPI, or styled appropriately)
  const htmlContent = `
    <html>
      <head>
        <style>
          @page { size: 2in 1in; margin: 0; }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 4px; 
            width: 2in; 
            height: 1in; 
            box-sizing: border-box; 
            display: flex;
            align-items: center;
            background: white;
            color: black;
          }
          .qr-container { width: 35%; display: flex; align-items: center; justify-content: center; }
          .qr-container img { max-width: 100%; max-height: 0.8in; }
          .text-container { width: 65%; padding-left: 4px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; }
          .title { font-size: 10px; font-weight: bold; text-transform: uppercase; }
          .eq-no { font-size: 14px; font-weight: 900; margin: 2px 0; border-bottom: 1px solid #000; padding-bottom: 2px; }
          .info { font-size: 8px; margin: 1px 0; }
          .status { font-size: 10px; font-weight: bold; margin-top: 2px; padding: 1px; text-align: center; border: 1px solid #000; }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <img src="${qrDataUrl}" alt="QR" />
        </div>
        <div class="text-container">
          <div class="title">CALIBRATION LABEL</div>
          <div class="eq-no">${equipment.equipment_no}</div>
          <div class="info">CAL: ${new Date(calibration_date).toLocaleDateString()}</div>
          <div class="info">DUE: ${new Date(next_due_date).toLocaleDateString()}</div>
          <div class="status">${result}</div>
        </div>
      </body>
    </html>
  `;

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set viewport to 2x1 inches (192x96 at 96dpi)
  await page.setViewport({ width: 192, height: 96, deviceScaleFactor: 2 });
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  const uploadDir = path.join(__dirname, '../../uploads/labels');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `${equipment.equipment_no}_label.pdf`;
  const filepath = path.join(uploadDir, filename);

  await page.pdf({
    path: filepath,
    width: '2in',
    height: '1in',
    printBackground: true,
    pageRanges: '1'
  });

  await browser.close();

  return `/uploads/labels/${filename}`;
};
