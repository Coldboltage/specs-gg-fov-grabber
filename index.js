const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const getNames = async (page) => {
  // Load site and wait for it to properly load
  await page.goto("https://specs.gg/players/?game=pubg");
  console.log("I've got to page");
  await page.waitForSelector(".item2_username");

  // Found this code
  let lastHeight = await page.evaluate("document.body.scrollHeight");
  let counter = 0

  while (true && 40 > counter) {
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await page.waitForTimeout(2000); // sleep a bit
    let newHeight = await page.evaluate("document.body.scrollHeight");
    if (newHeight === lastHeight) {
      break;
    }
    counter = counter + 1
    lastHeight = newHeight;
  }

  // Grab all the names
  console.log("Firing html");
  const html = await page.content();
  const $ = cheerio.load(html);
  const names = $(".item2_username")
    .map((index, element) => $(element).text())
    .get();
  console.log(names.length);
  return names;
};

// Names of users end up as url
const openPage = async (names, page) => {
  const fovList = [];
  for (var i = 0; i < names.length; i++) {
    await page.goto(`https://specs.gg/${names[i]}`);
    console.log(`Checking ${names[i]}'s page`);
    const html = await page.content();
    const $ = cheerio.load(html);
    // Find FOV Text
    const fovText = $(".__main").filter(
      (index, element) => $(element).text() === "FOV"
    );
    // DOM Transverse
    const fovString = $(fovText).parent().next().text();
    const fovNumber = +fovString;
    if (isNaN(fovNumber) === true || fovNumber === 0) {
      console.log(`Number is fucked`);
      console.log(fovNumber);
    } else {
      console.log(`Pushing Number ${fovNumber}`);
      fovList.push(fovNumber);
    }
  }
  return fovList;
};

// Main thread
const main = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const names = await getNames(page);
  console.log(names);
  const fovList = await openPage(names, page);
  console.log(
    `The Average Fov is: ${Math.floor(
      fovList.reduce((a, b) => a + b) / fovList.length
    )}`
  );
  console.log(`Profiles checked ${fovList.length} `)
  console.log(`Ending script`);
  await browser.close();
};

main();
