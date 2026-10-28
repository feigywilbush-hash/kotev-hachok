// Renders the poster: node scripts/hierarchy-poster/render.cjs scripts/hierarchy-poster/poster.html public/files/hierarchy-pyramids.pdf
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
  await p.goto("file://" + path.resolve(process.argv[2]));
  await p.waitForSelector("body[data-ready]");
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.pdf({ path: process.argv[3], format: "A4", printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
  await b.close();
})();
