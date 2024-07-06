import puppeteer from "puppeteer";
import fs from "fs/promises";
import fetch from "node-fetch";

async function loginToLinkedIn(page, username, password) {
  // Go to LinkedIn login page
  await page.goto("https://www.linkedin.com/login", {
    waitUntil: "networkidle2",
  });

  // Enter username (email)
  await page.type("#username", username);

  // Enter password
  await page.type("#password", password);

  // Click the login button
  await page.click('[data-litms-control-urn="login-submit"]');

  // Wait for navigation to complete
  await page.waitForNavigation({ waitUntil: "networkidle2" });
}

async function fetchJobsFromApi(query, location, geoId, pages) {
  let jobs = [];

  for (let pageNumber = 1; pageNumber <= pages; pageNumber++) {
    const apiUrl = `https://www.linkedin.com/mwlite/search/jobs?geo=urn:li:geo:${geoId}&locationName=${location}&geoId=${geoId}&keyword=${encodeURIComponent(
      query
    )}&pageNumber=${pageNumber}`;

    const response = await fetch(apiUrl);
    if (response.ok) {
      const data = await response.json();
      jobs = jobs.concat(data);
    } else {
      console.error(`Failed to fetch data from page ${pageNumber}`);
    }
  }

  return jobs;
}

async function main() {
  // Launch Puppeteer browser instance
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless mode
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-extensions",
      "--disable-default-apps",
      "--disable-gpu",
      `--user-data-dir=./user-data`, // Use a custom user data directory
    ],
    ignoreDefaultArgs: ["--disable-extensions"],
  });

  // Create a new page within the browser
  const pages = await browser.pages(); // Get all open pages
  const page = pages.length > 0 ? pages[0] : await browser.newPage(); // Use existing page or create a new one

  // LinkedIn credentials
  const username = "moussa.haidar@ecomz.com";
  const password = "MHecomzhaidar@2023";

  // Job search parameters
  const query = "Software Engineer";
  const location = "lebanon";
  const geoId = "101834488";
  const pagesToFetch = 5; // Number of pages to fetch

  try {
    // Log in to LinkedIn
    await loginToLinkedIn(page, username, password);

    // Fetch job information from LinkedIn API
    const jobs = await fetchJobsFromApi(query, location, geoId, pagesToFetch);

    // Save the job information to a JSON file
    await fs.writeFile("jobs.json", JSON.stringify(jobs, null, 2));
    console.log(`Job data saved to jobs.json`);
  } catch (error) {
    console.error("Error during scraping:", error);
  } finally {
    // Close the Puppeteer browser instance
    await browser.close();
  }
}

// Run the main function and handle errors
main().catch(console.error);
