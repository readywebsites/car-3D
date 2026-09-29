import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

async function testMobile() {
  const outputDir = path.resolve("test_output");
  const uniqueDir = path.join(os.tmpdir(), `chrome_mobile_${Date.now()}`);
  const chromePath = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";

  const chromeProc = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--remote-debugging-port=9222",
    `--user-data-dir=${uniqueDir}`,
    "--window-size=390,844",
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

  // Mobile device metrics emulation
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  });

  await new Promise((r) => setTimeout(r, 2600));

  async function takeScreenshot(filename) {
    const { data } = await sendCommand("Page.captureScreenshot", { format: "png" });
    const buffer = Buffer.from(data, "base64");
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, buffer);
    console.log(`Saved mobile screenshot: ${filepath}`);
  }

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
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
  }

  const evalExpr = async (expression) => {
    const res = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  };

  // Mobile 1: Stage 01
  await takeScreenshot("mobile_stage_01.png");

  // Mobile 2: Stage 02
  await evalExpr(`(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, maxScroll * 0.33);
  })()`);
  await new Promise((r) => setTimeout(r, 1200));
  await takeScreenshot("mobile_stage_02.png");

  // Mobile 3: Stage 03
  await evalExpr(`(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, maxScroll * 0.58);
  })()`);
  await new Promise((r) => setTimeout(r, 1200));
  await takeScreenshot("mobile_stage_03.png");

  // Mobile 4: Stage 04 End CTA
  await evalExpr(`(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, maxScroll * 1.0);
  })()`);
  await new Promise((r) => setTimeout(r, 1200));
  await takeScreenshot("mobile_stage_04_cta.png");

  ws.close();
  chromeProc.kill();

  try {
    fs.rmSync(uniqueDir, { recursive: true, force: true });
  } catch (e) {}

  console.log("Mobile verification complete!");
}

testMobile().catch(console.error);
