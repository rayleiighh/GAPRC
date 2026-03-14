import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";

/* ─── Animated NFC Icon ──────────────────────────────────────────── */
function NFCIcon() {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 180, height: 180 }}
    >
      {/* Ripple rings emanating outward */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            border: "1.5px solid #dc2626",
            width: 90,
            height: 90,
          }}
          animate={{
            scale: [1, 2.6 + i * 0.5],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 2.2,
            delay: i * 0.55,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Center disc */}
      <div
        className="relative z-10 flex items-center justify-center rounded-full"
        style={{
          width: 96,
          height: 96,
          background:
            "linear-gradient(145deg, #1c1c1e 0%, #0a0a0a 100%)",
          boxShadow:
            "0 24px 48px rgba(0,0,0,0.22), 0 6px 16px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.08) inset",
        }}
      >
        {/* NFC SVG */}
        <svg
          width="52"
          height="52"
          viewBox="0 0 52 52"
          fill="none"
        >
          {/* Card body */}
          <rect
            x="6"
            y="12"
            width="20"
            height="28"
            rx="3"
            fill="white"
            opacity="0.08"
          />
          <rect
            x="8"
            y="14"
            width="16"
            height="24"
            rx="2"
            fill="white"
            opacity="0.88"
          />
          <rect
            x="11"
            y="30"
            width="10"
            height="5"
            rx="1.5"
            fill="#1c1c1e"
            opacity="0.35"
          />
          {/* Chip */}
          <rect
            x="11"
            y="17"
            width="7"
            height="5"
            rx="1"
            fill="#d4a929"
            opacity="0.8"
          />

          {/* Arc 1 */}
          <motion.path
            d="M31 19 Q38 26 31 33"
            stroke="#dc2626"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.6,
              delay: 0.1,
              repeat: Infinity,
            }}
          />
          {/* Arc 2 */}
          <motion.path
            d="M35.5 15 Q46 26 35.5 37"
            stroke="#dc2626"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{
              duration: 1.6,
              delay: 0.35,
              repeat: Infinity,
            }}
          />
          {/* Arc 3 */}
          <motion.path
            d="M40 11 Q54 26 40 41"
            stroke="#dc2626"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            animate={{ opacity: [0.1, 0.5, 0.1] }}
            transition={{
              duration: 1.6,
              delay: 0.6,
              repeat: Infinity,
            }}
          />
        </svg>
      </div>
    </div>
  );
}

