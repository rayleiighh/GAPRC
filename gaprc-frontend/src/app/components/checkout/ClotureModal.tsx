import { useState } from "react";
import { motion } from "motion/react";
import { Clock, Banknote, CreditCard, MessageSquare, Loader2, CheckCircle2} from "lucide-react";
import { fmtCurrency, type Entry } from "../../pages/JobisteCheckoutForm";

export function ClotureModal({
  entries, jobisteName, onClose, onConfirm, startTimeStr,
}: {
  entries: Entry[];
  jobisteName: string;
  onClose: () => void;
  onConfirm: (comment: string, arrivee: string, depart: string) => void;
  startTimeStr: string;
}) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [heureArrivee, setHeureArrivee] = useState(startTimeStr);
  const [heureDepart, setHeureDepart] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });
  
  const totalCash = entries.reduce((s, e) => s + e.montantCash, 0);
  const totalBC = entries.reduce((s, e) => s + e.montantBancontact, 0);
  const total = totalCash + totalBC;

  const handleConfirm = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    onConfirm(comment, heureArrivee, heureDepart); 
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 28 }} onClick={(e) => e.stopPropagation()} style={{ width: "min(520px, 96vw)", background: "#ffffff", borderRadius: 24, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.2)", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ height: 4, background: "linear-gradient(90deg, #dc2626, #b91c1c)" }} />
        <div style={{ padding: "32px 36px 36px" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#111827", letterSpacing: "-0.03em", marginBottom: 4 }}>Clôturer la session</h2>
          <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginBottom: 24 }}>Vérifiez les heures et les totaux avant de vous déconnecter</p>
          <div style={{ background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "16px 18px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}><Clock style={{ width: 14, height: 14, color: "#6b7280" }} /><span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em" }}>Vérification des heures</span><span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "#9ca3af", fontWeight: 500 }}>Modifiez si nécessaire</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Heure d'arrivée</label><input type="time" value={heureArrivee} onChange={(e) => setHeureArrivee(e.target.value)} style={{ width: "100%", background: "white", border: "2px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", fontSize: "1.1rem", fontWeight: 800, color: "#111827", outline: "none", fontFamily: "inherit", letterSpacing: "-0.01em" }} onFocus={(e) => { e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.1)"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }} /></div>
              <div><label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Heure de départ</label><input type="time" value={heureDepart} onChange={(e) => setHeureDepart(e.target.value)} style={{ width: "100%", background: "white", border: "2px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", fontSize: "1.1rem", fontWeight: 800, color: "#111827", outline: "none", fontFamily: "inherit", letterSpacing: "-0.01em" }} onFocus={(e) => { e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.1)"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }} /></div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 14, padding: "16px 18px" }}><div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}><Banknote style={{ width: 15, height: 15, color: "#16a34a" }} /><span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.07em" }}>Espèces</span></div><p style={{ fontSize: "1.7rem", fontWeight: 900, color: "#15803d", letterSpacing: "-0.04em" }}>{fmtCurrency(totalCash)}</p></div>
            <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 14, padding: "16px 18px" }}><div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}><CreditCard style={{ width: 15, height: 15, color: "#2563eb" }} /><span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Bancontact</span></div><p style={{ fontSize: "1.7rem", fontWeight: 900, color: "#1d4ed8", letterSpacing: "-0.04em" }}>{fmtCurrency(totalBC)}</p></div>
          </div>
          <div style={{ background: "#111827", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}><span style={{ fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Total session ({entries.length} client{entries.length > 1 ? "s" : ""})</span><span style={{ fontSize: "1.8rem", fontWeight: 900, color: "white", letterSpacing: "-0.04em" }}>{fmtCurrency(total)}</span></div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><MessageSquare style={{ width: 13, height: 13 }} /> Commentaire <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optionnel)</span></label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Remarques sur la session…" rows={2} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ width: "100%", background: "#f9fafb", fontFamily: "inherit", border: `2px solid ${focused ? "#dc2626" : "#e5e7eb"}`, borderRadius: 12, padding: "12px 14px", fontSize: "0.9rem", color: "#374151", resize: "none", outline: "none", boxShadow: focused ? "0 0 0 3px rgba(220,38,38,0.1)" : "none", transition: "border-color 0.2s, box-shadow 0.2s" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, height: 52, borderRadius: 12, border: "2px solid #e5e7eb", background: "white", cursor: "pointer", fontWeight: 600, color: "#6b7280", fontSize: "0.9rem" }}>Annuler</button>
            <motion.button onClick={handleConfirm} disabled={loading} whileHover={!loading ? { scale: 1.02 } : {}} whileTap={!loading ? { scale: 0.98 } : {}} style={{ flex: 2, height: 52, borderRadius: 12, border: "none", background: loading ? "#16a34a" : "linear-gradient(135deg, #22c55e, #15803d)", color: "white", fontWeight: 800, fontSize: "0.95rem", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 6px 20px rgba(22,163,74,0.3)" }}>{loading ? <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> : <CheckCircle2 style={{ width: 18, height: 18 }} />}{loading ? "Enregistrement…" : "Valider et se déconnecter"}</motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}