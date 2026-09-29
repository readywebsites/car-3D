import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

async function runUnifiedCinematicTests() {
  const outputDir = path.resolve("test_output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const uniqueDir = path.join(os.tmpdir(), `chrome_unified_${Date.now()}`);
  const chromePath = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";

  console.log("Launching Headless Chrome on port 9222...");
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

  const consoleLogs = [];
  const consoleErrors = [];

  ws.addEventListener("message", (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.method === "Runtime.consoleAPICalled") {
        const text = msg.params.args.map((a) => a.value || a.description || "").join(" ");
        consoleLogs.push({ type: msg.params.type, text });
        if (msg.params.type === "error") {
          consoleErrors.push(text);
        }
      } else if (msg.method === "Runtime.exceptionThrown") {
        const desc = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text;
        consoleErrors.push(desc);
      }
    } catch {}
  });

  await send("Page.enable");
  await send("Runtime.enable");

  console.log("Navigating to http://127.0.0.1:5173/ ...");
  await send("Page.navigate", { url: "http://127.0.0.1:5173/" });

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

  // Wait until React application mounts
  console.log("Waiting for React application to mount...");
  for (let i = 0; i < 60; i++) {
    const hasStory = await evalExpr(`!!document.getElementById("cinematic-master-story")`);
    if (hasStory) break;
    await new Promise((r) => setTimeout(r, 200));
  }

  // Now wait until .loading-screen is removed from the DOM
  console.log("Waiting for loading screen to complete and unmount...");
  for (let i = 0; i < 60; i++) {
    const loader = await evalExpr(`!!document.querySelector(".loading-screen")`);
    if (!loader) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 1000));
  await evalExpr(`window.ScrollTrigger?.refresh()`);
  await new Promise((r) => setTimeout(r, 400));

  const loaderPresentAfter = await evalExpr(`!!document.querySelector(".loading-screen")`);
  console.log("Loader unmounted after intro:", !loaderPresentAfter);

  // 2. DOM & ARCHITECTURE TEST
  console.log("\n=======================================================");
  console.log("TEST 2: SINGLE STICKY 100svh VIEWPORT & VIDEO ELEMENTS");
  console.log("=======================================================");

  const domCheck = await evalExpr(`(() => {
    const story = document.getElementById("cinematic-master-story");
    const stickyViewport = story?.querySelector(".sticky");
    const v0 = document.querySelector("#section-exterior video");
    const v1 = document.querySelector("#section-02 video");
    const v2 = document.querySelector("#section-03 video");
    const v3 = document.querySelector("#section-04 video");
    const navItems = Array.from(document.querySelectorAll("header nav button")).map(b => b.textContent.trim());
    const sceneNumbers = Array.from(document.querySelectorAll("aside button span")).map(s => s.textContent.trim());

    const viewportStyle = stickyViewport ? window.getComputedStyle(stickyViewport) : null;
    const v0Style = v0 ? window.getComputedStyle(v0) : null;

    return {
      hasStory: !!story,
      hasStickyViewport: !!stickyViewport,
      viewportPosition: viewportStyle?.position,
      viewportHeight: viewportStyle?.height,
      v0Src: v0?.getAttribute("src"),
      v1Src: v1?.getAttribute("src"),
      v2Src: v2?.getAttribute("src"),
      v3Src: v3?.getAttribute("src"),
      v0ObjectFit: v0Style?.objectFit,
      navItems,
      sceneNumbers: sceneNumbers.filter(n => /0[1-4]/.test(n)),
      totalScrollHeight: document.documentElement.scrollHeight,
      viewportInnerHeight: window.innerHeight,
    };
  })()`);
  console.log("DOM & Architecture Check:", domCheck);

  // 3. SECTION 01 — CAR EXTERIOR (0% Scroll)
  console.log("\n=======================================================");
  console.log("TEST 3: SECTION 01 (CAR EXTERIOR) AT 0% SCROLL");
  console.log("=======================================================");
  const state0 = await evalExpr(`(() => {
    const v0 = document.querySelector("#section-exterior video");
    const v1 = document.querySelector("#section-02 video");
    const s0Style = window.getComputedStyle(v0);
    const s1Style = window.getComputedStyle(v1);
    const h1 = document.querySelector("#section-exterior ~ div h1, h1");
    const quote = document.querySelector("#section-exterior ~ div .font-editorial, .font-editorial");
    const navActive = document.querySelector("header nav button.text-white")?.textContent?.trim();
    const asideActive = document.querySelector("aside button span.text-white")?.textContent?.trim();

    return {
      v0: {
        opacity: s0Style.opacity,
        scale: s0Style.transform,
        filter: s0Style.filter,
        currentTime: v0.currentTime,
      },
      v1: {
        opacity: s1Style.opacity,
        filter: s1Style.filter,
      },
      title: h1?.textContent?.trim(),
      quote: quote?.textContent?.trim(),
      navActive,
      asideActive,
    };
  })()`);
  console.log("Section 01 initial state:", state0);
  await takeScreenshot("unified_01_exterior.png");

  const totalScroll = await evalExpr(`document.documentElement.scrollHeight - window.innerHeight`);
  console.log(`Total scroll range: ${totalScroll}px`);

  // 4. TRANSITION 01 -> 02 (Crossfade, scale, blur, translateY)
  console.log("\n=======================================================");
  console.log("TEST 4: TRANSITION 01 -> 02 (CAR -> WOMAN)");
  console.log("=======================================================");
  // Scroll to 22% of total scroll
  await evalExpr(`window.scrollTo({ top: ${totalScroll * 0.22}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 600));

  const trans01to02 = await evalExpr(`(() => {
    const v0 = document.querySelector("#section-exterior video");
    const v1 = document.querySelector("#section-02 video");
    return {
      v0Opacity: window.getComputedStyle(v0).opacity,
      v0Transform: window.getComputedStyle(v0).transform,
      v0Filter: window.getComputedStyle(v0).filter,
      v1Opacity: window.getComputedStyle(v1).opacity,
      v1Transform: window.getComputedStyle(v1).transform,
      v1Filter: window.getComputedStyle(v1).filter,
      v0CurrentTime: v0.currentTime,
      v1CurrentTime: v1.currentTime,
    };
  })()`);
  console.log("Transition 01 -> 02 details:", trans01to02);
  await takeScreenshot("unified_trans_01_02.png");

  // 5. SECTION 02 — WOMAN + CAR (35% Scroll)
  console.log("\n=======================================================");
  console.log("TEST 5: SECTION 02 (WOMAN + CAR EXPERIENCE) AT 35% SCROLL");
  console.log("=======================================================");
  await evalExpr(`window.scrollTo({ top: ${totalScroll * 0.35}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 600));

  const state1 = await evalExpr(`(() => {
    const v1 = document.querySelector("#section-02 video");
    const h2s = Array.from(document.querySelectorAll("h2")).map(h => h.textContent.trim());
    const quotes = Array.from(document.querySelectorAll(".font-editorial")).map(q => q.textContent.trim());
    const navActive = document.querySelector("header nav button.text-white")?.textContent?.trim();
    const asideActive = document.querySelector("aside button span.text-white")?.textContent?.trim();

    return {
      v1CurrentTime: v1.currentTime,
      v1Duration: v1.duration,
      v1Opacity: window.getComputedStyle(v1).opacity,
      h2s,
      quotes,
      navActive,
      asideActive,
    };
  })()`);
  console.log("Section 02 state at 35% scroll:", state1);
  await takeScreenshot("unified_02_woman.png");

  // 6. TRANSITION 02 -> 03 (WOMAN -> ENGINE)
  console.log("\n=======================================================");
  console.log("TEST 6: TRANSITION 02 -> 03 (WOMAN -> ENGINE)");
  console.log("=======================================================");
  await evalExpr(`window.scrollTo({ top: ${totalScroll * 0.48}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 600));

  const trans02to03 = await evalExpr(`(() => {
    const v1 = document.querySelector("#section-02 video");
    const v2 = document.querySelector("#section-03 video");
    return {
      v1Opacity: window.getComputedStyle(v1).opacity,
      v1Filter: window.getComputedStyle(v1).filter,
      v2Opacity: window.getComputedStyle(v2).opacity,
      v2Filter: window.getComputedStyle(v2).filter,
      v1CurrentTime: v1.currentTime,
      v2CurrentTime: v2.currentTime,
    };
  })()`);
  console.log("Transition 02 -> 03 details:", trans02to03);
  await takeScreenshot("unified_trans_02_03.png");

  // 7. SECTION 03 — ENGINE / PERFORMANCE (60% Scroll)
  console.log("\n=======================================================");
  console.log("TEST 7: SECTION 03 (ENGINE / PERFORMANCE) AT 60% SCROLL");
  console.log("=======================================================");
  await evalExpr(`window.scrollTo({ top: ${totalScroll * 0.60}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 600));

  const state2 = await evalExpr(`(() => {
    const v2 = document.querySelector("#section-03 video");
    const specItems = Array.from(document.querySelectorAll(".spec-item")).map(item => ({
      label: item.querySelector("span:first-child")?.textContent?.trim(),
      value: item.querySelector(".font-display")?.textContent?.trim(),
      unit: item.querySelector(".font-mono")?.textContent?.trim(),
      opacity: window.getComputedStyle(item).opacity,
    }));
    const navActive = document.querySelector("header nav button.text-white")?.textContent?.trim();
    const asideActive = document.querySelector("aside button span.text-white")?.textContent?.trim();

    return {
      v2CurrentTime: v2.currentTime,
      v2Duration: v2.duration,
      v2Opacity: window.getComputedStyle(v2).opacity,
      specItems,
      navActive,
      asideActive,
    };
  })()`);
  console.log("Section 03 state at 60% scroll:", state2);
  await takeScreenshot("unified_03_engine.png");

  // 8. TRANSITION 03 -> 04 (Camera Entering Car)
  console.log("\n=======================================================");
  console.log("TEST 8: TRANSITION 03 -> 04 (CAMERA ENTERING CAR)");
  console.log("=======================================================");
  await evalExpr(`window.scrollTo({ top: ${totalScroll * 0.73}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 600));

  const trans03to04 = await evalExpr(`(() => {
    const v2 = document.querySelector("#section-03 video");
    const v3 = document.querySelector("#section-04 video");
    return {
      v2Opacity: window.getComputedStyle(v2).opacity,
      v2Transform: window.getComputedStyle(v2).transform,
      v3Opacity: window.getComputedStyle(v3).opacity,
      v3Transform: window.getComputedStyle(v3).transform,
      v2CurrentTime: v2.currentTime,
      v3CurrentTime: v3.currentTime,
    };
  })()`);
  console.log("Transition 03 -> 04 details:", trans03to04);
  await takeScreenshot("unified_trans_03_04.png");

  // 9. SECTION 04 — INTERIOR & FINAL HERO CLIMAX (83% & 100% Scroll)
  console.log("\n=======================================================");
  console.log("TEST 9: SECTION 04 (INTERIOR & FINAL HERO CLIMAX)");
  console.log("=======================================================");
  // 83% Scroll - Cabin Exploration
  await evalExpr(`window.scrollTo({ top: ${totalScroll * 0.83}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 600));

  const state3Cabin = await evalExpr(`(() => {
    const v3 = document.querySelector("#section-04 video");
    const navActive = document.querySelector("header nav button.text-white")?.textContent?.trim();
    const asideActive = document.querySelector("aside button span.text-white")?.textContent?.trim();
    return {
      v3CurrentTime: v3.currentTime,
      v3Duration: v3.duration,
      navActive,
      asideActive,
    };
  })()`);
  console.log("Section 04 Cabin Exploration state (83%):", state3Cabin);
  await takeScreenshot("unified_04_interior_cabin.png");

  // 100% Scroll - Final Hero Climax
  await evalExpr(`window.scrollTo({ top: ${totalScroll}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 800));

  const state3Hero = await evalExpr(`(() => {
    const v3 = document.querySelector("#section-04 video");
    const heroHeadline = Array.from(document.querySelectorAll("h2")).map(h => h.textContent.trim()).find(t => t.includes("Made to move you"));
    const heroTag = Array.from(document.querySelectorAll("span")).map(s => s.textContent.trim()).find(t => t.includes("THE NEW EXPERIENCE"));
    const ctaButton = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("EXPLORE THE CAR"));
    const ctaStyle = ctaButton ? window.getComputedStyle(ctaButton) : null;

    return {
      v3FinalTime: v3.currentTime,
      v3Duration: v3.duration,
      v3AtFinalFrame: v3.currentTime > (v3.duration - 0.5),
      heroTag,
      heroHeadline,
      hasCtaButton: !!ctaButton,
      ctaText: ctaButton?.textContent?.trim(),
      ctaBorder: ctaStyle?.borderWidth + " " + ctaStyle?.borderStyle,
      ctaColor: ctaStyle?.color,
    };
  })()`);
  console.log("Section 04 Final Hero Climax state (100%):", state3Hero);
  await takeScreenshot("unified_04_interior_climax.png");

  // 10. SLOW SCROLL, FAST SCROLL, REVERSE SCROLL TESTS
  console.log("\n=======================================================");
  console.log("TEST 10: SCROLLING ENGINE (SLOW, FAST, REVERSE SCROLL)");
  console.log("=======================================================");

  // Slow Scroll test (step-by-step increments)
  console.log("Testing Slow Scroll in increments...");
  let slowScrollSuccessful = true;
  for (let p = 0.1; p <= 0.4; p += 0.05) {
    await evalExpr(`window.scrollTo({ top: ${totalScroll * p}, behavior: "instant" })`);
    await new Promise((r) => setTimeout(r, 120));
  }
  const slowScrollCheck = await evalExpr(`(() => {
    const v1 = document.querySelector("#section-02 video");
    return { currentTime: v1.currentTime, paused: v1.paused };
  })()`);
  console.log("Slow scroll result:", slowScrollCheck);

  // Fast Scroll test (instant large jump)
  console.log("Testing Fast Scroll (large jump to 85% then 15%)...");
  await evalExpr(`window.scrollTo({ top: ${totalScroll * 0.85}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 300));
  const fastScrollCheck1 = await evalExpr(`document.querySelector("#section-04 video")?.currentTime`);

  await evalExpr(`window.scrollTo({ top: ${totalScroll * 0.15}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 300));
  const fastScrollCheck2 = await evalExpr(`document.querySelector("#section-exterior video")?.currentTime`);
  console.log("Fast scroll results:", { at85Pct: fastScrollCheck1, at15Pct: fastScrollCheck2 });

  // Reverse Scroll test (from bottom 100% back to top 0%)
  console.log("Testing Reverse Scroll (100% -> 50% -> 0%)...");
  await evalExpr(`window.scrollTo({ top: ${totalScroll}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 200));

  await evalExpr(`window.scrollTo({ top: ${totalScroll * 0.5}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 300));

  await evalExpr(`window.scrollTo({ top: 0, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 400));

  const reverseCheck = await evalExpr(`(() => {
    const v0 = document.querySelector("#section-exterior video");
    const h1 = document.querySelector("h1")?.textContent?.trim();
    const navActive = document.querySelector("header nav button.text-white")?.textContent?.trim();
    return {
      v0Opacity: window.getComputedStyle(v0).opacity,
      h1,
      navActive,
    };
  })()`);
  console.log("Reverse scroll to 0% result:", reverseCheck);

  // 11. NAVBAR & SCENE INDICATOR NAVIGATION TEST
  console.log("\n=======================================================");
  console.log("TEST 11: NAVBAR & SCENE INDICATOR NAVIGATION CLICKS");
  console.log("=======================================================");

  // Click on "PERFORMANCE" navbar item
  console.log("Clicking 'PERFORMANCE' in Navbar...");
  await evalExpr(`(() => {
    const btns = Array.from(document.querySelectorAll("header nav button"));
    const perfBtn = btns.find(b => b.textContent.includes("PERFORMANCE"));
    perfBtn?.click();
  })()`);
  await new Promise((r) => setTimeout(r, 1000));

  const navClickResult = await evalExpr(`(() => {
    return {
      scrollY: window.scrollY,
      activeNav: document.querySelector("header nav button.text-white")?.textContent?.trim(),
      activeAside: document.querySelector("aside button span.text-white")?.textContent?.trim(),
    };
  })()`);
  console.log("Nav click result for PERFORMANCE:", navClickResult);

  // Click on "04" in right-side indicator
  console.log("Clicking '04' in Right-side Indicator...");
  await evalExpr(`(() => {
    const asideBtns = Array.from(document.querySelectorAll("aside button"));
    const btn04 = asideBtns.find(b => b.textContent.includes("04"));
    btn04?.click();
  })()`);
  await new Promise((r) => setTimeout(r, 1000));

  const asideClickResult = await evalExpr(`(() => {
    return {
      scrollY: window.scrollY,
      activeNav: document.querySelector("header nav button.text-white")?.textContent?.trim(),
      activeAside: document.querySelector("aside button span.text-white")?.textContent?.trim(),
    };
  })()`);
  console.log("Aside click result for 04:", asideClickResult);

  // Click "CAR" to return to stage 0
  console.log("Clicking 'CAR' in Navbar...");
  await evalExpr(`(() => {
    const btns = Array.from(document.querySelectorAll("header nav button"));
    const carBtn = btns.find(b => b.textContent.includes("CAR"));
    carBtn?.click();
  })()`);
  await new Promise((r) => setTimeout(r, 1000));

  // 12. EXPLORE MODAL INTERACTION TEST
  console.log("\n=======================================================");
  console.log("TEST 12: EXPLORE THE CAR MODAL INTERACTION");
  console.log("=======================================================");
  // Scroll to 100% to reveal CTA button
  await evalExpr(`window.scrollTo({ top: ${totalScroll}, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 800));

  console.log("Clicking 'EXPLORE THE CAR' button...");
  await evalExpr(`(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("EXPLORE THE CAR"));
    btn?.click();
  })()`);
  await new Promise((r) => setTimeout(r, 800));

  const modalResult = await evalExpr(`(() => {
    const modal = document.querySelector("[role='dialog']");
    const modalTitle = modal?.querySelector("h2")?.textContent?.trim();
    return {
      modalOpen: !!modal,
      modalTitle,
    };
  })()`);
  console.log("Modal opened status:", modalResult);
  await takeScreenshot("unified_explore_modal.png");

  // Close modal
  await evalExpr(`(() => {
    const closeBtn = document.querySelector("[role='dialog'] button[aria-label='Close explore modal']");
    closeBtn?.click();
  })()`);
  await new Promise((r) => setTimeout(r, 800));

  // 13. MOBILE RESPONSIVENESS TEST
  console.log("\n=======================================================");
  console.log("TEST 13: MOBILE RESPONSIVENESS (iPhone 390x844)");
  console.log("=======================================================");

  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 500));

  // Scroll to 0% on mobile
  await evalExpr(`window.scrollTo({ top: 0, behavior: "instant" })`);
  await new Promise((r) => setTimeout(r, 500));

  const mobileCheck = await evalExpr(`(() => {
    const v0 = document.querySelector("#section-exterior video");
    const rect = v0?.getBoundingClientRect();
    const h1 = document.querySelector("h1");
    const h1Style = h1 ? window.getComputedStyle(h1) : null;

    return {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      videoWidth: rect?.width,
      videoHeight: rect?.height,
      h1FontSize: h1Style?.fontSize,
      h1Visible: rect?.top >= 0,
    };
  })()`);
  console.log("Mobile Viewport Check:", mobileCheck);
  await takeScreenshot("unified_mobile_view.png");

  // Reset viewport
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await new Promise((r) => setTimeout(r, 400));

  // 14. CONSOLE ERRORS AUDIT
  console.log("\n=======================================================");
  console.log("TEST 14: CONSOLE ERRORS & DIAGNOSTICS AUDIT");
  console.log("=======================================================");
  console.log(`Total console error count: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error("Encountered console errors:", consoleErrors);
  } else {
    console.log("Zero console errors! Flawless browser execution.");
  }

  console.log("\n=======================================================");
  console.log("ALL UNIFIED CINEMATIC EXPERIENCE TESTS COMPLETED");
  console.log("=======================================================");

  chromeProc.kill();
  process.exit(consoleErrors.length > 0 ? 1 : 0);
}

runUnifiedCinematicTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
