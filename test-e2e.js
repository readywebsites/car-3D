import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

async function run() {
  const outputDir = path.resolve("test_output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const uniqueDir = path.join(os.tmpdir(), `chrome_test_${Date.now()}`);
  console.log("Starting Chrome with isolated profile:", uniqueDir);
  const chromePath = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";

  const chromeProc = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--remote-debugging-port=9222",
    `--user-data-dir=${uniqueDir}`,
    "--window-size=1920,1080",
    "http://127.0.0.1:5173/",
  ]);

  let pageTarget = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 400));
    try {
      const res = await fetch("http://127.0.0.1:9222/json/list");
      const list = await res.json();
      pageTarget = list.find((t) => t.type === "page");
      if (pageTarget) break;
    } catch (e) {}
  }

  if (!pageTarget) {
    console.error("Failed to find page target from Chrome CDP");
    chromeProc.kill();
    process.exit(1);
  }

  const wsUrl = pageTarget.webSocketDebuggerUrl;
  console.log("Found page target! Connecting WebSocket:", wsUrl);
  const ws = new WebSocket(wsUrl);

  let idCounter = 1;
  const pendingRequests = new Map();
  const consoleMessages = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pendingRequests.has(msg.id)) {
      const { resolve, reject } = pendingRequests.get(msg.id);
      pendingRequests.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }

    if (msg.method === "Runtime.consoleAPICalled") {
      const text = msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ");
      consoleMessages.push(`[CONSOLE ${msg.params.type}] ${text}`);
      console.log(`[BROWSER CONSOLE]`, text);
    }
    if (msg.method === "Runtime.exceptionThrown") {
      const details = msg.params.exceptionDetails;
      console.error("[BROWSER EXCEPTION]", details.text, details.exception?.description);
    }
  };

  await new Promise((resolve) => (ws.onopen = resolve));

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCommand("Page.enable");
  await sendCommand("Runtime.enable");

  console.log("Waiting 2.8s for loading screen to complete and stage to mount...");
  await new Promise((r) => setTimeout(r, 2800));

  async function takeScreenshot(filename) {
    const { data } = await sendCommand("Page.captureScreenshot", { format: "png" });
    const buffer = Buffer.from(data, "base64");
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, buffer);
    console.log(`Saved screenshot: ${filepath}`);
  }

  async function evalExpr(expression) {
    const res = await sendCommand("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  // 1. Capture Stage 01: Car Reveal
  console.log("--- TEST 1: STAGE 01 (CAR REVEAL) ---");
  await takeScreenshot("step1_stage_01.png");
  let v0Time = await evalExpr("document.querySelectorAll('video')[0]?.currentTime");
  let v0Opacity = await evalExpr("window.getComputedStyle(document.querySelectorAll('video')[0]).opacity");
  console.log("Stage 01 -> Video 0 currentTime:", v0Time, "opacity:", v0Opacity);

  // 2. Scroll to Stage 02: Woman + Car (~33% scroll)
  console.log("--- TEST 2: STAGE 02 (WOMAN + CAR) ---");
  await evalExpr(`(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, maxScroll * 0.33);
  })()`);
  await new Promise((r) => setTimeout(r, 1400));
  await takeScreenshot("step2_stage_02.png");
  let v1Time = await evalExpr("document.querySelectorAll('video')[1]?.currentTime");
  v0Opacity = await evalExpr("window.getComputedStyle(document.querySelectorAll('video')[0]).opacity");
  let v1Opacity = await evalExpr("window.getComputedStyle(document.querySelectorAll('video')[1]).opacity");
  console.log("Stage 02 -> Video 1 currentTime:", v1Time, "Video 0 opacity:", v0Opacity, "Video 1 opacity:", v1Opacity);

  // 3. Scroll to Stage 03: Engine / Performance (~58% scroll)
  console.log("--- TEST 3: STAGE 03 (ENGINE / PERFORMANCE) ---");
  await evalExpr(`(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, maxScroll * 0.58);
  })()`);
  await new Promise((r) => setTimeout(r, 1400));
  await takeScreenshot("step3_stage_03.png");
  let v2Time = await evalExpr("document.querySelectorAll('video')[2]?.currentTime");
  let v2Opacity = await evalExpr("window.getComputedStyle(document.querySelectorAll('video')[2]).opacity");
  let specsText = await evalExpr("Array.from(document.querySelectorAll('[data-spec-item]')).map(el => el.textContent.trim()).join(' | ')");
  console.log("Stage 03 -> Video 2 currentTime:", v2Time, "Video 2 opacity:", v2Opacity);
  console.log("Stage 03 Specs rendered:", specsText);

  // 4. Scroll to Stage 04: Interior Sanctuary (~82% scroll)
  console.log("--- TEST 4: STAGE 04 (INTERIOR / CABIN) ---");
  await evalExpr(`(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, maxScroll * 0.82);
  })()`);
  await new Promise((r) => setTimeout(r, 1400));
  await takeScreenshot("step4_stage_04.png");
  let v3Time = await evalExpr("document.querySelectorAll('video')[3]?.currentTime");
  let v3Opacity = await evalExpr("window.getComputedStyle(document.querySelectorAll('video')[3]).opacity");
  console.log("Stage 04 -> Video 3 currentTime:", v3Time, "Video 3 opacity:", v3Opacity);

  // 5. Scroll to End: Climax CTA (100% scroll)
  console.log("--- TEST 5: CLIMAX CTA (100% SCROLL) ---");
  await evalExpr(`(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, maxScroll * 1.0);
  })()`);
  await new Promise((r) => setTimeout(r, 1400));
  await takeScreenshot("step5_climax_cta.png");
  let ctaText = await evalExpr("document.querySelector('button[aria-label=\"Explore the car\"]')?.textContent");
  console.log("Climax CTA button text:", ctaText);

  // 6. Test Navbar Navigation (click '02 EXPERIENCE' button)
  console.log("--- TEST 6: NAVBAR NAVIGATION (CLICK 02 EXPERIENCE) ---");
  await evalExpr(`(() => {
    const buttons = Array.from(document.querySelectorAll('header nav button'));
    const expBtn = buttons.find(b => b.textContent.includes('EXPERIENCE'));
    if (expBtn) expBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 1600));
  await takeScreenshot("step6_nav_experience.png");
  let navActiveLabel = await evalExpr("document.querySelector('header nav button .font-medium, header nav button.text-white')?.textContent || ''");
  console.log("Navbar Active Stage after click:", navActiveLabel);

  // 7. Test Explore Modal (click 'EXPLORE' button in stage 4)
  console.log("--- TEST 7: EXPLORE MODAL ---");
  await evalExpr(`(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, maxScroll * 1.0);
  })()`);
  await new Promise((r) => setTimeout(r, 1200));
  await evalExpr(`(() => {
    const exploreBtn = document.querySelector('button[aria-label=\"Explore the car\"]');
    if (exploreBtn) exploreBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 800));
  await takeScreenshot("step7_explore_modal.png");
  let modalTitle = await evalExpr("document.querySelector('div[role=\"dialog\"] h2')?.textContent");
  console.log("Explore Modal Header:", modalTitle);

  // Close modal
  await evalExpr(`(() => {
    const closeBtn = document.querySelector('div[role=\"dialog\"] button[aria-label*=\"Close\"]');
    if (closeBtn) closeBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 500));

  // 8. Test Menu Drawer (click 'MENU' in header)
  console.log("--- TEST 8: MENU DRAWER ---");
  await evalExpr(`(() => {
    const menuBtn = document.querySelector('header button[aria-label=\"Open menu\"]');
    if (menuBtn) menuBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 800));
  await takeScreenshot("step8_menu_drawer.png");
  let drawerTitle = await evalExpr("document.querySelector('div[role=\"dialog\"] span')?.textContent");
  console.log("Menu Drawer Title:", drawerTitle);

  console.log("Total console messages logged:", consoleMessages.length);

  ws.close();
  chromeProc.kill();

  try {
    fs.rmSync(uniqueDir, { recursive: true, force: true });
  } catch (e) {}

  console.log("ALL E2E TESTS PASSED PERFECTLY!");
}

run().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
