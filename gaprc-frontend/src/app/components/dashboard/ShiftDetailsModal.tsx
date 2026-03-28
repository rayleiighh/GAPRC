import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, MessageSquare, Receipt, Users, Clock, Banknote, CreditCard, Loader2 } from "lucide-react";
import { fmtCurrency } from "../../pages/DirectorDashboard";

export function ShiftDetailsModal({ shift, onClose }: { shift: any; onClose: () => void }) {
  const [details, setDetails] = useState<{ comment: string, transactions: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/shifts/${shift.id}/details`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          setDetails(await res.json());
        }
      } catch (err) {
        console.error("Erreur de chargement des détails", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [shift.id]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }} onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 28 }} onClick={(e) => e.stopPropagation()} style={{ width: "min(640px, 96vw)", background: "#fff", borderRadius: 24, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.22)", maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
        
        {/* Header */}
        <div style={{ height: 4, background: "linear-gradient(90deg, #111827, #374151)" }} />
        <div style={{ padding: "28px 32px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f4f4f5", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Receipt style={{ width: 20, height: 20, color: "#374151" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>Détails du shift #{shift.id}</h2>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 2 }}>{shift.jobiste} · {shift.date} ({shift.arrivee} - {shift.depart})</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X style={{ width: 16, height: 16, color: "#6b7280" }} /></button>
        </div>

        {loading ? (
          <div style={{ padding: 60, display: "flex", justifyContent: "center" }}>
            <Loader2 style={{ animation: "spin 1s linear infinite", color: "#9ca3af" }} />
          </div>
        ) : (
          <div style={{ padding: "0 32px 32px", overflowY: "auto", flex: 1 }}>
            
            {/* Commentaire éventuel */}
            {details?.comment && (
              <div style={{ marginTop: 24, padding: "16px 20px", background: "#fefce8", border: "1px solid #fef08a", borderRadius: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <MessageSquare style={{ width: 14, height: 14, color: "#ca8a04" }} />
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a16207", textTransform: "uppercase", letterSpacing: "0.05em" }}>Commentaire de clôture</span>
                </div>
                <p style={{ fontSize: "0.9rem", color: "#854d0e", fontStyle: "italic", lineHeight: 1.4 }}>"{details.comment}"</p>
              </div>
            )}

            {/* Liste des transactions */}
            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Users style={{ width: 16, height: 16, color: "#6b7280" }} />
                <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#374151" }}>Clients enregistrés ({details?.transactions.length || 0})</h3>
              </div>

              {details?.transactions.length === 0 ? (
                <div style={{ padding: 30, textAlign: "center", background: "#f9fafb", borderRadius: 14, border: "1px dashed #e5e7eb" }}>
                  <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Aucun client encodé pour ce shift.</p>
                </div>
              ) : (
                <div style={{ border: "1px solid #f0f0f0", borderRadius: 16, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 0.8fr 1.2fr", padding: "12px 16px", background: "#f9fafb", borderBottom: "1px solid #f0f0f0" }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Client</span>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sport</span>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Durée</span>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>Paiement</span>
                  </div>
                  {details?.transactions.map((t, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 0.8fr 1.2fr", padding: "14px 16px", alignItems: "center", borderBottom: idx < details.transactions.length - 1 ? "1px solid #f4f4f5" : "none" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#111827" }}>{t.client_name}</span>
                      <span style={{ fontSize: "0.8rem", color: "#4b5563" }}>{t.sport}</span>
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", background: "#f3f4f6", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600, color: "#374151" }}><Clock style={{ width: 10, height: 10 }} />{t.duration}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                        {parseFloat(t.amount_cash) > 0 && (
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#15803d", display: "flex", alignItems: "center", gap: 4 }}><Banknote style={{ width: 11, height: 11 }} /> {fmtCurrency(parseFloat(t.amount_cash))}</span>
                        )}
                        {parseFloat(t.amount_card) > 0 && (
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1d4ed8", display: "flex", alignItems: "center", gap: 4 }}><CreditCard style={{ width: 11, height: 11 }} /> {fmtCurrency(parseFloat(t.amount_card))}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}