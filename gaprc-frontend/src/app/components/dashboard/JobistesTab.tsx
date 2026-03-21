import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Phone, X, UserPlus, Trash2, CreditCard, FileText } from "lucide-react";
// 👈 On importe tes fonctions depuis le Dashboard ! (Ajuste le chemin si besoin : "../pages/DirectorDashboard" ou "../../app/pages/DirectorDashboard")
import { getJobisteMeta, fmtCurrency, fmtHours, fmtDate, EcartPill } from "../../pages/DirectorDashboard"; 

/* ─── Jobiste Detail Modal ───────────────────────────────────────── */
function JobisteDetailModal({ jobisteName, shifts, onClose }: { jobisteName: string; shifts: any[]; onClose: () => void }) {
  const meta = getJobisteMeta(jobisteName);
  const totalHeures = shifts.reduce((s, j) => s + j.heures, 0);
  const totalReel = shifts.reduce((s, j) => s + j.reel, 0);
  const totalEcart = shifts.reduce((s, j) => s + j.ecart, 0);
  const sortedShifts = [...shifts].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }} onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 28 }} onClick={(e) => e.stopPropagation()}
        style={{ width: "min(760px, 96vw)", background: "#fff", borderRadius: 24, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.22)", maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}aa)` }} />
        <div style={{ padding: "28px 32px 20px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid #f4f4f5", flexShrink: 0 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: `${meta.color}18`, border: `2px solid ${meta.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 900, color: meta.color }}>{meta.initials}</span>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#111827", letterSpacing: "-0.03em" }}>{meta.name}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: "0.8rem", color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}><Mail style={{ width: 12, height: 12 }} />{meta.email}</span>
              <span style={{ fontSize: "0.8rem", color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}><Phone style={{ width: 12, height: 12 }} />{meta.phone}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X style={{ width: 16, height: 16, color: "#6b7280" }} /></button>
        </div>
        {/* Stats summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, padding: "20px 32px", flexShrink: 0 }}>
          {[
            { label: "Shifts", value: shifts.length.toString(), sub: "sessions" },
            { label: "Total heures", value: fmtHours(totalHeures), sub: `Moy. ${fmtHours(totalHeures / (shifts.length || 1))}/shift` },
            { label: "Montant géré", value: fmtCurrency(totalReel), sub: "Total réel encaissé" },
            { label: "Écart cumulé", value: (totalEcart > 0 ? "+" : "") + fmtCurrency(totalEcart), sub: totalEcart < 0 ? "Déficit total" : "Excédent total" },
          ].map(({ label, value, sub }) => (
            <div key={label} style={{ background: "#f9fafb", border: "1px solid #f0f0f0", borderRadius: 14, padding: "14px 16px" }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</p>
              <p style={{ fontSize: "1.25rem", fontWeight: 900, color: "#111827", letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: "0.7rem", color: "#d1d5db", marginTop: 4 }}>{sub}</p>
            </div>
          ))}
        </div>
        {/* Shifts table */}
        <div style={{ flex: 1, overflowY: "auto", margin: "0 32px 28px" }}>
          <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #f0f0f0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.8fr 1fr 1fr", padding: "10px 20px", background: "#18181b", alignItems: "center" }}>
              {["Date", "Arrivée", "Départ", "Heures", "Montant réel", "Écart"].map((h, i) => (
                <span key={h} style={{ fontSize: "0.62rem", fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.09em", textAlign: i >= 3 ? "right" : "left" }}>{h}</span>
              ))}
            </div>
            {sortedShifts.map((s, idx) => (
              <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.8fr 1fr 1fr", padding: "13px 20px", alignItems: "center", borderBottom: idx < sortedShifts.length - 1 ? "1px solid #f4f4f5" : "none", background: s.ecart < 0 ? "#fff8f8" : "white" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>{fmtDate(s.date)}</span>
                <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>{s.arrivee}</span>
                <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>{s.depart}</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#374151", textAlign: "right" }}>{fmtHours(s.heures)}</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#374151", textAlign: "right" }}>{fmtCurrency(s.reel)}</span>
                <div style={{ display: "flex", justifyContent: "flex-end" }}><EcartPill ecart={s.ecart} /></div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Add Jobiste Modal (Issue 6) ────────────────────────────────── */
function AddJobisteModal({ onClose, onRefresh }: { onClose: () => void; onRefresh: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email) { setError("Tous les champs sont requis."); return; }
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/jobistes`, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email }),
      });
      if (res.ok) { onRefresh(); onClose(); } 
      else { const data = await res.json(); setError(data.error || "Erreur lors de l'ajout."); }
    } catch (err) { setError("Erreur de connexion au serveur."); }
  };

  const inputStyle: React.CSSProperties = { width: "100%", background: "#f9fafb", border: "2px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", fontSize: "0.9rem", color: "#111827", outline: "none", fontFamily: "inherit" };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={(e) => e.stopPropagation()} style={{ width: 400, background: "white", borderRadius: 20, padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111827", marginBottom: 16 }}>Ajouter un jobiste</h3>
        {error && <p style={{ color: "#dc2626", fontSize: "0.8rem", marginBottom: 10, fontWeight: 600 }}>{error}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          <input placeholder="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} />
          <input placeholder="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} />
          <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "2px solid #e5e7eb", background: "white", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
          <button onClick={handleSubmit} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#111827", color: "white", fontWeight: 600, cursor: "pointer" }}>Ajouter</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Assign Badge Modal (Issue 6) ───────────────────────────────── */
function AssignBadgeModal({ jobiste, onClose, onRefresh }: { jobiste: any; onClose: () => void; onRefresh: () => void }) {
  const [uid, setUid] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!uid) return setError("L'UID est requis.");
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/jobistes/${jobiste.id}/badge`, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ nfc_uid: uid }),
      });
      if (res.ok) { onRefresh(); onClose(); } 
      else { const data = await res.json(); setError(data.error || "Erreur lors de l'assignation."); }
    } catch (err) { setError("Erreur de connexion au serveur."); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={(e) => e.stopPropagation()} style={{ width: 400, background: "white", borderRadius: 20, padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111827", marginBottom: 6 }}>Assigner un badge RFID</h3>
        <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 16 }}>Pour <strong>{jobiste.first_name} {jobiste.last_name}</strong></p>
        {error && <p style={{ color: "#dc2626", fontSize: "0.8rem", marginBottom: 10, fontWeight: 600 }}>{error}</p>}
        <input autoFocus placeholder="Scannez ou tapez l'UID du badge..." value={uid} onChange={(e) => setUid(e.target.value)} style={{ width: "100%", background: "#f9fafb", border: "2px solid #2563eb", borderRadius: 10, padding: "12px 14px", fontSize: "1rem", color: "#111827", outline: "none", marginBottom: 20, fontFamily: "monospace" }} />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "2px solid #e5e7eb", background: "white", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
          <button onClick={handleSubmit} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#2563eb", color: "white", fontWeight: 600, cursor: "pointer" }}>Assigner</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Jobistes HR Tab Principal ──────────────────────────────────── */
export function JobistesTab({ shifts }: { shifts: any[] }) {
  const [period, setPeriod] = useState<"mars-2026" | "fevrier-2026" | "3-mois">("mars-2026");
  const [selectedJobiste, setSelectedJobiste] = useState<string | null>(null);
  const [dbJobistes, setDbJobistes] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [badgeModalFor, setBadgeModalFor] = useState<any | null>(null);

  const fetchJobistes = async () => {
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/jobistes`, { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) setDbJobistes(await res.json());
    } catch (err) { console.error("Erreur chargement jobistes", err); }
  };

  useEffect(() => { fetchJobistes(); }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${name} ?`)) return;
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/jobistes/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) fetchJobistes();
    } catch (err) { console.error("Erreur suppression", err); }
  };

  const periodOptions = [
    { value: "mars-2026",    label: "Mars 2026" },
    { value: "fevrier-2026", label: "Février 2026" },
    { value: "3-mois",       label: "3 derniers mois" },
  ] as const;

  const filteredShifts = shifts.filter(s => {
    if (period === "mars-2026")    return s.date.startsWith("2026-03");
    if (period === "fevrier-2026") return s.date.startsWith("2026-02");
    return s.date >= "2026-01-01";
  });

  const getStats = (fullName: string) => {
    const jobisteShifts = filteredShifts.filter(s => s.jobiste === fullName);
    const totalHeures = jobisteShifts.reduce((s, j) => s + j.heures, 0);
    const totalReel   = jobisteShifts.reduce((s, j) => s + j.reel, 0);
    const totalEcart  = jobisteShifts.reduce((s, j) => s + j.ecart, 0);
    return { shifts: jobisteShifts, totalHeures, totalReel, totalEcart };
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header + Actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.025em" }}>Gestion de l'équipe ({dbJobistes.length})</h2>
          <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: 2 }}>Gérez les accès RFID et visualisez les prestations</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "white", borderRadius: 12, padding: "4px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            {periodOptions.map(opt => (
              <button key={opt.value} onClick={() => setPeriod(opt.value)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: period === opt.value ? 700 : 500, background: period === opt.value ? "#111827" : "transparent", color: period === opt.value ? "white" : "#6b7280", transition: "all 0.15s" }}>{opt.label}</button>
            ))}
          </div>
          <button onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10, background: "linear-gradient(135deg, #dc2626, #b91c1c)", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", boxShadow: "0 4px 12px rgba(220,38,38,0.2)" }}>
            <UserPlus style={{ width: 16, height: 16 }} /> Ajouter un jobiste
          </button>
        </div>
      </div>

      {/* Jobiste cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {dbJobistes.map((jobiste, i) => {
          const fullName = `${jobiste.first_name} ${jobiste.last_name}`;
          const meta = getJobisteMeta(fullName);
          const stats = getStats(fullName);
          const hasBadge = !!jobiste.nfc_uid;

          return (
            <motion.div key={jobiste.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
              <div style={{ height: 4, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}88)` }} />
              <div style={{ padding: "20px 24px", flex: 1 }}>
                
                {/* Header Card */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: `${meta.color}18`, border: `2px solid ${meta.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "0.85rem", fontWeight: 900, color: meta.color }}>{meta.initials}</span></div>
                    <div><p style={{ fontWeight: 800, fontSize: "1rem", color: "#111827", cursor: "pointer" }} onClick={() => setSelectedJobiste(fullName)}>{fullName}</p><p style={{ fontSize: "0.7rem", color: "#9ca3af" }}>{jobiste.email}</p></div>
                  </div>
                  <button onClick={() => handleDelete(jobiste.id, fullName)} title="Supprimer le jobiste" style={{ background: "#fef2f2", border: "none", width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 style={{ width: 14, height: 14, color: "#ef4444" }} /></button>
                </div>

                {/* Badge Status */}
                <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: hasBadge ? "#eff6ff" : "#fef2f2", borderRadius: 10, border: `1px solid ${hasBadge ? "#bfdbfe" : "#fecaca"}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CreditCard style={{ width: 16, height: 16, color: hasBadge ? "#2563eb" : "#ef4444" }} />
                    <div><p style={{ fontSize: "0.75rem", fontWeight: 700, color: hasBadge ? "#1d4ed8" : "#b91c1c" }}>{hasBadge ? "Badge Actif" : "Aucun Badge RFID"}</p>{hasBadge && <p style={{ fontSize: "0.65rem", color: "#60a5fa", fontFamily: "monospace" }}>UID: {jobiste.nfc_uid}</p>}</div>
                  </div>
                  <button onClick={() => setBadgeModalFor(jobiste)} style={{ background: "white", border: `1px solid ${hasBadge ? "#bfdbfe" : "#fecaca"}`, borderRadius: 6, padding: "4px 10px", fontSize: "0.7rem", fontWeight: 700, color: hasBadge ? "#2563eb" : "#dc2626", cursor: "pointer" }}>{hasBadge ? "Modifier" : "Assigner"}</button>
                </div>

                {/* Stats grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ background: "#f9fafb", borderRadius: 12, padding: "10px 14px" }}><p style={{ fontSize: "0.6rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Shifts / Heures</p><p style={{ fontSize: "1.1rem", fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>{stats.shifts.length} <span style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 600 }}>({fmtHours(stats.totalHeures)})</span></p></div>
                  <div style={{ background: stats.totalEcart < 0 ? "#fef2f2" : "#f0fdf4", border: `1px solid ${stats.totalEcart < 0 ? "#fecaca" : "#bbf7d0"}`, borderRadius: 12, padding: "10px 14px" }}><p style={{ fontSize: "0.6rem", fontWeight: 700, color: stats.totalEcart < 0 ? "#ef4444" : "#15803d", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Écart Cumulé</p><p style={{ fontSize: "1.1rem", fontWeight: 900, color: stats.totalEcart < 0 ? "#b91c1c" : stats.totalEcart > 0 ? "#15803d" : "#9ca3af", letterSpacing: "-0.02em" }}>{stats.totalEcart > 0 ? "+" : ""}{fmtCurrency(stats.totalEcart)}</p></div>
                </div>

                <button onClick={() => setSelectedJobiste(fullName)} style={{ width: "100%", marginTop: 12, padding: "8px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "white", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><FileText style={{ width: 13, height: 13 }} /> Voir la fiche RH</button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedJobiste && <JobisteDetailModal jobisteName={selectedJobiste} shifts={filteredShifts.filter(s => s.jobiste === selectedJobiste)} onClose={() => setSelectedJobiste(null)} />}
        {showAddModal && <AddJobisteModal onClose={() => setShowAddModal(false)} onRefresh={fetchJobistes} />}
        {badgeModalFor && <AssignBadgeModal jobiste={badgeModalFor} onClose={() => setBadgeModalFor(null)} onRefresh={fetchJobistes} />}
      </AnimatePresence>
    </motion.div>
  );
}