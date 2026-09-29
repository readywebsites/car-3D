import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

async function runWomanCarSectionTests() {
  const outputDir = path.resolve("test_output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const uniqueDir = path.join(os.tmpdir(), `chrome_woman_test_${Date.now()}`);
  const chromePath = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";

  console.log("Launching Headless Chrome...");
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

  console.log("Waiting for loading screen to complete...");
  await new Promise((r) => setTimeout(r, 3200));

  // Retrieve ScrollTrigger info for both sections
  const triggersInfo = await evalExpr(`(() => {
    const triggers = window.ScrollTrigger?.getAll() || [];
    return triggers.map(t => ({
      id: t.trigger?.id,
      pin: !!t.pin,
      start: t.start,
      end: t.end,
      distance: t.end - t.start
    }));
  })()`);
  console.log("\nRegistered ScrollTriggers:", triggersInfo);

  // SECTION 01 Trigger and SECTION 02 Trigger
  const st1 = triggersInfo?.find((t) => t.id === "section-exterior");
  const st2 = triggersInfo?.find((t) => t.id === "section-02");

  const st1Dist = st1 ? st1.distance : 2700;
  const st2Start = st2 ? st2.start : st1Dist;
  const st2Dist = st2 ? st2.distance : 2700;

  console.log(`Section 01 distance: ${st1Dist}px, Section 02 start: ${st2Start}px, distance: ${st2Dist}px`);

  // =========================================================================
  // TEST 1: SECTION 02 ENTRANCE & INITIAL STATE (0% of Section 02)
  // =========================================================================
  console.log("\n=======================================================");
  console.log("TEST 1: SECTION 02 ENTRANCE & INITIAL STATE (0% SCROLL)");
  console.log("=======================================================");

  await evalExpr(`window.scrollTo({ top: ${st2Start}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 800));

  const state0 = await evalExpr(`(() => {
    const sec = document.querySelector("#section-02");
    if (!sec) return { error: "section-02 not found" };

    const videos = sec.querySelectorAll("video");
    const prevVid = videos[0];
    const curVid = videos[1];

    const h2 = sec.querySelector("h2");
    const tag = sec.querySelector(".font-mono");
    const quote = sec.querySelector(".font-editorial");
    const textWrapper = h2?.parentElement;

    const stList = window.ScrollTrigger?.getAll() || [];
    const st = stList.find(s => s.trigger?.id === "section-02");
    const curRect = curVid?.getBoundingClientRect();

    return {
      secExists: !!sec,
      stProgress: st?.progress,
      currentVideo: {
        src: curVid?.src,
        paused: curVid?.paused,
        currentTime: curVid?.currentTime,
        duration: curVid?.duration,
        width: curRect?.width,
        height: curRect?.height,
        objectFit: curVid ? window.getComputedStyle(curVid).objectFit : null,
        opacity: curVid ? window.getComputedStyle(curVid).opacity : null,
        transform: curVid ? window.getComputedStyle(curVid).transform : null,
        filter: curVid ? window.getComputedStyle(curVid).filter : null,
      },
      prevVideo: {
        src: prevVid?.src,
        opacity: prevVid ? window.getComputedStyle(prevVid).opacity : null,
        transform: prevVid ? window.getComputedStyle(prevVid).transform : null,
        filter: prevVid ? window.getComputedStyle(prevVid).filter : null,
      },
      text: {
        tag: tag?.textContent?.trim(),
        title: h2?.textContent?.trim(),
        quote: quote?.textContent?.trim(),
        opacity: textWrapper ? window.getComputedStyle(textWrapper).opacity : null,
        transform: textWrapper ? window.getComputedStyle(textWrapper).transform : null,
      }
    };
  })()`);

  console.log("State at Section 02 entrance (0%):", JSON.stringify(state0, null, 2));
  await takeScreenshot("woman_00pct.png");

  // =========================================================================
  // TEST 2: CINEMATIC CROSSFADE IN ACTION & SCROLL TO 25%
  // =========================================================================
  console.log("\n=======================================================");
  console.log("TEST 2: SCROLL TO 25% (CROSSFADE COMPLETE, HERO TEXT VISIBLE)");
  console.log("=======================================================");

  await evalExpr(`window.scrollTo({ top: ${st2Start + st2Dist * 0.25}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 700));

  const state25 = await evalExpr(`(() => {
    const sec = document.querySelector("#section-02");
    const videos = sec?.querySelectorAll("video") || [];
    const prevVid = videos[0];
    const curVid = videos[1];
    const h2 = sec?.querySelector("h2");
    const textWrapper = h2?.parentElement;

    const stList = window.ScrollTrigger?.getAll() || [];
    const st = stList.find(s => s.trigger?.id === "section-02");

    return {
      progress: st?.progress,
      currentTime: curVid?.currentTime,
      duration: curVid?.duration,
      ratio: curVid && curVid.duration ? (curVid.currentTime / curVid.duration) : 0,
      currentOpacity: curVid ? window.getComputedStyle(curVid).opacity : null,
      currentFilter: curVid ? window.getComputedStyle(curVid).filter : null,
      prevOpacity: prevVid ? window.getComputedStyle(prevVid).opacity : null,
      prevFilter: prevVid ? window.getComputedStyle(prevVid).filter : null,
      textOpacity: textWrapper ? window.getComputedStyle(textWrapper).opacity : null,
      textTransform: textWrapper ? window.getComputedStyle(textWrapper).transform : null,
    };
  })()`);

  console.log("State at 25% scroll:", JSON.stringify(state25, null, 2));
  await takeScreenshot("woman_25pct.png");

  // =========================================================================
  // TEST 3: SCROLL TO 50%
  // =========================================================================
  console.log("\n=======================================================");
  console.log("TEST 3: SCROLL TO 50% (HALFWAY THROUGH VIDEO)");
  console.log("=======================================================");

  await evalExpr(`window.scrollTo({ top: ${st2Start + st2Dist * 0.50}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 700));

  const state50 = await evalExpr(`(() => {
    const sec = document.querySelector("#section-02");
    const curVid = sec?.querySelectorAll("video")[1];
    const h2 = sec?.querySelector("h2");
    const textWrapper = h2?.parentElement;

    const stList = window.ScrollTrigger?.getAll() || [];
    const st = stList.find(s => s.trigger?.id === "section-02");

    return {
      progress: st?.progress,
      currentTime: curVid?.currentTime,
      duration: curVid?.duration,
      ratio: curVid && curVid.duration ? (curVid.currentTime / curVid.duration) : 0,
      textOpacity: textWrapper ? window.getComputedStyle(textWrapper).opacity : null,
    };
  })()`);

  console.log("State at 50% scroll:", JSON.stringify(state50, null, 2));
  await takeScreenshot("woman_50pct.png");

  // =========================================================================
  // TEST 4: SCROLL TO 75%
  // =========================================================================
  console.log("\n=======================================================");
  console.log("TEST 4: SCROLL TO 75% (TEXT EXITS SUBTLY)");
  console.log("=======================================================");

  await evalExpr(`window.scrollTo({ top: ${st2Start + st2Dist * 0.75}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 700));

  const state75 = await evalExpr(`(() => {
    const sec = document.querySelector("#section-02");
    const curVid = sec?.querySelectorAll("video")[1];
    const h2 = sec?.querySelector("h2");
    const textWrapper = h2?.parentElement;

    const stList = window.ScrollTrigger?.getAll() || [];
    const st = stList.find(s => s.trigger?.id === "section-02");

    return {
      progress: st?.progress,
      currentTime: curVid?.currentTime,
      duration: curVid?.duration,
      ratio: curVid && curVid.duration ? (curVid.currentTime / curVid.duration) : 0,
      textOpacity: textWrapper ? window.getComputedStyle(textWrapper).opacity : null,
      textTransform: textWrapper ? window.getComputedStyle(textWrapper).transform : null,
    };
  })()`);

  console.log("State at 75% scroll:", JSON.stringify(state75, null, 2));
  await takeScreenshot("woman_75pct.png");

  // =========================================================================
  // TEST 5: SCROLL TO 100% (FINAL FRAME & ENGINE SECTION TRANSITION)
  // =========================================================================
  console.log("\n=======================================================");
  console.log("TEST 5: SCROLL TO 100% (FINAL FRAME REACHED & SMOOTH TRANSITION)");
  console.log("=======================================================");

  await evalExpr(`window.scrollTo({ top: ${st2Start + st2Dist * 1.0}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 700));

  const state100 = await evalExpr(`(() => {
    const sec = document.querySelector("#section-02");
    const curVid = sec?.querySelectorAll("video")[1];
    const sec3 = document.querySelector("#section-03");
    const sec3Rect = sec3?.getBoundingClientRect();

    const stList = window.ScrollTrigger?.getAll() || [];
    const st = stList.find(s => s.trigger?.id === "section-02");

    return {
      progress: st?.progress,
      currentTime: curVid?.currentTime,
      duration: curVid?.duration,
      isNearEnd: curVid && curVid.duration ? (curVid.duration - curVid.currentTime < 0.2) : false,
      section03Top: sec3Rect?.top,
    };
  })()`);

  console.log("State at 100% scroll:", JSON.stringify(state100, null, 2));
  await takeScreenshot("woman_100pct.png");

  // =========================================================================
  // TEST 6: SMOOTH TRANSITION INTO ENGINE SECTION (SECTION 03)
  // =========================================================================
  console.log("\n=======================================================");
  console.log("TEST 6: TRANSITION INTO SECTION 03 (ENGINE SECTION)");
  console.log("=======================================================");

  await evalExpr(`window.scrollTo({ top: ${st2Start + st2Dist + 350}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 700));

  const sec3State = await evalExpr(`(() => {
    const sec3 = document.querySelector("#section-03");
    const v3 = sec3?.querySelector("video");
    const rect = sec3?.getBoundingClientRect();
    return {
      exists: !!sec3,
      top: rect?.top,
      videoSrc: v3?.src,
    };
  })()`);

  console.log("Section 03 State:", sec3State);
  await takeScreenshot("woman_to_engine_transition.png");

  ws.close();
  chromeProc.kill();

  console.log("\nAll tests completed successfully!");
}

runWomanCarSectionTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
