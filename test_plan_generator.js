const style = document.createElement("style");
style.textContent = `
#richapitester-panel {
  position: fixed;
  top: 10px;
  right: 10px;
  width: 400px;
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

const html = document.createElement("div");
html.id = "richapitester-panel";
html.innerHTML = `
  <h4>🧪 RichAPItester</h4>
  <select id="richapi-endpoint" style="width:100%"></select>
  <div id="param-container"></div>
  <div class="info" id="richapi-info"></div>
  <textarea id="richapi-body" placeholder="JSON Body (opcional)"></textarea>
  <button id="richapi-send">Enviar</button>
  <button id="run-full-test">▶️ Ejecutar Prueba Completa</button>
  <input type="file" id="import-test-plan" style="margin-top: 6px;" />
  <button id="run-imported-test-plan">▶️ Ejecutar Plan Importado</button>
  <button id="clear-log">🧹 Limpiar Respuesta</button>
  <div id="richapitester-response">Respuesta aquí...</div>
  <div style="margin-top: 12px;">
    <h5>📝 Editor de Test Plan</h5>
    <textarea id="test-plan-editor" style="width:100%; height:200px;" placeholder="Escribe aquí tu test plan JSON..."></textarea>
    <div style="margin-top: 6px;">
      <button id="validate-test-plan">✅ Validar</button>
      <button id="save-test-plan">💾 Guardar en App</button>
      <button id="export-test-plan">⬇️ Exportar JSON</button>
    </div>
    <div id="editor-feedback" style="font-size: 12px; margin-top: 4px;"></div>
  </div>
`;

document.body.appendChild(style);
document.body.appendChild(html);

// 🧹 Botón para limpiar la respuesta
const clearLogButton = document.getElementById("clear-log");
clearLogButton.addEventListener("click", () => {
  document.getElementById("richapitester-response").textContent = "";
});

// ✅ Validación del test plan desde el editor
const validateButton = document.getElementById("validate-test-plan");
validateButton.addEventListener("click", () => {
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
