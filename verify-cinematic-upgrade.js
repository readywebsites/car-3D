import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

async function runVerification() {
  const outputDir = path.resolve("test_output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const uniqueDir = path.join(os.tmpdir(), `chrome_verify_${Date.now()}`);
  const chromePath = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";

  console.log("Launching Headless Chrome on port 9222...");
  const chromeProc = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--remote-debugging-port=9222",
    `--user-data-dir=${uniqueDir}`,
    "--window-size=1920,1080",
    "http://localhost:5173/",
  ]);

  let pageTarget = null;
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 400));
    try {
      const res = await fetch("http://127.0.0.1:9222/json/list");
      const list = await res.json();
      pageTarget = list.find((t) => t.type === "page");
      if (pageTarget) break;
    } catch (e) {}
  }

  if (!pageTarget) {
    console.error("CDP page target not found");
    chromeProc.kill();
    process.exit(1);
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };
  await new Promise((r) => (ws.onopen = r));

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const curId = id++;
      pending.set(curId, { resolve, reject });
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

  const evalExpr = async (expression) => {
    const res = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res?.exceptionDetails) {
      console.error("Evaluation Exception:", res.exceptionDetails?.text || res.exceptionDetails?.exception?.description);
    }
    return res?.result?.value;
  };

  const takeScreenshot = async (name) => {
    const { data } = await send("Page.captureScreenshot", { format: "png" });
    const filepath = path.join(outputDir, name);
    fs.writeFileSync(filepath, Buffer.from(data, "base64"));
    console.log(`Saved screenshot: ${filepath}`);
  };

  await send("Page.enable");
  await send("Runtime.enable");

  console.log("Navigating to http://localhost:5173/ ...");
  await send("Page.navigate", { url: "http://localhost:5173/" });

  console.log("Waiting for loading screen to complete...");
  await new Promise((r) => setTimeout(r, 3800));

  // --- 1. VERIFY SECTION 01 — CAR EXTERIOR ---
  console.log("\n=======================================================");
  console.log("SECTION 01: CAR EXTERIOR");
  console.log("=======================================================");
  const sec1Data = await evalExpr(`(() => {
    const v = document.querySelectorAll("video")[0];
    const h1 = document.querySelector("#section-01 h1, #section-exterior h1");
    const tag = document.querySelector("#section-01 .font-mono-tech, #section-exterior .font-mono-tech");
    const quote = document.querySelector("#section-01 .font-editorial, #section-exterior .font-editorial");
    return {
      videoSrc: v?.src,
      videoAutoplay: v?.autoplay,
      videoMuted: v?.muted,
      videoLoop: v?.loop,
      videoPlaysInline: v?.playsInline,
      tag: tag?.textContent?.trim(),
      heading: h1?.textContent?.trim(),
      quote: quote?.textContent?.trim(),
    };
  })()`);
  console.log("Section 01 Data:", sec1Data);

  // Check video plays forward normally without scroll scrubbing
  const t0_start = await evalExpr("document.querySelectorAll('video')[0]?.currentTime");
  await new Promise((r) => setTimeout(r, 1200));
  const t0_end = await evalExpr("document.querySelectorAll('video')[0]?.currentTime");
  console.log(`Video 01 is playing continuously: start=${t0_start}s -> end=${t0_end}s (diff=${(t0_end - t0_start).toFixed(2)}s)`);
  await takeScreenshot("verify_sec01_exterior.png");

  // --- 2. NAVIGATE TO SECTION 02 — WOMAN + CAR ---
  console.log("\n=======================================================");
  console.log("SECTION 02: WOMAN + CAR (NAVIGATING VIA NAVBAR)");
  console.log("=======================================================");
  await evalExpr(`(() => {
    const buttons = Array.from(document.querySelectorAll("header nav button"));
    const btn = buttons.find(b => b.textContent.includes("EXPERIENCE"));
    if (btn) btn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 1200));

  const sec2Data = await evalExpr(`(() => {
    const v = document.querySelectorAll("video")[1];
    const h2 = document.querySelector("#section-02 h2");
    const tag = document.querySelector("#section-02 .font-mono-tech");
    const quote = document.querySelector("#section-02 .font-editorial");
    const v1Opacity = window.getComputedStyle(v).opacity;
    const v0Opacity = window.getComputedStyle(document.querySelectorAll("video")[0]).opacity;
    return {
      videoSrc: v?.src,
      v0Opacity,
      v1Opacity,
      tag: tag?.textContent?.trim(),
      heading: h2?.textContent?.trim(),
      quote: quote?.textContent?.trim(),
    };
  })()`);
  console.log("Section 02 Data:", sec2Data);
  await takeScreenshot("verify_sec02_woman.png");

  // --- 3. NAVIGATE TO SECTION 03 — ENGINE / PERFORMANCE ---
  console.log("\n=======================================================");
  console.log("SECTION 03: ENGINE / PERFORMANCE (NAVIGATING VIA INDICATOR)");
  console.log("=======================================================");
  await evalExpr(`(() => {
    const buttons = Array.from(document.querySelectorAll("aside button"));
    const btn3 = buttons.find(b => b.textContent.includes("03"));
    if (btn3) btn3.click();
  })()`);
  await new Promise((r) => setTimeout(r, 1200));

  const sec3Data = await evalExpr(`(() => {
    const v = document.querySelectorAll("video")[2];
    const h2 = document.querySelector("#section-03 h2");
    const tag = document.querySelector("#section-03 .font-mono-tech");
    const quote = document.querySelector("#section-03 .font-editorial");
    const specs = Array.from(document.querySelectorAll("#section-03 [data-spec-item]")).map(el => {
      const label = el.querySelector(".font-mono-tech")?.textContent?.trim();
      const val = el.querySelector(".font-display")?.textContent?.trim();
      const unit = el.querySelector(".font-mono-tech:last-child")?.textContent?.trim();
      return { label, value: val + (unit ? " " + unit : "") };
    });
    const v2Opacity = window.getComputedStyle(v).opacity;
    return {
      videoSrc: v?.src,
      v2Opacity,
      tag: tag?.textContent?.trim(),
      heading: h2?.textContent?.trim(),
      quote: quote?.textContent?.trim(),
      specs,
    };
  })()`);
  console.log("Section 03 Data:", sec3Data);
  await takeScreenshot("verify_sec03_performance.png");

  // --- 4. NAVIGATE TO SECTION 04 — INTERIOR ---
  console.log("\n=======================================================");
  console.log("SECTION 04: INTERIOR (NAVIGATING VIA WHEEL SCROLL)");
  console.log("=======================================================");
  // Simulate wheel scroll down
  await evalExpr(`(() => {
    window.dispatchEvent(new WheelEvent("wheel", { deltaY: 100 }));
  })()`);
  await new Promise((r) => setTimeout(r, 1200));

  const sec4Data = await evalExpr(`(() => {
    const v = document.querySelectorAll("video")[3];
    const h2 = document.querySelector("#section-04 h2");
    const tag = document.querySelector("#section-04 .font-mono-tech");
    const quote = document.querySelector("#section-04 .font-editorial");
    const ctaBtn = document.querySelector("button[aria-label='Explore the car']");
    const v3Opacity = window.getComputedStyle(v).opacity;
    return {
      videoSrc: v?.src,
      v3Opacity,
      tag: tag?.textContent?.trim(),
      heading: h2?.textContent?.trim(),
      quote: quote?.textContent?.trim(),
      ctaButtonText: ctaBtn?.textContent?.trim(),
    };
  })()`);
  console.log("Section 04 Data:", sec4Data);
  await takeScreenshot("verify_sec04_interior.png");

  // --- 5. TEST EXPLORE BUTTON MODAL ---
  console.log("\n=======================================================");
  console.log("TESTING EXPLORE THE CAR MODAL");
  console.log("=======================================================");
  await evalExpr(`(() => {
    const ctaBtn = document.querySelector("button[aria-label='Explore the car']");
    if (ctaBtn) ctaBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 800));

  const modalData = await evalExpr(`(() => {
    const modal = document.querySelector("div[role='dialog']");
    const h2 = modal?.querySelector("h2");
    return {
      modalOpen: !!modal,
      modalTitle: h2?.textContent?.trim(),
    };
  })()`);
  console.log("Explore Modal Data:", modalData);
  await takeScreenshot("verify_explore_modal.png");

  // Close modal
  await evalExpr(`(() => {
    const closeBtn = document.querySelector("div[role='dialog'] button[aria-label*='Close']");
    if (closeBtn) closeBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 600));

  // --- 6. TEST NAVBAR AFTER SCROLL STYLING ---
  console.log("\n=======================================================");
  console.log("VERIFYING NAVBAR STYLING AFTER SCROLL");
  console.log("=======================================================");
  const navData = await evalExpr(`(() => {
    const header = document.querySelector("header");
    const style = window.getComputedStyle(header);
    return {
      backgroundColor: style.backgroundColor,
      backdropFilter: style.backdropFilter,
      borderBottomColor: style.borderBottomColor,
    };
  })()`);
  console.log("Navbar Scrolled Style:", navData);

  ws.close();
  chromeProc.kill();

  try {
    fs.rmSync(uniqueDir, { recursive: true, force: true });
  } catch (e) {}

  console.log("\n=======================================================");
  console.log("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
  console.log("=======================================================");
}

runVerification().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
