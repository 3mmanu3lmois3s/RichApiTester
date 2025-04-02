// richapitester-inject.js

(function () {
  // Evitamos duplicados
  if (document.getElementById("richapitester-panel")) return;

  // Estilos para el panel
  const style = document.createElement("style");
  style.textContent = `
    #richapitester-panel {
      position: fixed;
      top: 10px;
      right: 10px;
      width: 400px;
      max-height: 95vh;
      overflow-y: auto;
      background: white;
      border: 2px solid #ccc;
      padding: 10px;
      z-index: 999999;
      font-family: sans-serif;
      box-shadow: 0 0 10px rgba(0,0,0,0.3);
    }
    #richapitester-panel textarea {
      width: 100%;
      height: 100px;
    }
    #richapitester-panel input, 
    #richapitester-panel select, 
    #richapitester-panel button {
      margin: 5px 0;
      padding: 5px;
      width: 100%;
    }
    #richapitester-panel pre {
      background: #f3f3f3;
      padding: 10px;
      min-height: 80px;
      overflow: auto;
      white-space: pre-wrap;
    }
  `;
  document.head.appendChild(style);

  // HTML del panel
  const panel = document.createElement("div");
  panel.id = "richapitester-panel";
  panel.innerHTML = `
    <h2>RichAPItester</h2>
    <div>
      <label>Base URL:</label>
      <input id="rat-baseUrl" type="text" placeholder="https://tu-proyecto.github.io" />
      <button id="rat-loadEndpoints">Cargar Endpoints</button>
    </div>
    <div>
      <label>Endpoint:</label>
      <select id="rat-endpoints"></select>
    </div>
    <div id="rat-params"></div>
    <div>
      <label>Body (opcional):</label>
      <textarea id="rat-body" placeholder='{"key": "value"}'></textarea>
    </div>
    <div>
      <button id="rat-send">Enviar</button>
    </div>
    <div>
      <h3>Respuesta:</h3>
      <pre id="rat-response"></pre>
    </div>
  `;
  document.body.appendChild(panel);

  // Funciones de utilidad
  function extractParams(path) {
    const regex = /:([a-zA-Z0-9_]+)/g;
    let match;
    const params = [];
    while ((match = regex.exec(path)) !== null) {
      params.push(match[1]);
    }
    return params;
  }

  function renderParams(params) {
    const container = document.getElementById("rat-params");
    container.innerHTML = "";
    params.forEach((p) => {
      const div = document.createElement("div");
      div.innerHTML = `<label>${p}:</label><input type="text" data-param="${p}" />`;
      container.appendChild(div);
    });
  }

  // Variables internas
  let endpoints = [];

  // Cargar endpoints desde mocks_payloads.json
  document
    .getElementById("rat-loadEndpoints")
    .addEventListener("click", async () => {
      const baseUrl = document.getElementById("rat-baseUrl").value.trim();
      if (!baseUrl) {
        alert("Ingresa la Base URL");
        return;
      }
      const url = baseUrl.replace(/\/$/, "") + "/mocks_payloads.json";
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("No se pudo cargar");
        endpoints = await res.json();
        const select = document.getElementById("rat-endpoints");
        select.innerHTML = "";
        endpoints.forEach((ep, idx) => {
          const option = document.createElement("option");
          option.value = idx;
          option.textContent = `${ep.method} ${ep.path}`;
          select.appendChild(option);
        });
        // Seleccionar el primero y renderizar sus parámetros
        if (endpoints.length > 0) {
          select.selectedIndex = 0;
          const params = extractParams(endpoints[0].path);
          renderParams(params);
        }
      } catch (err) {
        console.error(err);
        alert("Error al cargar endpoints: " + err.message);
      }
    });

  // Cuando se cambia el endpoint seleccionado
  document
    .getElementById("rat-endpoints")
    .addEventListener("change", (e) => {
      const idx = parseInt(e.target.value, 10);
      if (endpoints[idx]) {
        const params = extractParams(endpoints[idx].path);
        renderParams(params);
      }
    });

  // Enviar solicitud
  document.getElementById("rat-send").addEventListener("click", async () => {
    const baseUrl = document.getElementById("rat-baseUrl").value.trim();
    const select = document.getElementById("rat-endpoints");
    const idx = parseInt(select.value, 10);
    if (!baseUrl || !endpoints[idx]) {
      alert("Asegúrate de que la Base URL y el endpoint estén configurados");
      return;
    }
    const ep = endpoints[idx];
    let finalPath = ep.path;
    // Reemplazar parámetros con los valores ingresados
    document
      .querySelectorAll("#rat-params input")
      .forEach((input) => {
        const key = input.getAttribute("data-param");
        const val = input.value.trim();
        finalPath = finalPath.replace(`:${key}`, val || `:${key}`);
      });
    const fullURL = baseUrl.replace(/\/$/, "") + finalPath;
    const options = {
      method: ep.method,
      headers: { "Content-Type": "application/json" },
    };
    if (ep.method === "POST" || ep.method === "PUT") {
      const body = document.getElementById("rat-body").value.trim();
      try {
        options.body = body ? JSON.stringify(JSON.parse(body)) : "{}";
      } catch (err) {
        alert("El body no es JSON válido");
        return;
      }
    }
    try {
      const res = await fetch(fullURL, options);
      const text = await res.text();
      document.getElementById("rat-response").textContent = text;
    } catch (err) {
      document.getElementById("rat-response").textContent =
        "Error: " + err.message;
    }
  });

  console.log("RichAPItester inyectado correctamente");
})();
