import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { AddEntryModal } from "../components/checkout/AddEntryModal";
import { ChecklistModal } from "../components/checkout/ChecklistModal";
import { ExitWarningModal } from "../components/checkout/ExitWarningModal";
import { ClotureModal } from "../components/checkout/ClotureModal";
import {
  Plus, Trash2, CheckCircle2, ChevronLeft,
  Banknote, CreditCard,
  Users, Clock, Euro, ClipboardList, Check, Pencil,
} from "lucide-react";
import { db } from "../../services/db";

/* ─── Types ──────────────────────────────────────────────────────── */
export interface Entry {
  id: string;
  nom: string;
  prenom: string;
  sport: string;
  heures: string;
  montantCash: number;
  montantBancontact: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  category: string;
}

/* ─── Helpers ────────────────────────────────────────────────────── */
export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function fmtCurrency(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

export function fmtTime(date: Date) {
  return date.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
}

/* ─── Checklist Data ─────────────────────────────────────────────── */
export const INITIAL_CHECKLIST: Omit<ChecklistItem, "id" | "checked">[] = [
  { label: "Contrôle & mise en ordre vestiaires", category: "Contrôle & mise en ordre de TOUS les locaux" },
  { label: "Contrôle & mise en ordre salles basses & grande salle", category: "Contrôle & mise en ordre de TOUS les locaux" },
  { label: "Contrôle & mise en ordre WC publics & gradins", category: "Contrôle & mise en ordre de TOUS les locaux" },
  { label: "Contrôle et respect des locaux", category: "Pendant la prestation" },
  { label: "Contrôle rangement matériel", category: "Pendant la prestation" },
  { label: "Fermer les salles basses", category: "Pendant la prestation" },
  { label: "Mise en ordre vestiaires", category: "Fin de prestation : mise en ordre de TOUS les locaux" },
  { label: "Mise en ordre salles basses et grande salle", category: "Fin de prestation : mise en ordre de TOUS les locaux" },
  { label: "Mise en ordre WC publics et gradins", category: "Fin de prestation : mise en ordre de TOUS les locaux" },
  { label: "Vider les poubelles", category: "Fin de prestation : mise en ordre de TOUS les locaux" },
  { label: "Aspirer dojo", category: "Tâches complémentaires" },
  { label: "Aspirer salle polyvalente", category: "Tâches complémentaires" },
  { label: "Entretien escaliers", category: "Tâches complémentaires" },
  { label: "Entretien accueil", category: "Tâches complémentaires" },
];

/* ─── Avatar ─────────────────────────────────────────────────────── */
export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
  const palette = ["#dc2626", "#7c3aed", "#0284c7", "#d97706", "#16a34a", "#0891b2"];
  const bg = palette[name.charCodeAt(0) % palette.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3,
      background: bg, display: "flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0,
      boxShadow: `0 3px 10px ${bg}44`,
    }}>
      <span style={{ color: "white", fontWeight: 800, fontSize: size * 0.33, letterSpacing: "-0.02em" }}>
        {initials}
      </span>
    </div>
  );
}

