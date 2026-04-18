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

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/audit`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          setLogs(await res.json());
        }
      } catch (err) {
        console.error("Erreur fetch audit", err);
      } finally {
        setLoadingAudit(false);
      }
    };

    fetchAudit();
  }, []);

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
              <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: "4px 0 0 0" }}>Dernière modification : il y a 30 jours</p>
            </div>
            <button style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", fontWeight: 600 }}>
              Modifier
            </button>
          </div>
        </div>
      </Section>

      <Section title="Journal d'Audit (RGPD)" icon={Database}>
        <div style={{ padding: "20px 28px", background: "#f9fafb" }}>
          <h4 style={{ fontSize: "0.9rem", fontWeight: 700, margin: "0 0 16px 0", color: "#374151" }}>Historique des actions sensibles</h4>

          {loadingAudit ? (
            <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>Chargement des logs...</p>
          ) : logs.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>Aucun événement enregistré.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "300px", overflowY: "auto" }}>
              {logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: "10px",
                    background: "white",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p style={{ fontSize: "0.8rem", fontWeight: 700, margin: 0, color: "#111827" }}>
                      {log.action}{" "}
                      <span style={{ color: "#6b7280", fontWeight: 400 }}>
                        sur {log.entity} #{log.entity_id}
                      </span>
                    </p>
                    <p style={{ fontSize: "0.7rem", color: "#6b7280", margin: "2px 0 0 0" }}>Par: {log.performed_by}</p>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
                    {new Date(log.created_at).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>
    </motion.div>
  );
}