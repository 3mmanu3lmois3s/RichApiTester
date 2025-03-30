// ⛑️ Captura de errores globales de promesas
window.addEventListener("unhandledrejection", (event) => {
  console.error("⚠️ Promesa no manejada:", event.reason);
});

const style = document.createElement("style");
style.textContent = `
#richapitester-panel {
  position: fixed;
  top: 10px;
  right: 10px;
  width: 400px;
  max-height: 95vh;           /* NUEVO: altura máxima visible */
  overflow-y: auto;           /* NUEVO: activa scroll interno */
  background: white;
  border: 2px solid #ccc;
  padding: 10px;
  z-index: 999999;
  font-family: monospace;
  box-shadow: 0 0 10px rgba(0,0,0,0.3);
}
  #richapitester-panel textarea {
    width: 100%;
    height: 100px;
  }
  #richapitester-response, #autotest-log {
    white-space: pre-wrap;
    background: #f3f3f3;
    padding: 10px;
    height: 150px;
    overflow: auto;
    margin-top: 10px;
    font-size: 12px;
  }
  .param-input {
    width: 100%;
    margin-bottom: 4px;
    font-family: monospace;
  }
  .param-label {
    font-size: 12px;
    color: #333;
    margin-bottom: 2px;
    display: block;
  }
  .info {
    font-size: 11px;
    color: #666;
    margin-bottom: 6px;
  }
  `;

document.body.appendChild(style);

const html = document.createElement("div");
html.id = "richapitester-panel";
html.innerHTML = `
    <h4>🧪 RichAPItester</h4>
    <select id="richapi-endpoint" style="width:100%"></select>
    <div id="param-container"></div>
    <div class="info" id="richapi-info"></div>
    <textarea id="richapi-body" placeholder="JSON Body (opcional)"></textarea>
    <button id="richapi-send">Enviar</button>
    <button id="run-autotest">▶️ Ejecutar Auto Test</button>
    <button id="run-full-test">▶️ Ejecutar Prueba Completa</button>
    <input type="file" id="import-test-plan" style="margin-top: 6px;" />
    <button id="run-imported-test-plan">▶️ Ejecutar Plan Importado</button>
    <button id="generate-test-flow">🛠️ Generar desde mocks_payloads</button>
    <button id="clear-log">🧹 Limpiar Log</button> <button id="copy-generated-to-editor" title="Copiar test generado al editor">📋 Payload -> testPlan </button>
    <div id="richapitester-response">Respuesta aquí...</div>
    <div id="autotest-log"></div>
    <div style="margin-top: 12px;">
      <h5>📝 Editor de Test Plan</h5>

      <textarea id="test-plan-editor" style="width:100%; height:200px;" placeholder="Escribe aquí tu test plan JSON..."></textarea>
      <div style="margin-top: 6px;">
        <button id="validate-test-plan">✅ Validar</button>
        <button id="save-test-plan">💾 Guardar en App</button>
        <button id="export-test-plan">⬇️ Exportar JSON</button>
        <button id="run-editor-test-plan">▶️ Ejecutar desde Editor</button>

      </div>
      <div id="editor-feedback" style="font-size: 12px; margin-top: 4px;"></div>
    </div>
  `;

document.body.appendChild(html);

// 📋 Botón para copiar el test generado al editor
document
  .getElementById("copy-generated-to-editor")
  .addEventListener("click", () => {
    if (!window.generatedTestFlow || !Array.isArray(window.generatedTestFlow)) {
      alert(
        "⚠️ No hay test generado aún. Usa 'Generar desde mocks_payloads' primero."
      );
      return;
    }
    document.getElementById("test-plan-editor").value = JSON.stringify(
      window.generatedTestFlow,
      null,
      2
    );
    alert("✅ Test generado copiado al editor.");
  });

// Activar botón "Generar desde mocks_payloads"
document
  .getElementById("generate-test-flow")
  .addEventListener("click", generateTestFlowFromMocks);

// Activar botón limpiar log
const clearBtn = document.getElementById("clear-log");
clearBtn.addEventListener("click", () => {
  document.getElementById("richapitester-response").textContent = "";
  document.getElementById("autotest-log").textContent = "";
});

// 🔁 Cargar endpoints desde mocks_payloads.json
async function loadMockEndpoints() {
  try {
    const base = window.location.pathname.split("/").slice(0, 2).join("/");
    const response = await fetch(`${base}/mocks_payloads.json`);
    const routes = await response.json();
    const select = document.getElementById("richapi-endpoint");

    routes.forEach((route, index) => {
      const option = document.createElement("option");
      option.value = JSON.stringify({ ...route, index });
      option.textContent = `${route.method} ${route.path}`;
      select.appendChild(option);
    });

    select.addEventListener("change", () => {
      const selected = JSON.parse(select.value);
      renderParamFields(selected.path);
      renderInfo(selected);
    });

    select.dispatchEvent(new Event("change"));
  } catch (error) {
    console.error("❌ Error cargando mocks_payloads.json:", error);
    document.getElementById("richapitester-response").textContent =
      "❌ No se pudo cargar mocks_payloads.json";
  }
}

