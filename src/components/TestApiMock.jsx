// src/components/TestApiMock.jsx
import React, { useState, useRef, useEffect } from "react";

// Función para detectar si estamos en Electron: en ese entorno se expone window.electronAPI
const isElectron = () => {
  return typeof window.electronAPI !== "undefined";
};

function TestApiMock() {
  // Estados para configuración y respuesta
  const [baseUrl, setBaseUrl] = useState("");
  const [endpoints, setEndpoints] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [params, setParams] = useState({});
  const [requestBody, setRequestBody] = useState("");
  const [response, setResponse] = useState("");

  // Referencia al webview (solo usaremos si estamos en Electron)
  const webviewRef = useRef(null);

  // Para depuración: registrar eventos del webview (si existe)
  useEffect(() => {
    if (isElectron() && webviewRef.current) {
      const webview = webviewRef.current;
      webview.addEventListener("dom-ready", () => {
        console.log("webview: dom-ready");
      });
      webview.addEventListener("did-finish-load", () => {
        console.log("webview: did-finish-load");
      });
      webview.addEventListener("did-stop-loading", () => {
        console.log("webview: did-stop-loading");
      });
      webview.addEventListener("did-fail-load", (ev) => {
        console.error("webview: did-fail-load", ev.errorDescription);
      });
    }
  }, [baseUrl]);

  // Función para cargar el archivo mocks_payloads.json desde la base URL
  const loadEndpoints = async () => {
    if (!baseUrl) {
      alert("Por favor ingresa la Base URL");
      return;
    }
    try {
      const fullURL = baseUrl.replace(/\/$/, "") + "/mocks_payloads.json";
      console.log("Cargando endpoints desde:", fullURL);
      const res = await fetch(fullURL);
      if (!res.ok) {
        throw new Error(
          `No se pudo cargar mocks_payloads.json desde ${fullURL}`
        );
      }
      const data = await res.json();
      setEndpoints(data);
      setSelectedIndex(data.length > 0 ? 0 : -1);
      if (data.length > 0) {
        setParams(extractParams(data[0].path));
      } else {
        setParams({});
      }
      setResponse("");
    } catch (err) {
      console.error(err);
      alert("Error al cargar endpoints: " + err.message);
    }
  };

  // Extrae parámetros de la ruta (ej: /api/user/:userId)
  const extractParams = (path) => {
    const regex = /:([a-zA-Z0-9_]+)/g;
    let match;
    const paramNames = [];
    while ((match = regex.exec(path)) !== null) {
      paramNames.push(match[1]);
    }
    const obj = {};
    paramNames.forEach((name) => (obj[name] = ""));
    return obj;
  };

  // Maneja el cambio en el dropdown de endpoints
  const handleSelectChange = (e) => {
    const idx = parseInt(e.target.value, 10);
    setSelectedIndex(idx);
    if (idx >= 0 && endpoints[idx]) {
      const ep = endpoints[idx];
      setParams(extractParams(ep.path));
      setResponse("");
      setRequestBody("");
    }
  };

  // Reemplaza parámetros en la ruta
  const constructPath = (path, paramsObj) => {
    let finalPath = path;
    Object.entries(paramsObj).forEach(([key, value]) => {
      finalPath = finalPath.replace(`:${key}`, value || `:${key}`);
    });
    return finalPath;
  };

  // Al presionar "Enviar": si estamos en Electron y el webview soporta executeJavaScript se usa; sino, se hace fetch directamente
  const handleSendRequest = async () => {
    if (selectedIndex < 0) {
      alert("No hay endpoint seleccionado");
      return;
    }
    const ep = endpoints[selectedIndex];
    const finalPath = constructPath(ep.path, params);
    const fullURL = baseUrl.replace(/\/$/, "") + finalPath;
    console.log("Enviando request a:", fullURL);

    const options = {
      method: ep.method,
      headers: { "Content-Type": "application/json" },
    };

    if (ep.method === "POST" || ep.method === "PUT") {
      if (requestBody.trim()) {
        try {
          const parsed = JSON.parse(requestBody);
          options.body = JSON.stringify(parsed);
        } catch (err) {
          alert("El body no es JSON válido");
          return;
        }
      } else {
        options.body = "{}";
      }
    }

    if (
      isElectron() &&
      webviewRef.current &&
      typeof webviewRef.current.executeJavaScript === "function"
    ) {
      // En Electron, inyectamos el fetch en el webview
      const codeToExecute = `
        fetch("${fullURL}", ${JSON.stringify(options)})
          .then(res => res.text())
          .then(text => text)
          .catch(err => "Error: " + err.message);
      `;
      try {
        const result = await webviewRef.current.executeJavaScript(
          codeToExecute
        );
        setResponse(result);
      } catch (err) {
        setResponse(
          "Error al ejecutar la solicitud (Electron-webview): " + err.message
        );
      }
    } else {
      // En navegador normal o si no se dispone de executeJavaScript, usamos fetch
      try {
        const res = await fetch(fullURL, options);
        const text = await res.text();
        setResponse(text);
      } catch (err) {
        setResponse("Error al ejecutar la solicitud (Browser): " + err.message);
      }
    }
  };

  const selectedEndpoint = selectedIndex >= 0 ? endpoints[selectedIndex] : null;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Test API Mock</h2>

      {/* Campo para la Base URL */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Base URL:</label>
        <input
          type="text"
          className="border p-2 w-full"
          placeholder="https://miapp.github.io/ServiceWorkerJS"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
        />
        <button
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
          onClick={loadEndpoints}
        >
          Cargar Endpoints
        </button>
      </div>

      {/* Dropdown de endpoints */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">
          Seleccionar Endpoint:
        </label>
        <select
          className="border p-2 w-full"
          onChange={handleSelectChange}
          value={selectedIndex}
        >
          {endpoints.length === 0 && (
            <option value={-1}>-- Sin endpoints cargados --</option>
          )}
          {endpoints.map((ep, idx) => (
            <option key={idx} value={idx}>
              {ep.method} {ep.path}
            </option>
          ))}
        </select>
      </div>

      {/* Parámetros de la ruta */}
      {selectedEndpoint && (
        <div className="mb-4">
          <h3 className="font-semibold">Parámetros:</h3>
          {Object.keys(params).length === 0 ? (
            <p className="text-gray-500">No hay parámetros en la ruta</p>
          ) : (
            Object.keys(params).map((pName) => (
              <div key={pName} className="mb-2">
                <label className="mr-2">{pName}:</label>
                <input
                  type="text"
                  className="border p-1"
                  value={params[pName]}
                  onChange={(e) =>
                    setParams({ ...params, [pName]: e.target.value })
                  }
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Body para métodos POST/PUT */}
      {selectedEndpoint &&
        (selectedEndpoint.method === "POST" ||
          selectedEndpoint.method === "PUT") && (
          <div className="mb-4">
            <h3 className="font-semibold">Body JSON (opcional):</h3>
            <textarea
              className="border p-2 w-full"
              rows="4"
              placeholder='{"key": "value"}'
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
            />
          </div>
        )}

      {/* Botón para enviar la solicitud */}
      <div className="mb-4">
        <button
          className="px-3 py-1 bg-green-500 text-white rounded"
          onClick={handleSendRequest}
        >
          Enviar
        </button>
      </div>

      {/* Mostrar respuesta */}
      <div className="mb-4">
        <h3 className="font-semibold">Respuesta:</h3>
        <pre className="bg-gray-100 p-2 border min-h-[80px] whitespace-pre-wrap">
          {response}
        </pre>
      </div>

      {/* Webview solo en Electron */}
      {isElectron() && (
        <div className="mb-4">
          <h3 className="font-semibold">Vista del Webview:</h3>
          {baseUrl ? (
            <webview
              ref={webviewRef}
              style={{ width: "100%", height: "300px" }}
              src={baseUrl}
            />
          ) : (
            <p className="text-gray-500">
              Ingresa la Base URL y presiona "Cargar Endpoints" para ver la
              vista.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default TestApiMock;
