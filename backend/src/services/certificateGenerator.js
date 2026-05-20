const puppeteer = require('puppeteer');
const qrGenerator = require('./qrGenerator');
const fs = require('fs');
const path = require('path');

exports.generateCertificatePDF = async (calibrationData) => {
  const {
    certificate_no,
    equipment,
    result,
    calibration_date,
    next_due_date,
    nominal_value,
    measured_value,
    tolerance_value,
    error_value,
    lower_limit,
    upper_limit,
    go_size,
    no_go_size,
    rust_status,
    dent_status,
    damage_status,
    surface_finish_status,
    calibrated_by,
    approved_by
  } = calibrationData;
  
  // Generate QR Code containing the cert verification link
  const verifyLink = `https://cms.local/verify/${certificate_no}`;
  const qrDataUrl = await qrGenerator.generateQRCode(verifyLink);

  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 25px; }
          h1 { color: #1e3a8a; margin: 10px 0; font-size: 26px; text-transform: uppercase; letter-spacing: 2px; }
          .cert-no { font-weight: bold; color: #666; font-size: 16px; }
          .section { margin-bottom: 25px; }
          .section-title { background: #f3f4f6; padding: 8px 12px; font-weight: bold; border-left: 4px solid #1e3a8a; margin-bottom: 12px; font-size: 14px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; font-size: 13px; }
          th { background: #f9fafb; color: #4b5563; font-weight: 600; }
          .result-box { text-align: center; padding: 15px; font-size: 20px; font-weight: bold; margin-top: 20px; border: 2px solid; border-radius: 6px; }
          .result-pass { color: #166534; border-color: #166534; background: #f0fdf4; }
          .result-fail { color: #991b1b; border-color: #991b1b; background: #fef2f2; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
          .signature-box { text-align: center; width: 180px; }
          .signature-line { border-top: 1px solid #9ca3af; margin-top: 45px; padding-top: 8px; font-size: 12px; color: #4b5563; }
          .qr-code { text-align: right; }
          .qr-code img { width: 90px; height: 90px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Calibration Certificate</h1>
          <div class="cert-no">Certificate No: ${certificate_no}</div>
        </div>

        <div class="section">
          <div class="section-title">Equipment Details</div>
          <table style="width: 100%;">
            <tr>
              <th style="width: 25%;">Equipment No</th>
              <td style="width: 25%; font-weight: bold;">${equipment.equipment_no || '—'}</td>
              <th style="width: 25%;">Serial No</th>
              <td style="width: 25%;">${equipment.serial_no || '—'}</td>
            </tr>
            <tr>
              <th>Description</th>
              <td>${equipment.description_name || '—'}</td>
              <th>Equipment Type</th>
              <td>${equipment.equipment_type || '—'}</td>
            </tr>
            <tr>
              <th>Range</th>
              <td>${equipment.range_min !== undefined ? equipment.range_min : '—'} to ${equipment.range_max !== undefined ? equipment.range_max : '—'} ${equipment.unit || ''}</td>
              <th>Least Count / Acc.</th>
              <td>LC: ${equipment.least_count || '—'} / Acc: ${equipment.accuracy || '—'} ${equipment.unit || ''}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Calibration Measurements</div>
          <table>
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Nominal Value</th>
                <th>Measured Value</th>
                <th>Tolerance</th>
                <th>Calculated Error</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight: bold;">Main Calibration</td>
                <td>${nominal_value !== undefined && nominal_value !== null ? nominal_value.toFixed(3) : '—'} ${equipment.unit || ''}</td>
                <td>${measured_value !== undefined && measured_value !== null ? measured_value.toFixed(3) : '—'} ${equipment.unit || ''}</td>
                <td>± ${tolerance_value !== undefined && tolerance_value !== null ? tolerance_value.toFixed(3) : '—'} ${equipment.unit || ''}</td>
                <td style="font-weight: bold; color: ${Math.abs(error_value) <= (equipment.q01_tolerance || tolerance_value) ? '#166534' : '#991b1b'};">
                  ${error_value !== undefined && error_value !== null ? (error_value >= 0 ? '+' : '') + error_value.toFixed(3) : '—'} ${equipment.unit || ''}
                </td>
                <td style="font-weight: bold; color: ${result === 'PASS' ? '#166534' : '#991b1b'};">
                  ${result === 'PASS' ? 'IN TOLERANCE' : 'OUT OF LIMITS'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Physical & Gauge Inspection Checklist</div>
          <table style="width: 100%;">
            <tr>
              <th style="width: 25%;">Rust Status</th>
              <td style="width: 25%; font-weight: bold; color: ${rust_status === 'OK' ? '#166534' : '#991b1b'};">${rust_status || '—'}</td>
              <th style="width: 25%;">Dent Status</th>
              <td style="width: 25%; font-weight: bold; color: ${dent_status === 'OK' ? '#166534' : '#991b1b'};">${dent_status || '—'}</td>
            </tr>
            <tr>
              <th>Damage Status</th>
              <td style="font-weight: bold; color: ${damage_status === 'OK' ? '#166534' : '#991b1b'};">${damage_status || '—'}</td>
              <th>Surface Finish</th>
              <td style="font-weight: bold; color: ${surface_finish_status === 'OK' ? '#166534' : '#991b1b'};">${surface_finish_status || '—'}</td>
            </tr>
            <tr>
              <th>Go Gauge Size</th>
              <td>${go_size !== undefined && go_size !== null ? go_size.toFixed(3) + ' ' + (equipment.unit || '') : '—'}</td>
              <th>No-Go Gauge Size</th>
              <td>${no_go_size !== undefined && no_go_size !== null ? no_go_size.toFixed(3) + ' ' + (equipment.unit || '') : '—'}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Calibration Conditions & Validity</div>
          <table style="width: 100%;">
            <tr>
              <th style="width: 25%;">Calibration Date</th>
              <td style="width: 25%;">${new Date(calibration_date).toLocaleDateString()}</td>
              <th style="width: 25%;">Next Due Date</th>
              <td style="width: 25%; font-weight: bold; color: #1e3a8a;">${new Date(next_due_date).toLocaleDateString()}</td>
            </tr>
            <tr>
              <th>Environment</th>
              <td colspan="3">Temperature: 20°C ± 2°C, Relative Humidity: 50% ± 10%</td>
            </tr>
          </table>
        </div>

        <div class="result-box ${result === 'PASS' ? 'result-pass' : 'result-fail'}">
          FINAL CALIBRATION RESULT: ${result}
        </div>

        <div class="footer">
          <div class="signature-box">
            <div style="font-size: 13px; font-weight: bold;">${calibrated_by || 'system'}</div>
            <div class="signature-line">Calibrated By</div>
          </div>
          <div class="signature-box">
            <div style="font-size: 13px; font-weight: bold;">${approved_by || '—'}</div>
            <div class="signature-line">Approved / Verified By</div>
          </div>
          <div class="qr-code">
            <img src="${qrDataUrl}" alt="Verification QR Code" />
            <div style="font-size: 9px; color: #666; margin-top: 3px; text-align: center;">Scan to Verify</div>
          </div>
        </div>
      </body>
    </html>
  `;

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  const uploadDir = path.join(__dirname, '../../uploads/certificates');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `${certificate_no}.pdf`;
  const filepath = path.join(uploadDir, filename);

  await page.pdf({
    path: filepath,
    format: 'A4',
    printBackground: true,
    margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
  });

  await browser.close();

  return `/uploads/certificates/${filename}`;
};
