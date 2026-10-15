# WatchTower – Website Change Detector

## About the Project

WatchTower is a website monitoring project that helps users find out when the content of a website changes. Instead of manually checking a website again and again, users can add the website to WatchTower and check for updates through the dashboard.

The project extracts the website's content and compares it with the previously saved version. When a change is detected, WatchTower displays the differences and saves them in the version history.

## Features

- Add websites for monitoring.
- Check website content using Playwright.
- Detect content changes using SHA-256 hashing.
- View the extracted text and website screenshots.
- Compare old and updated website content.
- View the history of detected changes.
- Set checking intervals and pause or resume monitoring.
- Handle errors when websites cannot be accessed.

## Technologies Used

- Next.js and React for the frontend.
- JavaScript for the application logic.
- Tailwind CSS for styling.
- Playwright for extracting website content.
- Node.js for running the application.
- Browser local storage for saving monitoring data.

## How to Run the Project

### Requirements

Install Node.js and npm before running the project.

### Installation

1. Clone the GitHub repository:

   ```bash
   git clone https://github.com/jainarjav1809-tech/WatchTower
   ```

2. Open the project folder:

   ```bash
   cd WatchTower
   ```

3. Install the required packages:

   ```bash
   npm install
   ```

4. Install the browser required by Playwright:

   ```bash
   npx playwright install chromium
   ```

### Start the Application

Run the following command:

```bash
npm run dev
```

Open http://localhost:3000 in your browser to use WatchTower.

## Testing the Project

An automated test script is included to check whether WatchTower can extract website content and detect changes.

Keep the application running and open another terminal in the project folder. Run:

```bash
npm run test:check
```

The test creates a temporary website, extracts a price of ₹499, changes it to ₹599, and checks whether the updated content is detected.

If the test succeeds, the terminal displays `All tests passed!`.

## Manual Testing

A separate HTML website named CloudNova is also available for testing WatchTower.

1. Start the CloudNova website using:

   ```bash
   py -m http.server 3001
   ```

2. Open http://localhost:3001.
3. Add this URL to WatchTower.
4. Run the first check to save the website's current content.
5. Open `index.html` and change some text or a price.
6. Save the file and check the website again in WatchTower.
7. Verify that the change appears in the version history.

Keep the CloudNova server running while testing.

## Limitations

- Some websites block automated requests or require CAPTCHA verification.
- Some dynamic website content may not be extracted correctly.
- Monitoring data is currently saved in browser local storage.
- The automated test checks content extraction and change detection, but does not test every dashboard feature.

## Future Improvements

- Improve detection of changes in specific website sections.
- Improve extraction of live counters and dynamic content.
- Add permanent storage for monitoring history.
- Add notifications for detected changes.

## Project Links

**GitHub Repository:** (https://github.com/jainarjav1809-tech/WatchTower)

**Live Website:** Add the deployed website URL here after deployment.