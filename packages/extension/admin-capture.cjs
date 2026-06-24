const { chromium } = require('/Users/truongdq/tx/GitHub/super-template/packages/extension/node_modules/playwright');

const ADMIN_URL = 'http://127.0.0.1:3002';
const OUTPUT_DIR = '/Users/truongdq/tx/GitHub/super-template/packages/extension';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    console.log('=== Capturing admin pages ===\n');

    await page.goto(`${ADMIN_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${OUTPUT_DIR}/admin-01-initial.png`, fullPage: false });
    console.log('1/12 Login page captured');

    await page.fill('#email', 'admin@example.local');
    await page.fill('#password', 'ChangeMe123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('http://127.0.0.1:3002/', { timeout: 15000 });
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    const pages = [
      { n: '02-dashboard', u: '/' },
      { n: '03-users', u: '/users' },
      { n: '04-roles', u: '/roles' },
      { n: '05-settings', u: '/settings' },
      { n: '06-projects', u: '/projects' },
      { n: '07-audit-logs', u: '/audit-logs' },
      { n: '08-notifications', u: '/notifications' },
      { n: '09-jobs', u: '/jobs' },
      { n: '10-mail', u: '/mail' },
      { n: '11-files', u: '/files' },
      { n: '12-imports', u: '/imports' },
    ];

    let i = 2;
    for (const p of pages) {
      try {
        await page.goto(`${ADMIN_URL}${p.u}`, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `${OUTPUT_DIR}/admin-${p.n}.png`, fullPage: false });
        console.log(`${i++}/12 ${p.n} captured`);
      } catch (e) {
        console.error(`Failed ${p.n}: ${e.message}`);
      }
    }
  } finally {
    await browser.close();
  }

  console.log('\n=== Done ===');
})();
