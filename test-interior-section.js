import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

async function runInteriorSectionTests() {
  const outputDir = path.resolve("test_output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const uniqueDir = path.join(os.tmpdir(), `chrome_interior_test_${Date.now()}`);
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

  // Retrieve ScrollTrigger info for all sections
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

  const st4 = triggersInfo?.find((t) => t.id === "section-04");
  if (!st4) {
    console.error("section-04 ScrollTrigger not found!");
    chromeProc.kill();
    process.exit(1);
  }

  const st4Start = st4.start;
  const st4Dist = st4.distance;
  console.log(`Section 04 start: ${st4Start}px, distance: ${st4Dist}px`);

  // =========================================================================
  // TEST 1: SECTION 04 ENTRANCE & INITIAL STATE (0% SCROLL)
  // =========================================================================
  console.log("\n=======================================================");
  console.log("TEST 1: SECTION 04 ENTRANCE & INITIAL STATE (0% SCROLL)");
  console.log("=======================================================");

  await evalExpr(`window.scrollTo({ top: ${st4Start}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 800));

  const state0 = await evalExpr(`(() => {
    const sec = document.querySelector("#section-04");
    if (!sec) return { error: "section-04 not found" };

    const videos = sec.querySelectorAll("video");
    const prevVid = videos[0];
    const curVid = videos[1];

    const h2 = sec.querySelector("h2");
    const tag = sec.querySelector(".font-mono");
    const quote = sec.querySelector(".font-editorial");
    const textWrapper = h2?.parentElement;

    const finalHero = sec.querySelector(".absolute.inset-0.z-20");

    const stList = window.ScrollTrigger?.getAll() || [];
    const st = stList.find(s => s.trigger?.id === "section-04");
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
      initialText: {
        tag: tag?.textContent?.trim(),
        title: h2?.textContent?.trim(),
        quote: quote?.textContent?.trim(),
        opacity: textWrapper ? window.getComputedStyle(textWrapper).opacity : null,
        transform: textWrapper ? window.getComputedStyle(textWrapper).transform : null,
      },
      finalHeroOpacity: finalHero ? window.getComputedStyle(finalHero).opacity : null,
    };
  })()`);

  console.log("State at Section 04 entrance (0%):", JSON.stringify(state0, null, 2));
  await takeScreenshot("interior_00pct.png");

  // =========================================================================
  // TEST 2: SCROLL TO 25% (DASHBOARD IN VIEW, TRANSITION COMPLETE)
  // =========================================================================
  console.log("\n=======================================================");
  console.log("TEST 2: SCROLL TO 25% (DASHBOARD IN VIEW, TEXT PROMINENT)");
  console.log("=======================================================");

  await evalExpr(`window.scrollTo({ top: ${st4Start + st4Dist * 0.25}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 700));

  const state25 = await evalExpr(`(() => {
    const sec = document.querySelector("#section-04");
    const videos = sec?.querySelectorAll("video") || [];
    const prevVid = videos[0];
    const curVid = videos[1];
    const h2 = sec?.querySelector("h2");
    const textWrapper = h2?.parentElement;

    const stList = window.ScrollTrigger?.getAll() || [];
    const st = stList.find(s => s.trigger?.id === "section-04");

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
    };
  })()`);

  console.log("State at 25% scroll:", JSON.stringify(state25, null, 2));
  await takeScreenshot("interior_25pct.png");

  // =========================================================================
  // TEST 3: SCROLL TO 50% (STEERING / COCKPIT)
  // =========================================================================
  console.log("\n=======================================================");
  console.log("TEST 3: SCROLL TO 50% (STEERING / COCKPIT)");
  console.log("=======================================================");

  await evalExpr(`window.scrollTo({ top: ${st4Start + st4Dist * 0.50}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 700));

  const state50 = await evalExpr(`(() => {
    const sec = document.querySelector("#section-04");
    const curVid = sec?.querySelectorAll("video")[1];
    const h2 = sec?.querySelector("h2");
    const textWrapper = h2?.parentElement;

    const stList = window.ScrollTrigger?.getAll() || [];
    const st = stList.find(s => s.trigger?.id === "section-04");

    return {
      progress: st?.progress,
      currentTime: curVid?.currentTime,
      duration: curVid?.duration,
      ratio: curVid && curVid.duration ? (curVid.currentTime / curVid.duration) : 0,
      textOpacity: textWrapper ? window.getComputedStyle(textWrapper).opacity : null,
    };
  })()`);

  console.log("State at 50% scroll:", JSON.stringify(state50, null, 2));
  await takeScreenshot("interior_50pct.png");

  // =========================================================================
  // TEST 4: SCROLL TO 75% (SEATS / CONSOLE)
  // =========================================================================
  console.log("\n=======================================================");
  console.log("TEST 4: SCROLL TO 75% (SEATS / CONSOLE, TEXT TRANSITION)");
  console.log("=======================================================");

  await evalExpr(`window.scrollTo({ top: ${st4Start + st4Dist * 0.75}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 700));

  const state75 = await evalExpr(`(() => {
    const sec = document.querySelector("#section-04");
    const curVid = sec?.querySelectorAll("video")[1];
    const h2 = sec?.querySelector("h2");
    const textWrapper = h2?.parentElement;
    const finalHero = sec?.querySelector(".absolute.inset-0.z-20");

    const stList = window.ScrollTrigger?.getAll() || [];
    const st = stList.find(s => s.trigger?.id === "section-04");

    return {
      progress: st?.progress,
      currentTime: curVid?.currentTime,
      duration: curVid?.duration,
      ratio: curVid && curVid.duration ? (curVid.currentTime / curVid.duration) : 0,
      initialTextOpacity: textWrapper ? window.getComputedStyle(textWrapper).opacity : null,
      finalHeroOpacity: finalHero ? window.getComputedStyle(finalHero).opacity : null,
    };
  })()`);

  console.log("State at 75% scroll:", JSON.stringify(state75, null, 2));
  await takeScreenshot("interior_75pct.png");

  // =========================================================================
  // TEST 5: SCROLL TO 100% (FINAL HERO CLIMAX & CTA)
  // =========================================================================
  console.log("\n=======================================================");
  console.log("TEST 5: SCROLL TO 100% (FINAL INTERIOR HERO & CTA)");
  console.log("=======================================================");

  await evalExpr(`window.scrollTo({ top: ${st4Start + st4Dist * 1.0}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 800));

  const state100 = await evalExpr(`(() => {
    const sec = document.querySelector("#section-04");
    const curVid = sec?.querySelectorAll("video")[1];
    const finalHero = sec?.querySelector(".absolute.inset-0.z-20");
    const btn = finalHero?.querySelector("button");

    const stList = window.ScrollTrigger?.getAll() || [];
    const st = stList.find(s => s.trigger?.id === "section-04");

    return {
      progress: st?.progress,
      currentTime: curVid?.currentTime,
      duration: curVid?.duration,
      isNearEnd: curVid && curVid.duration ? (curVid.duration - curVid.currentTime < 0.2) : false,
      finalHero: {
        tag: finalHero?.querySelector(".font-mono")?.textContent?.trim(),
        headline: finalHero?.querySelector("h2")?.textContent?.trim(),
        buttonText: btn?.textContent?.trim(),
        buttonBorder: btn ? window.getComputedStyle(btn).borderColor : null,
        buttonBg: btn ? window.getComputedStyle(btn).backgroundColor : null,
        buttonColor: btn ? window.getComputedStyle(btn).color : null,
        opacity: finalHero ? window.getComputedStyle(finalHero).opacity : null,
        pointerEvents: finalHero ? window.getComputedStyle(finalHero).pointerEvents : null,
      }
    };
  })()`);

  console.log("State at 100% scroll:", JSON.stringify(state100, null, 2));
  await takeScreenshot("interior_100pct.png");

  // =========================================================================
  // TEST 6: CTA INTERACTION (EXPLORE THE CAR BUTTON)
  // =========================================================================
  console.log("\n=======================================================");
  console.log("TEST 6: INTERACTIVE MODAL VERIFICATION");
  console.log("=======================================================");

  await evalExpr(`(() => {
    const btn = document.querySelector("#section-04 button");
    if (btn) btn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 600));

  const modalState = await evalExpr(`(() => {
    const modal = document.querySelector("[role='dialog']") || document.querySelector(".fixed.inset-0.z-50") || document.querySelector(".explore-modal");
    return {
      modalOpen: !!modal,
      modalText: modal?.textContent?.slice(0, 100),
    };
  })()`);

  console.log("Modal state after CTA click:", modalState);
  await takeScreenshot("interior_explore_modal_open.png");

  ws.close();
  chromeProc.kill();

  console.log("\nAll Section 04 tests completed successfully!");
}

runInteriorSectionTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
