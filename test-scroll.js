import { spawn } from "child_process";
import path from "path";

async function testScroll() {
  const chromePath = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
  const userDataDir = path.resolve("temp_chrome_test");

  const chromeProc = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--remote-debugging-port=9222",
    `--user-data-dir=${userDataDir}`,
    "--window-size=1920,1080",
    "http://127.0.0.1:5173/",
  ]);

  let pageTarget = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 300));
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

  await new Promise((r) => setTimeout(r, 2000));

  console.log("Initial scrollHeight:", await evalExpr("document.documentElement.scrollHeight"));
  console.log("Initial innerHeight:", await evalExpr("window.innerHeight"));
  console.log("Initial scrollY:", await evalExpr("window.scrollY"));

  // Try scrolling to 500px
  console.log("Calling window.scrollTo(0, 800)...");
  await evalExpr("window.scrollTo(0, 800)");
  await new Promise((r) => setTimeout(r, 300));
  console.log("After scroll 800 -> scrollY:", await evalExpr("window.scrollY"));

  // Try scrolling to 2000px
  console.log("Calling window.scrollTo(0, 2000)...");
  await evalExpr("window.scrollTo(0, 2000)");
  await new Promise((r) => setTimeout(r, 300));
  console.log("After scroll 2000 -> scrollY:", await evalExpr("window.scrollY"));

  // Try scrolling to 3000px
  console.log("Calling window.scrollTo(0, 3000)...");
  await evalExpr("window.scrollTo(0, 3000)");
  await new Promise((r) => setTimeout(r, 300));
  console.log("After scroll 3000 -> scrollY:", await evalExpr("window.scrollY"));

  ws.close();
  chromeProc.kill();
}

testScroll().catch(console.error);
