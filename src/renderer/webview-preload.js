// webview-preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("webviewAPI", {
  // Por ejemplo, se podría exponer una función para enviar una solicitud y devolver la respuesta
  sendRequest: async (fullURL, options) => {
    try {
      const res = await fetch(fullURL, options);
      const text = await res.text();
      return { success: true, text };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  // También se pueden pasar otros mensajes, por ejemplo, para confirmar que el SW se registró
  notifySWRegistered: () => {
    ipcRenderer.sendToHost("sw-registered");
  },
});
