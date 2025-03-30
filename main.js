const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  mainWindow.loadFile("index.html");

  ipcMain.on("abrir-webview", (event, url) => {
    const childWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    childWindow.loadURL(url);

    childWindow.webContents.on("did-finish-load", () => {
      const injectScriptPath = path.join(__dirname, "injectPanel.js");
      const scriptContent = require("fs").readFileSync(
        injectScriptPath,
        "utf8"
      );
      childWindow.webContents.executeJavaScript(scriptContent);
    });
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