/* ─── Clock ──────────────────────────────────────────────────────── */
export function LiveTime() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return <span>{fmtTime(t)}</span>;
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export function JobisteCheckoutForm() {
  const navigate = useNavigate();
  const { name = "Rayane" } = useParams<{ name: string }>();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showCloture, setShowCloture] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [startTimeStr, setStartTimeStr] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  const [editingStartTime, setEditingStartTime] = useState(false);
  
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() =>
    INITIAL_CHECKLIST.map((item, idx) => ({ ...item, id: `chk-${idx}`, checked: false }))
  );

  const totalCash = entries.reduce((s, e) => s + e.montantCash, 0);
  const totalBC = entries.reduce((s, e) => s + e.montantBancontact, 0);
  const total = totalCash + totalBC;

  const addEntry = (e: Omit<Entry, "id">) => {
    setEntries((prev) => [...prev, { ...e, id: uid() }]);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) => prev.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleConfirm = async (comment: string, arrivee: string, depart: string) => { 
    setShowCloture(false);

    const transactions = entries.map(e => ({
      local_id: e.id,
      client_name: [e.prenom, e.nom].filter(Boolean).join(" "),
      sport: e.sport,
      duration: e.heures,
      amount_cash: e.montantCash,
      amount_card: e.montantBancontact
    }));

    const shift_id = parseInt(localStorage.getItem("current_shift_id") || "0", 10);

    const now = new Date();
    
    // Date d'arrivée
    const [arrH, arrM] = arrivee.split(':');
    const startDate = new Date(now);
    startDate.setHours(parseInt(arrH), parseInt(arrM), 0, 0);

    // Date de départ
    const [depH, depM] = depart.split(':');
    const endDate = new Date(now);
    endDate.setHours(parseInt(depH), parseInt(depM), 0, 0);

    // Si l'heure de départ est plus petite (ex: arrivée 22:00, départ 01:00), 
    // ça veut dire qu'on a passé minuit ! On ajoute 1 jour.
    if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
    }

    // 🛠️ NOUVEAU : On formate la date en texte clair local (SANS le fuseau horaire Z)
    const formatLocal = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    };

    const payload = {
      shift_id,
      comment,
      amount_cash: totalCash,
      amount_card: totalBC,
      transactions,
      start_time: formatLocal(startDate), // "2026-03-14 10:29:00"
      end_time: formatLocal(endDate)      // "2026-03-14 23:32:00"
    };

    try {
      if (navigator.onLine) {
        // SCÉNARIO A : INTERNET EST LÀ. On envoie direct à l'API !
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/shifts/close`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Erreur serveur API");
      } else {
        // SCÉNARIO B : PAS D'INTERNET. On force l'erreur pour passer dans le catch
        throw new Error("Hors-ligne");
      }
    } catch (err) {
      // 🪄 LA MAGIE DE LA PWA : Le réseau a crashé ? Pas de panique, on sauvegarde en local !
      console.warn("Réseau indisponible. Sauvegarde dans IndexedDB (Dexie)...");
      await db.pendingReports.add({
        ...payload,
        timestamp: Date.now()
      });
    }

    // Quoi qu'il arrive (Online ou Offline), l'utilisateur voit le succès !
    setSubmitted(true);
    setTimeout(() => navigate("/"), 2500);
  };

  const checklistCompleted = checklist.filter(i => i.checked).length;
  const checklistPercentage = Math.round((checklistCompleted / checklist.length) * 100);

  /* ── Success screen ── */
  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F9FA", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
            style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg, #22c55e, #15803d)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 40px rgba(22,163,74,0.35)" }}
          >
            <CheckCircle2 style={{ width: 44, height: 44, color: "white" }} />
          </motion.div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.03em" }}>Session clôturée !</h2>
          <p style={{ fontSize: "0.95rem", color: "#9ca3af" }}>{entries.length} client{entries.length > 1 ? "s" : ""} · {fmtCurrency(total)} encaissés</p>
          <p style={{ fontSize: "0.82rem", color: "#d1d5db" }}>Redirection vers l'écran d'accueil…</p>
        </motion.div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FA", display: "flex", flexDirection: "column" }}>

      {/* ── TOP BAR ── */}
      <header style={{
        background: "#ffffff", borderBottom: "1px solid #f0f0f0",
        padding: "0 32px", height: 68, display: "flex", alignItems: "center",
        justifyContent: "space-between", flexShrink: 0,
        boxShadow: "0 1px 0 #f0f0f0, 0 4px 16px rgba(0,0,0,0.04)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => setShowExitWarning(true)}
            style={{ width: 34, height: 34, borderRadius: 9, border: "1.5px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <ChevronLeft style={{ width: 16, height: 16, color: "#374151" }} />
          </button>
          <div style={{ width: 1, height: 22, background: "#f0f0f0" }} />
          <div style={{ width: 30, height: 30, background: "#dc2626", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontWeight: 900, fontSize: "0.65rem" }}>SC</span>
          </div>
        </div>

        {/* Center */}
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <p style={{ fontSize: "0.65rem", color: "#9ca3af", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Session en cours · depuis&nbsp;
            </p>
            {editingStartTime ? (
              <input
                type="time"
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                onBlur={() => setEditingStartTime(false)}
                autoFocus
                style={{
                  background: "#f9fafb", border: "1.5px solid #dc2626", borderRadius: 6,
                  padding: "1px 6px", fontSize: "0.65rem", fontWeight: 700, color: "#111827",
                  outline: "none", letterSpacing: "0.04em", cursor: "pointer",
                }}
              />
            ) : (
              <button
                onClick={() => setEditingStartTime(true)}
                title="Modifier l'heure d'arrivée"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: 3 }}
              >
                <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#374151", letterSpacing: "0.06em" }}>{startTimeStr}</span>
                <Pencil style={{ width: 9, height: 9, color: "#9ca3af" }} />
              </button>
            )}
          </div>
          <h1 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            {name}
          </h1>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: isOnline ? "#f0fdf4" : "#fff1f2", border: `1px solid ${isOnline ? "#bbf7d0" : "#fecdd3"}`, borderRadius: 999 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: isOnline ? "#22c55e" : "#e11d48", display: "block", boxShadow: `0 0 5px ${isOnline ? "rgba(34,197,94,0.6)" : "rgba(225,29,72,0.6)"}` }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: isOnline ? "#16a34a" : "#e11d48" }}>{isOnline ? "En ligne" : "Hors-ligne"}</span>
            </div>
          <Avatar name={name} size={36} />
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main style={{ flex: 1, padding: "24px 32px 140px", overflowY: "auto" }}>
        
        {/* Actions bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.025em" }}>
              Clients du shift
            </h2>
            <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: 2 }}>
              {entries.length === 0 ? "Aucune entrée pour le moment" : `${entries.length} client${entries.length > 1 ? "s" : ""} enregistré${entries.length > 1 ? "s" : ""}`}
            </p>
          </div>
          
          <div style={{ display: "flex", gap: 10 }}>
            {/* Checklist button */}
            <motion.button
              onClick={() => setShowChecklist(true)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "11px 20px",
                background: checklistPercentage === 100 ? "linear-gradient(135deg, #22c55e, #15803d)" : "white",
                color: checklistPercentage === 100 ? "white" : "#374151",
                border: checklistPercentage === 100 ? "none" : "2px solid #e5e7eb",
                borderRadius: 12, cursor: "pointer",
                fontWeight: 700, fontSize: "0.9rem",
                boxShadow: checklistPercentage === 100 ? "0 6px 18px rgba(22,163,74,0.28)" : "none",
                letterSpacing: "-0.01em",
                position: "relative",
              }}
            >
              <ClipboardList style={{ width: 18, height: 18 }} />
              Checklist
              {checklistPercentage > 0 && checklistPercentage < 100 && (
                <span style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  background: "#dc2626",
                  color: "white",
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  borderRadius: 999,
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(220,38,38,0.4)",
                }}>
                  {checklistPercentage}%
                </span>
              )}
              {checklistPercentage === 100 && (
                <Check style={{ width: 16, height: 16 }} />
              )}
            </motion.button>
            
            {/* Add client button */}
            <motion.button
              onClick={() => setShowAdd(true)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "11px 20px",
                background: "linear-gradient(155deg, #dc2626 0%, #b91c1c 100%)",
                color: "white", border: "none", borderRadius: 12, cursor: "pointer",
                fontWeight: 700, fontSize: "0.9rem",
                boxShadow: "0 6px 18px rgba(220,38,38,0.28)",
                letterSpacing: "-0.01em",
              }}
            >
              <Plus style={{ width: 18, height: 18 }} />
              Ajouter un client
            </motion.button>
          </div>
        </div>

        {/* Empty state */}
        {entries.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "white", borderRadius: 20, border: "2px dashed #e5e7eb",
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: "64px 32px", gap: 14, textAlign: "center",
            }}
          >
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users style={{ width: 28, height: 28, color: "#d1d5db" }} />
            </div>
            <div>
              <p style={{ fontSize: "1rem", fontWeight: 700, color: "#374151", marginBottom: 4 }}>Aucun client enregistré</p>
              <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                Cliquez sur "Ajouter un client" pour commencer votre shift
              </p>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              style={{
                marginTop: 8, padding: "10px 24px", borderRadius: 10,
                border: "2px solid #e5e7eb", background: "white",
                cursor: "pointer", fontWeight: 600, color: "#374151", fontSize: "0.875rem",
              }}
            >
              + Ajouter le premier client
            </button>
          </motion.div>
        )}

        {/* Entries table */}
        {entries.length > 0 && (
          <motion.div
            layout
            style={{ background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            {/* Table head */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.8fr 0.8fr 1fr 44px", padding: "12px 20px", background: "#111827", gap: 8, alignItems: "center" }}>
              {["Client", "Sport", "Heures", "Montant", "Paiement", ""].map((h, i) => (
                <span key={i} style={{ fontSize: "0.62rem", fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.09em", textAlign: i >= 2 && i <= 3 ? "center" : "left" }}>
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            <AnimatePresence>
              {entries.map((entry, idx) => {
                const clientName = [entry.prenom, entry.nom].filter(Boolean).join(" ") || "Client";
                const initials = [entry.prenom[0], entry.nom[0]].filter(Boolean).join("").toUpperCase() || "?";
                const entryTotal = entry.montantCash + entry.montantBancontact;
                const paiementType = entry.montantCash > 0 && entry.montantBancontact > 0 ? "mixte" : entry.montantCash > 0 ? "cash" : "bancontact";

                return (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1.2fr 0.8fr 0.8fr 1fr 44px",
                      padding: "14px 20px",
                      gap: 8,
                      alignItems: "center",
                      borderBottom: idx < entries.length - 1 ? "1px solid #f4f4f5" : "none",
                      background: "white",
                    }}
                  >
                    {/* Client */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#6b7280" }}>
                          {initials}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827", lineHeight: 1.2 }}>
                          {clientName}
                        </p>
                      </div>
                    </div>

                    {/* Sport */}
                    <div>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>{entry.sport}</span>
                    </div>

                    {/* Heures */}
                    <div style={{ textAlign: "center" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", background: "#f3f4f6", borderRadius: 8, fontSize: "0.82rem", fontWeight: 700, color: "#374151" }}>
                        <Clock style={{ width: 11, height: 11 }} />
                        {entry.heures}
                      </span>
                    </div>

                    {/* Montant */}
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
                        {fmtCurrency(entryTotal)}
                      </span>
                    </div>

                    {/* Paiement */}
                    <div>
                      {paiementType === "mixte" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "2px 8px", borderRadius: 6, fontSize: "0.65rem", fontWeight: 700,
                            background: "#f0fdf4", color: "#15803d",
                            border: "1px solid #bbf7d0",
                          }}>
                            <Banknote style={{ width: 9, height: 9 }} />
                            {fmtCurrency(entry.montantCash)}
                          </span>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "2px 8px", borderRadius: 6, fontSize: "0.65rem", fontWeight: 700,
                            background: "#eff6ff", color: "#1d4ed8",
                            border: "1px solid #bfdbfe",
                          }}>
                            <CreditCard style={{ width: 9, height: 9 }} />
                            {fmtCurrency(entry.montantBancontact)}
                          </span>
                        </div>
                      ) : (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "4px 10px", borderRadius: 99, fontSize: "0.75rem", fontWeight: 700,
                          background: paiementType === "cash" ? "#f0fdf4" : "#eff6ff",
                          color: paiementType === "cash" ? "#15803d" : "#1d4ed8",
                          border: `1px solid ${paiementType === "cash" ? "#bbf7d0" : "#bfdbfe"}`,
                        }}>
                          {paiementType === "cash"
                            ? <Banknote style={{ width: 11, height: 11 }} />
                            : <CreditCard style={{ width: 11, height: 11 }} />
                          }
                          {paiementType === "cash" ? "Espèces" : "Bancontact"}
                        </span>
                      )}
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => removeEntry(entry.id)}
                      style={{ width: 32, height: 32, borderRadius: 9, border: "none", background: "#fff0f0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}
                    >
                      <Trash2 style={{ width: 14, height: 14, color: "#dc2626" }} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* ── BOTTOM BAR ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(0,0,0,0.07)",
        padding: "16px 32px",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, maxWidth: 1200, margin: "0 auto" }}>
          {/* Totals */}
          <div style={{ display: "flex", gap: 12, flex: 1 }}>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <Banknote style={{ width: 16, height: 16, color: "#16a34a", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.06em" }}>Espèces</p>
                <p style={{ fontSize: "1rem", fontWeight: 800, color: "#15803d", letterSpacing: "-0.03em", lineHeight: 1.2 }}>{fmtCurrency(totalCash)}</p>
              </div>
            </div>
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <CreditCard style={{ width: 16, height: 16, color: "#2563eb", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Bancontact</p>
                <p style={{ fontSize: "1rem", fontWeight: 800, color: "#1d4ed8", letterSpacing: "-0.03em", lineHeight: 1.2 }}>{fmtCurrency(totalBC)}</p>
              </div>
            </div>
            <div style={{ background: "#111827", borderRadius: 12, padding: "10px 20px", display: "flex", alignItems: "center", gap: 8 }}>
              <Euro style={{ width: 16, height: 16, color: "rgba(255,255,255,0.5)", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</p>
                <p style={{ fontSize: "1.15rem", fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1.2 }}>{fmtCurrency(total)}</p>
              </div>
            </div>
          </div>

          {/* Clôturer button */}
          <motion.button
            onClick={() => setShowCloture(true)} // Plus besoin de vérifier la longueur !
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              height: 52, padding: "0 28px", flexShrink: 0,
              background: "linear-gradient(135deg, #22c55e, #15803d)", // Toujours vert et cliquable
              color: "white",
              border: "none", borderRadius: 14, cursor: "pointer",
              fontWeight: 800, fontSize: "0.95rem", letterSpacing: "-0.01em",
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 6px 20px rgba(22,163,74,0.3)",
              transition: "all 0.2s",
            }}
          >
            <CheckCircle2 style={{ width: 18, height: 18 }} />
            Clôturer le shift
          </motion.button>
        </div>
      </div>

      {/* ── MODALS ── */}
      <AnimatePresence>
        {showAdd && (
          <AddEntryModal onClose={() => setShowAdd(false)} onAdd={addEntry} />
        )}
        {showCloture && (
          <ClotureModal
            entries={entries}
            jobisteName={name}
            onClose={() => setShowCloture(false)}
            onConfirm={handleConfirm}
            startTimeStr={startTimeStr}
          />
        )}
        {showChecklist && (
          <ChecklistModal
            checklist={checklist}
            onToggle={toggleChecklistItem}
            onClose={() => setShowChecklist(false)}
          />
        )}
        {showExitWarning && (
          <ExitWarningModal
            onClose={() => setShowExitWarning(false)}
            onLeave={() => navigate("/")}
            onCloture={() => {
              setShowExitWarning(false);
              setShowCloture(true);
            }}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}