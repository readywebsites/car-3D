import { spawn } from "child_process";
import os from "os";
import path from "path";

async function main() {
  const uniqueDir = path.join(os.tmpdir(), "chrome_diag_" + Date.now());
  const chromeProc = spawn("C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe", [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--remote-debugging-port=9225",
    "--user-data-dir=" + uniqueDir,
    "http://localhost:5173/",
  ]);

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 400));
    try {
      const res = await fetch("http://127.0.0.1:9225/json/list");
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page) {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((r) => (ws.onopen = r));
        let id = 1;
        const send = (m, p = {}) =>
          new Promise((resolve) => {
            const cur = id++;
            const h = (e) => {
              const d = JSON.parse(e.data);
              if (d.id === cur) {
                ws.removeEventListener("message", h);
                resolve(d.result);
              }
            };
            ws.addEventListener("message", h);
            ws.send(JSON.stringify({ id: cur, method: m, params: p }));
          });

        ws.addEventListener("message", (e) => {
          const d = JSON.parse(e.data);
          if (d.method === "Runtime.consoleAPICalled") {
            console.log("CONSOLE:", d.params.type, d.params.args.map((a) => a.value || a.description));
          }
          if (d.method === "Runtime.exceptionThrown") {
            console.error("EXCEPTION:", JSON.stringify(d.params.exceptionDetails, null, 2));
          }
        });

        await send("Runtime.enable");
        await send("Page.enable");
        await new Promise((r) => setTimeout(r, 3000));

        const domInfo = await send("Runtime.evaluate", {
          expression: "(() => ({ html: document.body.innerHTML.slice(0, 500), sections: Array.from(document.querySelectorAll('section')).map(s => s.id) }))()",
          returnByValue: true,
        });
        console.log("DOM Info:", domInfo?.result?.value);

        ws.close();
        chromeProc.kill();
        process.exit(0);
      }
    } catch (e) {}
  }
  chromeProc.kill();
  process.exit(1);
}

main().catch(console.error);
