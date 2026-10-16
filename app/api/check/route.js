import { chromium } from "playwright-core";
import sparticuz from "@sparticuz/chromium";
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { mkdir } from "fs/promises";
import path from "path";

export const maxDuration = 60;
export const runtime = "nodejs";

const IS_VERCEL = Boolean(process.env.VERCEL);

const BLOCK_WORDS = [
  "captcha",
  "verify you are human",
  "are you a robot",
  "unusual traffic",
  "access denied"
];

function isLocalAddress(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
  );
}

function removeNoise(text) {
  return text
    .replace(/\b\d{1,2}:\d{2}(:\d{2})?\s?(am|pm)?\b/gi, "")
    .replace(/\b\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}\b/g, "")
    .split("\n")
    .map(line => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter(line => !/^(retrieving data|loading)\.*$/i.test(line))
    .filter(line => /[\p{L}\p{N}]/u.test(line))
    .join("\n");
}

export async function POST(request) {
  let browser;

  try {
    const { url } = await request.json();

    if (typeof url !== "string" || !url.trim()) {
      return NextResponse.json(
        { error: "A website URL is required." },
        { status: 400 }
      );
    }

    let parsed;
    try {
      parsed = new URL(url.trim());
    } catch {
      return NextResponse.json(
        { error: "Invalid website URL." },
        { status: 400 }
      );
    }

    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password
    ) {
      return NextResponse.json(
        { error: "Invalid website URL." },
        { status: 400 }
      );
    }

    if (
      process.env.NODE_ENV === "production" &&
      isLocalAddress(parsed.hostname)
    ) {
      return NextResponse.json(
        { error: "Local addresses are not allowed." },
        { status: 400 }
      );
    }

    browser = IS_VERCEL
      ? await chromium.launch({
          args: sparticuz.args,
          executablePath: await sparticuz.executablePath(),
          headless: true
        })
      : await chromium.launch({ headless: true });

    const page = await browser.newPage({
      viewport: { width: 1365, height: 900 }
    });

    const response = await page.goto(parsed.href, {
      waitUntil: "domcontentloaded",
      timeout: 20000
    });

    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(3000);

    const rawText = await page.evaluate(() => document.body.innerText);
    const title = await page.title();
    const checkedAt = new Date().toISOString();

    const httpStatus = response ? response.status() : 0;
    const lowerText = rawText.toLowerCase();

    let status = "ok";

    if (httpStatus === 403 || httpStatus === 429) {
      status = "blocked";
    } else if (httpStatus === 0 || httpStatus >= 400) {
      status = "error";
    } else if (BLOCK_WORDS.some(word => lowerText.includes(word))) {
      status = "blocked";
    }

    if (status !== "ok") {
      return NextResponse.json({
        url: parsed.href,
        status,
        error:
          status === "blocked"
            ? "The website blocked the check (CAPTCHA or access denied)."
            : `The website returned an error (HTTP ${httpStatus}).`,
        checkedAt
      });
    }

    const content = removeNoise(rawText);

    const hash = createHash("sha256")
      .update(title + "\n" + content)
      .digest("hex");

    let screenshot = "";
    if (!IS_VERCEL) {
      const folder = path.join(process.cwd(), "public", "screenshots");
      await mkdir(folder, { recursive: true });

      const fileName = `${hash.slice(0, 16)}.png`;
      await page.screenshot({
        path: path.join(folder, fileName),
        fullPage: true
      });
      screenshot = `/screenshots/${fileName}`;
    }

    return NextResponse.json({
      url: parsed.href,
      status: "ok",
      title,
      content,
      hash,
      screenshot,
      checkedAt
    });
  } catch (error) {
    console.error("Website check failed:", error);

    return NextResponse.json(
      {
        status: "error",
        error: "Could not check this website. Verify the URL and try again."
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}