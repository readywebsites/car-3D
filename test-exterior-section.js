import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

async function runExteriorSectionTests() {
  const outputDir = path.resolve("test_output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const uniqueDir = path.join(os.tmpdir(), `chrome_ext_test_${Date.now()}`);
  const chromePath = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";

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

  await send("Page.enable");
  await send("Runtime.enable");

  console.log("Navigating to http://localhost:5173/ ...");
  await send("Page.navigate", { url: "http://localhost:5173/" });

  const evalExpr = async (expression) => {
    const res = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  };

  const takeScreenshot = async (name) => {
    const { data } = await send("Page.captureScreenshot", { format: "png" });
    const filepath = path.join(outputDir, name);
    fs.writeFileSync(filepath, Buffer.from(data, "base64"));
    console.log(`Saved screenshot: ${filepath}`);
  };

  console.log("Waiting for loader to finish...");
  await new Promise((r) => setTimeout(r, 3200));

  // 1. Initial State Check (0% Scroll)
  console.log("\n=======================================================");
  console.log("TEST 1: INITIAL STATE (0% SCROLL)");
  console.log("=======================================================");
  
  const videoDetails = await evalExpr(`(() => {
    const v = document.querySelector("#section-exterior video");
    if (!v) return null;
    const style = window.getComputedStyle(v);
    const rect = v.getBoundingClientRect();
    return {
      src: v.src,
      paused: v.paused,
      currentTime: v.currentTime,
      duration: v.duration,
      width: rect.width,
      height: rect.height,
      objectFit: style.objectFit,
      transform: style.transform,
    };
  })()`);
  console.log("Video Details:", videoDetails);

  const textDetails0 = await evalExpr(`(() => {
    const section = document.querySelector("#section-exterior");
    const h1 = section?.querySelector("h1");
    const tag = section?.querySelector(".font-mono");
    const quote = section?.querySelector(".font-editorial");
    const textWrapper = h1?.parentElement;
    const style = textWrapper ? window.getComputedStyle(textWrapper) : null;
    return {
      tag: tag?.textContent?.trim(),
      h1: h1?.textContent?.trim(),
      quote: quote?.textContent?.trim(),
      opacity: style?.opacity,
      transform: style?.transform,
    };
  })()`);
  console.log("Text at 0% scroll:", textDetails0);

  await takeScreenshot("exterior_0pct.png");

  // Determine the scroll distance of the pinned section
  const sectionScrollInfo = await evalExpr(`(() => {
    const stList = window.ScrollTrigger?.getAll();
    const st = stList?.find(s => s.trigger?.id === "section-exterior" || s.pin?.closest("#section-exterior"));
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    return {
      stStart: st?.start,
      stEnd: st?.end,
      stDistance: st ? (st.end - st.start) : 0,
      totalScrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
      maxScroll
    };
  })()`);
  console.log("ScrollTrigger Info:", sectionScrollInfo);

  const stDist = sectionScrollInfo.stDistance || (sectionScrollInfo.innerHeight * 2.5) || 2700;

  // 2. Scroll to 25%
  console.log("\n=======================================================");
  console.log("TEST 2: SCROLL TO 25%");
  console.log("=======================================================");
  await evalExpr(`window.scrollTo({ top: ${stDist * 0.25}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 600));

  const state25 = await evalExpr(`(() => {
    const v = document.querySelector("#section-exterior video");
    const h1 = document.querySelector("#section-exterior h1");
    const textWrapper = h1?.parentElement;
    const stList = window.ScrollTrigger?.getAll();
    const st = stList?.find(s => s.trigger?.id === "section-exterior" || s.pin?.closest("#section-exterior"));
    return {
      progress: st?.progress,
      currentTime: v?.currentTime,
      videoTransform: v ? window.getComputedStyle(v).transform : null,
      textOpacity: textWrapper ? window.getComputedStyle(textWrapper).opacity : null,
      textTransform: textWrapper ? window.getComputedStyle(textWrapper).transform : null,
    };
  })()`);
  console.log("State at 25% scroll:", state25);
  await takeScreenshot("exterior_25pct.png");

  // 3. Scroll to 50%
  console.log("\n=======================================================");
  console.log("TEST 3: SCROLL TO 50%");
  console.log("=======================================================");
  await evalExpr(`window.scrollTo({ top: ${stDist * 0.50}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 600));

  const state50 = await evalExpr(`(() => {
    const v = document.querySelector("#section-exterior video");
    const h1 = document.querySelector("#section-exterior h1");
    const textWrapper = h1?.parentElement;
    const stList = window.ScrollTrigger?.getAll();
    const st = stList?.find(s => s.trigger?.id === "section-exterior" || s.pin?.closest("#section-exterior"));
    return {
      progress: st?.progress,
      currentTime: v?.currentTime,
      videoTransform: v ? window.getComputedStyle(v).transform : null,
      textOpacity: textWrapper ? window.getComputedStyle(textWrapper).opacity : null,
      textTransform: textWrapper ? window.getComputedStyle(textWrapper).transform : null,
    };
  })()`);
  console.log("State at 50% scroll:", state50);
  await takeScreenshot("exterior_50pct.png");

  // 4. Scroll to 75%
  console.log("\n=======================================================");
  console.log("TEST 4: SCROLL TO 75%");
  console.log("=======================================================");
  await evalExpr(`window.scrollTo({ top: ${stDist * 0.75}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 600));

  const state75 = await evalExpr(`(() => {
    const v = document.querySelector("#section-exterior video");
    const h1 = document.querySelector("#section-exterior h1");
    const textWrapper = h1?.parentElement;
    const stList = window.ScrollTrigger?.getAll();
    const st = stList?.find(s => s.trigger?.id === "section-exterior" || s.pin?.closest("#section-exterior"));
    return {
      progress: st?.progress,
      currentTime: v?.currentTime,
      videoTransform: v ? window.getComputedStyle(v).transform : null,
      textOpacity: textWrapper ? window.getComputedStyle(textWrapper).opacity : null,
      textTransform: textWrapper ? window.getComputedStyle(textWrapper).transform : null,
    };
  })()`);
  console.log("State at 75% scroll:", state75);
  await takeScreenshot("exterior_75pct.png");

  // 5. Scroll to 100% (Final frame & section transition)
  console.log("\n=======================================================");
  console.log("TEST 5: SCROLL TO 100% (FINAL FRAME & TRANSITION)");
  console.log("=======================================================");
  await evalExpr(`window.scrollTo({ top: ${stDist * 1.0}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 600));

  const state100 = await evalExpr(`(() => {
    const v = document.querySelector("#section-exterior video");
    const h1 = document.querySelector("#section-exterior h1");
    const textWrapper = h1?.parentElement;
    const stList = window.ScrollTrigger?.getAll();
    const st = stList?.find(s => s.trigger?.id === "section-exterior" || s.pin?.closest("#section-exterior"));
    const sec2 = document.querySelector("#section-02");
    const sec2Rect = sec2?.getBoundingClientRect();
    return {
      progress: st?.progress,
      currentTime: v?.currentTime,
      videoTransform: v ? window.getComputedStyle(v).transform : null,
      textOpacity: textWrapper ? window.getComputedStyle(textWrapper).opacity : null,
      section02Top: sec2Rect?.top,
    };
  })()`);
  console.log("State at 100% scroll:", state100);
  await takeScreenshot("exterior_100pct.png");

  // 6. Scroll into Section 02
  console.log("\n=======================================================");
  console.log("TEST 6: TRANSITION INTO SECTION 02");
  console.log("=======================================================");
  await evalExpr(`window.scrollTo({ top: ${stDist + 400}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 800));

  const section02State = await evalExpr(`(() => {
    const sec2 = document.querySelector("#section-02");
    const v2 = sec2?.querySelector("video");
    const rect = sec2?.getBoundingClientRect();
    return {
      exists: !!sec2,
      top: rect?.top,
      videoSrc: v2?.src,
      videoPaused: v2?.paused,
    };
  })()`);
  console.log("Section 02 State:", section02State);
  await takeScreenshot("exterior_section_02_transition.png");

  ws.close();
  chromeProc.kill();
  console.log("\nAll tests completed!");
}

runExteriorSectionTests().catch(console.error);
