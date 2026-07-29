import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  const storage = await page.evaluate(() => {
    return window.localStorage.getItem('zen_sudoku_game');
  });
  
  console.log("Storage:", storage);
  
  await browser.close();
})();
