import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Trash2, CheckCircle2, Loader2, X, ChevronLeft,
  Banknote, CreditCard, MessageSquare,
  Users, Clock, Euro, AlertCircle, ClipboardList, Check, Pencil,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────── */
interface Entry {
  id: string;
  nom: string;
  prenom: string;
  sport: string;
  heures: string;
  montantCash: number;
  montantBancontact: number;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  category: string;
}

/* ─── Helpers ────────────────────────────────────────────────────── */
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function fmtCurrency(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

function fmtTime(date: Date) {
  return date.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
}

/* ─── Checklist Data ─────────────────────────────────────────────── */
const INITIAL_CHECKLIST: Omit<ChecklistItem, "id" | "checked">[] = [
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
function Avatar({ name, size = 44 }: { name: string; size?: number }) {
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
function LiveTime() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return <span>{fmtTime(t)}</span>;
}

/* ─── Add Entry Modal ────────────────────────────────────────────── */
function AddEntryModal({
  onClose, onAdd,
}: { onClose: () => void; onAdd: (e: Omit<Entry, "id">) => void }) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [sport, setSport] = useState("");
  const [heures, setHeures] = useState("");
  const [montantCash, setMontantCash] = useState("");
  const [montantBancontact, setMontantBancontact] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = () => {
    const errs: string[] = [];
    // Au moins un nom ou prénom doit être rempli
    if (!prenom.trim() && !nom.trim()) errs.push("client");
    if (!sport.trim()) errs.push("sport");
    if (!heures.trim()) errs.push("heures");
    
    const cashVal = parseFloat(montantCash || "0");
    const bcVal = parseFloat(montantBancontact || "0");
    if (cashVal + bcVal <= 0) errs.push("montant");
    
    if (errs.length) { setErrors(errs); return; }
    
    onAdd({
      nom: nom.trim(),
      prenom: prenom.trim(),
      sport: sport.trim(),
      heures: heures.trim(),
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 100, padding: "24px",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 100%)", background: "#ffffff",
          borderRadius: 24, padding: "0 0 32px",
          maxHeight: "92vh", overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "#e5e7eb" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px 20px" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.025em" }}>
              Nouveau client
            </h2>
            <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: 2 }}>Remplissez les informations de la réservation</p>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X style={{ width: 16, height: 16, color: "#6b7280" }} />
          </button>
        </div>

        <div style={{ padding: "0 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Nom + Prénom */}
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: err("client") ? "#dc2626" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 10 }}>
              Client (nom et/ou prénom) *
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <input
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Prénom"
                style={{ 
                  ...inputBase, 
                  borderColor: err("client") ? "#fca5a5" : "#e5e7eb", 
                  boxShadow: err("client") ? "0 0 0 3px rgba(220,38,38,0.1)" : "none" 
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = err("client") ? "#fca5a5" : "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Nom"
                style={{ 
                  ...inputBase, 
                  borderColor: err("client") ? "#fca5a5" : "#e5e7eb", 
                  boxShadow: err("client") ? "0 0 0 3px rgba(220,38,38,0.1)" : "none" 
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = err("client") ? "#fca5a5" : "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          {/* Sport - texte libre */}
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: err("sport") ? "#dc2626" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 10 }}>
              Sport / Activité *
            </label>
            <input
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              placeholder="ex: Tennis, Badminton, Football..."
              style={{ 
                ...inputBase, 
                borderColor: err("sport") ? "#fca5a5" : "#e5e7eb", 
                boxShadow: err("sport") ? "0 0 0 3px rgba(220,38,38,0.1)" : "none" 
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.1)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = err("sport") ? "#fca5a5" : "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          {/* Heures - texte libre */}
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: err("heures") ? "#dc2626" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 10 }}>
              Durée *
            </label>
            <input
              value={heures}
              onChange={(e) => setHeures(e.target.value)}
              placeholder="ex: 1h, 1h30, 2h15..."
              style={{ 
                ...inputBase, 
                borderColor: err("heures") ? "#fca5a5" : "#e5e7eb", 
                boxShadow: err("heures") ? "0 0 0 3px rgba(220,38,38,0.1)" : "none" 
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.1)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = err("heures") ? "#fca5a5" : "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          {/* Montants - cash + bancontact */}
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: err("montant") ? "#dc2626" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 10 }}>
              Montant * <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(au moins un montant requis)</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {/* Cash */}
              <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                  <Banknote style={{ width: 15, height: 15, color: "#16a34a" }} />
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.07em" }}>Espèces</span>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={montantCash}
                    onChange={(e) => setMontantCash(e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: "100%",
                      background: "white",
                      border: "2px solid #d1fae5",
                      borderRadius: 10,
                      padding: "10px 12px",
                      paddingRight: 36,
                      fontSize: "1.2rem",
                      fontWeight: 800,
                      letterSpacing: "-0.03em",
                      color: "#111827",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "1rem", fontWeight: 700, color: "#9ca3af" }}>€</span>
                </div>
              </div>

              {/* Bancontact */}
              <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                  <CreditCard style={{ width: 15, height: 15, color: "#2563eb" }} />
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Bancontact</span>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={montantBancontact}
                    onChange={(e) => setMontantBancontact(e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: "100%",
                      background: "white",
                      border: "2px solid #dbeafe",
                      borderRadius: 10,
                      padding: "10px 12px",
                      paddingRight: 36,
                      fontSize: "1.2rem",
                      fontWeight: 800,
                      letterSpacing: "-0.03em",
                      color: "#111827",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "1rem", fontWeight: 700, color: "#9ca3af" }}>€</span>
                </div>
              </div>
            </div>
            {(parseFloat(montantCash || "0") + parseFloat(montantBancontact || "0")) > 0 && (
              <div style={{ marginTop: 10, textAlign: "center", padding: "8px", background: "#f9fafb", borderRadius: 10 }}>
                <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 600 }}>Total : </span>
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
                  {fmtCurrency(parseFloat(montantCash || "0") + parseFloat(montantBancontact || "0"))}
                </span>
              </div>
            )}
          </div>

          {/* Validation errors */}
          {errors.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#fef2f2", borderRadius: 10, border: "1px solid #fecaca" }}>
              <AlertCircle style={{ width: 15, height: 15, color: "#dc2626", flexShrink: 0 }} />
              <span style={{ fontSize: "0.82rem", color: "#b91c1c", fontWeight: 500 }}>
                Veuillez remplir tous les champs obligatoires (*)
              </span>
            </div>
          )}

          {/* Submit */}
          <motion.button
            type="button"
            onClick={handleSubmit}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            style={{
              width: "100%", height: 58,
              background: "linear-gradient(155deg, #dc2626 0%, #b91c1c 100%)",
              color: "white", border: "none", borderRadius: 14,
              fontWeight: 800, fontSize: "1rem", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              boxShadow: "0 8px 24px rgba(220,38,38,0.3)",
              letterSpacing: "-0.01em",
            }}
          >
            <Plus style={{ width: 20, height: 20 }} />
            Ajouter à la session
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Checklist Modal ────────────────────────────────────────────── */
function ChecklistModal({
  checklist, onToggle, onClose,
}: {
  checklist: ChecklistItem[];
  onToggle: (id: string) => void;
  onClose: () => void;
}) {
  // Group checklist by category
  const grouped = checklist.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const categories = Object.keys(grouped);
  
  // Calculate completion percentage
  const completed = checklist.filter(i => i.checked).length;
  const percentage = Math.round((completed / checklist.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 100, padding: 24,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(680px, 96vw)", background: "#ffffff",
          borderRadius: 24, overflow: "hidden",
          boxShadow: "0 40px 80px rgba(0,0,0,0.2)",
          maxHeight: "90vh",
        }}
      >
        {/* Red top bar */}
        <div style={{ height: 4, background: "linear-gradient(90deg, #dc2626, #b91c1c)" }} />

        <div style={{ padding: "28px 32px 32px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#111827", letterSpacing: "-0.03em", marginBottom: 4 }}>
                Entretien journalier
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                Checklist des tâches du shift
              </p>
            </div>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X style={{ width: 16, height: 16, color: "#6b7280" }} />
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 24, background: "#f3f4f6", borderRadius: 12, padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Progression
              </span>
              <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
                {completed}/{checklist.length}
              </span>
            </div>
            <div style={{ width: "100%", height: 8, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{
                  height: "100%",
                  background: percentage === 100 ? "linear-gradient(90deg, #22c55e, #15803d)" : "linear-gradient(90deg, #dc2626, #b91c1c)",
                  borderRadius: 99,
                }}
              />
            </div>
          </div>

          {/* Checklist items by category */}
          <div style={{ maxHeight: "50vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
            {categories.map((category, catIdx) => (
              <div key={catIdx}>
                <h3 style={{ fontSize: "0.82rem", fontWeight: 700, color: "#374151", marginBottom: 10, letterSpacing: "-0.01em" }}>
                  {catIdx + 1}. {category}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 8 }}>
                  {grouped[category].map((item) => (
                    <motion.button
                      key={item.id}
                      onClick={() => onToggle(item.id)}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        background: item.checked ? "#f0fdf4" : "#f9fafb",
                        border: item.checked ? "2px solid #bbf7d0" : "2px solid #e5e7eb",
                        borderRadius: 10,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: item.checked ? "#16a34a" : "white",
                        border: item.checked ? "2px solid #16a34a" : "2px solid #d1d5db",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.2s",
                      }}>
                        {item.checked && <Check style={{ width: 14, height: 14, color: "white", strokeWidth: 3 }} />}
                      </div>
                      <span style={{
                        fontSize: "0.9rem",
                        fontWeight: item.checked ? 600 : 500,
                        color: item.checked ? "#15803d" : "#374151",
                        textDecoration: item.checked ? "line-through" : "none",
                        flex: 1,
                      }}>
                        {item.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Clôture Modal ──────────────────────────────────────────────── */
function ClotureModal({
  entries, jobisteName, onClose, onConfirm, startTimeStr,
}: {
  entries: Entry[];
  jobisteName: string;
  onClose: () => void;
  onConfirm: (comment: string) => void;
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
    onConfirm(comment);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 100, padding: 24,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 96vw)", background: "#ffffff",
          borderRadius: 24, overflow: "hidden",
          boxShadow: "0 40px 80px rgba(0,0,0,0.2)",
          maxHeight: "92vh", overflowY: "auto",
        }}
      >
        {/* Red top bar */}
        <div style={{ height: 4, background: "linear-gradient(90deg, #dc2626, #b91c1c)" }} />

        <div style={{ padding: "32px 36px 36px" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#111827", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Clôturer la session
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginBottom: 24 }}>
            Vérifiez les heures et les totaux avant de vous déconnecter
          </p>

          {/* ── Vérification des heures ── */}
          <div style={{ background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "16px 18px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
              <Clock style={{ width: 14, height: 14, color: "#6b7280" }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Vérification des heures
              </span>
              <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "#9ca3af", fontWeight: 500 }}>
                Modifiez si nécessaire
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Heure d'arrivée
                </label>
                <input
                  type="time"
                  value={heureArrivee}
                  onChange={(e) => setHeureArrivee(e.target.value)}
                  style={{
                    width: "100%", background: "white", border: "2px solid #e5e7eb",
                    borderRadius: 10, padding: "10px 12px", fontSize: "1.1rem",
                    fontWeight: 800, color: "#111827", outline: "none", fontFamily: "inherit",
                    letterSpacing: "-0.01em",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.1)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Heure de départ
                </label>
                <input
                  type="time"
                  value={heureDepart}
                  onChange={(e) => setHeureDepart(e.target.value)}
                  style={{
                    width: "100%", background: "white", border: "2px solid #e5e7eb",
                    borderRadius: 10, padding: "10px 12px", fontSize: "1.1rem",
                    fontWeight: 800, color: "#111827", outline: "none", fontFamily: "inherit",
                    letterSpacing: "-0.01em",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.1)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
            </div>
          </div>

          {/* Summary boxes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <Banknote style={{ width: 15, height: 15, color: "#16a34a" }} />
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.07em" }}>Espèces</span>
              </div>
              <p style={{ fontSize: "1.7rem", fontWeight: 900, color: "#15803d", letterSpacing: "-0.04em" }}>
                {fmtCurrency(totalCash)}
              </p>
            </div>
            <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <CreditCard style={{ width: 15, height: 15, color: "#2563eb" }} />
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Bancontact</span>
              </div>
              <p style={{ fontSize: "1.7rem", fontWeight: 900, color: "#1d4ed8", letterSpacing: "-0.04em" }}>
                {fmtCurrency(totalBC)}
              </p>
            </div>
          </div>

          {/* Total */}
          <div style={{ background: "#111827", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Total session ({entries.length} client{entries.length > 1 ? "s" : ""})
            </span>
            <span style={{ fontSize: "1.8rem", fontWeight: 900, color: "white", letterSpacing: "-0.04em" }}>
              {fmtCurrency(total)}
            </span>
          </div>

          {/* Comment */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <MessageSquare style={{ width: 13, height: 13 }} />
              Commentaire <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optionnel)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Remarques sur la session…"
              rows={2}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={{
                width: "100%", background: "#f9fafb", fontFamily: "inherit",
                border: `2px solid ${focused ? "#dc2626" : "#e5e7eb"}`,
                borderRadius: 12, padding: "12px 14px", fontSize: "0.9rem",
                color: "#374151", resize: "none", outline: "none",
                boxShadow: focused ? "0 0 0 3px rgba(220,38,38,0.1)" : "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, height: 52, borderRadius: 12,
                border: "2px solid #e5e7eb", background: "white",
                cursor: "pointer", fontWeight: 600, color: "#6b7280", fontSize: "0.9rem",
              }}
            >
              Annuler
            </button>
            <motion.button
              onClick={handleConfirm}
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              style={{
                flex: 2, height: 52, borderRadius: 12, border: "none",
                background: loading ? "#16a34a" : "linear-gradient(135deg, #22c55e, #15803d)",
                color: "white", fontWeight: 800, fontSize: "0.95rem",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 6px 20px rgba(22,163,74,0.3)",
              }}
            >
              {loading ? <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> : <CheckCircle2 style={{ width: 18, height: 18 }} />}
              {loading ? "Enregistrement…" : "Valider et se déconnecter"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export function JobisteCheckoutForm() {
  const navigate = useNavigate();
  const { name = "Rayane" } = useParams<{ name: string }>();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showCloture, setShowCloture] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [startTimeStr, setStartTimeStr] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });
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

  const handleConfirm = () => {
    setShowCloture(false);
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
            onClick={() => navigate("/")}
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
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 999 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "block", boxShadow: "0 0 5px rgba(34,197,94,0.6)" }} />
            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#16a34a" }}>En ligne</span>
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
            onClick={() => entries.length > 0 && setShowCloture(true)}
            disabled={entries.length === 0}
            whileHover={entries.length > 0 ? { scale: 1.02 } : {}}
            whileTap={entries.length > 0 ? { scale: 0.98 } : {}}
            style={{
              height: 52, padding: "0 28px", flexShrink: 0,
              background: entries.length === 0
                ? "#e5e7eb"
                : "linear-gradient(135deg, #22c55e, #15803d)",
              color: entries.length === 0 ? "#9ca3af" : "white",
              border: "none", borderRadius: 14, cursor: entries.length === 0 ? "not-allowed" : "pointer",
              fontWeight: 800, fontSize: "0.95rem", letterSpacing: "-0.01em",
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: entries.length > 0 ? "0 6px 20px rgba(22,163,74,0.3)" : "none",
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