const puppeteer = require("puppeteer");
const jsdom = require("jsdom");

async function getPageHTML(pageUrl) {
  const browser = await puppeteer.launch();

  const page = await browser.newPage();

  await page.setViewport({
    width: 1920,
    height: 1080,
  });
  await page.goto(pageUrl, { waitUntil: "networkidle0" });
  // await page.waitForSelector(".cta-title", { visible: true, timeout: 0 });

  const pageHTML = await page.evaluate(
    "new XMLSerializer().serializeToString(document.doctype) + document.documentElement.outerHTML"
  );

  await browser.close();

  return new jsdom.JSDOM(pageHTML).window.document;
}

module.exports = {
  getPageHTML: getPageHTML,
};

// //
// const url =
//   "https://fiber.google.com/address/?&street_address=3605+Palomar+Ln&unit_number&zip_code=78727&event_category=check+address&event_action=submit&event_label=hero";
// console.log(url);
//
// getPageHTML(url)
//   .then((html) => html.querySelector(".cta-title"))
//   .then((element) => element.innerHTML)
//   .then(console.log);