function renderParamFields(path) {
  const paramContainer = document.getElementById("param-container");
  paramContainer.innerHTML = "";
  const paramMatches = path.match(/:([a-zA-Z0-9_]+)/g) || [];
  paramMatches.forEach((param) => {
    const paramName = param.replace(":", "");
    const label = document.createElement("label");
    label.className = "param-label";
    label.textContent = `Parámetro: ${paramName}`;
    const input = document.createElement("input");
    input.id = `param-${paramName}`;
    input.className = "param-input";
    paramContainer.appendChild(label);
    paramContainer.appendChild(input);
  });
}

function renderInfo(route) {
  const info = document.getElementById("richapi-info");
  if (route.description) {
    info.textContent = `ℹ️ ${route.description}`;
  } else {
    info.textContent = "";
  }

  if (
    route.payloadExample &&
    (route.method === "POST" || route.method === "PUT")
  ) {
    document.getElementById("richapi-body").placeholder = JSON.stringify(
      route.payloadExample,
      null,
      2
    );
  } else {
    document.getElementById("richapi-body").placeholder =
      "JSON Body (opcional)";
  }
}

loadMockEndpoints();

function replaceParams(path) {
  const paramMatches = path.match(/:([a-zA-Z0-9_]+)/g) || [];
  paramMatches.forEach((param) => {
    const paramName = param.replace(":", "");
    const input = document.getElementById(`param-${paramName}`);
    const value = input ? input.value.trim() : "";
    path = path.replace(param, value || `:${paramName}`);
  });
  return path;
}

document.getElementById("richapi-send").addEventListener("click", async () => {
  const routeData = JSON.parse(
    document.getElementById("richapi-endpoint").value
  );
  const method = routeData.method;
  const path = replaceParams(routeData.path);
  const body = document.getElementById("richapi-body").value.trim();

  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (method === "POST" || method === "PUT") {
    if (body) {
      try {
        options.body = JSON.stringify(JSON.parse(body));
      } catch (e) {
        return alert("⚠️ El body no es JSON válido.");
      }
    } else {
      options.body = "{}";
    }
  }

  try {
    const fullPath = `${window.location.pathname
      .split("/")
      .slice(0, 2)
      .join("/")}${path}`;
    const res = await fetch(fullPath, options);
    const text = await res.text();
    document.getElementById("richapitester-response").textContent = text;
  } catch (err) {
    document.getElementById("richapitester-response").textContent =
      "❌ Error: " + err.message;
  }
});

// ▶️ AUTO TEST FLOW
const testSteps = [
  {
    label: "Crear cliente",
    method: "POST",
    path: "/api/data",
    body: {
      name: "Test",
      email: "test@example.com",
      address: "123 Main St",
    },
    storeAs: "customerId",
  },
  {
    label: "Iniciar cotización",
    method: "POST",
    path: "/api/customers/:customerId/quotes",
    body: {
      productCode: "BASIC",
      coverage: "FULL",
      birthDate: "1990-01-01",
    },
    storeAs: "quoteId",
  },
  {
    label: "Calcular prima",
    method: "POST",
    path: "/api/customers/:customerId/quotes/:quoteId/calculate",
  },
  {
    label: "Aceptar cotización",
    method: "POST",
    path: "/api/customers/:customerId/quotes/:quoteId/accept",
    storeAs: "policyId",
  },
  {
    label: "Registrar reclamo",
    method: "POST",
    path: "/api/customers/:customerId/claims",
    body: {
      policyId: "{policyId}",
      description: "Daño leve",
    },
  },
];

const vars = {};

function substitute(str) {
  return str
    .replace(/:(\w+)/g, (_, v) => vars[v] || v)
    .replace(/\{(\w+)\}/g, (_, v) => vars[v] || v);
}

// Esta parte genera un flujo de prueba inicial automáticamente
// a partir del archivo mocks_payloads.json

