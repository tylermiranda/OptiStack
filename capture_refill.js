import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        console.log('Navigating to localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

        // Check if we are on login page (look for username input)
        const usernameInput = await page.$('input[type="text"]');
        if (usernameInput) {
            console.log('Login form detected. Logging in...');
            await page.type('input[type="text"]', 'admin');
            await page.type('input[type="password"]', 'admin');

            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle0' }),
                page.click('button[type="submit"]'),
            ]);
            console.log('Logged in.');
        } else {
            console.log('Already logged in or no login form found.');
        }

        // Look for refill button
        console.log('Waiting for Refill Assistant button...');
        const refillSelector = 'button[aria-label="Refill Assistant"]';
        await page.waitForSelector(refillSelector, { timeout: 5000 });

        // Click it
        console.log('Clicking Refill Assistant button...');
        await page.click(refillSelector);

        // Wait for modal
        console.log('Waiting for modal...');
        await page.waitForSelector('div[role="dialog"]', { timeout: 5000 });

        // Small delay for interaction/animation
        await new Promise(r => setTimeout(r, 1000));

        const screenshotPath = path.join(__dirname, 'public/screenshots/SCR-refill.png');
        console.log(`Taking screenshot to ${screenshotPath}...`);
        await page.screenshot({ path: screenshotPath });
        console.log('Screenshot saved.');

    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
