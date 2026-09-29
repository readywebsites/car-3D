import { spawn } from "child_process";
import os from "os";
import path from "path";

async function testScrollTrigger() {
  const chromePath = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
  const uniqueDir = path.join(os.tmpdir(), `st_test_${Date.now()}`);

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

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const curId = id++;
      const handler = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === curId) {
          ws.removeEventListener("message", handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

  await new Promise((r) => (ws.onopen = r));
  await send("Page.enable");
  await send("Runtime.enable");

  const evalExpr = async (expression) => {
    const res = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  };

  console.log("Waiting 2.5s for loading...");
  await new Promise((r) => setTimeout(r, 2500));

  // Add scroll listener in browser
  await evalExpr(`
    window._scrollEvents = 0;
    window.addEventListener('scroll', () => { window._scrollEvents++; });
  `);

  console.log("Current scrollY:", await evalExpr("window.scrollY"));
  console.log("Current maxScroll:", await evalExpr("document.documentElement.scrollHeight - window.innerHeight"));

  // Check ScrollTrigger instance
  const stExists = await evalExpr("typeof window !== 'undefined' && !!document.querySelector('.scroll-story')");
  console.log(".scroll-story exists in DOM:", stExists);

  // Scroll to 1000px
  await evalExpr("window.scrollTo(0, 1000);");
  await new Promise((r) => setTimeout(r, 500));
  console.log("After scroll to 1000:");
  console.log("  scrollY:", await evalExpr("window.scrollY"));
  console.log("  _scrollEvents count:", await evalExpr("window._scrollEvents"));

  // Let's force ScrollTrigger.update() in browser
  const stProgress = await evalExpr(`
    if (window.ScrollTrigger) {
      window.ScrollTrigger.update();
      const all = window.ScrollTrigger.getAll();
      return all.map(s => ({ start: s.start, end: s.end, progress: s.progress }));
    } else {
      return "ScrollTrigger not global";
    }
  `);
  console.log("ScrollTrigger status:", stProgress);

  ws.close();
  chromeProc.kill();
}

testScrollTrigger().catch(console.error);
