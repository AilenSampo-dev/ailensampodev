import { useEffect, useState } from "react";
import { History, RotateCcw } from "lucide-react";
import { fetchBackupHistory, restoreBackup } from "../lib/erp-api.js";

const t = {
  muted: "rgba(26,14,51,0.46)",
  faint: "rgba(26,14,51,0.28)",
  line: "rgba(26,14,51,0.09)",
  orange: "#FF6437",
  mint: "#2FA98A",
  plum: "#3A1E66",
  fMono: "'DM Mono', ui-monospace, monospace",
};

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BackupHistoryPanel({ onRestored }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restoringId, setRestoringId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBackupHistory();
      setItems(data.items || []);
    } catch (e) {
      setError(e.message || "No se pudo cargar el historial.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const restaurar = async (item) => {
    const msg = [
      `Restaurar backup del ${fmtDate(item.created_at)}?`,
      `${item.clientes_count} cliente(s), ${item.proyectos_count} proyecto(s).`,
      "",
      "Se reemplazarán TODOS los datos actuales del ERP.",
    ].join("\n");
    if (!window.confirm(msg)) return;

    setRestoringId(item.id);
    try {
      const data = await restoreBackup(item.id);
      onRestored?.({ clientes: data.clientes, proyectos: data.proyectos });
      await load();
      window.alert("Backup restaurado.");
    } catch (e) {
      window.alert(e.message || "No se pudo restaurar.");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${t.line}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <History size={13} color={t.plum} />
        <span style={{ fontFamily: t.fMono, fontSize: 9, letterSpacing: 1.2, color: t.muted }}>
          HISTORIAL AUTOMÁTICO
        </span>
      </div>

      {loading && <p style={{ fontFamily: t.fMono, fontSize: 9, color: t.faint, margin: 0 }}>Cargando…</p>}

      {error && (
        <p style={{ fontFamily: t.fMono, fontSize: 9, color: t.orange, lineHeight: 1.45, margin: "0 0 8px" }}>
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p style={{ fontFamily: t.fMono, fontSize: 9, color: t.faint, lineHeight: 1.45, margin: 0 }}>
          Aún no hay snapshots. Se crean solos antes de cada guardado.
        </p>
      )}

      {!loading && items.length > 0 && (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: 180, overflowY: "auto" }}>
          {items.map((item) => (
            <li
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
                fontSize: 10,
                color: t.plum,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: t.fMono, fontSize: 9, color: t.muted }}>{fmtDate(item.created_at)}</div>
                <div style={{ fontSize: 10 }}>
                  {item.clientes_count} cli · {item.proyectos_count} proy
                  {item.source === "pre-restore" ? " · pre-restauración" : ""}
                </div>
              </div>
              <button
                type="button"
                disabled={restoringId === item.id}
                onClick={() => restaurar(item)}
                title="Restaurar este backup"
                style={{
                  background: "transparent",
                  border: `1px solid ${t.line}`,
                  borderRadius: 6,
                  padding: "4px 6px",
                  color: restoringId === item.id ? t.faint : t.mint,
                  cursor: restoringId === item.id ? "wait" : "pointer",
                }}
              >
                <RotateCcw size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p style={{ fontFamily: t.fMono, fontSize: 8, color: t.faint, lineHeight: 1.4, marginTop: 6, marginBottom: 0 }}>
        Guarda los últimos 30 cambios en Supabase.
      </p>
    </div>
  );
}
