// Lightweight cron runner for Next.js app
// Requires env: CRON_SECRET and BASE_URL (defaults to http://localhost:3000)

require("dotenv").config();
const cron = require("node-cron");
const https = require("https");
const http = require("http");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.warn("[cron] CRON_SECRET is not set; cron calls will be rejected by the server.");
}

function post(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(
      url,
      {
        method: "POST",
        headers: {
          "x-cron-key": CRON_SECRET || "",
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (d) => chunks.push(d));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          resolve({ status: res.statusCode, body });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function runOverdue() {
  try {
    const res = await post("/cron/overdue");
    console.log(`[cron] overdue -> ${res.status} ${res.body}`);
  } catch (e) {
    console.error("[cron] overdue error", e);
  }
}

async function runScheduleStatus() {
  try {
    const res = await post("/cron/schedule-status");
    console.log(`[cron] schedule-status -> ${res.status} ${res.body}`);
  } catch (e) {
    console.error("[cron] schedule-status error", e);
  }
}

// Schedule at 06:00 every day (server local time)
cron.schedule("0 6 * * *", () => {
  runScheduleStatus();
  runOverdue();
});

console.log("[cron] runner started. Schedules: 06:00 daily for schedule-status and overdue scans.");