/* ─── Live Clock ─────────────────────────────────────────────────── */
function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = time.getHours().toString().padStart(2, "0");
  const mm = time.getMinutes().toString().padStart(2, "0");
  const dateStr = time.toLocaleDateString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="text-center select-none">
      <p
        style={{
          fontSize: "4.8rem",
          fontWeight: 800,
          color: "#1c1c1e",
          lineHeight: 1,
          letterSpacing: "-0.05em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {hh}
        <motion.span
          animate={{ opacity: [1, 0.15, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          :
        </motion.span>
        {mm}
      </p>
      <p
        className="mt-2 capitalize"
        style={{
          fontSize: "0.9rem",
          color: "#aeaeb2",
          fontWeight: 500,
          letterSpacing: "0.01em",
        }}
      >
        {dateStr}
      </p>
    </div>
  );
}

/* ─── Network Status Pill ────────────────────────────────────────── */
function OnlinePill() {
  return (
    <div
      className="flex items-center gap-2"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,1)",
        borderRadius: 999,
        padding: "9px 18px 9px 14px",
        boxShadow:
          "0 4px 24px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      {/* Glowing green dot */}
      <div
        className="relative"
        style={{ width: 10, height: 10 }}
      >
        <span
          style={{
            position: "absolute",
            inset: -3,
            borderRadius: "50%",
            background: "rgba(52,199,89,0.28)",
            animation: "glow-ping 2s ease-out infinite",
          }}
        />
        <span
          style={{
            display: "block",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#34c759",
            boxShadow: "0 0 6px rgba(52,199,89,0.7)",
          }}
        />
      </div>
      <span
        style={{
          fontSize: "0.82rem",
          fontWeight: 600,
          color: "#1c1c1e",
          letterSpacing: "0.01em",
        }}
      >
        En ligne
      </span>
    </div>
  );
}

/* ─── Main Screen ────────────────────────────────────────────────── */
export function KioskIdleScreen() {
  const navigate = useNavigate();
  // 🔌 INJECTION WEBSOCKET (Issue 2)
  useEffect(() => {
    // CA1 : Connexion au serveur backend
    const socket = io("http://localhost:3000");

    // CA2 : Écoute de l'événement magique envoyé par le scanController
    socket.on("unlock_session", (data) => {
      console.log("🔓 Ordre de déverrouillage reçu !", data);
      
      // On sauvegarde l'ID du shift pour que la page de checkout puisse l'utiliser plus tard !
      localStorage.setItem("current_shift_id", data.shift_id.toString());
      
      // CA3 : On navigue automatiquement sans toucher la souris !
      navigate(`/checkout/${encodeURIComponent(data.jobisteName)}`);
    });

    // Nettoyage pour éviter les fuites de mémoire
    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "#F8F9FA" }}
    >
      {/* Very subtle radial wash */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 45%, rgba(220,38,38,0.035) 0%, transparent 65%)",
        }}
      />

      {/* ── Top-right: Online pill ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.4,
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="absolute top-7 right-7 z-20"
      >
        <OnlinePill />
      </motion.div>

      {/* ── Top-left: Branding ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.4,
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="absolute top-7 left-7 z-20 flex items-center gap-2.5"
      >
        <div
          style={{
            width: 34,
            height: 34,
            background: "#dc2626",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(220,38,38,0.35)",
          }}
        >
          <span
            style={{
              color: "white",
              fontWeight: 900,
              fontSize: "0.75rem",
              letterSpacing: "-0.02em",
            }}
          >
            SC
          </span>
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: "0.88rem",
            color: "#3a3a3c",
            letterSpacing: "-0.01em",
          }}
        >
          Hall omnisport Grez-Doiceau
        </span>
      </motion.div>

      {/* ── Elevated White Card ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 32 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.75,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{
          width: "min(560px, 90vw)",
          background: "#ffffff",
          borderRadius: 24,
          padding: "52px 44px 44px",
          boxShadow:
            "0 2px 0px rgba(255,255,255,0.9) inset, 0 40px 80px rgba(0,0,0,0.1), 0 16px 32px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.04)",
          border: "1px solid rgba(0,0,0,0.06)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        {/* Crimson accent pill at top of card */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 64,
            height: 4,
            background:
              "linear-gradient(90deg, rgba(220,38,38,0.0), #dc2626, rgba(220,38,38,0.0))",
            borderRadius: "0 0 4px 4px",
          }}
        />

        {/* NFC Icon — floating animation */}
        <motion.div
          animate={{ y: [0, -7, 0] }}
          transition={{
            duration: 3.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ marginBottom: 36 }}
        >
          <NFCIcon />
        </motion.div>

        {/* Clock */}
        <Clock />

        {/* Thin separator */}
        <div
          style={{
            width: 40,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, #e5e7eb, transparent)",
            margin: "28px 0",
          }}
        />

        {/* Main instruction text */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 36,
            padding: "0 8px",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(1.35rem, 2.8vw, 1.65rem)",
              fontWeight: 800,
              color: "#1c1c1e",
              lineHeight: 1.3,
              letterSpacing: "-0.03em",
            }}
          >
            Veuillez badger pour déverrouiller la caisse
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#aeaeb2",
              fontWeight: 400,
              marginTop: 10,
              lineHeight: 1.5,
            }}
          >
            Approchez votre badge RFID du lecteur NFC
          </p>
        </div>

        {/* Demo CTA */}
        <motion.button
          onClick={() => navigate("/checkout/Rayane")}
          whileHover={{
            scale: 1.02,
            boxShadow: "0 12px 32px rgba(220,38,38,0.38)",
          }}
          whileTap={{ scale: 0.98 }}
          style={{
            width: "100%",
            padding: "17px 24px",
            background:
              "linear-gradient(160deg, #dc2626 0%, #b91c1c 100%)",
            color: "white",
            border: "none",
            borderRadius: 14,
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: "pointer",
            letterSpacing: "-0.01em",
            boxShadow:
              "0 8px 24px rgba(220,38,38,0.28), 0 2px 6px rgba(220,38,38,0.16)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            transition: "box-shadow 0.2s",
          }}
        >
          <span style={{ fontSize: "1rem" }}>🪪</span>
          Simuler un scan de badge
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.55)",
              background: "rgba(255,255,255,0.12)",
              padding: "2px 7px",
              borderRadius: 6,
            }}
          >
            DÉMO
          </span>
        </motion.button>

        {/* Director access */}
        <p
          style={{
            fontSize: "0.75rem",
            color: "#c7c7cc",
            marginTop: 20,
            textAlign: "center",
          }}
        >
          Accès directeur ·{" "}
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#dc2626",
              fontWeight: 600,
              fontSize: "0.75rem",
              padding: 0,
            }}
          >
            Tableau de bord →
          </button>
        </p>
      </motion.div>

      {/* Bottom version */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6"
        style={{
          fontSize: "0.7rem",
          color: "#d1d1d6",
          letterSpacing: "0.06em",
          fontWeight: 500,
        }}
      >
        SPORTS CENTER POS · v2.1.0
      </motion.p>

      <style>{`
        @keyframes glow-ping {
          0% { transform: scale(1); opacity: 0.7; }
          70% { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}