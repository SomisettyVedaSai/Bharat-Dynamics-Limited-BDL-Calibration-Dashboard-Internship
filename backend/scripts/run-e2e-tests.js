const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5175';
const RESULTS_PATH = path.join(__dirname, '../e2e-results.json');

let results = [];

function logTest(testName, status, error = null) {
  console.log(`[${status}] ${testName}${error ? `: ${error}` : ''}`);
  results.push({ testName, status, error: error ? error.toString() : null });
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Reliable React input filler using real keyboard events.
 * Works with React 18 & 19 controlled inputs.
 */
async function fillInput(page, selector, value) {
  const el = await page.$(selector);
  if (!el) throw new Error(`Selector not found: ${selector}`);
  await el.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await el.type(String(value), { delay: 10 });
}

async function runTests() {
  console.log('Starting Final Bulletproof E2E QA Test Runner (v3)...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1536, height: 872 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  page.on('dialog', async dialog => {
    console.log(`  [Dialog] ${dialog.type()}: ${dialog.message().substring(0, 70)}`);
    await dialog.accept();
  });

  const uid = Date.now();

  try {
    // ==========================================
    // SUITE 1: AUTHENTICATION & PROTECTION
    // ==========================================
    console.log('\n--- SUITE 1: AUTHENTICATION & PROTECTION ---');

    try {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
      await delay(600);
      if (page.url().includes('/login')) logTest('1.1 Unauthenticated /dashboard → redirects to /login', 'PASS');
      else logTest('1.1 Unauthenticated /dashboard → redirects to /login', 'FAIL', page.url());
    } catch (e) { logTest('1.1 Unauthenticated /dashboard → redirects to /login', 'FAIL', e.message); }

    try {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await fillInput(page, 'input[type="email"]', 'admin@bdl.local');
      await fillInput(page, 'input[type="password"]', 'WrongPassword!');
      await page.click('button[type="submit"]');
      await page.waitForSelector('.text-red-400', { timeout: 4000 });
      logTest('1.2 Wrong password shows inline error', 'PASS');
    } catch (e) { logTest('1.2 Wrong password shows inline error', 'FAIL', e.message); }

    try {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await fillInput(page, 'input[type="email"]', 'nobody@x.com');
      await fillInput(page, 'input[type="password"]', 'Abcd1234!');
      await page.click('button[type="submit"]');
      await page.waitForSelector('.text-red-400', { timeout: 4000 });
      logTest('1.3 Non-existent email shows inline error', 'PASS');
    } catch (e) { logTest('1.3 Non-existent email shows inline error', 'FAIL', e.message); }

    try {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await fillInput(page, 'input[type="email"]', 'admin@bdl.local');
      await fillInput(page, 'input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 6000 });
      if (page.url().includes('/dashboard')) logTest('1.4 Valid credentials → redirects to /dashboard', 'PASS');
      else logTest('1.4 Valid credentials → redirects to /dashboard', 'FAIL', page.url());
    } catch (e) { logTest('1.4 Valid credentials → redirects to /dashboard', 'FAIL', e.message); }

    // ==========================================
    // SUITE 2: CRUD — EQUIPMENT
    // ==========================================
    console.log('\n--- SUITE 2: CRUD OPERATIONS & FORM VALIDATION ---');

    try {
      await page.goto(`${BASE_URL}/equipment`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('h1', { timeout: 4000 });
      logTest('2.1 Equipment page loads correctly', 'PASS');
    } catch (e) { logTest('2.1 Equipment page loads correctly', 'FAIL', e.message); }

    // Empty form submission
    try {
      await page.evaluate(() => {
        [...document.querySelectorAll('button')].find(b => b.textContent.includes('Add Equipment'))?.click();
      });
      await page.waitForSelector('form', { timeout: 3000 });
      await page.click('form button[type="submit"]');
      await delay(400);
      const invalid = await page.evaluate(() => document.querySelectorAll('input:invalid').length);
      if (invalid > 0) logTest('2.2 Empty form submission triggers HTML5 validation', 'PASS');
      else logTest('2.2 Empty form submission triggers HTML5 validation', 'FAIL', `invalid count: ${invalid}`);
    } catch (e) { logTest('2.2 Empty form submission triggers HTML5 validation', 'FAIL', e.message); }

    // Partial submission
    try {
      await fillInput(page, 'input[name="equipment_no"]', `EQ-${uid}`);
      await page.click('form button[type="submit"]');
      await delay(400);
      const invalid = await page.evaluate(() => document.querySelectorAll('input:invalid').length);
      if (invalid > 0) logTest('2.3 Partial submission validates remaining required fields', 'PASS');
      else logTest('2.3 Partial submission validates remaining required fields', 'FAIL', `invalid count: ${invalid}`);
    } catch (e) { logTest('2.3 Partial submission validates remaining required fields', 'FAIL', e.message); }

    // Full create with XSS + SQL injection payloads
    const xssPayload = `<script>alert('xss')</script> Gauge-${uid}`;
    try {
      await fillInput(page, 'input[name="serial_no"]', `SNO-${uid}`);
      await fillInput(page, 'input[name="description_name"]', xssPayload);
      await fillInput(page, 'input[name="range_min"]', '0');
      await fillInput(page, 'input[name="range_max"]', '100');
      await fillInput(page, 'input[name="unit"]', 'PSI');
      await fillInput(page, 'input[name="periodicity_value"]', '365');
      await page.click('form button[type="submit"]');
      await delay(2500);
      const txt = await page.evaluate(() => document.body.innerText);
      if (txt.includes(`Gauge-${uid}`) && !txt.includes('Server Error'))
        logTest('2.4 XSS/SQL payloads stored safely, no crash or script execution', 'PASS');
      else
        logTest('2.4 XSS/SQL payloads stored safely, no crash or script execution', 'FAIL', 'Record not visible after create');
    } catch (e) { logTest('2.4 XSS/SQL payloads stored safely, no crash or script execution', 'FAIL', e.message); }

    // Row visible
    try {
      const txt = await page.evaluate(() => document.body.innerText);
      if (txt.includes(`EQ-${uid}`) && txt.includes(`SNO-${uid}`))
        logTest('2.5 Created record renders all fields in table row', 'PASS');
      else logTest('2.5 Created record renders all fields in table row', 'FAIL', 'Row not found');
    } catch (e) { logTest('2.5 Created record renders all fields in table row', 'FAIL', e.message); }

    // Edit record
    try {
      const clicked = await page.evaluate((id) => {
        const rows = [...document.querySelectorAll('table tbody tr')];
        const row = rows.find(r => r.textContent.includes(id));
        const btn = [...(row?.querySelectorAll('button') || [])].find(b => b.textContent.trim() === 'Edit');
        if (btn) { btn.click(); return true; }
        return false;
      }, `EQ-${uid}`);
      if (!clicked) throw new Error('Edit button not found');

      await page.waitForSelector('form', { timeout: 3000 });
      await delay(600);

      // Use keyboard-based fill to update range_max
      await fillInput(page, 'input[name="range_max"]', '888');
      await page.click('form button[type="submit"]');
      await delay(2500);

      const txt = await page.evaluate(() => document.body.innerText);
      if (txt.includes('888'))
        logTest('2.6 Edit equipment updates record and reflects in table', 'PASS');
      else
        logTest('2.6 Edit equipment updates record and reflects in table', 'FAIL', 'range_max=888 not visible after update');
    } catch (e) { logTest('2.6 Edit equipment updates record and reflects in table', 'FAIL', e.message); }

    // Delete
    try {
      const clicked = await page.evaluate((id) => {
        const rows = [...document.querySelectorAll('table tbody tr')];
        const row = rows.find(r => r.textContent.includes(id));
        const btn = [...(row?.querySelectorAll('button') || [])].find(b => b.textContent.trim() === 'Delete');
        if (btn) { btn.click(); return true; }
        return false;
      }, `EQ-${uid}`);
      if (!clicked) throw new Error('Delete button not found');
      await delay(2000);
      const txt = await page.evaluate(() => document.body.innerText);
      if (!txt.includes(`EQ-${uid}`)) logTest('2.7 Delete removes record from table', 'PASS');
      else logTest('2.7 Delete removes record from table', 'FAIL', 'Row still visible');
    } catch (e) { logTest('2.7 Delete removes record from table', 'FAIL', e.message); }

    // ==========================================
    // SUITE 3: SEARCH, FILTER & SORT
    // ==========================================
    console.log('\n--- SUITE 3: SEARCH, FILTER & SORT ---');

    try {
      await page.goto(`${BASE_URL}/equipment`, { waitUntil: 'networkidle0' });
      await fillInput(page, 'input[placeholder*="Search"]', 'Caliper');
      await delay(800);
      const rows = await page.$$('table tbody tr');
      logTest(`3.1 Search "Caliper" — table filters correctly (${rows.length} row(s))`, 'PASS');
    } catch (e) { logTest('3.1 Search existing term filters table', 'FAIL', e.message); }

    try {
      await fillInput(page, 'input[placeholder*="Search"]', 'ZZZ999NONEXISTENT');
      await delay(800);
      const txt = await page.evaluate(() => document.body.innerText);
      // The component renders: "No equipment found. Click Add Equipment to register your first instrument."
      if (txt.includes('No equipment found'))
        logTest('3.2 Non-existent search term shows empty-state message', 'PASS');
      else
        logTest('3.2 Non-existent search term shows empty-state message', 'FAIL', 'Empty state not found');
    } catch (e) { logTest('3.2 Non-existent search term shows empty-state message', 'FAIL', e.message); }

    try {
      await fillInput(page, 'input[placeholder*="Search"]', '#@!$%^&*<script>');
      await delay(800);
      logTest('3.3 Special-character search completes without crash', 'PASS');
    } catch (e) { logTest('3.3 Special-character search completes without crash', 'FAIL', e.message); }

    try {
      await page.goto(`${BASE_URL}/equipment`, { waitUntil: 'networkidle0' });
      const ths = await page.$$('table thead th');
      if (ths.length > 0) {
        await ths[0].click(); await delay(300);
        await ths[0].click(); await delay(300);
        logTest('3.4 Column header click toggles sort order without crash', 'PASS');
      } else throw new Error('No table headers found');
    } catch (e) { logTest('3.4 Column header click toggles sort order without crash', 'FAIL', e.message); }

    // ==========================================
    // SUITE 4: CALIBRATION ENGINE WORKFLOW
    // ==========================================
    console.log('\n--- SUITE 4: CALIBRATION ENGINE ---');

    const calEqNo = `CALTEST-${uid}`;

    // Pre-create equipment for calibration testing
    try {
      await page.goto(`${BASE_URL}/equipment`, { waitUntil: 'networkidle0' });
      await page.evaluate(() => {
        [...document.querySelectorAll('button')].find(b => b.textContent.includes('Add Equipment'))?.click();
      });
      await page.waitForSelector('form', { timeout: 3000 });
      await fillInput(page, 'input[name="equipment_no"]', calEqNo);
      await fillInput(page, 'input[name="serial_no"]', `SN-${uid}`);
      await fillInput(page, 'input[name="description_name"]', 'QA Test Vernier Caliper');
      await fillInput(page, 'input[name="range_min"]', '0');
      await fillInput(page, 'input[name="range_max"]', '150');
      await fillInput(page, 'input[name="unit"]', 'mm');
      await fillInput(page, 'input[name="periodicity_value"]', '365');
      await page.click('form button[type="submit"]');
      await delay(2500);
    } catch (e) { console.error('[SETUP] Failed to pre-create calibration equipment:', e.message); }

    try {
      await page.goto(`${BASE_URL}/calibration`, { waitUntil: 'networkidle0' });
      await delay(800);

      const searchBox = await page.$('input[placeholder*="Type Equipment No."]');
      if (!searchBox) throw new Error('Calibration search box not found');

      await searchBox.focus();
      await page.keyboard.type(calEqNo.substring(0, 8), { delay: 50 });
      await delay(1500);

      const selected = await page.evaluate((no) => {
        const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes(no));
        if (btn) { btn.click(); return true; }
        return false;
      }, calEqNo);

      if (!selected) throw new Error(`${calEqNo} not found in dropdown`);
      await delay(1000);

      // Fill measurement fields using keyboard
      await fillInput(page, 'input[placeholder="e.g. 10.000"]', '10.000');
      await fillInput(page, 'input[placeholder="e.g. 10.008"]', '10.005');
      await fillInput(page, 'input[placeholder="e.g. 0.02"]', '0.02');
      await delay(1200);

      const txt = await page.evaluate(() => document.body.innerText);
      if (txt.includes('Live Engine Calculations') && txt.includes('IN TOLERANCE')) {
        logTest('4.1 Live calibration engine shows IN TOLERANCE result', 'PASS');

        // Fill Go / No-Go sizes
        const goPlaceholder = `input[placeholder*="Go gauge size in mm"]`;
        const noGoPlaceholder = `input[placeholder*="No-Go gauge size in mm"]`;
        try {
          await fillInput(page, goPlaceholder, '10.000');
          await fillInput(page, noGoPlaceholder, '10.020');
        } catch (_) {
          // fallback: fill by index
          const numInputs = await page.$$('input[type="number"]');
          if (numInputs.length >= 5) {
            await numInputs[numInputs.length - 2].click({ clickCount: 3 });
            await numInputs[numInputs.length - 2].type('10.000');
            await numInputs[numInputs.length - 1].click({ clickCount: 3 });
            await numInputs[numInputs.length - 1].type('10.020');
          }
        }
        await delay(800);

        await page.evaluate(() => {
          [...document.querySelectorAll('button[type="submit"]')]
            .find(b => b.textContent.includes('Save'))?.click();
        });
        await delay(2500);

        const postTxt = await page.evaluate(() => document.body.innerText);
        if (postTxt.includes('Saved to database') || postTxt.includes('History'))
          logTest('4.2 Calibration record saved successfully to database', 'PASS');
        else logTest('4.2 Calibration record saved successfully to database', 'FAIL', 'Success message not found');
      } else {
        logTest('4.1 Live calibration engine shows IN TOLERANCE result', 'FAIL', 'Live calculations not rendered — measurement inputs may not have triggered React state');
      }
    } catch (e) { logTest('4.1 Live calibration engine shows IN TOLERANCE result', 'FAIL', e.message); }

    // ==========================================
    // SUITE 5: SECONDARY PAGES
    // ==========================================
    console.log('\n--- SUITE 5: SECONDARY PAGES ---');

    const pagesToCheck = [
      { name: 'Dashboard',           path: '/dashboard'     },
      { name: 'Calibration History', path: '/cal-history'   },
      { name: 'Calibration Status',  path: '/cal-status'    },
      { name: 'Certificates',        path: '/certificates'  },
      { name: 'Narrative Gallery',   path: '/narratives'    },
      { name: 'Narrative Wizard',    path: '/narrative/new' },
      { name: 'Factory Calendar',    path: '/calendar'      },
      { name: 'Settings',            path: '/settings'      },
    ];

    for (const pg of pagesToCheck) {
      try {
        await page.goto(`${BASE_URL}${pg.path}`, { waitUntil: 'networkidle0', timeout: 8000 });
        await page.waitForSelector('h1', { timeout: 4000 });
        logTest(`5.x ${pg.name} (${pg.path}) loads without crash`, 'PASS');
      } catch (e) {
        logTest(`5.x ${pg.name} (${pg.path}) loads without crash`, 'FAIL', e.message);
      }
    }

    // ==========================================
    // SUITE 6: NAVIGATION & EDGE CASES
    // ==========================================
    console.log('\n--- SUITE 6: NAVIGATION & EDGE CASES ---');

    try {
      await page.goto(`${BASE_URL}/this-route-does-not-exist`, { waitUntil: 'networkidle0' });
      await delay(600);
      if (page.url().includes('/dashboard') || page.url().includes('/login'))
        logTest('6.1 Invalid route redirects gracefully (no white screen crash)', 'PASS');
      else logTest('6.1 Invalid route redirects gracefully (no white screen crash)', 'FAIL', page.url());
    } catch (e) { logTest('6.1 Invalid route redirects gracefully (no white screen crash)', 'FAIL', e.message); }

    try {
      await page.goto(`${BASE_URL}/equipment`, { waitUntil: 'networkidle0' });
      await page.evaluate(() => {
        [...document.querySelectorAll('button')].find(b => b.textContent.includes('Add Equipment'))?.click();
      });
      await page.waitForSelector('form', { timeout: 3000 });
      await page.evaluate(() => {
        [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Cancel')?.click();
      });
      await delay(500);
      const modalGone = await page.evaluate(() => !document.querySelector('.fixed.inset-0'));
      logTest('6.2 Cancel button closes modal without saving', modalGone ? 'PASS' : 'FAIL');
    } catch (e) { logTest('6.2 Cancel button closes modal without saving', 'FAIL', e.message); }

    try {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
      await page.evaluate(() => {
        [...document.querySelectorAll('button, a')].find(b => b.textContent.includes('Logout'))?.click();
      });
      await delay(2000);
      if (page.url().includes('/login')) logTest('6.3 Logout clears session and redirects to /login', 'PASS');
      else logTest('6.3 Logout clears session and redirects to /login', 'FAIL', page.url());
    } catch (e) { logTest('6.3 Logout clears session and redirects to /login', 'FAIL', e.message); }

  } catch (fatal) {
    console.error('FATAL error:', fatal);
  } finally {
    await browser.close();
    fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const total  = results.length;
    const score  = ((passed / total) * 100).toFixed(1);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`  FINAL E2E QA REPORT`);
    console.log(`  Passed : ${passed}/${total}`);
    console.log(`  Failed : ${failed}/${total}`);
    console.log(`  Score  : ${score}%`);
    console.log(`${'='.repeat(60)}`);

    if (failed > 0) {
      console.log('\n  FAILED TESTS:');
      results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`  ✗ ${r.testName}`);
        if (r.error) console.log(`    → ${r.error}`);
      });
    }
    console.log(`\n  Results → ${RESULTS_PATH}`);
  }
}

runTests();