async function generateTestFlowFromMocks() {
  try {
    const base = window.location.pathname.split("/").slice(0, 2).join("/");
    const response = await fetch(`${base}/mocks_payloads.json`);
    const routes = await response.json();

    // Función recursiva para reemplazar campos que terminan en Id
    function replaceIdFields(obj) {
      if (Array.isArray(obj)) {
        return obj.map(replaceIdFields);
      } else if (typeof obj === "object" && obj !== null) {
        const newObj = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === "string" && key.endsWith("Id")) {
            newObj[key] = `{{${key}}}`;
          } else {
            newObj[key] = replaceIdFields(value);
          }
        }
        return newObj;
      }
      return obj;
    }

    const testFlow = routes.map((route) => {
      const step = {
        method: route.method,
        path: route.path,
        description: route.description || "",
        params: {},
        body: replaceIdFields(route.payloadExample || {}),
        saveResponse: true, // permite guardar cosas como IDs
      };

      // Extraemos nombres de parámetros como :customerId, :quoteId
      const paramMatches = route.path.match(/:([a-zA-Z0-9_]+)/g) || [];
      paramMatches.forEach((p) => {
        const key = p.replace(":", "");
        step.params[key] = `{{${key}}}`; // placeholder
      });

      return step;
    });

    // Mostrar el JSON en consola o guardarlo en variable global para edición/export
    console.log("🔁 Test flow generado:", testFlow);
    window.generatedTestFlow = testFlow;
    document.getElementById("richapitester-response").textContent =
      JSON.stringify(testFlow, null, 2);
  } catch (error) {
    console.error(
      "❌ Error generando test flow desde mocks_payloads.json",
      error
    );
    document.getElementById("richapitester-response").textContent =
      "❌ No se pudo generar el flujo de pruebas";
  }
}

// Ejemplo de uso: genera el flujo y lo guarda en window.generatedTestFlow
generateTestFlowFromMocks();

async function runAutotest() {
  const log = document.getElementById("autotest-log");
  log.textContent = "";
  for (const step of testSteps) {
    const url = substitute(step.path);
    const method = step.method;
    const body = step.body
      ? JSON.stringify(JSON.parse(substitute(JSON.stringify(step.body))))
      : undefined;
    log.textContent += `▶️ ${step.label} (${method} ${url})\n`;
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });
      const json = await res.json();
      log.textContent += `✅ ${res.status} → ${JSON.stringify(json)}\n\n`;
      if (step.storeAs && json[step.storeAs]) {
        vars[step.storeAs] = json[step.storeAs];
      }
    } catch (err) {
      log.textContent += `❌ Error: ${err.message}\n\n`;
      break;
    }
  }
}

document.getElementById("run-autotest").addEventListener("click", runAutotest);

let importedTestPlan = null;

document
  .getElementById("import-test-plan")
  .addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        importedTestPlan = JSON.parse(e.target.result);
        alert("✅ Test plan importado correctamente.");
      } catch (err) {
        alert("❌ Error al leer el archivo JSON.");
      }
    };
    reader.readAsText(file);
  });

document
  .getElementById("run-imported-test-plan")
  .addEventListener("click", async () => {
    if (!importedTestPlan) return alert("⚠️ No hay plan de prueba cargado.");

    //const logArea = document.createElement("div");
    const logArea = document.getElementById("autotest-log");

    /*
    logArea.id = "test-log";
    logArea.style.whiteSpace = "pre-wrap";
    logArea.style.background = "#f3f3f3";
    logArea.style.padding = "10px";
    logArea.style.marginTop = "10px";
    logArea.style.height = "150px";
    logArea.style.overflow = "auto";
    document.getElementById("richapitester-panel").appendChild(logArea); */
    logArea.textContent = "🧪 Ejecutando test plan...\n\n";

    const context = {};

    for (const step of importedTestPlan) {
      const base = window.location.pathname.split("/").slice(0, 2).join("/");
      const substitutedPath = step.path
        .replace(/:([a-zA-Z0-9_]+)/g, (_, k) => context[k] || `:${k}`)
        .replace(/{{(.*?)}}/g, (_, k) => context[k] || `missing_${k}`);
      const finalPath = `${base}${substitutedPath}`;
      const method = step.method.toUpperCase();

      let body = null;
      if (step.body && method !== "GET" && method !== "HEAD") {
        body = JSON.stringify(
          JSON.parse(
            JSON.stringify(step.body).replace(
              /{{(.*?)}}/g,
              (_, k) => context[k] || `missing_${k}`
            )
          )
        );
      }

      logArea.textContent += `📤 ${step.description || step.path}\n`;
      logArea.textContent += `📌 URL Final: ${finalPath}\n`;
      logArea.textContent += `📌 Contexto actual: ${JSON.stringify(
        context,
        null,
        2
      )}\n`;
      if (body) logArea.textContent += `📦 Payload usado: ${body}\n`;

      const options = {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body ? { body } : {}),
      };

      try {
        const res = await fetch(finalPath, options);
        const resultText = await res.text();
        logArea.textContent += `✅ Respuesta: ${resultText}\n`;

        const json = JSON.parse(resultText);
        if (step.saveResponse && typeof json === "object") {
          Object.entries(json).forEach(([key, value]) => {
            if (typeof value === "string" && key.endsWith("Id")) {
              context[key] = value;
            }
          });
        }
      } catch (err) {
        logArea.textContent += `❌ Error: ${err.message}\n`;
        break;
      }

      await new Promise((res) => setTimeout(res, 800));
    }

    logArea.textContent += "\n🏁 Test finalizado.";
  });

