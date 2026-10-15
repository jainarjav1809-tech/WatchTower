
const http = require("http");

const API_URL = "http://localhost:3000/api/check";

async function runTest() {
  let price = 499;

  const server = http.createServer((req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });

    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CloudNova Test Store</title>
        </head>
        <body>
          <h1>CloudNova Laptop</h1>
          <p>Price: ₹${price}</p>
          <p>Availability: In Stock</p>
        </body>
      </html>
    `);
  });

  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });

    const address = server.address();
    const testUrl = `http://127.0.0.1:${address.port}`;

    async function checkWebsite() {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: testUrl })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `API returned HTTP ${response.status}: ${data.error || "Unknown error"}`
        );
      }

      if (data.status !== "ok") {
        throw new Error(data.error || "Website check failed");
      }

      if (typeof data.content !== "string" || !data.hash) {
        throw new Error("API response is missing content or hash");
      }

      return data;
    }

    console.log("Test 1: Checking initial price...");
    const first = await checkWebsite();

    if (!first.content.includes("499")) {
      throw new Error("Initial price ₹499 was not extracted");
    }

    console.log("PASS: Initial price ₹499 extracted");

    console.log("Test 2: Changing price to ₹599...");
    price = 599;

    const second = await checkWebsite();

    if (!second.content.includes("599")) {
      throw new Error("Updated price ₹599 was not extracted");
    }

    console.log("PASS: Updated price ₹599 extracted");

    console.log("Test 3: Comparing website versions...");

    if (first.hash === second.hash) {
      throw new Error("The hash did not change after the price changed");
    }

    console.log("PASS: Website change detected by hash");
    console.log("\nAll tests passed!");
  } catch (error) {
    console.error("\nTEST FAILED:", error.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTest();
