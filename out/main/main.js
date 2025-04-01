"use strict";
const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
      // ¡Habilita el uso de <webview>!
    }
  });
  const startUrl = process.env.ELECTRON_START_URL || "http://localhost:5173";
  mainWindow.loadURL(startUrl);
  const menuTemplate = [{ label: "File", submenu: [{ role: "quit" }] }];
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (mainWindow === null) createWindow();
});
