import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

async function testFrames() {
  const outputDir = path.resolve("test_output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const uniqueDir = path.join(os.tmpdir(), `chrome_video_test_${Date.now()}`);
  const chromePath = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";

  const htmlContent = `<!DOCTYPE html>
<html>
<body style="margin:0;background:#050505;overflow:hidden;">
  <video id="vid" src="http://localhost:5173/videos/01-car.mp4" style="width:100vw;height:100vh;object-fit:cover;" muted playsinline></video>
</body>
</html>`;
  fs.writeFileSync(path.resolve("public/test_video.html"), htmlContent);

  const chromeProc = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--remote-debugging-port=9223",
    `--user-data-dir=${uniqueDir}`,
    "--window-size=1920,1080",
    "http://localhost:5173/test_video.html",
  ]);

  let pageTarget = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const res = await fetch("http://127.0.0.1:9223/json/list");
      const list = await res.json();
      pageTarget = list.find((t) => t.type === "page");
      if (pageTarget) break;
    } catch (e) {}
  }

  if (!pageTarget) {
    console.error("Target not found");
    chromeProc.kill();
    return;
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve } = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg.result);
    }
  };
  await new Promise((r) => (ws.onopen = r));
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const curId = id++;
      pending.set(curId, { resolve });
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

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

  await new Promise((r) => setTimeout(r, 1200));
  const dur = await evalExpr(`new Promise(r => {
    const v = document.getElementById("vid");
    if (v.duration && !isNaN(v.duration)) r(v.duration);
    else v.onloadedmetadata = () => r(v.duration);
    setTimeout(() => r(v.duration || 6), 2000);
  })`);
  console.log("Video 01-car.mp4 duration:", dur);

  const captureFrame = async (pct) => {
    const time = dur * pct;
    await evalExpr(`new Promise(r => {
      const v = document.getElementById("vid");
      v.currentTime = ${time};
      v.onseeked = () => r(v.currentTime);
      setTimeout(r, 700);
    })`);
    await new Promise((r) => setTimeout(r, 400));
    const { data } = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(
      path.join(outputDir, `car_frame_${Math.round(pct * 100)}.png`),
      Buffer.from(data, "base64")
    );
    console.log(`Captured frame at ${Math.round(pct * 100)}% (${time.toFixed(2)}s)`);
  };

  await captureFrame(0.0);
  await captureFrame(0.25);
  await captureFrame(0.5);
  await captureFrame(0.75);
  await captureFrame(0.98);

  ws.close();
  chromeProc.kill();
  if (fs.existsSync(path.resolve("public/test_video.html"))) {
    fs.unlinkSync(path.resolve("public/test_video.html"));
  }
}

testFrames().catch(console.error);
