const puppeteer = require('puppeteer');

exports.generateMasterReportPDF = async (equipment, calibrations, summary) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page {
            size: A4 portrait;
            margin: 20mm 15mm 20mm 15mm;
          }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 0;
            font-size: 11px;
            line-height: 1.4;
            background-color: #ffffff;
          }
          .header {
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .header h1 {
            color: #1e3a8a;
            margin: 0 0 4px 0;
            font-size: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 700;
          }
          .header h2 {
            color: #475569;
            margin: 0;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .meta-info {
            text-align: right;
            font-size: 9px;
            color: #64748b;
          }
          .section-title {
            color: #0f172a;
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            border-left: 3px solid #1e3a8a;
            padding-left: 8px;
            margin: 25px 0 12px 0;
            letter-spacing: 0.5px;
          }
          
          /* Summary Grid */
          .grid {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 20px;
          }
          .card {
            flex: 1;
            min-width: 100px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 12px;
            text-align: center;
          }
          .card .title {
            font-size: 9px;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 4px;
            font-weight: 600;
          }
          .card .value {
            font-size: 18px;
            font-weight: bold;
            color: #0f172a;
          }
          
          /* Table Styles */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          th, td {
            border: 1px solid #e2e8f0;
            padding: 6px 8px;
            text-align: left;
            vertical-align: middle;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 600;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.2px;
          }
          td {
            font-size: 9px;
            color: #334155;
          }
          tr:nth-child(even) {
            background-color: #fafafa;
          }
          
          /* Status Badges */
          .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 9999px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
            border: 1px solid transparent;
          }
          .badge-active, .badge-pass {
            background-color: #f0fdf4;
            color: #16a34a;
            border-color: #bbf7d0;
          }
          .badge-due {
            background-color: #fffbeb;
            color: #d97706;
            border-color: #fef3c7;
          }
          .badge-failed, .badge-fail, .badge-scrapped {
            background-color: #fef2f2;
            color: #dc2626;
            border-color: #fecaca;
          }
          .badge-under-cal {
            background-color: #eff6ff;
            color: #2563eb;
            border-color: #bfdbfe;
          }
          .badge-general-store {
            background-color: #f1f5f9;
            color: #475569;
            border-color: #cbd5e1;
          }

          /* Footer / Page Breaking rules */
          .footer-text {
            position: fixed;
            bottom: 10mm;
            left: 15mm;
            right: 15mm;
            font-size: 8px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 5px;
            display: flex;
            justify-content: space-between;
          }
          .page-break {
            page-break-before: always;
          }
        </style>
      </head>
      <body>
        <!-- Report Header -->
        <div class="header">
          <div>
            <h1>Bharat Dynamics Limited</h1>
            <h2>Calibration & Inventory Management System (CMS)</h2>
          </div>
          <div class="meta-info">
            <strong>Master Status & Activity Report</strong><br>
            Generated on: ${new Date().toLocaleString()}<br>
            Scope: All Registered Assets & Logs
          </div>
        </div>

        <!-- Executive Summary Section -->
        <div class="section-title" style="margin-top: 0;">Executive Summary</div>
        <div class="grid">
          <div class="card">
            <div class="title">Total Registered</div>
            <div class="value">${equipment.length}</div>
          </div>
          <div class="card">
            <div class="title">Active Assets</div>
            <div class="value" style="color: #16a34a;">${summary.activeCount}</div>
          </div>
          <div class="card">
            <div class="title">Calibration Due</div>
            <div class="value" style="color: #d97706;">${summary.dueCount}</div>
          </div>
          <div class="card">
            <div class="title">Under Calibration</div>
            <div class="value" style="color: #2563eb;">${summary.underCalCount}</div>
          </div>
          <div class="card">
            <div class="title">Failed / Scrapped</div>
            <div class="value" style="color: #dc2626;">${summary.failedCount}</div>
          </div>
          <div class="card">
            <div class="title">Store Inventory</div>
            <div class="value" style="color: #475569;">${summary.generalStoreCount}</div>
          </div>
        </div>

        <div class="grid" style="margin-top: 10px;">
          <div class="card">
            <div class="title">Total Calibrations</div>
            <div class="value">${summary.totalCals}</div>
          </div>
          <div class="card">
            <div class="title">Passed Calibrations</div>
            <div class="value" style="color: #16a34a;">${summary.totalPass}</div>
          </div>
          <div class="card">
            <div class="title">Failed Calibrations</div>
            <div class="value" style="color: #dc2626;">${summary.totalFail}</div>
          </div>
          <div class="card">
            <div class="title">Overall Pass Rate</div>
            <div class="value" style="color: #1e3a8a;">${summary.passRate}</div>
          </div>
        </div>

        <!-- Equipment Master Registry -->
        <div class="section-title">Equipment Registry (Active & Store)</div>
        <table>
          <thead>
            <tr>
              <th style="width: 12%;">Equipment No</th>
              <th style="width: 25%;">Description / Name</th>
              <th style="width: 15%;">Serial No</th>
              <th style="width: 15%;">Type</th>
              <th style="width: 13%;">Due Date</th>
              <th style="width: 10%;">Status</th>
              <th style="width: 10%;">Location</th>
            </tr>
          </thead>
          <tbody>
            ${equipment.map(e => {
              let badgeClass = 'badge-general-store';
              if (e.current_status === 'Active') badgeClass = 'badge-active';
              else if (e.current_status === 'Due') badgeClass = 'badge-due';
              else if (e.current_status === 'Under Calibration') badgeClass = 'badge-under-cal';
              else if (['Failed', 'Scrapped'].includes(e.current_status)) badgeClass = 'badge-failed';

              return `
                <tr>
                  <td style="font-weight: bold;">${e.equipment_no}</td>
                  <td>${e.description_name}</td>
                  <td>${e.serial_no || '—'}</td>
                  <td>${e.equipment_type || '—'}</td>
                  <td>${e.calibration_due_date ? new Date(e.calibration_due_date).toLocaleDateString() : '—'}</td>
                  <td><span class="badge ${badgeClass}">${e.current_status}</span></td>
                  <td>${e.plant_location || '—'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- Page Break for Calibration Logs -->
        <div class="page-break"></div>

        <div class="header">
          <div>
            <h1>Bharat Dynamics Limited</h1>
            <h2>Calibration & Inventory Management System (CMS)</h2>
          </div>
          <div class="meta-info">
            <strong>Master Status & Activity Report</strong><br>
            Generated on: ${new Date().toLocaleString()}
          </div>
        </div>

        <div class="section-title" style="margin-top: 0;">Calibration Activity Log</div>
        <table>
          <thead>
            <tr>
              <th style="width: 12%;">Equipment No</th>
              <th style="width: 15%;">Calib Date</th>
              <th style="width: 15%;">Next Due Date</th>
              <th style="width: 10%;">Nominal</th>
              <th style="width: 10%;">Measured</th>
              <th style="width: 10%;">Error</th>
              <th style="width: 10%;">Result</th>
              <th style="width: 18%;">Calibrated By</th>
            </tr>
          </thead>
          <tbody>
            ${calibrations.slice(0, 150).map(c => {
              const resultBadge = c.result === 'PASS' ? 'badge-pass' : 'badge-fail';
              const errorVal = c.error_value !== undefined && c.error_value !== null 
                ? (c.error_value >= 0 ? '+' : '') + c.error_value.toFixed(3) 
                : '—';

              return `
                <tr>
                  <td style="font-weight: bold;">${c.equipment?.equipment_no || '—'}</td>
                  <td>${new Date(c.calibration_date).toLocaleDateString()}</td>
                  <td>${new Date(c.next_due_date).toLocaleDateString()}</td>
                  <td>${c.nominal_value !== undefined && c.nominal_value !== null ? c.nominal_value.toFixed(3) : '—'}</td>
                  <td>${c.measured_value !== undefined && c.measured_value !== null ? c.measured_value.toFixed(3) : '—'}</td>
                  <td style="font-weight: bold; color: ${c.result === 'PASS' ? '#16a34a' : '#dc2626'};">${errorVal}</td>
                  <td><span class="badge ${resultBadge}">${c.result}</span></td>
                  <td>${c.calibrated_by || '—'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
  });

  await browser.close();
  return pdfBuffer;
};
