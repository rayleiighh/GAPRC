import { motion } from "motion/react";
import { AlertTriangle, LogOut, CheckCircle2 } from "lucide-react";

export function ExitWarningModal({
  onClose,
  onLeave,
  onCloture
}: {
  onClose: () => void;
  onLeave: () => void;
  onCloture: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }} onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} style={{ width: "min(460px, 96vw)", background: "white", borderRadius: 24, overflow: "hidden", boxShadow: "0 24px 48px rgba(0,0,0,0.2)", padding: "36px 32px", textAlign: "center" }}>
        
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <AlertTriangle style={{ width: 32, height: 32, color: "#dc2626" }} />
        </div>
        
        <h2 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#111827", letterSpacing: "-0.02em", marginBottom: 8 }}>Quitter la session ?</h2>
        <p style={{ fontSize: "0.95rem", color: "#6b7280", marginBottom: 28, lineHeight: 1.5 }}>
          Si vous retournez à l'accueil, les transactions non validées de cette session seront <strong>définitivement perdues</strong>.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => { onClose(); onCloture(); }} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #22c55e, #15803d)", color: "white", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 14px rgba(34,197,94,0.25)" }}>
            <CheckCircle2 style={{ width: 18, height: 18 }} /> Clôturer la caisse proprement
          </button>
          
          <button onClick={onLeave} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "2px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <LogOut style={{ width: 18, height: 18 }} /> Quitter sans sauvegarder
          </button>

          <button onClick={onClose} style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: "transparent", color: "#6b7280", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", marginTop: 4 }}>
            Annuler et rester ici
          </button>
        </div>
        
      </motion.div>
    </motion.div>
  );
}