// ==== Test Plan Editor (Manual JSON Edition) ====

const testPlanEditor = document.getElementById("test-plan-editor");

const testPlanEditorText = document.getElementById("test-plan-json");
const saveTestPlanBtn = document.getElementById("save-test-plan");
const exportTestPlanBtn = document.getElementById("export-test-plan");

let currentEditableTestPlan = [];

// Mostrar editor con test plan cargado o generado
function showTestPlanEditor(plan) {
  testPlanEditor.style.display = "block";
  currentEditableTestPlan = plan;
  testPlanEditorText.value = JSON.stringify(plan, null, 2);
}

// Guardar el contenido del editor en memoria (para ejecución)
saveTestPlanBtn.addEventListener("click", () => {
  try {
    currentEditableTestPlan = JSON.parse(testPlanEditor.value);
    alert("✅ Test plan actualizado en memoria.");
  } catch (e) {
    alert("⚠️ JSON inválido, no se pudo guardar.");
  }
});

// Exportar como archivo
exportTestPlanBtn.addEventListener("click", () => {
  try {
    const json = JSON.stringify(currentEditableTestPlan, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "test_plan_exportado.json";
    a.click();

    URL.revokeObjectURL(url);
  } catch (e) {
    alert("❌ No se pudo exportar el archivo.");
  }
});

// Botón de Validar Test Plan
document.getElementById("validate-test-plan").addEventListener("click", () => {
  const editor = document.getElementById("test-plan-editor");
  const feedback = document.getElementById("editor-feedback");

  try {
    const parsed = JSON.parse(editor.value);
    if (!Array.isArray(parsed))
      throw new Error("El test plan debe ser un array.");
    feedback.textContent = "✅ JSON válido.";
    feedback.style.color = "green";
  } catch (e) {
    feedback.textContent = "❌ Error: " + e.message;
    feedback.style.color = "red";
  }
});

// ✅ Botón: Ejecutar desde Editor
document
  .getElementById("run-editor-test-plan")
  .addEventListener("click", async () => {
    const log = document.getElementById("autotest-log");
    log.textContent = "🧪 Ejecutando test plan desde editor...\n\n";

    let plan;
    try {
      plan = JSON.parse(document.getElementById("test-plan-editor").value);
      plan = plan.map((step) => {
        if (step.method.toUpperCase() === "GET" && step.body) {
          delete step.body;
        }
        return step;
      });
    } catch (err) {
      log.textContent += "❌ Error: JSON inválido.\n";
      return;
    }

    const context = {};
    const base = window.location.pathname.split("/").slice(0, 2).join("/");

    for (const step of plan) {
      const substitutedPath = step.path
        .replace(/:([a-zA-Z0-9_]+)/g, (_, k) => context[k] || `:${k}`)
        .replace(/{{(.*?)}}/g, (_, k) => context[k] || `missing_${k}`);

      const finalPath = `${base}${substitutedPath}`;
      const method = step.method.toUpperCase();

      let payloadUsed = null;
      if (step.body && method !== "GET" && method !== "HEAD") {
        payloadUsed = JSON.parse(
          JSON.stringify(step.body).replace(
            /{{(.*?)}}/g,
            (_, k) => context[k] || `missing_${k}`
          )
        );
      }

      const options = {
        method,
        headers: { "Content-Type": "application/json" },
        ...(payloadUsed ? { body: JSON.stringify(payloadUsed) } : {}),
      };

      log.textContent += `📤 ${step.description || step.path}\n`;
      log.textContent += `🔗 URL Final: ${finalPath}\n`;
      if (payloadUsed)
        log.textContent += `📦 Payload usado: ${JSON.stringify(payloadUsed)}\n`;
      log.textContent += `🧠 Contexto actual: ${JSON.stringify(context)}\n`;

      try {
        const res = await fetch(finalPath, options);
        const text = await res.text();
        log.textContent += `✅ Respuesta: ${text}\n\n`;

        // Intenta guardar todos los IDs útiles que estén en la respuesta
        const json = JSON.parse(text);
        ["customerId", "quoteId", "policyId", "claimId"].forEach((key) => {
          if (json[key]) context[key] = json[key];
        });
      } catch (err) {
        log.textContent += `❌ Error: ${err.message}\n\n`;
        break;
      }

      await new Promise((res) => setTimeout(res, 800));
    }

    log.textContent += "\n🏁 Test finalizado desde editor.";
  });
