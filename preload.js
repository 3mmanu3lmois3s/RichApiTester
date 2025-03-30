const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openWebview: (url) => ipcRenderer.send("abrir-webview", url),
});
