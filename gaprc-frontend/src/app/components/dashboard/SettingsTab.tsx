import { useEffect, useState, type ReactNode, type ElementType } from "react";
import { motion } from "motion/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Shield, Database, Download, FileText } from "lucide-react";
import { fmtHours } from "../../pages/DirectorDashboard";

const Section = ({ title, icon: Icon, children }: { title: string; icon: ElementType; children: ReactNode }) => (
  <div style={{ background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)" }}>
    <div style={{ padding: "18px 28px", borderBottom: "1px solid #f4f4f5", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon style={{ width: 15, height: 15, color: "#6b7280" }} />
      </div>
      <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>{title}</h3>
    </div>
    <div style={{ padding: "24px 28px" }}>{children}</div>
  </div>
);

export function SettingsTab({ shifts }: { shifts: any[] }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [loadingMoreAudit, setLoadingMoreAudit] = useState(false);
  const [hasMoreAudit, setHasMoreAudit] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const AUDIT_PAGE_SIZE = 20;

  const lastPasswordChangeLog = logs.find((log: any) => log.action === "CHANGE_PASSWORD");
  const lastPasswordChangeText = lastPasswordChangeLog
    ? new Date(lastPasswordChangeLog.created_at).toLocaleString("fr-BE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Jamais";

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Tous les champs sont obligatoires.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    try {
      setPasswordLoading(true);
      const token = localStorage.getItem("adminToken");

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible de changer le mot de passe.");
      }

      setPasswordSuccess("Mot de passe mis à jour. Reconnexion en cours...");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        window.location.assign("/admin/login");
      }, 1200);
    } catch (err: any) {
      setPasswordError(err.message || "Erreur lors du changement de mot de passe.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const fetchAudit = async (offset: number, append = false) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/audit?limit=${AUDIT_PAGE_SIZE}&offset=${offset}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error("Impossible de récupérer les logs d'audit");
      }

      const pageLogs = await res.json();
      setLogs((prev) => (append ? [...prev, ...pageLogs] : pageLogs));
      setHasMoreAudit(pageLogs.length === AUDIT_PAGE_SIZE);
    } catch (err) {
      console.error("Erreur fetch audit", err);
      if (!append) {
        setLogs([]);
      }
      setHasMoreAudit(false);
    }
  };

  useEffect(() => {
    const loadInitialAudit = async () => {
      try {
        await fetchAudit(0, false);
      } finally {
        setLoadingAudit(false);
      }
    };

    loadInitialAudit();
  }, []);

  const loadMoreAudit = async () => {
    if (loadingMoreAudit || !hasMoreAudit) return;
    setLoadingMoreAudit(true);
    try {
      await fetchAudit(logs.length, true);
    } finally {
      setLoadingMoreAudit(false);
    }
  };

  const downloadAuditJson = () => {
    if (logs.length === 0) return;
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_gaprc_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (shifts.length === 0) return alert("Aucune donnée à exporter.");
    const headers = ["ID", "Date", "Jobiste", "Arrivee", "Depart", "Heures_Prestees", "Encaisse"];
    const rows = shifts.map(s => [
      s.id, s.date, s.jobiste, s.arrivee, s.depart,
      s.heures.toFixed(2), s.reel.toFixed(2)
    ]);
    const csvContent = [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `export_caisse_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    if (shifts.length === 0) return alert("Aucune donnée à exporter.");
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Rapport Comptable - Export des clôtures", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Généré le : ${new Date().toLocaleDateString('fr-BE')}`, 14, 30);

    const totalReel = shifts.reduce((s, j) => s + j.reel, 0);
    const totalHeures = shifts.reduce((s, j) => s + j.heures, 0);

    const tableData = shifts.map(s => [
      s.date, s.jobiste, `${s.arrivee} - ${s.depart}`,
      fmtHours(s.heures), `${s.reel.toFixed(2)} €`
    ]);

    autoTable(doc, {
      startY: 38,
      head: [['Date', 'Jobiste', 'Horaire', 'Heures', 'Encaissé']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] },
      foot: [['', '', 'TOTAUX', fmtHours(totalHeures), `${totalReel.toFixed(2)} €`]],
      footStyles: { fillColor: [24, 24, 27], fontStyle: 'bold' }
    });
    doc.save(`Rapport_SportsCenter_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40, maxWidth: 680 }}>

      <Section title="Exports Comptables" icon={Download}>
        <div style={{ padding: "20px 28px" }}>
          <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 16 }}>Téléchargez les données de clôture de caisse pour la comptabilité.</p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={exportCSV} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontWeight: 600 }}>
              <FileText style={{ width: 16, height: 16 }} /> Excel (CSV)
            </button>
            <button onClick={exportPDF} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#111827", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontWeight: 600 }}>
              <Download style={{ width: 16, height: 16 }} /> Rapport PDF
            </button>
          </div>
        </div>
      </Section>

      <Section title="Sécurité & Accès" icon={Shield}>
        <div style={{ padding: "20px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ fontSize: "0.9rem", fontWeight: 700, margin: 0 }}>Mot de passe Directeur</h4>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: "4px 0 0 0" }}>
                Dernière modification : {lastPasswordChangeText}
              </p>
            </div>
            <button
              onClick={() => {
                setShowPasswordForm((prev) => !prev);
                setPasswordError("");
                setPasswordSuccess("");
              }}
              style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", fontWeight: 600 }}
            >
              {showPasswordForm ? "Fermer" : "Modifier"}
            </button>
          </div>

          {showPasswordForm && (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mot de passe actuel"
                style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: "0.85rem" }}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe"
                style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: "0.85rem" }}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le nouveau mot de passe"
                style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: "0.85rem" }}
              />

              {passwordError && (
                <p style={{ margin: 0, color: "#dc2626", fontSize: "0.78rem", fontWeight: 700 }}>{passwordError}</p>
              )}
              {passwordSuccess && (
                <p style={{ margin: 0, color: "#15803d", fontSize: "0.78rem", fontWeight: 700 }}>{passwordSuccess}</p>
              )}

              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                style={{
                  alignSelf: "flex-start",
                  padding: "9px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "#111827",
                  color: "white",
                  cursor: passwordLoading ? "not-allowed" : "pointer",
                  opacity: passwordLoading ? 0.7 : 1,
                  fontWeight: 700,
                  fontSize: "0.82rem",
                }}
              >
                {passwordLoading ? "Mise à jour..." : "Enregistrer le nouveau mot de passe"}
              </button>
            </div>
          )}
        </div>
      </Section>

      <Section title="Journal d'Audit (RGPD)" icon={Database}>
        <div style={{ padding: "20px 28px", background: "#f9fafb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
            <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#374151", margin: 0 }}>Traçabilité des actions</h4>
            <span style={{ fontSize: "0.7rem", color: "#6b7280", fontWeight: 500 }}>{logs.length} derniers événements</span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxHeight: "320px",
              overflowY: "auto",
              paddingRight: "8px",
              borderRadius: "12px",
            }}
          >
            {loadingAudit ? (
              <p style={{ fontSize: "0.8rem", color: "#6b7280", textAlign: "center", padding: 20 }}>Chargement...</p>
            ) : logs.length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: "#6b7280", textAlign: "center", padding: 20 }}>Aucun événement enregistré.</p>
            ) : (
              logs.map((log: any) => (
                <div
                  key={log.id}
                  style={{
                    padding: "12px",
                    background: "white",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        color: log.action.includes("DELETE") ? "#ef4444" : "#111827",
                        background: log.action.includes("DELETE") ? "#fef2f2" : "#f3f4f6",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {log.action}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
                      {new Date(log.created_at).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.8rem", margin: 0, color: "#4b5563" }}>
                    Cible : <strong>{log.entity} #{log.entity_id}</strong>
                  </p>
                  <p style={{ fontSize: "0.75rem", margin: 0, color: "#6b7280" }}>Par : {log.performed_by}</p>
                  {log.details && (
                    <pre
                      style={{
                        fontSize: "0.65rem",
                        color: "#6b7280",
                        background: "#f8fafc",
                        padding: "4px 8px",
                        borderRadius: 4,
                        margin: "4px 0 0 0",
                        overflowX: "auto",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {JSON.stringify(log.details)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 12 }}>
            <button
              onClick={loadMoreAudit}
              disabled={loadingAudit || loadingMoreAudit || !hasMoreAudit}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "white",
                color: "#374151",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: loadingAudit || loadingMoreAudit || !hasMoreAudit ? "not-allowed" : "pointer",
                opacity: loadingAudit || loadingMoreAudit || !hasMoreAudit ? 0.6 : 1,
              }}
            >
              {loadingMoreAudit ? "Chargement..." : hasMoreAudit ? "Voir plus" : "Fin de l'historique"}
            </button>

            <button
              onClick={downloadAuditJson}
              disabled={logs.length === 0}
              style={{
                background: "none",
                border: "none",
                color: logs.length === 0 ? "#9ca3af" : "#4f46e5",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: logs.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              Télécharger l'historique (JSON)
            </button>
          </div>
        </div>
      </Section>
    </motion.div>
  );
}