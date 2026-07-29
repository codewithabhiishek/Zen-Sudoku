import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  const storage = await page.evaluate(() => {
    return window.localStorage.getItem('zen-sudoku-store'); // Zustand defaults to `storeName`, let me check what key is used
  });
  
  fs.writeFileSync('storage_dump.txt', storage || "NULL");
  await browser.close();
})();
