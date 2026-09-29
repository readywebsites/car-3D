async function check() {
  const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
  const page = list.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const curId = id++;
      const handler = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === curId) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

  await new Promise((r) => (ws.onopen = r));
  const evalCode = async (code) => {
    const res = await send('Runtime.evaluate', {
      expression: code,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  };

  const sh = await evalCode('document.documentElement.scrollHeight');
  const ih = await evalCode('window.innerHeight');
  const sy = await evalCode('window.scrollY');
  console.log({ scrollHeight: sh, innerHeight: ih, scrollY: sy });

  const vInfo = await evalCode(
    'Array.from(document.querySelectorAll("video")).map((v, i) => ({ i, opacity: window.getComputedStyle(v).opacity, zIndex: window.getComputedStyle(v).zIndex, currentTime: v.currentTime, duration: v.duration }))'
  );
  console.log('Videos:', vInfo);

  ws.close();
}
check();
