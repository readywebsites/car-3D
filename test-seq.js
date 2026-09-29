import { spawn } from "child_process";
import os from "os";
import path from "path";

async function testScrollSequence() {
  const chromePath = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
  const uniqueDir = path.join(os.tmpdir(), `seq_test_${Date.now()}`);

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
      ws.send(JSON.stringify({ id, method, params }));
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

  console.log("Waiting 2.5s for page to mount...");
  await new Promise((r) => setTimeout(r, 2500));

  const maxScroll = await evalExpr("document.documentElement.scrollHeight - window.innerHeight");
  console.log("maxScroll:", maxScroll);

  const targets = [
    { name: "Stage 01 (0%)", pos: 0 },
    { name: "Stage 02 (33%)", pos: maxScroll * 0.33 },
    { name: "Stage 03 (58%)", pos: maxScroll * 0.58 },
    { name: "Stage 04 (82%)", pos: maxScroll * 0.82 },
    { name: "Stage End (100%)", pos: maxScroll * 1.0 },
  ];

  for (const t of targets) {
    console.log(`\nScrolling to ${t.name}: target y = ${t.pos}...`);
    await evalExpr(`window.scrollTo(0, ${t.pos});`);
    await new Promise((r) => setTimeout(r, 1200));

    const curY = await evalExpr("window.scrollY");
    const p = curY / maxScroll;
    const vStats = await evalExpr(`
      Array.from(document.querySelectorAll('video')).map((v, i) => ({
        i,
        time: v.currentTime.toFixed(2),
        opacity: window.getComputedStyle(v).opacity,
        zIndex: window.getComputedStyle(v).zIndex
      }))
    `);
    const activeNav = await evalExpr("document.querySelector('header nav button.text-white')?.textContent || ''");
    console.log(`  Actual scrollY: ${curY} (progress: ${(p * 100).toFixed(1)}%)`);
    console.log(`  Active Nav: "${activeNav}"`);
    console.log(`  Videos:`, vStats);
  }

  ws.close();
  chromeProc.kill();
}

testScrollSequence().catch(console.error);
