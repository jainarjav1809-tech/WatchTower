# WatchTower – Website Change Detector

WatchTower is a web application that monitors website content and detects changes between consecutive checks. It helps users identify important updates on websites by comparing the current content with the previously saved version.

## Project Links

**GitHub Repository:**  
https://github.com/jainarjav1809-tech/WatchTower

**Live Website:**  
https://watch-tower-eight.vercel.app/

## Features

- **Website Monitoring:** Enter a website URL to check its current content.
- **Change Detection:** Compares the latest website content with the previously saved version.
- **Before and After Comparison:** Helps identify added, removed, and modified content.
- **Content Hashing:** Uses SHA-256 hashing to determine whether website content has changed.
- **Screenshot Capture:** Saves a screenshot of the website during a successful check.
- **Version History:** Stores previous website versions to help track changes.
- **Status Messages:** Displays whether a website is being checked for the first time, has changed, or remains unchanged.
- **Simple Dashboard:** Provides an easy-to-use interface for managing website checks.

## Technologies Used

- Next.js
- React.js
- JavaScript
- Node.js
- Playwright
- Tailwind CSS
- Browser Local Storage
- SHA-256 Hashing

## How It Works

1. The user enters a website URL in the WatchTower dashboard.
2. The backend uses Playwright to open the website and extract its visible text.
3. The extracted content is cleaned to remove some unnecessary information.
4. WatchTower generates a SHA-256 hash from the page title and cleaned content.
5. The hash is compared with the previously saved version.
6. If the hash is different, WatchTower identifies the website as changed.
7. The dashboard displays the result and provides the available comparison and version-history information.

## Installation and Setup

### Prerequisites

Install the following before running the project:

- Node.js
- npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/jainarjav1809-tech/WatchTower.git
```

### 2. Open the Project Folder

```bash
cd WatchTower
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Install the Playwright Browser

```bash
npx playwright install chromium
```

### 5. Start the Development Server

```bash
npm run dev
```

### 6. Open WatchTower

Visit the following address in your browser:

http://localhost:3000

## Testing

WatchTower includes an automated test for its website-checking API.

Make sure the development server is running in one terminal. Then open another terminal in the project folder and execute:

```bash
npm run test:check
```

The test checks whether WatchTower can extract website content and detect a change in a sample price, from ₹499 to ₹599.

If the test completes successfully, the terminal displays:

```text
All tests passed!
```

## Limitations

- Some websites may block automated browser access.
- CAPTCHA-protected websites may not be checked successfully.
- Dynamic websites may display different content between checks.
- Changes in advertisements, timestamps, or other page content may sometimes affect change detection.
- Screenshots and browser execution depend on the deployment environment.
- The current version uses browser Local Storage for dashboard data, so saved data is not automatically synchronized across different browsers or devices.

## Future Scope

- Add user authentication and cloud-based storage.
- Support scheduled website checks.
- Introduce email or push notifications for detected changes.
- Improve filtering to focus on important content, such as prices, headlines, and product availability.
- Provide more detailed visual comparisons between website versions.
- Improve support for dynamic and JavaScript-heavy websites.

## Conclusion

WatchTower provides a simple way to monitor website content and identify changes over time. By combining automated browsing, content extraction, hashing, and comparison, it helps users understand what has changed without manually checking every website.

## Author

**Arjav Jain (25BYB0108)**

GitHub: https://github.com/jainarjav1809-tech
