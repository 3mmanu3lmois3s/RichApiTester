#!/bin/bash
# Script de setup para RichAPITester con Electron, Vite, React y Tailwind

# Crear estructura de carpetas
mkdir -p richapitester/electron
mkdir -p richapitester/src/components
mkdir -p richapitester/src/renderer

# Crear package.json
cat > richapitester/package.json << 'EOF'
{
  "name": "richapitester",
  "version": "1.0.0",
  "main": "electron/main.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.0",
    "electron": "^25.0.0",
    "electron-vite": "^2.0.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.2.0"
  }
}
EOF

# Crear electron.vite.config.js
cat > richapitester/electron.vite.config.js << 'EOF'
import { defineConfig } from "electron-vite";
import { resolve } from "path";

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, "electron/main.js")
        }
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          preload: resolve(__dirname, "electron/preload.js")
        }
      }
    }
  },
  renderer: {
    input: resolve(__dirname, "src/renderer/index.html")
  }
});
EOF

# Crear tailwind.config.js
cat > richapitester/tailwind.config.js << 'EOF'
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./electron/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# Crear postcss.config.js
cat > richapitester/postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Crear index.html en src/renderer
cat > richapitester/src/renderer/index.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>RichAPITester</title>
    <link rel="stylesheet" href="./index.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.jsx"></script>
  </body>
</html>
EOF

# Crear electron/main.js
cat > richapitester/electron/main.js << 'EOF'
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
      nodeIntegration: false
    }
  });

  const startUrl = process.env.ELECTRON_START_URL || "http://localhost:5173";
  mainWindow.loadURL(startUrl);

  const menuTemplate = [
    { label: "File", submenu: [{ role: "quit" }] }
  ];
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
EOF

# Crear electron/preload.js
cat > richapitester/electron/preload.js << 'EOF'
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  onNewTab: (callback) => ipcRenderer.on("menu-new-tab", (event, mode) => callback(mode))
});

console.log("Preload script cargado correctamente");
EOF

# Crear src/renderer/main.jsx
cat > richapitester/src/renderer/main.jsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';
import '../index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# Crear src/App.jsx
cat > richapitester/src/App.jsx << 'EOF'
import React from 'react';
import Tabs from './components/Tabs';

function App() {
  return (
    <div className="w-full h-full">
      <Tabs />
    </div>
  );
}

export default App;
EOF

# Crear src/components/Tabs.jsx (versión final con reducer, IDs únicos, edición y diferenciación de colores)
cat > richapitester/src/components/Tabs.jsx << 'EOF'
import React, { useReducer, useState } from "react";

const initialState = {
  tabs: [],
  activeIndex: null,
  nextId: 1,
};

function tabsReducer(state, action) {
  switch (action.type) {
    case "ADD_TAB": {
      const { title, content, type } = action.payload;
      if (type === "orch") {
        const existingIndex = state.tabs.findIndex((tab) => tab.type === "orch");
        if (existingIndex !== -1) {
          return { ...state, activeIndex: existingIndex };
        }
      }
      const newTab = {
        id: state.nextId,
        title,
        content,
        type,
      };
      const newTabs = [...state.tabs, newTab];
      return {
        tabs: newTabs,
        activeIndex: newTabs.length - 1,
        nextId: state.nextId + 1,
      };
    }
    case "CLOSE_TAB": {
      const index = action.payload;
      const newTabs = state.tabs.slice();
      newTabs.splice(index, 1);
      let newActiveIndex = state.activeIndex;
      if (state.activeIndex === index) {
        newActiveIndex = newTabs.length > 0 ? (index > 0 ? index - 1 : 0) : null;
      } else if (state.activeIndex > index) {
        newActiveIndex = state.activeIndex - 1;
      }
      return { ...state, tabs: newTabs, activeIndex: newActiveIndex };
    }
    case "SET_ACTIVE": {
      return { ...state, activeIndex: action.payload };
    }
    case "EDIT_TAB": {
      const { index, newTitle } = action.payload;
      const updatedTabs = state.tabs.map((tab, i) =>
        i === index ? { ...tab, title: newTitle } : tab
      );
      return { ...state, tabs: updatedTabs };
    }
    default:
      return state;
  }
}

function Tabs() {
  const [state, dispatch] = useReducer(tabsReducer, initialState);

  const addTab = (title, content, type) => {
    dispatch({ type: "ADD_TAB", payload: { title, content, type } });
  };

  const closeTab = (index) => {
    dispatch({ type: "CLOSE_TAB", payload: index });
  };

  const setActive = (index) => {
    dispatch({ type: "SET_ACTIVE", payload: index });
  };

  const handleTitleEdit = (index, newTitle) => {
    dispatch({ type: "EDIT_TAB", payload: { index, newTitle } });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex overflow-x-auto bg-gray-200 p-2 space-x-1">
        {state.tabs.map((tab, i) => (
          <div
            key={tab.id}
            onClick={() => setActive(i)}
            className={`flex-shrink-0 px-2 py-1 mx-1 cursor-pointer rounded 
              ${
                tab.type === "mock"
                  ? "bg-blue-300 hover:bg-blue-400"
                  : tab.type === "real"
                  ? "bg-green-300 hover:bg-green-400"
                  : "bg-purple-300 hover:bg-purple-400"
              }
              ${i === state.activeIndex ? "bg-white" : ""}`}
            style={{ minWidth: "100px" }}
          >
            <EditableLabel
              initialValue={tab.title}
              onSave={(newTitle) => handleTitleEdit(i, newTitle)}
            />
            <button
              className="ml-1 text-red-500 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(i);
              }}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          className="flex-shrink-0 ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
          onClick={() => addTab("Test API Mock", <MockApiView />, "mock")}
        >
          +Mock
        </button>
        <button
          className="flex-shrink-0 ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
          onClick={() => addTab("Test API Real", <RealApiView />, "real")}
        >
          +Real
        </button>
        <button
          className="flex-shrink-0 ml-2 px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
          onClick={() => addTab("Orchestrator", <OrchestratorView />, "orch")}
        >
          +Orch
        </button>
      </div>
      <div className="flex-1 bg-white p-4">
        {state.activeIndex !== null && state.tabs[state.activeIndex] ? (
          state.tabs[state.activeIndex].content
        ) : (
          <p className="text-gray-500">No hay pestañas abiertas</p>
        )}
      </div>
    </div>
  );
}

function EditableLabel({ initialValue, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  return editing ? (
    <input
      type="text"
      className="text-sm"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        setEditing(false);
        onSave(value);
      }}
      autoFocus
    />
  ) : (
    <span onDoubleClick={() => setEditing(true)} className="text-sm">
      {value}
    </span>
  );
}

function MockApiView() {
  return <div>Vista de Mock API</div>;
}

function RealApiView() {
  return <div>Vista de Real API</div>;
}

function OrchestratorView() {
  return <div>Vista de Orquestador</div>;
}

export default Tabs;
EOF

# Crear src/index.css
cat > richapitester/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

echo "Proyecto RichAPITester creado correctamente en la carpeta 'richapitester'."
echo "Luego, navega a la carpeta 'richapitester', ejecuta 'npm install' y 'npm run dev'."
