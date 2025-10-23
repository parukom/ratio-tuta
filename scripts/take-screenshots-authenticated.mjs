import { chromium } from '@playwright/test';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = join(__dirname, '../public/images/index/howitworks');

// Login credentials
const EMAIL = 'tomasdudovicius@gmail.com';
const PASSWORD = 'b1g36ll4e';

// Define screenshots to take for "How It Works" section
const screenshots = [
  {
    name: '1-signup',
    path: '/auth?form=signup',
    mode: 'light',
    viewport: { width: 1400, height: 900 },
    waitFor: 'input[name="email"]',
    description: 'Step 1: Sign up form',
    requireAuth: false
  },
  {
    name: '2-create-place',
    path: '/dashboard/home',
    mode: 'dark',
    viewport: { width: 1400, height: 900 },
    waitFor: 'main',
    description: 'Step 2: Dashboard - Create place',
    requireAuth: true
  },
  {
    name: '3-add-items',
    path: '/dashboard/items',
    mode: 'light',
    viewport: { width: 1400, height: 900 },
    waitFor: 'main',
    description: 'Step 3: Items management',
    requireAuth: true
  },
  {
    name: '4-start-selling',
    path: '/cash-register',
    mode: 'dark',
    viewport: { width: 1400, height: 900 },
    waitFor: 'main',
    description: 'Step 4: Cash register',
    requireAuth: true
  },
  {
    name: '5-analytics',
    path: '/dashboard/reports',
    mode: 'light',
    viewport: { width: 1400, height: 900 },
    waitFor: 'main',
    description: 'Step 5: Analytics/Reports',
    requireAuth: true
  }
];

async function login(page) {
  console.log('   🔐 Logging in...');

  // Go to login page
  await page.goto(`${BASE_URL}/auth?form=login`, {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Wait for login form
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });

  // Fill in credentials
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await page.waitForLoadState('networkidle');

  // Wait a bit for any redirects
  await page.waitForTimeout(2000);

  console.log('   ✅ Logged in successfully');
}

async function takeScreenshots() {
  console.log('🎬 Starting authenticated screenshot capture...');

  // Create output directory
  await mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });

  const page = await context.newPage();

  // Login once for all authenticated pages
  let isLoggedIn = false;

  for (const screenshot of screenshots) {
    console.log(`📸 Capturing: ${screenshot.name}`);
    console.log(`   📄 ${screenshot.description}`);

    try {
      // Login if needed and not already logged in
      if (screenshot.requireAuth && !isLoggedIn) {
        await login(page);
        isLoggedIn = true;
      }

      // Set color scheme for this screenshot
      await page.emulateMedia({ colorScheme: screenshot.mode });

      // Navigate to the page
      await page.goto(`${BASE_URL}${screenshot.path}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for specific element if provided
      if (screenshot.waitFor) {
        try {
          await page.waitForSelector(screenshot.waitFor, { timeout: 10000 });
        } catch (e) {
          console.log(`   ⚠️  Element ${screenshot.waitFor} not found, continuing anyway...`);
        }
      }

      // Give extra time for rendering and animations
      await page.waitForTimeout(2000);

      // Take screenshot
      const filename = `${screenshot.name}.jpg`;
      await page.screenshot({
        path: join(OUTPUT_DIR, filename),
        type: 'jpeg',
        quality: 92,
        fullPage: false
      });

      console.log(`   ✅ Saved: ${filename}`);
    } catch (error) {
      console.error(`   ❌ Error capturing ${screenshot.name}:`, error.message);
    }
  }

  await context.close();
  await browser.close();

  console.log('✨ Screenshot capture complete!');
  console.log(`📁 Screenshots saved to: ${OUTPUT_DIR}`);
}

// Run the script
takeScreenshots().catch(console.error);
