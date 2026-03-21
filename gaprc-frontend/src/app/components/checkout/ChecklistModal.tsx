import { motion } from "motion/react";
import { X, Check } from "lucide-react";
import type { ChecklistItem } from "../../pages/JobisteCheckoutForm";

export function ChecklistModal({
  checklist, onToggle, onClose,
}: {
  checklist: ChecklistItem[];
  onToggle: (id: string) => void;
  onClose: () => void;
}) {
  const grouped = checklist.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const categories = Object.keys(grouped);
  const completed = checklist.filter(i => i.checked).length;
  const percentage = Math.round((completed / checklist.length) * 100);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 28 }} onClick={(e) => e.stopPropagation()} style={{ width: "min(680px, 96vw)", background: "#ffffff", borderRadius: 24, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.2)", maxHeight: "90vh" }}>
        <div style={{ height: 4, background: "linear-gradient(90deg, #dc2626, #b91c1c)" }} />
        <div style={{ padding: "28px 32px 32px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
            <div><h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#111827", letterSpacing: "-0.03em", marginBottom: 4 }}>Entretien journalier</h2><p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Checklist des tâches du shift</p></div>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X style={{ width: 16, height: 16, color: "#6b7280" }} /></button>
          </div>
          <div style={{ marginBottom: 24, background: "#f3f4f6", borderRadius: 12, padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em" }}>Progression</span><span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>{completed}/{checklist.length}</span></div>
            <div style={{ width: "100%", height: 8, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}><motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 0.5, ease: "easeOut" }} style={{ height: "100%", background: percentage === 100 ? "linear-gradient(90deg, #22c55e, #15803d)" : "linear-gradient(90deg, #dc2626, #b91c1c)", borderRadius: 99 }} /></div>
          </div>
          <div style={{ maxHeight: "50vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
            {categories.map((category, catIdx) => (
              <div key={catIdx}>
                <h3 style={{ fontSize: "0.82rem", fontWeight: 700, color: "#374151", marginBottom: 10, letterSpacing: "-0.01em" }}>{catIdx + 1}. {category}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 8 }}>
                  {grouped[category].map((item) => (
                    <motion.button key={item.id} onClick={() => onToggle(item.id)} whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: item.checked ? "#f0fdf4" : "#f9fafb", border: item.checked ? "2px solid #bbf7d0" : "2px solid #e5e7eb", borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, background: item.checked ? "#16a34a" : "white", border: item.checked ? "2px solid #16a34a" : "2px solid #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>{item.checked && <Check style={{ width: 14, height: 14, color: "white", strokeWidth: 3 }} />}</div>
                      <span style={{ fontSize: "0.9rem", fontWeight: item.checked ? 600 : 500, color: item.checked ? "#15803d" : "#374151", textDecoration: item.checked ? "line-through" : "none", flex: 1 }}>{item.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}