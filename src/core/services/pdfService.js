import puppeteer from "puppeteer-core";

const generatePDF = async (html) => {
  const isProduction = process.env.NODE_ENV === "production";

  let browser;

  if (isProduction) {
    // Linux server - use sparticuz chromium
    const chromium = require("@sparticuz/chromium");
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  } else {
    // Local Windows/Mac - use system Chrome
    browser = await puppeteer.launch({
      headless: "new",
      executablePath:
        process.platform === "win32"
          ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
          : process.platform === "darwin"
          ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
          : "/usr/bin/google-chrome",
    });
  }

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();
  return pdfBuffer;
};

export default generatePDF;