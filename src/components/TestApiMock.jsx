// src/components/TestApiMock.jsx
import React, { useState, useRef, useEffect } from "react";

function TestApiMock() {
  // Estados para configuración y respuesta
  const [baseUrl, setBaseUrl] = useState("");
  const [endpoints, setEndpoints] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [params, setParams] = useState({});
  const [requestBody, setRequestBody] = useState("");
  const [response, setResponse] = useState("");

  // Referencia al iframe proxy (usado en navegador)
  const proxyIframeRef = useRef(null);

  // Para debug: registrar eventos del iframe proxy (si existe)
  useEffect(() => {
    if (proxyIframeRef.current) {
      const iframe = proxyIframeRef.current;
      iframe.addEventListener("load", () => {
        console.log("proxy iframe: load");
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

  // Extrae parámetros de la ruta (ejemplo: /api/user/:userId)
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

  // Función para enviar la solicitud
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

    // Si estamos en un navegador normal (donde el webview no existe) usamos el proxy
    if (proxyIframeRef.current) {
      // Prepara el mensaje para el proxy
      const message = { type: "fetchRequest", fullURL, options };
      // Envía el mensaje vía postMessage y espera la respuesta
      const responsePromise = new Promise((resolve, reject) => {
        const handler = (event) => {
          if (event.data && event.data.type === "fetchResponse") {
            window.removeEventListener("message", handler);
            resolve(event.data);
          }
        };
        window.addEventListener("message", handler);
        setTimeout(() => {
          window.removeEventListener("message", handler);
          reject(new Error("Timeout esperando respuesta del proxy"));
        }, 10000);
      });
      proxyIframeRef.current.contentWindow.postMessage(message, "*");
      try {
        const result = await responsePromise;
        if (result.error) {
          setResponse("Error: " + result.error);
        } else {
          setResponse(result.text);
        }
      } catch (err) {
        setResponse("Error al ejecutar la solicitud: " + err.message);
      }
    } else {
      // Si no hay proxy (por ejemplo en Electron donde podemos usar executeJavaScript), usamos directamente fetch
      try {
        const res = await fetch(fullURL, options);
        const text = await res.text();
        setResponse(text);
      } catch (err) {
        setResponse("Error al ejecutar la solicitud: " + err.message);
      }
    }
  };

  // Renderizado del componente
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

      {/* Iframe para el proxy: solo se usará en navegador */}
      <div className="mb-4">
        <h3 className="font-semibold">Proxy Iframe (para solicitudes)</h3>
        {baseUrl ? (
          <iframe
            ref={proxyIframeRef}
            style={{ display: "none" }}
            src={baseUrl.replace(/\/$/, "") + "/proxy.html"}
            title="Proxy"
          ></iframe>
        ) : (
          <p className="text-gray-500">
            Ingresa la Base URL y presiona "Cargar Endpoints" para usar el
            proxy.
          </p>
        )}
      </div>
    </div>
  );
}

export default TestApiMock;
