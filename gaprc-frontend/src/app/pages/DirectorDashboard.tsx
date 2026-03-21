import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  LayoutDashboard, Users, Settings, LogOut,
  TrendingDown, TrendingUp, Minus, AlertTriangle,
  CheckCircle2, Activity, Calendar, X,
  ChevronLeft, ChevronRight, Mail, Phone,
  Clock, Euro, Filter, Save, Bell, Shield, Database,
  FileText, Download, Plus, Trash2, CreditCard, UserPlus
} from "lucide-react";

/* ─── Mock Data ──────────────────────────────────────────────────── */
const JOBISTES_META = [
  { name: "Rayane",  initials: "RA", color: "#dc2626", email: "rayane.k@sportscenter.be",  phone: "+32 470 12 34 56" },
  { name: "Sophie",  initials: "SO", color: "#7c3aed", email: "sophie.m@sportscenter.be",  phone: "+32 471 23 45 67" },
  { name: "Thomas",  initials: "TH", color: "#0284c7", email: "thomas.d@sportscenter.be",  phone: "+32 472 34 56 78" },
  { name: "Marie",   initials: "MA", color: "#d97706", email: "marie.v@sportscenter.be",   phone: "+32 473 45 67 89" },
  { name: "Lucas",   initials: "LU", color: "#16a34a", email: "lucas.b@sportscenter.be",   phone: "+32 474 56 78 90" },
];

const getJobisteMeta = (name: string) => {
  const found = JOBISTES_META.find(j => j.name === name);
  if (found) return found;
  
  // Si le nom vient de la DB et n'est pas dans la liste Figma, on crée un avatar générique
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "??";
  return {
    name: name,
    initials: initials,
    color: "#6b7280", // Un beau gris passe-partout
    email: "non-renseigne@gaprc.be",
    phone: "-"
  };
};


/* ─── Helpers ────────────────────────────────────────────────────── */
function fmtCurrency(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

function fmtDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function fmtDateLong(dateStr: string) {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function fmtHours(h: number) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  if (mm === 0) return `${hh}h`;
  return `${hh}h${mm.toString().padStart(2, "0")}`;
}

/* ─── Nav items ──────────────────────────────────────────────────── */
const navItems = [
  { id: "dashboard",  label: "Dashboard",   icon: LayoutDashboard },
  { id: "jobistes",   label: "Jobistes",    icon: Users           },
  { id: "calendrier", label: "Calendrier",  icon: Calendar        },
  { id: "settings",   label: "Paramètres",  icon: Settings        },
];

/* ─── Écart Pill ─────────────────────────────────────────────────── */
function EcartPill({ ecart }: { ecart: number }) {
  if (ecart < 0) return (
    <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 13px", borderRadius: 99,
        background: "#fef2f2", border: "1.5px solid #fca5a5", color: "#b91c1c", fontWeight: 800,
        fontSize: "0.82rem", letterSpacing: "-0.01em",
        boxShadow: "0 2px 8px rgba(220,38,38,0.18), 0 0 0 3px rgba(220,38,38,0.07)", whiteSpace: "nowrap" }}
    >
      <AlertTriangle style={{ width: 13, height: 13, color: "#dc2626" }} />
      {ecart.toFixed(2)} €
    </motion.span>
  );
  if (ecart > 0) return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 99,
      background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", fontWeight: 700,
      fontSize: "0.82rem", whiteSpace: "nowrap" }}
    >
      <TrendingUp style={{ width: 12, height: 12 }} />+{ecart.toFixed(2)} €
    </span>
  );
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 99,
      background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#6b7280", fontWeight: 600,
      fontSize: "0.82rem", whiteSpace: "nowrap" }}
    >
      <Minus style={{ width: 12, height: 12 }} />0.00 €
    </span>
  );
}

