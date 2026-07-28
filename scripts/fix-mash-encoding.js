const fs = require("fs");
const { execSync } = require("child_process");

const tracking = `
<div id="as-proposal-actions" style="position:fixed;bottom:0;left:0;right:0;z-index:9999;padding:12px 16px;background:rgba(26,16,48,.92);backdrop-filter:blur(8px);display:flex;gap:10px;justify-content:center;align-items:center;font-family:system-ui,sans-serif">
  <button id="as-proposal-accept" type="button" style="padding:12px 20px;border:none;background:#F656BF;color:#fff;font:inherit;font-weight:700;cursor:pointer">Aceptar propuesta</button>
  <span id="as-proposal-status" style="color:#E1ADFF;font-size:14px"></span>
</div>
<style>@media print{#as-proposal-actions{display:none!important}} body{padding-bottom:72px} #as-proposal-actions{max-width:100vw;overflow-x:clip;box-sizing:border-box}</style>
<script>
(function(){
  var slug = "mash";
  var storageKey = "as-proposal-" + slug + "-accepted";
  var params = new URLSearchParams(window.location.search);
  var btn = document.getElementById("as-proposal-accept");
  var status = document.getElementById("as-proposal-status");
  function showAccepted() {
    if (!btn || !status) return;
    btn.style.display = "none";
    status.textContent = "Propuesta aceptada";
    try { localStorage.setItem(storageKey, "1"); } catch (e) {}
  }
  try { if (localStorage.getItem(storageKey) === "1") showAccepted(); } catch (e) {}
  fetch("/api/proposals/" + slug + "/open?" + params.toString(), { method: "POST" })
    .then(function(r){ return r.json().catch(function(){ return {}; }); })
    .then(function(d){ if (d && d.status === "accepted") showAccepted(); })
    .catch(function(){});
  if (!btn) return;
  btn.addEventListener("click", function(){
    btn.disabled = true;
    fetch("/api/proposals/" + slug + "/accept", { method: "POST" })
      .then(function(r){ return r.json().then(function(d){ return { ok: r.ok, status: r.status, d: d }; }); })
      .then(function(res){
        if (res.ok || res.status === 409) { showAccepted(); return; }
        status.textContent = res.d.error || "No se pudo aceptar.";
        btn.disabled = false;
      })
      .catch(function(){ status.textContent = "Error de conexión."; btn.disabled = false; });
  });
})();
</script>`;

let html = execSync(
  "git show feat/sitio:src/content/propuestas/mash/propuesta.html",
  { encoding: "utf8" }
);

html = html.replace(/\n<\/body>\n<\/html>\s*$/, `${tracking}\n</body>\n</html>`);

const outPath = "p/mash/index.html";
fs.writeFileSync(outPath, html, "utf8");

const bytes = fs.readFileSync(outPath);
console.log("startsWithBOM", bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf);
console.log("has Núcleo", html.includes("Núcleo"));
console.log("has Ailén", html.includes("Ailén"));
