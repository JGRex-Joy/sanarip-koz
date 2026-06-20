import { useState, useRef, useCallback, useEffect } from "react";
import {
  Shield, Upload, Play, Pause, AlertTriangle, Eye, FileVideo,
  Activity, ChevronRight, Clock, Zap, Lock, BarChart3,
  Camera, Mic, Radio, AlertCircle, CheckCircle, XCircle,
  ArrowRight, Video, Search, FileSearch, Cpu
} from "lucide-react";

const API_URL = "/api/analyze";

const INCIDENT_META = {
  HEALTH_AND_SAFETY: {
    label: "Угроза / Безопасность", shortLabel: "Угроза",
    color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.35)",
    Icon: AlertTriangle,
  },
  ETHICS_AND_REGULATION: {
    label: "Этика / Регламент", shortLabel: "Этика",
    color: "#facc15", bg: "rgba(250,204,21,0.10)", border: "rgba(250,204,21,0.35)",
    Icon: Shield,
  },
  CORRUPTION_RISK: {
    label: "Риск коррупции", shortLabel: "Коррупция",
    color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.35)",
    Icon: Eye,
  },
  LEGAL_EVIDENCE: {
    label: "Юр. фиксация", shortLabel: "Юр. факт",
    color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.35)",
    Icon: FileSearch,
  },
  TECHNICAL_ANOMALY: {
    label: "Тех. аномалия", shortLabel: "Аномалия",
    color: "#a855f7", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.35)",
    Icon: Activity,
  },
};

const SEVERITY_META = {
  CRITICAL: { label: "КРИТ", color: "#ef4444", bg: "rgba(239,68,68,0.2)" },
  HIGH:     { label: "ВЫСОК", color: "#f97316", bg: "rgba(249,115,22,0.2)" },
  MEDIUM:   { label: "СРЕДН", color: "#facc15", bg: "rgba(250,204,21,0.2)" },
  LOW:      { label: "НИЗК",  color: "#22c55e", bg: "rgba(34,197,94,0.2)" },
};

const LOADING_STAGES = [
  { label: "Загрузка видеофайла...", Icon: Upload },
  { label: "Извлечение аудио дорожки...", Icon: Mic },
  { label: "ИИ-распознавание речи...", Icon: Cpu },
  { label: "Анализ нарушений...", Icon: Search },
  { label: "Формирование рапорта...", Icon: FileSearch },
];

function tsToSeconds(ts) {
  if (!ts) return 0;
  const parts = ts.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

// ── Ambient glow background (subtle, for inner pages) ────────────────────────
function AmbientBg({ subtle = false }) {
  const op = subtle ? 0.18 : 0.32;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      <div style={{
        position: "absolute", width: 700, height: 700,
        borderRadius: "50%", top: -200, left: -150,
        background: `radial-gradient(circle, rgba(59,130,246,${op}) 0%, transparent 70%)`,
        filter: "blur(60px)",
      }} />
      <div style={{
        position: "absolute", width: 600, height: 600,
        borderRadius: "50%", top: 100, right: -150,
        background: `radial-gradient(circle, rgba(239,68,68,${op * 0.8}) 0%, transparent 70%)`,
        filter: "blur(60px)",
      }} />
      <div style={{
        position: "absolute", width: 500, height: 500,
        borderRadius: "50%", bottom: -100, left: "40%",
        background: `radial-gradient(circle, rgba(255,255,255,${op * 0.25}) 0%, transparent 70%)`,
        filter: "blur(80px)",
      }} />
    </div>
  );
}

