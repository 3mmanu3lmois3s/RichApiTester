// src/components/TestApiMock.jsx
import React, { useState, useRef, useEffect } from "react";

function TestApiMock() {
  const [baseUrl, setBaseUrl] = useState("");
  const [endpoints, setEndpoints] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [params, setParams] = useState({});
  const [requestBody, setRequestBody] = useState("");
  const [response, setResponse] = useState("");

  // Referencia a la "caja de pruebas": en Electron será un webview y en el navegador un iframe.
  const containerRef = useRef(null);

  // Para cargar endpoints desde mocks_payloads.json
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

  // Extraer parámetros de la ruta (ej: /api/user/:userId)
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

  const constructPath = (path, paramsObj) => {
    let finalPath = path;
    Object.entries(paramsObj).forEach(([key, value]) => {
      finalPath = finalPath.replace(`:${key}`, value || `:${key}`);
    });
    return finalPath;
  };

  // Esta función se encargará de enviar la solicitud.
  // Se usará un enfoque distinto según el entorno:
  // - En Electron (si detectamos window.electronAPI o que containerRef.current.executeJavaScript existe) usará ese método.
  // - En navegador se hará directamente fetch.
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

    // Si estamos en Electron y tenemos un webview con executeJavaScript...
    if (
      containerRef.current &&
      typeof containerRef.current.executeJavaScript === "function"
    ) {
      const codeToExecute = `
        fetch("${fullURL}", ${JSON.stringify(options)})
          .then(res => res.text())
          .then(text => text)
          .catch(err => "Error: " + err.message);
      `;
      try {
        const result = await containerRef.current.executeJavaScript(
          codeToExecute
        );
        setResponse(result);
      } catch (err) {
        setResponse("Error al ejecutar la solicitud: " + err.message);
      }
    } else {
      // En navegador, hacemos fetch directamente (o, si deseas usar iframe+postMessage, lo implementas aquí)
      try {
        const res = await fetch(fullURL, options);
        const text = await res.text();
        setResponse(text);
      } catch (err) {
        setResponse("Error al ejecutar la solicitud (Browser): " + err.message);
      }
    }
  };

  // Renderizado
  const selectedEndpoint = selectedIndex >= 0 ? endpoints[selectedIndex] : null;
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Test API Mock</h2>
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
      <div className="mb-4">
        <button
          className="px-3 py-1 bg-green-500 text-white rounded"
          onClick={handleSendRequest}
        >
          Enviar
        </button>
      </div>
      <div className="mb-4">
        <h3 className="font-semibold">Respuesta:</h3>
        <pre className="bg-gray-100 p-2 border min-h-[80px] whitespace-pre-wrap">
          {response}
        </pre>
      </div>
      <div className="mb-4">
        <h3 className="font-semibold">Vista del Contenedor:</h3>
        {/* En Electron, este contenedor será un webview; en navegador, podrías usar un iframe o dejarlo vacío */}
        {baseUrl ? (
          <div>
            {typeof window.electronAPI !== "undefined" ? (
              <webview
                ref={containerRef}
                style={{ width: "100%", height: "300px" }}
                src={baseUrl}
              />
            ) : (
              <iframe
                ref={containerRef}
                style={{ width: "100%", height: "300px", border: "none" }}
                src={baseUrl}
                title="Proxy View"
              />
            )}
          </div>
        ) : (
          <p className="text-gray-500">
            Ingresa la Base URL y presiona "Cargar Endpoints" para ver la vista.
          </p>
        )}
      </div>
    </div>
  );
}

export default TestApiMock;
