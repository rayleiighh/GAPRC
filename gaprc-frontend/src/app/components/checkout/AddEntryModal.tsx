import { useState } from "react";
import { motion } from "motion/react";
import { Plus, X, Banknote, CreditCard, AlertCircle } from "lucide-react";
import { fmtCurrency, type Entry } from "../../pages/JobisteCheckoutForm";

export function AddEntryModal({
  onClose, onAdd
}: { onClose: () => void; onAdd: (e: Omit<Entry, "id">) => void }) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [sport, setSport] = useState("");
  const [heures, setHeures] = useState(""); // Menu déroulant
  const [montantCash, setMontantCash] = useState("");
  const [montantBancontact, setMontantBancontact] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = () => {
    const errs: string[] = [];
    if (!prenom.trim() && !nom.trim()) errs.push("client");
    if (!sport.trim()) errs.push("sport");
    if (!heures) errs.push("heures");
    
    const cashVal = parseFloat(montantCash || "0");
    const bcVal = parseFloat(montantBancontact || "0");
    if (cashVal + bcVal <= 0) errs.push("montant");
    
    if (errs.length) { setErrors(errs); return; }
    
    onAdd({
      nom: nom.trim(),
      prenom: prenom.trim(),
      sport: sport.trim(),
      heures: heures,
      montantCash: cashVal,
      montantBancontact: bcVal,
    });
    onClose();
  };

  const err = (f: string) => errors.includes(f);

  const inputBase: React.CSSProperties = {
    width: "100%", background: "#f9fafb", border: "2px solid #e5e7eb",
    borderRadius: 12, padding: "13px 16px", fontSize: "1rem",
    color: "#111827", outline: "none", fontFamily: "inherit",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "24px" }} onClick={onClose}>
      <motion.div initial={{ scale: 0.94, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 340, damping: 32 }} onClick={(e) => e.stopPropagation()} style={{ width: "min(720px, 100%)", background: "#ffffff", borderRadius: 24, padding: "0 0 32px", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 0" }}><div style={{ width: 36, height: 4, borderRadius: 99, background: "#e5e7eb" }} /></div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px 20px" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.025em" }}>Nouveau client</h2>
            <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: 2 }}>Remplissez les informations de la réservation</p>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X style={{ width: 16, height: 16, color: "#6b7280" }} /></button>
        </div>
        <div style={{ padding: "0 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* CLIENT */}
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: err("client") ? "#dc2626" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 10 }}>Client (nom et/ou prénom) *</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom" style={{ ...inputBase, borderColor: err("client") ? "#fca5a5" : "#e5e7eb", boxShadow: err("client") ? "0 0 0 3px rgba(220,38,38,0.1)" : "none" }} />
              <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" style={{ ...inputBase, borderColor: err("client") ? "#fca5a5" : "#e5e7eb", boxShadow: err("client") ? "0 0 0 3px rgba(220,38,38,0.1)" : "none" }} />
            </div>
          </div>

          {/* SPORT */}
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: err("sport") ? "#dc2626" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 10 }}>Sport / Activité *</label>
            <input value={sport} onChange={(e) => setSport(e.target.value)} placeholder="ex: Tennis, Badminton, Football..." style={{ ...inputBase, borderColor: err("sport") ? "#fca5a5" : "#e5e7eb", boxShadow: err("sport") ? "0 0 0 3px rgba(220,38,38,0.1)" : "none" }} />
          </div>

          {/* DURÉE (SÉLECTEUR FIXE) */}
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: err("heures") ? "#dc2626" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 10 }}>Durée de l'activité *</label>
            <select 
              value={heures} 
              onChange={(e) => setHeures(e.target.value)} 
              style={{ 
                ...inputBase, 
                appearance: "none", cursor: "pointer",
                borderColor: err("heures") ? "#fca5a5" : "#e5e7eb", 
                boxShadow: err("heures") ? "0 0 0 3px rgba(220,38,38,0.1)" : "none",
              }}
            >
              <option value="" disabled>Sélectionnez une durée...</option>
              <option value="0h30">30 minutes</option>
              <option value="1h">1 heure</option>
              <option value="1h30">1 heure 30</option>
              <option value="2h">2 heures</option>
              <option value="2h30">2 heures 30</option>
              <option value="3h">3 heures</option>
              <option value="3h30">3 heures 30</option>
              <option value="4h">4 heures</option>
            </select>
          </div>

          {/* MONTANTS */}
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: err("montant") ? "#dc2626" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 10 }}>Montant * <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(au moins un montant)</span></label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}><Banknote style={{ width: 15, height: 15, color: "#16a34a" }} /><span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.07em" }}>Espèces</span></div>
                <div style={{ position: "relative" }}><input type="number" step="0.5" min="0" value={montantCash} onChange={(e) => setMontantCash(e.target.value)} placeholder="0.00" style={{ width: "100%", background: "white", border: "2px solid #d1fae5", borderRadius: 10, padding: "10px 12px", paddingRight: 36, fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#111827", outline: "none", fontFamily: "inherit" }} /><span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "1rem", fontWeight: 700, color: "#9ca3af" }}>€</span></div>
              </div>
              <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}><CreditCard style={{ width: 15, height: 15, color: "#2563eb" }} /><span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Bancontact</span></div>
                <div style={{ position: "relative" }}><input type="number" step="0.5" min="0" value={montantBancontact} onChange={(e) => setMontantBancontact(e.target.value)} placeholder="0.00" style={{ width: "100%", background: "white", border: "2px solid #dbeafe", borderRadius: 10, padding: "10px 12px", paddingRight: 36, fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#111827", outline: "none", fontFamily: "inherit" }} /><span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "1rem", fontWeight: 700, color: "#9ca3af" }}>€</span></div>
              </div>
            </div>
            {(parseFloat(montantCash || "0") + parseFloat(montantBancontact || "0")) > 0 && (
              <div style={{ marginTop: 10, textAlign: "center", padding: "8px", background: "#f9fafb", borderRadius: 10 }}>
                <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 600 }}>Total : </span><span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>{fmtCurrency(parseFloat(montantCash || "0") + parseFloat(montantBancontact || "0"))}</span>
              </div>
            )}
          </div>
          
          {errors.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#fef2f2", borderRadius: 10, border: "1px solid #fecaca" }}>
              <AlertCircle style={{ width: 15, height: 15, color: "#dc2626", flexShrink: 0 }} /><span style={{ fontSize: "0.82rem", color: "#b91c1c", fontWeight: 500 }}>Veuillez remplir correctement tous les champs obligatoires.</span>
            </div>
          )}

          <motion.button type="button" onClick={handleSubmit} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }} style={{ width: "100%", height: 58, background: "linear-gradient(155deg, #dc2626 0%, #b91c1c 100%)", color: "white", border: "none", borderRadius: 14, fontWeight: 800, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 8px 24px rgba(220,38,38,0.3)", letterSpacing: "-0.01em" }}>
            <Plus style={{ width: 20, height: 20 }} /> Ajouter à la session
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}