// ── Siren background — strobing red/blue/white like a police light bar ───────
function SirenBg() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden", background: "#03050c" }}>
      {/* Cyber grid floor */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(59,130,246,0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59,130,246,0.12) 1px, transparent 1px)
        `,
        backgroundSize: "44px 44px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, black 0%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, black 0%, transparent 75%)",
      }} />

      {/* Strobing siren sweep - blue left */}
      <div className="siren-blue" style={{
        position: "absolute", width: "70vw", height: "140vh",
        top: "-20vh", left: "-25vw",
        background: "conic-gradient(from 70deg at 50% 50%, transparent 0deg, rgba(37,99,235,0.55) 35deg, transparent 90deg)",
        filter: "blur(8px)",
        transformOrigin: "center",
      }} />
      {/* Strobing siren sweep - red right */}
      <div className="siren-red" style={{
        position: "absolute", width: "70vw", height: "140vh",
        top: "-20vh", right: "-25vw",
        background: "conic-gradient(from 250deg at 50% 50%, transparent 0deg, rgba(220,38,38,0.55) 35deg, transparent 90deg)",
        filter: "blur(8px)",
        transformOrigin: "center",
      }} />

      {/* Core glow orbs - bright and saturated */}
      <div className="orb-pulse-blue" style={{
        position: "absolute", width: 620, height: 620, borderRadius: "50%",
        top: "-12%", left: "-10%",
        background: "radial-gradient(circle, rgba(37,99,235,0.85) 0%, rgba(37,99,235,0.25) 45%, transparent 75%)",
        filter: "blur(50px)",
      }} />
      <div className="orb-pulse-red" style={{
        position: "absolute", width: 620, height: 620, borderRadius: "50%",
        top: "-8%", right: "-12%",
        background: "radial-gradient(circle, rgba(220,38,38,0.85) 0%, rgba(220,38,38,0.25) 45%, transparent 75%)",
        filter: "blur(50px)",
      }} />
      <div className="orb-pulse-white" style={{
        position: "absolute", width: 480, height: 480, borderRadius: "50%",
        bottom: "-10%", left: "38%",
        background: "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)",
        filter: "blur(60px)",
      }} />

      {/* Flash overlay - the actual strobe flicker across whole screen */}
      <div className="strobe-flash" style={{
        position: "absolute", inset: 0,
      }} />

      <style>{`
        @keyframes sirenSweepBlue {
          0%, 100% { transform: rotate(0deg); opacity: 0.9; }
          50% { transform: rotate(8deg); opacity: 0.5; }
        }
        @keyframes sirenSweepRed {
          0%, 100% { transform: rotate(0deg); opacity: 0.5; }
          50% { transform: rotate(-8deg); opacity: 0.9; }
        }
        @keyframes orbFlashBlue {
          0%, 40%, 100% { opacity: 0.55; transform: scale(1); }
          20% { opacity: 1; transform: scale(1.12); }
        }
        @keyframes orbFlashRed {
          0%, 100% { opacity: 1; transform: scale(1.12); }
          20%, 60% { opacity: 0.5; transform: scale(1); }
          80% { opacity: 1; transform: scale(1.12); }
        }
        @keyframes orbFlashWhite {
          0%, 88% { opacity: 0; }
          92% { opacity: 0.9; }
          96% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes strobeFlicker {
          0%, 100% { background: rgba(37,99,235,0.05); }
          25% { background: rgba(220,38,38,0.06); }
          50% { background: rgba(37,99,235,0.04); }
          75% { background: rgba(220,38,38,0.07); }
          92% { background: rgba(255,255,255,0.08); }
        }
        .siren-blue { animation: sirenSweepBlue 3.2s ease-in-out infinite; }
        .siren-red { animation: sirenSweepRed 3.2s ease-in-out infinite; }
        .orb-pulse-blue { animation: orbFlashBlue 1.6s ease-in-out infinite; }
        .orb-pulse-red { animation: orbFlashRed 1.6s ease-in-out infinite; }
        .orb-pulse-white { animation: orbFlashWhite 4.8s ease-in-out infinite; }
        .strobe-flash { animation: strobeFlicker 2.4s linear infinite; }
      `}</style>
    </div>
  );
}

// ── Hero Page ────────────────────────────────────────────────────────────────
function HeroPage({ onEnter }) {
  const [hovered, setHovered] = useState(false);

  const features = [
    { Icon: Mic,      title: "Распознавание речи",  desc: "Whisper транскрибирует аудио с тайм-кодами", color: "#60a5fa", num: "01" },
    { Icon: Shield,   title: "Анализ нарушений",    desc: "LLM выявляет коррупцию, угрозы, нарушения этики", color: "#f87171", num: "02" },
    { Icon: Camera,   title: "Тех. контроль",       desc: "Обрывы записи, заглушение микрофона, окклюзия объектива", color: "#ffffff", num: "03" },
    { Icon: Lock,     title: "On-Premise режим",    desc: "Полностью локальный инференс внутри периметра МВД", color: "#60a5fa", num: "04" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#03050c", color: "#fff",
      fontFamily: "'Manrope', 'Segoe UI', sans-serif",
      position: "relative", overflowX: "hidden",
    }}>
      <SirenBg />

      {/* Nav */}
      <nav style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 48px",
        borderBottom: "1px solid rgba(96,165,250,0.15)",
        backdropFilter: "blur(6px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "linear-gradient(135deg, #2563eb, #dc2626)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 24px rgba(59,130,246,0.6), 0 0 24px rgba(239,68,68,0.3)",
          }}>
            <Eye size={19} color="#fff" />
          </div>
          <span style={{
            fontFamily: "'Exo 2', sans-serif",
            fontWeight: 800, fontSize: 19, letterSpacing: 0.5,
            textShadow: "0 0 20px rgba(96,165,250,0.5)",
          }}>Санарип Көз</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="live-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: 0.6 }}>
            СИСТЕМА АКТИВНА
          </span>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", padding: "100px 24px 80px",
      }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "7px 18px", borderRadius: 999,
          border: "1px solid rgba(96,165,250,0.5)",
          background: "rgba(37,99,235,0.12)",
          marginBottom: 36, fontSize: 13, color: "#93c5fd",
          fontFamily: "'Manrope', sans-serif", fontWeight: 600, letterSpacing: 0.6,
          boxShadow: "0 0 24px rgba(37,99,235,0.25), inset 0 0 12px rgba(37,99,235,0.1)",
        }}>
          <Shield size={14} />
          МВД · ЦИФРОВОЙ КОНТРОЛЬ И АУДИТ
        </div>

        {/* Title */}
        <h1 className="hero-title-glow" style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: "clamp(56px, 9vw, 104px)",
          fontWeight: 900,
          lineHeight: 0.98,
          letterSpacing: "-3px",
          margin: "0 0 4px",
          color: "#fff",
        }}>
          Санарип
        </h1>
        <h1 className="hero-title-glow-color" style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: "clamp(56px, 9vw, 104px)",
          fontWeight: 900,
          lineHeight: 0.98,
          letterSpacing: "-3px",
          margin: "0 0 36px",
          background: "linear-gradient(90deg, #60a5fa 0%, #ffffff 50%, #f87171 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          Көз
        </h1>

        <p style={{
          fontSize: "clamp(16px, 2.5vw, 22px)",
          color: "rgba(255,255,255,0.6)",
          maxWidth: 620, lineHeight: 1.7, margin: "0 0 56px",
          fontWeight: 400,
        }}>
          ИИ-платформа комплексного аудита записей бодикамер.<br />
          Автоматическое выявление нарушений, рисков коррупции и технических аномалий.
        </p>

        {/* CTA */}
        <button
          onClick={onEnter}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "19px 44px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.25)",
            cursor: "pointer", fontSize: 17, fontWeight: 800,
            background: hovered
              ? "linear-gradient(135deg, #3b82f6, #ef4444)"
              : "linear-gradient(135deg, #2563eb, #dc2626)",
            color: "#fff",
            transition: "all 0.25s ease",
            transform: hovered ? "scale(1.04) translateY(-3px)" : "scale(1)",
            boxShadow: hovered
              ? "0 0 70px rgba(59,130,246,0.6), 0 0 70px rgba(239,68,68,0.35), 0 20px 50px rgba(0,0,0,0.4)"
              : "0 0 40px rgba(59,130,246,0.4), 0 0 40px rgba(239,68,68,0.2)",
          }}
        >
          <Video size={20} />
          Начать анализ видео
          <ArrowRight size={20} />
        </button>
      </div>

      {/* Stats strip */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", justifyContent: "center", gap: 0,
        borderTop: "1px solid rgba(96,165,250,0.15)",
        borderBottom: "1px solid rgba(96,165,250,0.15)",
        margin: "0 0 100px",
        background: "rgba(255,255,255,0.015)",
        backdropFilter: "blur(4px)",
      }}>
        {[
          { val: "4", label: "Класса нарушений", color: "#60a5fa" },
          { val: "<10с", label: "Время анализа", color: "#fff" },
          { val: "100%", label: "Локальный режим", color: "#f87171" },
          { val: "99%", label: "Точность Whisper", color: "#60a5fa" },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, maxWidth: 200, textAlign: "center",
            padding: "32px 16px",
            borderRight: i < 3 ? "1px solid rgba(96,165,250,0.12)" : "none",
          }}>
            <div style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: 38, fontWeight: 800, color: s.color, letterSpacing: -1,
              textShadow: `0 0 20px ${s.color}66`,
            }}>{s.val}</div>
            <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginTop: 6, letterSpacing: 0.4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{
        position: "relative", zIndex: 10,
        maxWidth: 1040, margin: "0 auto", padding: "0 24px 130px",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 22,
      }}>
        {features.map(({ Icon: Ic, title, desc, color, num }, i) => (
          <div key={i} className="feature-card" style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)",
            border: `1px solid ${color}2e`,
            borderRadius: 20, padding: "26px 22px 24px",
            transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Corner accent brackets */}
            <div style={{
              position: "absolute", top: 12, right: 14,
              fontFamily: "'Exo 2', sans-serif", fontSize: 34, fontWeight: 800,
              color: `${color}1a`, lineHeight: 1, userSelect: "none",
            }}>
              {num}
            </div>
            <div style={{
              position: "absolute", top: 0, left: 0, width: 28, height: 28,
              borderTop: `2px solid ${color}88`, borderLeft: `2px solid ${color}88`,
              borderTopLeftRadius: 20,
            }} />
            <div style={{
              position: "absolute", bottom: 0, right: 0, width: 28, height: 28,
              borderBottom: `2px solid ${color}88`, borderRight: `2px solid ${color}88`,
              borderBottomRightRadius: 20,
            }} />

            <div className="feature-icon" style={{
              width: 50, height: 50, borderRadius: 14, marginBottom: 20,
              background: `${color}1c`,
              border: `1px solid ${color}50`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 28px ${color}2e`,
              transition: "all 0.35s ease",
            }}>
              <Ic size={23} color={color} strokeWidth={1.8} />
            </div>
            <div style={{
              fontFamily: "'Exo 2', sans-serif",
              fontWeight: 700, fontSize: 15.5, marginBottom: 9, color: "#fff",
              letterSpacing: 0.2,
            }}>{title}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.65 }}>{desc}</div>

            {/* Bottom accent line */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, height: 2, width: "30%",
              background: `linear-gradient(90deg, ${color}, transparent)`,
            }} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes livedotPulse {
          0%, 100% { box-shadow: 0 0 6px #22c55e; opacity: 1; }
          50% { box-shadow: 0 0 16px #22c55e; opacity: 0.6; }
        }
        @keyframes titleGlowWhite {
          0%, 100% { text-shadow: 0 0 30px rgba(255,255,255,0.3), 0 0 60px rgba(96,165,250,0.15); }
          50% { text-shadow: 0 0 50px rgba(255,255,255,0.5), 0 0 90px rgba(96,165,250,0.3); }
        }
        @keyframes titleGlowColor {
          0%, 100% { filter: drop-shadow(0 0 25px rgba(96,165,250,0.4)) drop-shadow(0 0 25px rgba(248,113,113,0.25)); }
          50% { filter: drop-shadow(0 0 45px rgba(96,165,250,0.6)) drop-shadow(0 0 45px rgba(248,113,113,0.4)); }
        }
        .live-dot { animation: livedotPulse 1.8s ease-in-out infinite; }
        .hero-title-glow { animation: titleGlowWhite 3s ease-in-out infinite; }
        .hero-title-glow-color { animation: titleGlowColor 3s ease-in-out infinite; }
        .feature-card:hover {
          transform: translateY(-6px);
          border-color: rgba(255,255,255,0.18) !important;
        }
        .feature-card:hover .feature-icon {
          transform: scale(1.08) rotate(-4deg);
        }
      `}</style>
    </div>
  );
}

// ── Upload Drop Zone ─────────────────────────────────────────────────────────
function DropZone({ onFile }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef(null);

  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      style={{
        width: "100%", aspectRatio: "16/7",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 16, cursor: "pointer", borderRadius: 20,
        border: `2px dashed ${drag ? "#3b82f6" : "rgba(255,255,255,0.12)"}`,
        background: drag ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.02)",
        transition: "all 0.25s ease",
        transform: drag ? "scale(1.01)" : "scale(1)",
      }}
    >
      <input ref={ref} type="file" accept="video/*" style={{ display: "none" }}
        onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); }} />

      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: drag ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.25s",
        boxShadow: drag ? "0 0 40px rgba(59,130,246,0.3)" : "none",
      }}>
        <FileVideo size={32} color={drag ? "#60a5fa" : "rgba(255,255,255,0.4)"} />
      </div>

      <div style={{ textAlign: "center" }}>
        <p style={{ fontWeight: 700, fontSize: 16, margin: "0 0 6px", color: drag ? "#93c5fd" : "#fff" }}>
          Перетащите видео сюда
        </p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
          или нажмите для выбора · MP4, MOV, AVI
        </p>
      </div>
    </div>
  );
}

// ── Loader ───────────────────────────────────────────────────────────────────
function Loader({ stageIdx, progress }) {
  const stage = LOADING_STAGES[Math.min(stageIdx, LOADING_STAGES.length - 1)];
  const StageIcon = stage.Icon;

  return (
    <div style={{
      width: "100%", aspectRatio: "16/7",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 24,
    }}>
      {/* Spinning ring */}
      <div style={{ position: "relative", width: 80, height: 80 }}>
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="40" cy="40" r="33" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
          <circle cx="40" cy="40" r="33" fill="none" stroke="url(#grad)" strokeWidth="5"
            strokeDasharray={`${2 * Math.PI * 33 * progress / 100} ${2 * Math.PI * 33}`}
            strokeLinecap="round" style={{ transition: "stroke-dasharray 0.7s ease" }}
          />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <StageIcon size={24} color="#60a5fa" />
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <p style={{
          fontWeight: 600, fontSize: 15, color: "#93c5fd", margin: "0 0 6px",
          animation: "pulse 2s ease-in-out infinite",
        }}>
          {stage.label}
        </p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>
          {Math.round(progress)}% завершено
        </p>
      </div>

      {/* Stage dots */}
      <div style={{ display: "flex", gap: 8 }}>
        {LOADING_STAGES.map((_, i) => (
          <div key={i} style={{
            width: i === stageIdx ? 24 : 8, height: 8, borderRadius: 4,
            background: i <= stageIdx ? "#3b82f6" : "rgba(255,255,255,0.12)",
            transition: "all 0.4s ease",
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Timeline ─────────────────────────────────────────────────────────────────
function Timeline({ incidents, duration, currentTime, onSeek, activeId }) {
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{ position: "relative", marginTop: 12 }}>
      {/* Track */}
      <div
        onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          onSeek(ratio * duration);
        }}
        style={{
          height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3,
          position: "relative", cursor: "pointer",
        }}
      >
        {/* Progress fill */}
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%", borderRadius: 3,
          width: `${pct}%`,
          background: "linear-gradient(90deg, #3b82f6, #ef4444)",
          transition: "width 0.1s linear",
        }} />

        {/* Playhead */}
        <div style={{
          position: "absolute", top: "50%", transform: "translate(-50%, -50%)",
          left: `${pct}%`,
          width: 14, height: 14, borderRadius: "50%",
          background: "#fff", border: "2px solid #3b82f6",
          boxShadow: "0 0 10px rgba(59,130,246,0.6)",
          transition: "left 0.1s linear",
          zIndex: 5,
        }} />
      </div>

      {/* Incident markers (on a separate row) */}
      <div style={{ position: "relative", height: 32, marginTop: 8 }}>
        {incidents.map(inc => {
          const meta = INCIDENT_META[inc.type] || INCIDENT_META.TECHNICAL_ANOMALY;
          const left = duration > 0 ? (tsToSeconds(inc.timestamp) / duration) * 100 : 0;
          const isActive = activeId === inc.id;

          return (
            <button
              key={inc.id}
              title={`${inc.timestamp} — ${inc.title}`}
              onClick={() => onSeek(tsToSeconds(inc.timestamp))}
              style={{
                position: "absolute",
                left: `${Math.min(left, 98)}%`,
                top: "50%", transform: "translate(-50%, -50%)",
                width: isActive ? 14 : 10,
                height: isActive ? 14 : 10,
                borderRadius: "50%",
                background: meta.color,
                border: isActive ? `2px solid #fff` : "none",
                boxShadow: isActive ? `0 0 14px ${meta.color}` : `0 0 6px ${meta.color}66`,
                cursor: "pointer",
                transition: "all 0.2s ease",
                zIndex: 4,
                padding: 0,
              }}
            />
          );
        })}
      </div>

      {/* Time labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>0:00</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
          {duration > 0 ? fmtTime(duration) : "--:--"}
        </span>
      </div>
    </div>
  );
}

// ── Incident Card ─────────────────────────────────────────────────────────────
function IncidentCard({ inc, isActive, onClick }) {
  const meta = INCIDENT_META[inc.type] || INCIDENT_META.TECHNICAL_ANOMALY;
  const sev = SEVERITY_META[inc.severity] || SEVERITY_META.LOW;
  const IconComp = meta.Icon;

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", textAlign: "left", padding: "14px 16px",
        borderRadius: 14,
        border: `1px solid ${isActive ? meta.color : meta.border}`,
        background: isActive ? meta.bg : "rgba(255,255,255,0.02)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        transform: isActive ? "scale(1.01)" : "scale(1)",
        boxShadow: isActive ? `0 4px 24px ${meta.color}22` : "none",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <IconComp size={14} color={meta.color} />
          <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {meta.shortLabel}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
            color: sev.color, background: sev.bg, border: `1px solid ${sev.color}55`,
          }}>
            {sev.label}
          </span>
          <span style={{ fontSize: 12, fontFamily: "monospace", color: "rgba(255,255,255,0.5)" }}>
            {inc.timestamp}
          </span>
        </div>
      </div>

      {/* Title */}
      <p style={{ margin: "0 0 4px", fontFamily: "'Exo 2', sans-serif", fontSize: 13.5, fontWeight: 700, color: "#fff" }}>{inc.title}</p>

      {/* Summary */}
      <p style={{
        margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.45)",
        lineHeight: 1.5,
        overflow: "hidden", display: "-webkit-box",
        WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
      }}>{inc.summary}</p>

      {/* Risk bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Риск</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: meta.color }}>{inc.risk_score}%</span>
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
          <div style={{
            height: "100%", borderRadius: 2, width: `${inc.risk_score}%`,
            background: `linear-gradient(90deg, ${meta.color}88, ${meta.color})`,
            transition: "width 0.8s ease",
          }} />
        </div>
      </div>
    </button>
  );
}

// ── Analysis Page ─────────────────────────────────────────────────────────────
function AnalysisPage({ onBack }) {
  const videoRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);

  const [loading, setLoading] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const tick = () => {
      if (i < LOADING_STAGES.length) {
        setStageIdx(i);
        setProgress(((i + 1) / LOADING_STAGES.length) * 92);
        i++;
        setTimeout(tick, 1600 + Math.random() * 800);
      }
    };
    tick();
  }, [loading]);

  const handleFile = useCallback(async file => {
    setError(null); setResult(null); setActiveId(null);
    setVideoUrl(URL.createObjectURL(file));
    setLoading(true); setStageIdx(0); setProgress(0);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(API_URL, { method: "POST", body: fd });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Ошибка сервера"); }
      const data = await res.json();
      setResult(data);
      setProgress(100);
      await new Promise(r => setTimeout(r, 500));
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const seekTo = useCallback(sec => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      videoRef.current.play();
      setPlaying(true);
    }
  }, []);

  const handleCardClick = useCallback(inc => {
    setActiveId(inc.id);
    seekTo(tsToSeconds(inc.timestamp));
  }, [seekTo]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  const filtered = result?.incidents?.filter(i => filter === "ALL" || i.type === filter) || [];
  const s = result?.summary;

  return (
    <div style={{
      minHeight: "100vh", background: "#03050c", color: "#fff",
      fontFamily: "'Manrope', 'Segoe UI', sans-serif",
      position: "relative",
    }}>
      <AmbientBg subtle />

      {/* Top bar */}
      <nav style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 32px",
        borderBottom: "1px solid rgba(96,165,250,0.15)",
        backdropFilter: "blur(12px)",
        background: "rgba(3,5,12,0.75)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={onBack} style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10, padding: "7px 16px", color: "rgba(255,255,255,0.6)",
            cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6,
            fontFamily: "'Manrope', sans-serif", fontWeight: 500,
            transition: "all 0.2s",
          }}>
            ← Назад
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: "linear-gradient(135deg, #2563eb, #dc2626)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 16px rgba(59,130,246,0.5)",
            }}>
              <Eye size={15} color="#fff" />
            </div>
            <span style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 800, fontSize: 16 }}>Санарип Көз</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "'Manrope', sans-serif" }}>/ Анализ видео</span>
          </div>
        </div>

        {s && (
          <div style={{ display: "flex", gap: 22 }}>
            {[
              { label: "Всего", val: s.total, color: "#fff" },
              { label: "Крит.", val: s.critical, color: "#ef4444" },
              { label: "Высок.", val: s.high, color: "#f97316" },
              { label: "Средн.", val: s.medium, color: "#facc15" },
            ].map((x, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: 20, fontWeight: 800, color: x.color,
                  textShadow: `0 0 14px ${x.color}55`,
                }}>{x.val}</div>
                <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: 0.4 }}>{x.label}</div>
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Main layout */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "grid",
        gridTemplateColumns: result ? "1fr 400px" : "1fr",
        gap: 0, minHeight: "calc(100vh - 61px)",
      }}>
        {/* Left: video + timeline */}
        <div style={{ padding: "28px 28px 28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Video area */}
          <div style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.015) 100%)",
            border: "1px solid rgba(96,165,250,0.18)",
            borderRadius: 20, overflow: "hidden",
            boxShadow: "0 0 40px rgba(37,99,235,0.08)",
          }}>
            {!videoUrl && !loading && <DropZone onFile={handleFile} />}
            {loading && <Loader stageIdx={stageIdx} progress={progress} />}

            {videoUrl && !loading && (
              <div>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  style={{ width: "100%", display: "block", maxHeight: 420, background: "#000" }}
                  onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                  onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                />
                <div style={{ padding: "16px 20px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <button onClick={togglePlay} style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.4)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", flexShrink: 0,
                    }}>
                      {playing
                        ? <Pause size={16} color="#60a5fa" />
                        : <Play size={16} color="#60a5fa" style={{ marginLeft: 2 }} />
                      }
                    </button>
                    <span style={{ fontFamily: "monospace", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                      {fmtTime(currentTime)} / {fmtTime(duration)}
                    </span>
                    {result && (
                      <span style={{ marginLeft: "auto", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                        {result.incidents.length} инцидентов найдено
                      </span>
                    )}
                  </div>
                  {result && (
                    <Timeline
                      incidents={result.incidents}
                      duration={duration}
                      currentTime={currentTime}
                      onSeek={seekTo}
                      activeId={activeId}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div style={{
              padding: "14px 18px", borderRadius: 14,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              display: "flex", alignItems: "center", gap: 10, color: "#fca5a5",
            }}>
              <AlertCircle size={16} />
              <span style={{ fontSize: 14 }}>{error}</span>
            </div>
          )}

          {/* Transcript */}
          {result?.transcript && (
            <div style={{
              background: "linear-gradient(160deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.015) 100%)",
              border: "1px solid rgba(96,165,250,0.15)",
              borderRadius: 16, padding: "18px 20px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Mic size={14} color="#60a5fa" />
                <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>
                  Транскрипция речи
                </span>
              </div>
              <div style={{ maxHeight: 140, overflowY: "auto", paddingRight: 8 }}>
                {result.segments?.length > 0
                  ? result.segments.map((seg, i) => (
                    <p key={i} style={{ margin: "0 0 6px", fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                      <span style={{ color: "#3b82f6", fontFamily: "monospace", marginRight: 8, fontSize: 11 }}>
                        [{fmtTime(seg.start)}]
                      </span>
                      {seg.text}
                    </p>
                  ))
                  : <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{result.transcript}</p>
                }
              </div>
            </div>
          )}

          {/* Reset */}
          {videoUrl && !loading && (
            <button onClick={() => {
              URL.revokeObjectURL(videoUrl);
              setVideoUrl(null); setResult(null); setError(null); setActiveId(null); setFilter("ALL");
            }} style={{
              alignSelf: "flex-start", background: "none",
              border: "none", color: "rgba(255,255,255,0.3)",
              cursor: "pointer", fontSize: 13, textDecoration: "underline",
            }}>
              ← Загрузить другое видео
            </button>
          )}
        </div>

        {/* Right: incident feed */}
        {result && (
          <div style={{
            borderLeft: "1px solid rgba(96,165,250,0.15)",
            padding: "28px 24px 28px 20px",
            display: "flex", flexDirection: "column", gap: 14,
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Radio size={14} color="#60a5fa" />
                  <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>
                    Лента инцидентов
                  </span>
                </div>
                <span style={{ fontSize: 12, color: "#3b82f6", fontFamily: "monospace" }}>
                  {filtered.length}/{result.incidents.length}
                </span>
              </div>

              {/* Filter pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {["ALL", ...Object.keys(INCIDENT_META)].map(key => {
                  const meta = key === "ALL" ? null : INCIDENT_META[key];
                  const active = filter === key;
                  return (
                    <button key={key} onClick={() => setFilter(key)} style={{
                      padding: "4px 10px", borderRadius: 999, fontSize: 11, cursor: "pointer",
                      border: `1px solid ${active ? (meta?.color || "#3b82f6") : "rgba(255,255,255,0.12)"}`,
                      background: active ? (meta ? meta.bg : "rgba(59,130,246,0.15)") : "transparent",
                      color: active ? (meta?.color || "#60a5fa") : "rgba(255,255,255,0.4)",
                      transition: "all 0.2s",
                    }}>
                      {key === "ALL" ? "Все" : meta.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", flex: 1 }}>
              {filtered.map(inc => (
                <IncidentCard key={inc.id} inc={inc} isActive={activeId === inc.id} onClick={() => handleCardClick(inc)} />
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 14, paddingTop: 40 }}>
                  Инцидентов не обнаружено
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
      `}</style>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("hero");

  if (page === "analysis") return <AnalysisPage onBack={() => setPage("hero")} />;
  return <HeroPage onEnter={() => setPage("analysis")} />;
}
