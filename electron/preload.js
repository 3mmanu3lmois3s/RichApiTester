const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  onNewTab: (callback) => ipcRenderer.on("menu-new-tab", (event, mode) => callback(mode))
});

console.log("Preload script cargado correctamente");
