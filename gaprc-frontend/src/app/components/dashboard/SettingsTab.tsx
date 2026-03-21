import { useState } from "react";
import { motion } from "motion/react"; // ou "framer-motion" selon ce que tu as
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Shield, Mail, Bell, Database, 
  Download, FileText, CheckCircle2, Save 
} from "lucide-react";

/* ─── Composants UI ──────────────────────────────────────────────── */
const Section = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
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

const Toggle = ({ value, onChange, label, sub }: { value: boolean; onChange: (v: boolean) => void; label: string; sub: string }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f9fafb" }}>
    <div>
      <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#374151" }}>{label}</p>
      <p style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: 2 }}>{sub}</p>
    </div>
    <button onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 99, border: "none", background: value ? "#dc2626" : "#e5e7eb", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: value ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
    </button>
  </div>
);

/* ─── Settings Tab Principal ─────────────────────────────────────── */
export function SettingsTab({ shifts }: { shifts: any[] }) {
  const [saved, setSaved] = useState(false);
  
  const [centerName, setCenterName] = useState(() => localStorage.getItem("sc_centerName") || "Sports Center Bruxelles");
  const [address, setAddress] = useState(() => localStorage.getItem("sc_address") || "Rue du Sport 42, 1000 Bruxelles");
  const [adminEmail, setAdminEmail] = useState(() => localStorage.getItem("sc_adminEmail") || "direction@sportscenter.be");
  const [adminPhone, setAdminPhone] = useState(() => localStorage.getItem("sc_adminPhone") || "+32 2 123 45 67");
  const [notifEcart, setNotifEcart] = useState(() => localStorage.getItem("sc_notifEcart") !== "false");
  const [notifCloture, setNotifCloture] = useState(() => localStorage.getItem("sc_notifCloture") !== "false");

  const handleSave = () => {
    localStorage.setItem("sc_centerName", centerName);
    localStorage.setItem("sc_address", address);
    localStorage.setItem("sc_adminEmail", adminEmail);
    localStorage.setItem("sc_adminPhone", adminPhone);
    localStorage.setItem("sc_notifEcart", notifEcart.toString());
    localStorage.setItem("sc_notifCloture", notifCloture.toString());

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const exportCSV = () => {
    if (shifts.length === 0) return alert("Aucune donnée à exporter.");
    const headers = ["ID", "Date", "Jobiste", "Arrivee", "Depart", "Attendu", "Reel", "Ecart"];
    const rows = shifts.map(s => [
      s.id, s.date, s.jobiste, s.arrivee, s.depart,
      s.attendu.toFixed(2), s.reel.toFixed(2), s.ecart.toFixed(2)
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
    doc.text(`Rapport Comptable - ${centerName}`, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Généré le : ${new Date().toLocaleDateString('fr-BE')}`, 14, 30);
    
    doc.setFontSize(9);
    doc.text(`${address} | Contact: ${adminEmail} | Tél: ${adminPhone}`, 14, 36);

    const totalAttendu = shifts.reduce((s, j) => s + j.attendu, 0);
    const totalReel = shifts.reduce((s, j) => s + j.reel, 0);
    const totalEcart = shifts.reduce((s, j) => s + j.ecart, 0);

    const tableData = shifts.map(s => [
      s.date, s.jobiste, `${s.arrivee} - ${s.depart}`,
      `${s.attendu.toFixed(2)} €`, `${s.reel.toFixed(2)} €`,
      `${s.ecart > 0 ? '+' : ''}${s.ecart.toFixed(2)} €`
    ]);

    autoTable(doc, {
      startY: 44,
      head: [['Date', 'Jobiste', 'Horaire', 'Attendu', 'Réel', 'Écart']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] },
      foot: [['', '', 'TOTAUX', `${totalAttendu.toFixed(2)} €`, `${totalReel.toFixed(2)} €`, `${totalEcart > 0 ? '+' : ''}${totalEcart.toFixed(2)} €`]],
      footStyles: { fillColor: [24, 24, 27], fontStyle: 'bold' }
    });
    doc.save(`Rapport_SportsCenter_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#f9fafb", border: "2px solid #e5e7eb", borderRadius: 12,
    padding: "12px 16px", fontSize: "0.9rem", color: "#111827", outline: "none", fontFamily: "inherit",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 680 }}>
      
      <Section title="Informations du centre" icon={Shield}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 8 }}>Nom du centre</label>
            <input value={centerName} onChange={e => setCenterName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 8 }}>Adresse</label>
            <input value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </Section>

      <Section title="Contact administration" icon={Mail}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 8 }}>Email direction</label>
            <input value={adminEmail} onChange={e => setAdminEmail(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 8 }}>Téléphone</label>
            <input value={adminPhone} onChange={e => setAdminPhone(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </Section>

      <Section title="Notifications" icon={Bell}>
        <Toggle value={notifEcart} onChange={setNotifEcart} label="Alertes écart de caisse" sub="Notifier quand un écart négatif est détecté à la clôture" />
        <Toggle value={notifCloture} onChange={setNotifCloture} label="Résumé de clôture" sub="Recevoir un récapitulatif par email à chaque clôture de shift" />
      </Section>

      <Section title="Données & export comptable" icon={Database}>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={exportCSV} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1.5px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>
            <Download style={{ width: 15, height: 15 }} />Export CSV (Excel)
          </button>
          <button onClick={exportPDF} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "none", background: "#111827", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: "0.875rem", fontWeight: 600 }}>
            <FileText style={{ width: 15, height: 15 }} />Export rapport PDF
          </button>
        </div>
      </Section>

      <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }} onClick={handleSave}
        style={{ height: 52, borderRadius: 14, border: "none", cursor: "pointer", background: saved ? "linear-gradient(135deg, #22c55e, #15803d)" : "linear-gradient(155deg, #dc2626, #b91c1c)", color: "white", fontWeight: 800, fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {saved ? <CheckCircle2 style={{ width: 18, height: 18 }} /> : <Save style={{ width: 18, height: 18 }} />}
        {saved ? "Paramètres enregistrés !" : "Enregistrer les modifications"}
      </motion.button>
    </motion.div>
  );
}