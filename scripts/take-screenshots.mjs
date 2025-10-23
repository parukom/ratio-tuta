import { chromium } from '@playwright/test';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = 'public/images/index/howitworks';

// Define screenshots to take for "How It Works" section
const screenshots = [
  {
    name: '1-signup',
    path: '/auth?form=signup',
    mode: 'light',
    viewport: { width: 1400, height: 900 },
    waitFor: 'input[name="email"]',
    description: 'Sign up form'
  },
  {
    name: '2-create-place',
    path: '/auth?form=login', // We'll use login page as placeholder
    mode: 'dark',
    viewport: { width: 1400, height: 900 },
    waitFor: 'input[name="email"]',
    description: 'Create place (using login as placeholder)'
  },
  {
    name: '3-add-items',
    path: '/pricing',
    mode: 'light',
    viewport: { width: 1400, height: 900 },
    waitFor: 'main',
    description: 'Pricing page (placeholder for items)'
  },
  {
    name: '4-start-selling',
    path: '/docs',
    mode: 'dark',
    viewport: { width: 1400, height: 900 },
    waitFor: 'main',
    description: 'Documentation (placeholder for selling)'
  },
  {
    name: '5-analytics',
    path: '/',
    mode: 'light',
    viewport: { width: 1400, height: 900 },
    waitFor: 'h1',
    description: 'Home page (placeholder for analytics)'
  }
];

async function takeScreenshots() {
  console.log('🎬 Starting screenshot capture...');

  // Create output directory
  await mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true
  });

  for (const screenshot of screenshots) {
    console.log(`📸 Capturing: ${screenshot.name} (${screenshot.mode} mode)`);

    const context = await browser.newContext({
      viewport: screenshot.viewport,
      colorScheme: screenshot.mode,
    });

    const page = await context.newPage();

    try {
      console.log(`   📄 ${screenshot.description}`);

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

    await context.close();
  }

  await browser.close();
  console.log('✨ Screenshot capture complete!');
}

// Run the script
takeScreenshots().catch(console.error);