/* ─── KPI Card ───────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, variant = "neutral", icon: Icon }:
  { label: string; value: string; sub?: string; variant?: "neutral" | "red" | "green"; icon: React.ElementType }) {
  const colors = {
    neutral: { bg: "#fff", border: "rgba(0,0,0,0.06)", text: "#111827", label: "#9ca3af" },
    red:     { bg: "#fff5f5", border: "rgba(220,38,38,0.16)", text: "#b91c1c", label: "#ef4444" },
    green:   { bg: "#f0fdf4", border: "rgba(22,163,74,0.16)", text: "#15803d", label: "#22c55e" },
  }[variant];
  return (
    <div style={{ background: colors.bg, borderRadius: 18, padding: "22px 24px",
      border: `1px solid ${colors.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      display: "flex", flexDirection: "column", gap: 4, position: "relative", overflow: "hidden" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: colors.label, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {label}
        </span>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: colors.border, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon style={{ width: 14, height: 14, color: colors.label }} />
        </div>
      </div>
      <p style={{ fontSize: "1.9rem", fontWeight: 900, color: colors.text, letterSpacing: "-0.045em", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: "0.75rem", color: "#d1d5db", marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

/* ─── Jobiste Detail Modal ───────────────────────────────────────── */
function JobisteDetailModal({ jobisteName, shifts, onClose }:
  { jobisteName: string; shifts: any[]; onClose: () => void }) {
  const meta = getJobisteMeta(jobisteName);
  const totalHeures = shifts.reduce((s, j) => s + j.heures, 0);
  const totalReel = shifts.reduce((s, j) => s + j.reel, 0);
  const totalEcart = shifts.reduce((s, j) => s + j.ecart, 0);
  const sortedShifts = [...shifts].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }}
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(760px, 96vw)", background: "#fff", borderRadius: 24, overflow: "hidden",
          boxShadow: "0 40px 80px rgba(0,0,0,0.22)", maxHeight: "88vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}aa)` }} />
        <div style={{ padding: "28px 32px 20px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid #f4f4f5", flexShrink: 0 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: `${meta.color}18`,
            border: `2px solid ${meta.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 900, color: meta.color }}>{meta.initials}</span>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#111827", letterSpacing: "-0.03em" }}>{meta.name}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: "0.8rem", color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                <Mail style={{ width: 12, height: 12 }} />{meta.email}
              </span>
              <span style={{ fontSize: "0.8rem", color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                <Phone style={{ width: 12, height: 12 }} />{meta.phone}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #e5e7eb",
            background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X style={{ width: 16, height: 16, color: "#6b7280" }} />
          </button>
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
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.8fr 1fr 1fr", padding: "10px 20px",
              background: "#18181b", alignItems: "center" }}>
              {["Date", "Arrivée", "Départ", "Heures", "Montant réel", "Écart"].map((h, i) => (
                <span key={h} style={{ fontSize: "0.62rem", fontWeight: 700, color: "#52525b",
                  textTransform: "uppercase", letterSpacing: "0.09em", textAlign: i >= 3 ? "right" : "left" }}>
                  {h}
                </span>
              ))}
            </div>
            {sortedShifts.map((s, idx) => (
              <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.8fr 1fr 1fr",
                padding: "13px 20px", alignItems: "center",
                borderBottom: idx < sortedShifts.length - 1 ? "1px solid #f4f4f5" : "none",
                background: s.ecart < 0 ? "#fff8f8" : "white" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>{fmtDate(s.date)}</span>
                <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>{s.arrivee}</span>
                <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>{s.depart}</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#374151", textAlign: "right" }}>{fmtHours(s.heures)}</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#374151", textAlign: "right" }}>{fmtCurrency(s.reel)}</span>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <EcartPill ecart={s.ecart} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Calendar View ──────────────────────────────────────────────── */
function CalendarView({ shifts }: { shifts: any[] }) {
  // On calcule la date du jour
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // On initialise le calendrier sur le mois et l'année en cours
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); 
  const [selectedDay, setSelectedDay] = useState<string | null>(todayStr);

  const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const MONTHS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rawFirstDay = new Date(year, month, 1).getDay();
  const firstDayMon = rawFirstDay === 0 ? 6 : rawFirstDay - 1;

  const goPrev = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const goNext = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const shiftsForDay = (d: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return shifts.filter(s => s.date === dateStr);
  };

  const selectedShifts = selectedDay ? shifts.filter(s => s.date === selectedDay) : [];
  
  // On utilise la vraie date calculée plus haut
  const today = todayStr;

  const cells: (number | null)[] = [
    ...Array(firstDayMon).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Calendar card */}
      <div style={{ background: "white", borderRadius: 20, overflow: "hidden",
        boxShadow: "0 4px 6px rgba(0,0,0,0.03), 0 24px 48px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)" }}>
        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px 16px" }}>
          <button onClick={goPrev} style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #e5e7eb",
            background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft style={{ width: 16, height: 16, color: "#6b7280" }} />
          </button>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.025em" }}>
            {MONTHS_FR[month]} {year}
          </h3>
          <button onClick={goNext} style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #e5e7eb",
            background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronRight style={{ width: 16, height: 16, color: "#6b7280" }} />
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 20px 8px", gap: 4 }}>
          {DAYS_FR.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: "0.65rem", fontWeight: 700,
              color: d === "Sam" || d === "Dim" ? "#9ca3af" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 0" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 20px 20px", gap: 4 }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayShifts = shiftsForDay(day);
            const isSelected = selectedDay === dateStr;
            const isToday = dateStr === today;
            const isWeekend = (idx % 7) >= 5;

            return (
              <motion.button key={day} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                style={{ borderRadius: 12, padding: "8px 4px", border: isToday ? "2px solid #dc2626" : "2px solid transparent",
                  background: isSelected ? "#111827" : isToday ? "#fff5f5" : "transparent",
                  cursor: dayShifts.length > 0 ? "pointer" : "default",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minHeight: 64 }}
              >
                <span style={{ fontSize: "0.875rem", fontWeight: isToday ? 900 : 600,
                  color: isSelected ? "white" : isToday ? "#dc2626" : isWeekend ? "#9ca3af" : "#374151" }}>
                  {day}
                </span>
                {dayShifts.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 2 }}>
                    {dayShifts.map(s => {
                      const meta = getJobisteMeta(s.jobiste);
                      return (
                        <div key={s.id} title={s.jobiste} style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: isSelected ? "rgba(255,255,255,0.7)" : (meta?.color || "#9ca3af"),
                        }} />
                      );
                    })}
                  </div>
                )}
                {dayShifts.length > 0 && (
                  <span style={{ fontSize: "0.6rem", fontWeight: 700,
                    color: isSelected ? "rgba(255,255,255,0.6)" : "#9ca3af" }}>
                    {dayShifts.length} shift{dayShifts.length > 1 ? "s" : ""}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ borderTop: "1px solid #f4f4f5", padding: "16px 28px", display: "flex", gap: 16, flexWrap: "wrap" }}>
          {JOBISTES_META.map(j => (
            <div key={j.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: j.color }} />
              <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 500 }}>{j.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected day detail */}
      <AnimatePresence>
        {selectedDay && selectedShifts.length > 0 && (
          <motion.div key={selectedDay} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            style={{ background: "white", borderRadius: 20, overflow: "hidden",
              boxShadow: "0 4px 6px rgba(0,0,0,0.03), 0 24px 48px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)" }}>
            <div style={{ padding: "20px 28px 16px", borderBottom: "1px solid #f4f4f5" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
                Shifts du {fmtDateLong(selectedDay)}
              </h3>
              <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: 2 }}>
                {selectedShifts.length} session{selectedShifts.length > 1 ? "s" : ""} · {fmtCurrency(selectedShifts.reduce((s, j) => s + j.reel, 0))} encaissés
              </p>
            </div>
            <div style={{ padding: "16px 28px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedShifts.map(s => {
                const meta = getJobisteMeta(s.jobiste);
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
                    background: "#f9fafb", borderRadius: 12, border: "1px solid #f0f0f0" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: `${meta.color}18`,
                      border: `1.5px solid ${meta.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "0.65rem", fontWeight: 900, color: meta.color }}>{meta.initials}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827" }}>{s.jobiste}</p>
                      <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{s.arrivee} → {s.depart} · {fmtHours(s.heures)}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontWeight: 800, fontSize: "0.95rem", color: "#111827" }}>{fmtCurrency(s.reel)}</p>
                    </div>
                    <EcartPill ecart={s.ecart} />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
    if (!firstName || !lastName || !email) {
      setError("Tous les champs sont requis.");
      return;
    }
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("http://localhost:3000/api/admin/jobistes", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email }),
      });
      if (res.ok) {
        onRefresh();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de l'ajout.");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur.");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#f9fafb", border: "2px solid #e5e7eb", borderRadius: 10,
    padding: "10px 14px", fontSize: "0.9rem", color: "#111827", outline: "none", fontFamily: "inherit",
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={(e) => e.stopPropagation()}
        style={{ width: 400, background: "white", borderRadius: 20, padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
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
      const res = await fetch(`http://localhost:3000/api/admin/jobistes/${jobiste.id}/badge`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ nfc_uid: uid }),
      });
      if (res.ok) {
        onRefresh();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de l'assignation.");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={(e) => e.stopPropagation()}
        style={{ width: 400, background: "white", borderRadius: 20, padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111827", marginBottom: 6 }}>Assigner un badge RFID</h3>
        <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 16 }}>Pour <strong>{jobiste.first_name} {jobiste.last_name}</strong></p>
        {error && <p style={{ color: "#dc2626", fontSize: "0.8rem", marginBottom: 10, fontWeight: 600 }}>{error}</p>}
        <input autoFocus placeholder="Scannez ou tapez l'UID du badge..." value={uid} onChange={(e) => setUid(e.target.value)}
          style={{ width: "100%", background: "#f9fafb", border: "2px solid #2563eb", borderRadius: 10, padding: "12px 14px", fontSize: "1rem", color: "#111827", outline: "none", marginBottom: 20, fontFamily: "monospace" }} />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "2px solid #e5e7eb", background: "white", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
          <button onClick={handleSubmit} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#2563eb", color: "white", fontWeight: 600, cursor: "pointer" }}>Assigner</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Jobistes HR Tab ────────────────────────────────────────────── */
/* ─── Jobistes HR Tab (Issue 6 : API Connectée) ──────────────────── */
function JobistesTab({ shifts }: { shifts: any[] }) {
  const [period, setPeriod] = useState<"mars-2026" | "fevrier-2026" | "3-mois">("mars-2026");
  const [selectedJobiste, setSelectedJobiste] = useState<string | null>(null);
  
  // Nouveaux états pour l'API Jobistes
  const [dbJobistes, setDbJobistes] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [badgeModalFor, setBadgeModalFor] = useState<any | null>(null);

  const fetchJobistes = async () => {
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch("http://localhost:3000/api/admin/jobistes", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setDbJobistes(await res.json());
    } catch (err) {
      console.error("Erreur chargement jobistes", err);
    }
  };

  useEffect(() => {
    fetchJobistes();
  }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${name} ?`)) return;
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`http://localhost:3000/api/admin/jobistes/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) fetchJobistes();
    } catch (err) {
      console.error("Erreur suppression", err);
    }
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
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header + Actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.025em" }}>
            Gestion de l'équipe ({dbJobistes.length})
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: 2 }}>
            Gérez les accès RFID et visualisez les prestations
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "white", borderRadius: 12,
            padding: "4px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            {periodOptions.map(opt => (
              <button key={opt.value} onClick={() => setPeriod(opt.value)}
                style={{ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: "0.75rem", fontWeight: period === opt.value ? 700 : 500,
                  background: period === opt.value ? "#111827" : "transparent",
                  color: period === opt.value ? "white" : "#6b7280", transition: "all 0.15s" }}>
                {opt.label}
              </button>
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
            <motion.div key={jobiste.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ background: "white", borderRadius: 20, overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}
            >
              <div style={{ height: 4, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}88)` }} />
              <div style={{ padding: "20px 24px", flex: 1 }}>
                
                {/* Header Card */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: `${meta.color}18`,
                      border: `2px solid ${meta.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 900, color: meta.color }}>{meta.initials}</span>
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: "1rem", color: "#111827", cursor: "pointer" }} onClick={() => setSelectedJobiste(fullName)}>
                        {fullName}
                      </p>
                      <p style={{ fontSize: "0.7rem", color: "#9ca3af" }}>{jobiste.email}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(jobiste.id, fullName)} title="Supprimer le jobiste" style={{ background: "#fef2f2", border: "none", width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Trash2 style={{ width: 14, height: 14, color: "#ef4444" }} />
                  </button>
                </div>

                {/* Badge Status */}
                <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: hasBadge ? "#eff6ff" : "#fef2f2", borderRadius: 10, border: `1px solid ${hasBadge ? "#bfdbfe" : "#fecaca"}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CreditCard style={{ width: 16, height: 16, color: hasBadge ? "#2563eb" : "#ef4444" }} />
                    <div>
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: hasBadge ? "#1d4ed8" : "#b91c1c" }}>
                        {hasBadge ? "Badge Actif" : "Aucun Badge RFID"}
                      </p>
                      {hasBadge && <p style={{ fontSize: "0.65rem", color: "#60a5fa", fontFamily: "monospace" }}>UID: {jobiste.nfc_uid}</p>}
                    </div>
                  </div>
                  <button onClick={() => setBadgeModalFor(jobiste)} style={{ background: "white", border: `1px solid ${hasBadge ? "#bfdbfe" : "#fecaca"}`, borderRadius: 6, padding: "4px 10px", fontSize: "0.7rem", fontWeight: 700, color: hasBadge ? "#2563eb" : "#dc2626", cursor: "pointer" }}>
                    {hasBadge ? "Modifier" : "Assigner"}
                  </button>
                </div>

                {/* Stats grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ background: "#f9fafb", borderRadius: 12, padding: "10px 14px" }}>
                    <p style={{ fontSize: "0.6rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Shifts / Heures</p>
                    <p style={{ fontSize: "1.1rem", fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>
                      {stats.shifts.length} <span style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 600 }}>({fmtHours(stats.totalHeures)})</span>
                    </p>
                  </div>
                  <div style={{ background: stats.totalEcart < 0 ? "#fef2f2" : "#f0fdf4", border: `1px solid ${stats.totalEcart < 0 ? "#fecaca" : "#bbf7d0"}`, borderRadius: 12, padding: "10px 14px" }}>
                    <p style={{ fontSize: "0.6rem", fontWeight: 700, color: stats.totalEcart < 0 ? "#ef4444" : "#15803d", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Écart Cumulé</p>
                    <p style={{ fontSize: "1.1rem", fontWeight: 900, color: stats.totalEcart < 0 ? "#b91c1c" : stats.totalEcart > 0 ? "#15803d" : "#9ca3af", letterSpacing: "-0.02em" }}>
                      {stats.totalEcart > 0 ? "+" : ""}{fmtCurrency(stats.totalEcart)}
                    </p>
                  </div>
                </div>

                <button onClick={() => setSelectedJobiste(fullName)} style={{ width: "100%", marginTop: 12, padding: "8px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "white", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <FileText style={{ width: 13, height: 13 }} /> Voir la fiche RH
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedJobiste && (
          <JobisteDetailModal jobisteName={selectedJobiste} shifts={filteredShifts.filter(s => s.jobiste === selectedJobiste)} onClose={() => setSelectedJobiste(null)} />
        )}
        {showAddModal && <AddJobisteModal onClose={() => setShowAddModal(false)} onRefresh={fetchJobistes} />}
        {badgeModalFor && <AssignBadgeModal jobiste={badgeModalFor} onClose={() => setBadgeModalFor(null)} onRefresh={fetchJobistes} />}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Settings Tab───────────────────────────── */
/* ─── Composants UI (Sortis pour éviter le bug de re-render) ─────── */
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

/* ─── Settings Tab (Vraie Sauvegarde + Lien PDF) ─────────────────── */
function SettingsTab({ shifts }: { shifts: any[] }) {
  const [saved, setSaved] = useState(false);
  
  // 💾 On initialise avec le localStorage s'il existe, sinon valeur par défaut
  const [centerName, setCenterName] = useState(() => localStorage.getItem("sc_centerName") || "Sports Center Bruxelles");
  const [address, setAddress] = useState(() => localStorage.getItem("sc_address") || "Rue du Sport 42, 1000 Bruxelles");
  const [adminEmail, setAdminEmail] = useState(() => localStorage.getItem("sc_adminEmail") || "direction@sportscenter.be");
  const [adminPhone, setAdminPhone] = useState(() => localStorage.getItem("sc_adminPhone") || "+32 2 123 45 67");
  const [notifEcart, setNotifEcart] = useState(() => localStorage.getItem("sc_notifEcart") !== "false");
  const [notifCloture, setNotifCloture] = useState(() => localStorage.getItem("sc_notifCloture") !== "false");

  const handleSave = () => {
    // 💾 On sauvegarde les vraies données dans le navigateur
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
    
    // 🖨️ ON UTILISE LES PARAMÈTRES POUR LE PDF !
    doc.setFontSize(18);
    doc.text(`Rapport Comptable - ${centerName}`, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Généré le : ${new Date().toLocaleDateString('fr-BE')}`, 14, 30);
    
    // Ajout de l'adresse et contact en sous-titre
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
      startY: 44, // 👈 On a descendu le tableau pour laisser de la place au texte
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

/* ─── Main Dashboard ─────────────────────────────────────────────── */
export function DirectorDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [shifts, setShifts] = useState<any[]>([]); // 👈 Nouvel état pour les vraies données
  const [loading, setLoading] = useState(true);   // 👈 Pour afficher un chargement
  const navigate = useNavigate();
  
// 🔴 Le fameux fetch sécurisé
  useEffect(() => {
    const fetchShifts = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        navigate("/admin/login");
        return;
      }

      try {
        // On fait l'appel vers ton vrai backend avec le JWT dans le Header !
        const response = await fetch("http://localhost:3000/api/shifts", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          // 🛠️ ON CONVERTIT LES CHAINES EN NOMBRES POUR JAVASCRIPT
          const formattedData = data.map((shift: any) => ({
              ...shift,
              heures: Number(shift.heures),
              attendu: Number(shift.attendu),
              reel: Number(shift.reel),
              ecart: Number(shift.ecart)
          }));

          setShifts(formattedData); // On injecte les données converties !
        } else if (response.status === 401 || response.status === 403) {
          // Si le token est expiré ou invalide, on le jette dehors
          localStorage.removeItem("adminToken");
          navigate("/admin/login");
        }
      } catch (error) {
        console.error("Erreur de connexion à l'API :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, [navigate]);

// 1. ON VÉRIFIE D'ABORD SI ÇA CHARGE (On bloque le rendu ici si besoin)
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] text-gray-500 font-bold">Chargement des données sécurisées...</div>;
  }

  // 2. ENSUITE SEULEMENT, ON FAIT LES CALCULS (Car on est sûr d'avoir les données)
  const uniqueDates = [...new Set(shifts.map(s => s.date))].sort((a, b) => b.localeCompare(a));

  const filteredShifts = dateFilter === "all"
    ? shifts
    : shifts.filter(s => s.date === dateFilter);

  const totalAttendu = filteredShifts.reduce((s, r) => s + r.attendu, 0);
  const totalReel    = filteredShifts.reduce((s, r) => s + r.reel, 0);
  const totalEcart   = totalReel - totalAttendu;
  const negCount     = filteredShifts.filter(r => r.ecart < 0).length;

  const tableColumns = "1.8fr 1fr 0.9fr 0.9fr 1.1fr 1.1fr 1.3fr";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "inherit" }}>

      {/* ═══════════ DARK SIDEBAR ═══════════ */}
      <aside style={{ width: 240, minWidth: 240, background: "#18181b", display: "flex",
        flexDirection: "column", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
        {/* Logo */}
        <div style={{ padding: "24px 18px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, background: "linear-gradient(145deg, #dc2626, #b91c1c)",
              borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, boxShadow: "0 4px 14px rgba(220,38,38,0.35)" }}>
              <span style={{ color: "white", fontWeight: 900, fontSize: "0.75rem", letterSpacing: "-0.02em" }}>SC</span>
            </div>
            <div>
              <p style={{ color: "#f4f4f5", fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                Sports Center
              </p>
              <p style={{ color: "#52525b", fontSize: "0.68rem", fontWeight: 500, marginTop: 1 }}>Administration</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "14px 10px" }}>
          <p style={{ fontSize: "0.64rem", fontWeight: 700, color: "#3f3f46", letterSpacing: "0.1em",
            textTransform: "uppercase", padding: "0 8px", marginBottom: 8 }}>Menu</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            {navItems.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <li key={id}>
                  <button onClick={() => setActiveTab(id)} style={{ width: "100%", display: "flex", alignItems: "center",
                    gap: 9, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                    background: isActive ? "rgba(220,38,38,0.12)" : "transparent",
                    color: isActive ? "#f87171" : "#71717a", fontWeight: isActive ? 700 : 500,
                    fontSize: "0.875rem", position: "relative", transition: "all 0.15s", textAlign: "left" }}>
                    {isActive && (
                      <motion.div layoutId="activeBar" style={{ position: "absolute", left: 0, top: "50%",
                        transform: "translateY(-50%)", width: 3, height: 18,
                        background: "#dc2626", borderRadius: "0 3px 3px 0" }} />
                    )}
                    <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom */}
        <div style={{ padding: "10px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10,
            background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)", marginBottom: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e",
              boxShadow: "0 0 6px rgba(34,197,94,0.7)", display: "block", flexShrink: 0 }} />
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#4ade80" }}>En ligne</span>
          </div>
          <button onClick={() => {
            // 1. On supprime les traces dans le navigateur
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
            // 2. On redirige vers l'accueil
            navigate("/");
            }} 
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: "transparent", color: "#52525b", fontSize: "0.875rem", fontWeight: 500 }}
          >
            <LogOut style={{ width: 15, height: 15 }} />Déconnexion
          </button>
        </div>
      </aside>

      {/* ═══════════ MAIN AREA ═══════════ */}
      <main style={{ flex: 1, overflowY: "auto", background: "#F8F9FA", display: "flex", flexDirection: "column" }}>
        {/* Sticky header */}
        <header style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "20px 36px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 20 }}>
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#111827", letterSpacing: "-0.035em", lineHeight: 1 }}>
              {activeTab === "dashboard"  && "Tableau de bord"}
              {activeTab === "jobistes"   && "Gestion des Jobistes"}
              {activeTab === "calendrier" && "Calendrier des Shifts"}
              {activeTab === "settings"   && "Paramètres"}
            </h1>
            <p style={{ fontSize: "0.82rem", color: "#9ca3af", fontWeight: 500, marginTop: 4 }}>
              {activeTab === "dashboard"  && `Jeudi 12 mars 2026 · ${filteredShifts.length} sessions`}
              {activeTab === "jobistes"   && `${JOBISTES_META.length} étudiants · Fiches RH`}
              {activeTab === "calendrier" && "Vue mensuelle des prestations"}
              {activeTab === "settings"   && "Configuration du système"}
            </p>
          </div>
          {activeTab === "dashboard" && negCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
              background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10 }}>
              <AlertTriangle style={{ width: 14, height: 14, color: "#dc2626" }} />
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#b91c1c" }}>
                {negCount} écart{negCount > 1 ? "s" : ""} négatif{negCount > 1 ? "s" : ""} détecté{negCount > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </header>

        {/* Page content */}
        <div style={{ padding: "28px 36px", flex: 1 }}>

          {/* ─── DASHBOARD TAB ─── */}
          {activeTab === "dashboard" && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
              style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* KPI Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                <KpiCard label="Total Attendu" value={`${totalAttendu.toFixed(2)} €`}
                  sub="Somme des montants théoriques" icon={Activity} variant="neutral" />
                <KpiCard label="Total Réel" value={`${totalReel.toFixed(2)} €`}
                  sub="Somme des montants déclarés" icon={CheckCircle2} variant="green" />
                <KpiCard label="Écart Total" value={`${totalEcart > 0 ? "+" : ""}${totalEcart.toFixed(2)} €`}
                  sub={totalEcart < 0 ? "Déficit constaté" : "Excédent constaté"}
                  icon={totalEcart < 0 ? TrendingDown : TrendingUp}
                  variant={totalEcart < 0 ? "red" : "green"} />
              </div>

              {/* Date filter */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Filter style={{ width: 14, height: 14, color: "#9ca3af", flexShrink: 0 }} />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => setDateFilter("all")} style={{ padding: "6px 16px", borderRadius: 99,
                    border: dateFilter === "all" ? "none" : "1.5px solid #e5e7eb",
                    background: dateFilter === "all" ? "#111827" : "white",
                    color: dateFilter === "all" ? "white" : "#6b7280",
                    fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                    Toutes les dates
                  </button>
                  {uniqueDates.map(d => (
                    <button key={d} onClick={() => setDateFilter(d)} style={{ padding: "6px 16px", borderRadius: 99,
                      border: dateFilter === d ? "none" : "1.5px solid #e5e7eb",
                      background: dateFilter === d ? "#dc2626" : "white",
                      color: dateFilter === d ? "white" : "#6b7280",
                      fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                      {fmtDate(d)}
                    </button>
                  ))}
                </div>
              </div>

              {/* DATA TABLE */}
              <div style={{ background: "#ffffff", borderRadius: 20, overflow: "hidden",
                boxShadow: "0 4px 6px rgba(0,0,0,0.03), 0 24px 48px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)" }}>
                {/* Table heading */}
                <div style={{ display: "grid", gridTemplateColumns: tableColumns, padding: "13px 28px",
                  background: "#18181b", alignItems: "center" }}>
                  {[
                    { label: "Jobiste", align: "left" },
                    { label: "Date",    align: "left" },
                    { label: "Arrivée", align: "left" },
                    { label: "Départ",  align: "left" },
                    { label: "Attendu", align: "right" },
                    { label: "Réel",    align: "right" },
                    { label: "Écart",   align: "right" },
                  ].map(({ label, align }) => (
                    <span key={label} style={{ fontSize: "0.65rem", fontWeight: 700, color: "#52525b",
                      textTransform: "uppercase", letterSpacing: "0.09em", textAlign: align as "left" | "right" }}>
                      {label}
                    </span>
                  ))}
                </div>

                {/* Rows */}
                {filteredShifts.map((shift, idx) => {
                  const isNeg  = shift.ecart < 0;
                  const isLast = idx === filteredShifts.length - 1;
                  const meta = getJobisteMeta(shift.jobiste);
                  return (
                    <motion.div key={shift.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 + idx * 0.03, duration: 0.3 }}
                      style={{ display: "grid", gridTemplateColumns: tableColumns, padding: "16px 28px",
                        alignItems: "center", borderBottom: isLast ? "none" : "1px solid #f4f4f5",
                        background: isNeg ? "#fff8f8" : "transparent", position: "relative" }}>
                      {isNeg && (
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                          background: "#dc2626", borderRadius: "0 2px 2px 0" }} />
                      )}
                      {/* Jobiste */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${meta.color}18`,
                          border: `1.5px solid ${meta.color}30`, display: "flex", alignItems: "center",
                          justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: "0.62rem", fontWeight: 900, color: meta.color }}>{meta.initials}</span>
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827", lineHeight: 1.2 }}>{shift.jobiste}</p>
                          {isNeg && <p style={{ fontSize: "0.65rem", color: "#ef4444", fontWeight: 600 }}>Écart détecté</p>}
                        </div>
                      </div>
                      {/* Date */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px",
                          background: "#f3f4f6", borderRadius: 8, fontSize: "0.78rem", fontWeight: 700, color: "#374151" }}>
                          <Calendar style={{ width: 10, height: 10 }} />
                          {fmtDate(shift.date)}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: 500 }}>{shift.arrivee}</span>
                      <span style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: 500 }}>{shift.depart}</span>
                      <span style={{ textAlign: "right", fontSize: "0.9rem", color: "#374151", fontWeight: 600 }}>{shift.attendu.toFixed(2)} €</span>
                      <span style={{ textAlign: "right", fontSize: "0.9rem", color: "#374151", fontWeight: 600 }}>{shift.reel.toFixed(2)} €</span>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <EcartPill ecart={shift.ecart} />
                      </div>
                    </motion.div>
                  );
                })}

                {/* Footer totals */}
                <div style={{ display: "grid", gridTemplateColumns: tableColumns, padding: "14px 28px",
                  background: "#fafafa", borderTop: "2px solid #f0f0f0", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Totaux
                  </span>
                  <span /><span /><span />
                  <span style={{ textAlign: "right", fontSize: "0.95rem", fontWeight: 900, color: "#111827" }}>
                    {totalAttendu.toFixed(2)} €
                  </span>
                  <span style={{ textAlign: "right", fontSize: "0.95rem", fontWeight: 900, color: "#111827" }}>
                    {totalReel.toFixed(2)} €
                  </span>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <EcartPill ecart={totalEcart} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── JOBISTES TAB ─── */}
          {activeTab === "jobistes" && <JobistesTab shifts={shifts} />}

          {/* ─── CALENDRIER TAB ─── */}
          {activeTab === "calendrier" && <CalendarView shifts={shifts} />}

          {/* ─── SETTINGS TAB ─── */}
          {activeTab === "settings" && <SettingsTab shifts={filteredShifts} />}
        </div>
      </main>
    </div>
  );
}
