import React, { useState, useMemo } from "react";

/* ============================== Design tokens ============================== */
const C = {
  bg: "#12141C",
  panel: "#1A1D27",
  panelAlt: "#20242F",
  panelSoft: "#242836",
  border: "#2A2E3C",
  borderSoft: "#232733",
  text: "#EDEBE3",
  textMuted: "#9AA0B4",
  textFaint: "#6C7286",
  gold: "#C9A15A",
  goldLight: "#E3C98A",
  success: "#5FBE8D",
  warning: "#E2A857",
  danger: "#E1706B",
};
const SHADOW = "0 10px 32px rgba(0,0,0,0.38)";

const CATEGORIES = [
  { id: "torah", label: "לימוד תורה", color: "#6C8FD6", emoji: "📖" },
  { id: "work", label: "עבודה", color: "#5FB8C9", emoji: "💼" },
  { id: "study", label: "לימודים", color: "#A78BE0", emoji: "🎓" },
  { id: "homework", label: "שיעורי בית", color: "#D98F5C", emoji: "📝" },
  { id: "fitness", label: "כושר", color: "#5FBE8D", emoji: "💪" },
  { id: "personal", label: "פנאי", color: "#E2A857", emoji: "🌿" },
  { id: "rest", label: "מנוחה", color: "#7C8595", emoji: "😴" },
];
const catById = (id) => CATEGORIES.find((c) => c.id === id);

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06..23

/* ============================== Seed data ============================== */
function buildSlot(task = "", category = null, done = false) {
  return { task, category, done };
}

function seedSchedule() {
  const data = {};
  for (let d = 0; d < 7; d++) {
    data[d] = HOURS.map(() => buildSlot());
  }
  // Sun-Thu template: kollel seder in the morning, work, boxing, evening seder, homework drills
  const workday = {
    6: buildSlot("קימה + תפילת שחרית", "rest", true),
    7: buildSlot("סדר בוקר בכולל — לימוד תורה", "torah", true),
    8: buildSlot("סדר בוקר בכולל (המשך)", "torah", true),
    9: buildSlot("ארוחת בוקר + הפסקה", "personal", true),
    10: buildSlot("סדר שני בכולל — עיון וחברותא", "torah", false),
    11: buildSlot("סדר שני בכולל (המשך)", "torah", false),
    12: buildSlot("ארוחת צהריים", "personal", false),
    13: buildSlot("עבודה - משימות", "work", false),
    14: buildSlot("עבודה - פגישות / פרויקט", "work", false),
    15: buildSlot("עבודה - המשך", "work", false),
    16: buildSlot("אימון איגרוף בחדר כושר", "fitness", false),
    17: buildSlot("מקלחת + מנוחה קצרה", "rest", false),
    18: buildSlot("סדר ערב בכולל — לימוד תורה", "torah", false),
    19: buildSlot("ארוחת ערב", "personal", false),
    20: buildSlot("תרגילי איגרוף — שיעורי בית", "homework", false),
    21: buildSlot("זמן משפחה", "personal", false),
    22: buildSlot("סיכום יום + תכנון מחר", "work", false),
    23: buildSlot("שינה", "rest", false),
  };
  for (let d = 0; d <= 4; d++) {
    HOURS.forEach((h, idx) => {
      if (workday[h]) data[d][idx] = { ...workday[h] };
    });
  }
  // Friday (5) - shorter workday, short seder before Shabbat
  const friday = {
    6: buildSlot("קימה", "rest", true),
    7: buildSlot("סדר קצר בכולל לפני השבת", "torah", true),
    8: buildSlot("ארוחת בוקר", "personal", true),
    9: buildSlot("עבודה - סגירות לסופ״ש", "work", true),
    10: buildSlot("עבודה", "work", false),
    11: buildSlot("קניות לשבת", "personal", false),
    12: buildSlot("הכנות לשבת", "personal", false),
    13: buildSlot("ארוחת צהריים", "personal", false),
    14: buildSlot("מנוחה", "rest", false),
    18: buildSlot("קבלת שבת", "personal", false),
    19: buildSlot("ארוחת ערב חגיגית", "personal", false),
    21: buildSlot("זמן משפחה", "personal", false),
  };
  HOURS.forEach((h, idx) => {
    if (friday[h]) data[5][idx] = { ...friday[h] };
  });
  // Saturday (6) - Shabbat: prayer, Torah, family, rest
  const saturday = {
    8: buildSlot("קימה מאוחרת", "rest", true),
    9: buildSlot("ארוחת בוקר משפחתית + קידוש", "personal", true),
    10: buildSlot("תפילת שחרית ושיעור תורה בבית הכנסת", "torah", false),
    12: buildSlot("עיון בפרשת השבוע", "torah", false),
    13: buildSlot("ארוחת צהריים של שבת", "personal", false),
    16: buildSlot("טיול משפחתי בטבע", "fitness", false),
    19: buildSlot("משחקי קופסה + זמן משפחה", "personal", false),
    22: buildSlot("סיכום השבוע + תכנון קדימה", "work", false),
  };
  HOURS.forEach((h, idx) => {
    if (saturday[h]) data[6][idx] = { ...saturday[h] };
  });
  return data;
}

const WORKOUT_TYPES = [
  "ריצה",
  "איגרוף",
  "כוח - פלג גוף עליון",
  "כוח - פלג גוף תחתון",
  "יוגה",
  "שחייה",
  "אופניים",
  "הליכה / טיול",
  "אחר",
];
const TYPE_EMOJI = {
  "ריצה": "🏃",
  "איגרוף": "🥊",
  "כוח - פלג גוף עליון": "🏋️",
  "כוח - פלג גוף תחתון": "🏋️",
  "יוגה": "🧘",
  "שחייה": "🏊",
  "אופניים": "🚴",
  "הליכה / טיול": "🚶",
  "אחר": "✨",
};
const typeEmoji = (t) => TYPE_EMOJI[t] || "✨";

function seedWorkouts() {
  return [
    { id: 1, day: 0, type: "ריצה", duration: 30, detail: "5 ק״מ קלים", done: true },
    { id: 2, day: 1, type: "כוח - פלג גוף עליון", duration: 50, detail: "חזה + כתפים", done: true },
    { id: 3, day: 2, type: "איגרוף", duration: 45, detail: "שקית איגרוף + עבודת רגליים", done: false },
    { id: 4, day: 3, type: "כוח - פלג גוף תחתון", duration: 55, detail: "רגליים + ליבה", done: false },
    { id: 5, day: 4, type: "ריצה", duration: 35, detail: "6 ק״מ קצב", done: false },
    { id: 6, day: 6, type: "הליכה / טיול", duration: 60, detail: "טבע, קצב נינוח", done: false },
  ];
}

function seedFitnessVideos() {
  return [{ id: "M7lc1UVf-VE", title: "וידאו לדוגמה — הוסיפו קישור אימון משלכם" }];
}
function seedPlaylists() {
  return [{ id: "jNQXAC9IVRw", emoji: "🎵", title: "פלייליסט לדוגמה — הוסיפו קישור משלכם" }];
}

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
    /(?:youtu\.be\/)([^?&\s]+)/,
    /(?:youtube\.com\/embed\/)([^?&\s]+)/,
    /(?:youtube\.com\/live\/)([^?&\s]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  if (/^[a-zA-Z0-9_-]{6,20}$/.test(url.trim())) return url.trim();
  return null;
}

/* ============================== Small UI atoms ============================== */
function ProgressRing({ percent, size = 96, stroke = 10, color = C.gold, label, sub }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c - (clamped / 100) * c;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke={C.borderSoft} strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: size * 0.24, fontWeight: 700, color: C.text, fontFamily: "'Frank Ruhl Libre', serif" }}>
            {Math.round(clamped)}%
          </span>
        </div>
      </div>
      {label && <span style={{ fontSize: 13, color: C.textMuted, textAlign: "center" }}>{label}</span>}
      {sub && <span style={{ fontSize: 11, color: C.textFaint, textAlign: "center" }}>{sub}</span>}
    </div>
  );
}

function Bar({ percent, color = C.gold, height = 8 }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div style={{ width: "100%", height, borderRadius: height, background: C.borderSoft, overflow: "hidden" }}>
      <div
        style={{
          width: `${clamped}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${color}, ${color}CC)`,
          borderRadius: height,
          transition: "width 0.5s ease",
        }}
      />
    </div>
  );
}

function Card({ children, style = {}, padding = 20, accent = false }) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding,
        boxShadow: SHADOW,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {accent && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`,
          }}
        />
      )}
      {children}
    </div>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 26, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`, flexShrink: 0 }} />
        <h2
          style={{
            fontFamily: "'Frank Ruhl Libre', serif",
            fontSize: 22,
            fontWeight: 600,
            color: C.text,
            margin: 0,
          }}
        >
          {children}
        </h2>
      </div>
      {sub && <p style={{ margin: "6px 0 0", fontSize: 13, color: C.textMuted }}>{sub}</p>}
    </div>
  );
}

function Chip({ active, color, onClick, children, small }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1px solid ${active ? color : C.border}`,
        background: active ? `${color}22` : "transparent",
        color: active ? color : C.textMuted,
        borderRadius: 999,
        padding: small ? "4px 10px" : "6px 14px",
        fontSize: small ? 12 : 13,
        cursor: "pointer",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

/* ============================== Main App ============================== */
export default function SelfDisciplineHub() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [scheduleData, setScheduleData] = useState(seedSchedule);
  const todayIdx = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(todayIdx);

  const [workouts, setWorkouts] = useState(seedWorkouts);
  const [goal, setGoal] = useState({ sessions: 4, minutes: 150 });

  const [fitnessVideos, setFitnessVideos] = useState(seedFitnessVideos);
  const [selectedFitnessVideo, setSelectedFitnessVideo] = useState(seedFitnessVideos()[0].id);
  const [newFitnessLink, setNewFitnessLink] = useState("");
  const [newFitnessTitle, setNewFitnessTitle] = useState("");

  const [playlists, setPlaylists] = useState(seedPlaylists);
  const [selectedPlaylist, setSelectedPlaylist] = useState(seedPlaylists()[0].id);
  const [newMusicLink, setNewMusicLink] = useState("");
  const [newMusicTitle, setNewMusicTitle] = useState("");

  /* ---------- schedule helpers ---------- */
  const updateSlot = (dayIdx, hourIdx, patch) => {
    setScheduleData((prev) => {
      const next = { ...prev };
      next[dayIdx] = next[dayIdx].map((slot, i) => (i === hourIdx ? { ...slot, ...patch } : slot));
      return next;
    });
  };

  const dayStats = (dayIdx) => {
    const slots = scheduleData[dayIdx];
    const planned = slots.filter((s) => s.task.trim() !== "");
    const done = planned.filter((s) => s.done);
    const catHours = {};
    planned.forEach((s) => {
      const key = s.category || "other";
      catHours[key] = (catHours[key] || 0) + 1;
    });
    return {
      plannedCount: planned.length,
      doneCount: done.length,
      percent: planned.length ? (done.length / planned.length) * 100 : 0,
      catHours,
    };
  };

  const weekStats = useMemo(() => {
    let totalPlanned = 0;
    let totalDone = 0;
    const catTotals = {};
    const dailyPercents = [];
    for (let d = 0; d < 7; d++) {
      const s = dayStats(d);
      totalPlanned += s.plannedCount;
      totalDone += s.doneCount;
      dailyPercents.push(s.percent);
      Object.entries(s.catHours).forEach(([k, v]) => {
        catTotals[k] = (catTotals[k] || 0) + v;
      });
    }
    return {
      totalPlanned,
      totalDone,
      percent: totalPlanned ? (totalDone / totalPlanned) * 100 : 0,
      catTotals,
      dailyPercents,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleData]);

  const today = dayStats(todayIdx);

  /* ---------- workout helpers ---------- */
  const addWorkout = () => {
    const id = Math.max(0, ...workouts.map((w) => w.id)) + 1;
    setWorkouts([...workouts, { id, day: todayIdx, type: WORKOUT_TYPES[0], duration: 30, detail: "", done: false }]);
  };
  const updateWorkout = (id, patch) => setWorkouts(workouts.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  const deleteWorkout = (id) => setWorkouts(workouts.filter((w) => w.id !== id));

  const workoutStats = useMemo(() => {
    const sessions = workouts.length;
    const doneSessions = workouts.filter((w) => w.done).length;
    const minutes = workouts.reduce((a, w) => a + Number(w.duration || 0), 0);
    const doneMinutes = workouts.filter((w) => w.done).reduce((a, w) => a + Number(w.duration || 0), 0);
    return {
      sessions,
      doneSessions,
      minutes,
      doneMinutes,
      sessionsPct: goal.sessions ? (doneSessions / goal.sessions) * 100 : 0,
      minutesPct: goal.minutes ? (doneMinutes / goal.minutes) * 100 : 0,
    };
  }, [workouts, goal]);

  /* ---------- media helpers ---------- */
  const addFitnessVideo = () => {
    const id = extractYouTubeId(newFitnessLink);
    if (!id) return;
    setFitnessVideos([...fitnessVideos, { id, title: newFitnessTitle.trim() || "וידאו כושר" }]);
    setSelectedFitnessVideo(id);
    setNewFitnessLink("");
    setNewFitnessTitle("");
  };
  const addPlaylist = () => {
    const id = extractYouTubeId(newMusicLink);
    if (!id) return;
    setPlaylists([...playlists, { id, emoji: "🎧", title: newMusicTitle.trim() || "פלייליסט" }]);
    setSelectedPlaylist(id);
    setNewMusicLink("");
    setNewMusicTitle("");
  };

  const NAV = [
    { id: "dashboard", label: "סקירה", icon: "🏠" },
    { id: "schedule", label: "לו״ז", icon: "🗓️" },
    { id: "fitness", label: "כושר", icon: "🥊" },
    { id: "music", label: "מוזיקה", icon: "🎵" },
  ];

  const todayLabel = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div
      dir="rtl"
      className="app-shell"
      style={{
        fontFamily: "'Assistant', sans-serif",
        background: `radial-gradient(circle at 15% 0%, #1B1E2A 0%, ${C.bg} 55%)`,
        color: C.text,
        minHeight: "100vh",
        display: "flex",
        width: "100%",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;600;700&family=Assistant:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input, select { font-family: 'Assistant', sans-serif; outline: none; }
        input::placeholder { color: ${C.textFaint}; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: ${C.borderSoft}; border-radius: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        button { font-family: 'Assistant', sans-serif; }

        /* ---- Mobile responsive layout ---- */
        @media (max-width: 820px) {
          .app-shell { flex-direction: column; }
          .sidebar {
            width: 100% !important;
            min-width: 0 !important;
            border-inline-start: none !important;
            border-bottom: 1px solid ${C.border};
            padding: 16px 16px !important;
            gap: 16px !important;
          }
          .sidebar-nav { flex-direction: row !important; flex-wrap: wrap; }
          .main-content { padding: 18px 16px !important; }
          .two-col-grid, .schedule-grid, .video-grid { grid-template-columns: 1fr !important; }
          .kpi-grid, .fitness-kpi-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .kpi-grid, .fitness-kpi-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Sidebar */}
      <aside
        className="sidebar"
        style={{
          width: 220,
          minWidth: 220,
          borderInlineStart: `1px solid ${C.border}`,
          padding: "28px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: C.gold, fontSize: 16 }}>✡</span>
            <span style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 19, fontWeight: 700, color: C.goldLight }}>
              משמעת עצמית
            </span>
          </div>
          <div style={{ fontSize: 12, color: C.textFaint, marginTop: 4 }}>ניהול זמן, תורה וכושר אישי</div>
        </div>

        <nav className="sidebar-nav" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setActiveTab(n.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                textAlign: "right",
                background: activeTab === n.id ? C.panelSoft : "transparent",
                color: activeTab === n.id ? C.goldLight : C.textMuted,
                fontSize: 14,
                fontWeight: activeTab === n.id ? 600 : 500,
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: 15 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: "auto" }}>
          <Card padding={14} style={{ background: C.panelAlt }}>
            <div style={{ fontSize: 12, color: C.textFaint, marginBottom: 6 }}>היום</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{DAYS[todayIdx]}</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{todayLabel}</div>
            <div style={{ marginTop: 10 }}>
              <Bar percent={today.percent} color={C.gold} />
              <div style={{ fontSize: 11, color: C.textFaint, marginTop: 4 }}>
                {today.doneCount}/{today.plannedCount} משימות הושלמו
              </div>
            </div>
          </Card>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content" style={{ flex: 1, padding: "28px 32px", overflowX: "hidden" }}>
        {activeTab === "dashboard" && (
          <DashboardTab today={today} weekStats={weekStats} workoutStats={workoutStats} goal={goal} />
        )}
        {activeTab === "schedule" && (
          <ScheduleTab
            scheduleData={scheduleData}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            updateSlot={updateSlot}
            dayStats={dayStats}
            todayIdx={todayIdx}
          />
        )}
        {activeTab === "fitness" && (
          <FitnessTab
            workouts={workouts}
            addWorkout={addWorkout}
            updateWorkout={updateWorkout}
            deleteWorkout={deleteWorkout}
            goal={goal}
            setGoal={setGoal}
            workoutStats={workoutStats}
            videos={fitnessVideos}
            selectedVideo={selectedFitnessVideo}
            setSelectedVideo={setSelectedFitnessVideo}
            newLink={newFitnessLink}
            setNewLink={setNewFitnessLink}
            newTitle={newFitnessTitle}
            setNewTitle={setNewFitnessTitle}
            addVideo={addFitnessVideo}
          />
        )}
        {activeTab === "music" && (
          <MusicTab
            playlists={playlists}
            selected={selectedPlaylist}
            setSelected={setSelectedPlaylist}
            newLink={newMusicLink}
            setNewLink={setNewMusicLink}
            newTitle={newMusicTitle}
            setNewTitle={setNewMusicTitle}
            addPlaylist={addPlaylist}
          />
        )}
      </main>
    </div>
  );
}

/* ============================== Dashboard Tab ============================== */
function DashboardTab({ today, weekStats, workoutStats, goal }) {
  const catList = Object.entries(weekStats.catTotals).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(1, ...catList.map(([, v]) => v));

  return (
    <div>
      <SectionTitle sub="תמונת מצב יומית ושבועית של הזמן, התורה והכושר">משמעת עצמית</SectionTitle>

      <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        <Card accent>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ProgressRing percent={today.percent} label="עמידה היום" sub={`${today.doneCount}/${today.plannedCount} משימות`} color={C.gold} />
          </div>
        </Card>
        <Card accent>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ProgressRing percent={weekStats.percent} label="עמידה שבועית" sub={`${weekStats.totalDone}/${weekStats.totalPlanned} משימות`} color={C.success} />
          </div>
        </Card>
        <Card accent>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ProgressRing
              percent={workoutStats.sessionsPct}
              label="💪 יעד כושר"
              sub={`${workoutStats.doneSessions}/${goal.sessions} הושלמו`}
              color={catById("fitness").color}
            />
          </div>
        </Card>
        <Card accent>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ProgressRing
              percent={workoutStats.minutesPct}
              label="דקות אימון"
              sub={`${workoutStats.doneMinutes}/${goal.minutes} דק׳`}
              color={C.warning}
            />
          </div>
        </Card>
      </div>

      <div className="two-col-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>חלוקת שעות שבועית לפי קטגוריה</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {catList.length === 0 && <div style={{ color: C.textFaint, fontSize: 13 }}>עדיין לא הוזנו משימות</div>}
            {catList.map(([id, val]) => {
              const cat = catById(id) || { label: "אחר", color: C.textFaint, emoji: "•" };
              return (
                <div key={id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: C.textMuted }}>
                      {cat.emoji} {cat.label}
                    </span>
                    <span style={{ color: C.text, fontWeight: 600 }}>{val} שעות</span>
                  </div>
                  <Bar percent={(val / maxCat) * 100} color={cat.color} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>מגמת עמידה שבועית</div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
            {weekStats.dailyPercents.map((p, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
                <ProgressRing percent={p} size={54} stroke={6} color={C.gold} />
                <span style={{ fontSize: 11, color: C.textFaint }}>{DAYS[i].slice(0, 2)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================== Schedule Tab ============================== */
function ScheduleTab({ scheduleData, selectedDay, setSelectedDay, updateSlot, dayStats, todayIdx }) {
  const stats = dayStats(selectedDay);
  const slots = scheduleData[selectedDay];

  return (
    <div>
      <SectionTitle sub="תיעוד שעתי, סימון V והשוואת מתוכנן לבפועל">לוח זמנים</SectionTitle>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {DAYS.map((d, i) => (
          <Chip key={i} active={selectedDay === i} color={i === todayIdx ? C.gold : "#6E9FE0"} onClick={() => setSelectedDay(i)}>
            {d} {i === todayIdx && "· היום"}
          </Chip>
        ))}
      </div>

      <div className="schedule-grid" style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 16 }}>
        <Card padding={0} style={{ overflow: "hidden" }}>
          <div style={{ maxHeight: 640, overflowY: "auto", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.panelAlt, position: "sticky", top: 0 }}>
                  <th style={thStyle}>שעה</th>
                  <th style={thStyle}>משימה</th>
                  <th style={{ ...thStyle, width: 150 }}>קטגוריה</th>
                  <th style={{ ...thStyle, width: 54, textAlign: "center" }}>V</th>
                </tr>
              </thead>
              <tbody>
                {HOURS.map((h, idx) => {
                  const slot = slots[idx];
                  const cat = slot.category ? catById(slot.category) : null;
                  return (
                    <tr key={h} style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                      <td style={{ ...tdStyle, color: C.textFaint, fontWeight: 600, width: 64 }}>
                        {String(h).padStart(2, "0")}:00
                      </td>
                      <td style={tdStyle}>
                        <input
                          value={slot.task}
                          onChange={(e) => updateSlot(selectedDay, idx, { task: e.target.value })}
                          placeholder="הוסיפו משימה..."
                          style={{
                            width: "100%",
                            background: "transparent",
                            border: "none",
                            color: C.text,
                            fontSize: 13,
                            padding: "4px 0",
                          }}
                        />
                      </td>
                      <td style={tdStyle}>
                        <select
                          value={slot.category || ""}
                          onChange={(e) => updateSlot(selectedDay, idx, { category: e.target.value || null })}
                          style={{
                            width: "100%",
                            background: cat ? `${cat.color}1A` : "transparent",
                            border: `1px solid ${cat ? cat.color : C.border}`,
                            color: cat ? cat.color : C.textFaint,
                            fontSize: 12,
                            borderRadius: 8,
                            padding: "4px 6px",
                          }}
                        >
                          <option value="">—</option>
                          {CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id} style={{ color: "#000" }}>
                              {c.emoji} {c.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <button
                          disabled={!slot.task.trim()}
                          onClick={() => updateSlot(selectedDay, idx, { done: !slot.done })}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            border: `1px solid ${slot.done ? C.success : C.border}`,
                            background: slot.done ? `${C.success}26` : "transparent",
                            color: slot.done ? C.success : C.textFaint,
                            cursor: slot.task.trim() ? "pointer" : "not-allowed",
                            opacity: slot.task.trim() ? 1 : 0.4,
                            fontSize: 13,
                          }}
                        >
                          ✓
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card accent>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 10 }}>סיכום יום — {DAYS[selectedDay]}</div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <ProgressRing percent={stats.percent} size={110} color={C.gold} />
            </div>
            <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between", color: C.textMuted }}>
              <span>מתוכנן</span>
              <span style={{ color: C.text, fontWeight: 600 }}>{stats.plannedCount} שעות</span>
            </div>
            <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between", color: C.textMuted, marginTop: 4 }}>
              <span>בוצע בפועל</span>
              <span style={{ color: C.success, fontWeight: 600 }}>{stats.doneCount} שעות</span>
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 10 }}>פירוט לפי קטגוריה</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(stats.catHours).length === 0 && (
                <span style={{ fontSize: 12, color: C.textFaint }}>אין נתונים ליום זה</span>
              )}
              {Object.entries(stats.catHours).map(([id, val]) => {
                const cat = catById(id) || { label: "אחר", color: C.textFaint, emoji: "•" };
                return (
                  <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{cat.emoji}</span>
                      {cat.label}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{val} שעות</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const thStyle = { textAlign: "right", padding: "10px 12px", fontSize: 12, color: C.textFaint, fontWeight: 600 };
const tdStyle = { padding: "6px 12px", verticalAlign: "middle" };

/* ============================== Fitness Tab ============================== */
function FitnessTab({
  workouts,
  addWorkout,
  updateWorkout,
  deleteWorkout,
  goal,
  setGoal,
  workoutStats,
  videos,
  selectedVideo,
  setSelectedVideo,
  newLink,
  setNewLink,
  newTitle,
  setNewTitle,
  addVideo,
}) {
  return (
    <div>
      <SectionTitle sub="מעקב אימונים, יעדים שבועיים וסרטוני כושר">אזור כושר</SectionTitle>

      <div className="fitness-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        <Card accent>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ProgressRing percent={workoutStats.sessionsPct} color={C.success} label="כושר" sub={`${workoutStats.doneSessions}/${goal.sessions}`} />
          </div>
        </Card>
        <Card accent>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ProgressRing percent={workoutStats.minutesPct} color={C.warning} label="דקות" sub={`${workoutStats.doneMinutes}/${goal.minutes}`} />
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 10 }}>עריכת יעד שבועי</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ fontSize: 12, color: C.textFaint, display: "flex", justifyContent: "space-between" }}>
              מספר פעילויות כושר
              <input
                type="number"
                value={goal.sessions}
                onChange={(e) => setGoal({ ...goal, sessions: Number(e.target.value) })}
                style={numInputStyle}
              />
            </label>
            <label style={{ fontSize: 12, color: C.textFaint, display: "flex", justifyContent: "space-between" }}>
              דקות סה״כ
              <input
                type="number"
                value={goal.minutes}
                onChange={(e) => setGoal({ ...goal, minutes: Number(e.target.value) })}
                style={numInputStyle}
              />
            </label>
          </div>
        </Card>
      </div>

      <Card padding={0} style={{ marginBottom: 20, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px" }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>טבלת כושר</div>
          <button onClick={addWorkout} style={addBtnStyle}>+ הוספת אימון</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.panelAlt }}>
              <th style={thStyle}>יום</th>
              <th style={thStyle}>סוג אימון</th>
              <th style={thStyle}>משך (דק׳)</th>
              <th style={thStyle}>פרטים</th>
              <th style={{ ...thStyle, textAlign: "center" }}>הושלם</th>
              <th style={{ ...thStyle, width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {workouts.map((w) => (
              <tr key={w.id} style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                <td style={tdStyle}>
                  <select value={w.day} onChange={(e) => updateWorkout(w.id, { day: Number(e.target.value) })} style={selectMini}>
                    {DAYS.map((d, i) => (
                      <option key={i} value={i} style={{ color: "#000" }}>
                        {d}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={tdStyle}>
                  <select value={w.type} onChange={(e) => updateWorkout(w.id, { type: e.target.value })} style={selectMini}>
                    {WORKOUT_TYPES.map((t) => (
                      <option key={t} value={t} style={{ color: "#000" }}>
                        {typeEmoji(t)} {t}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={tdStyle}>
                  <input
                    type="number"
                    value={w.duration}
                    onChange={(e) => updateWorkout(w.id, { duration: Number(e.target.value) })}
                    style={{ ...numInputStyle, width: 64 }}
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    value={w.detail}
                    onChange={(e) => updateWorkout(w.id, { detail: e.target.value })}
                    placeholder="פרטים..."
                    style={{ width: "100%", background: "transparent", border: "none", color: C.text, fontSize: 13 }}
                  />
                </td>
                <td style={{ ...tdStyle, textAlign: "center" }}>
                  <button
                    onClick={() => updateWorkout(w.id, { done: !w.done })}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      border: `1px solid ${w.done ? C.success : C.border}`,
                      background: w.done ? `${C.success}26` : "transparent",
                      color: w.done ? C.success : C.textFaint,
                      cursor: "pointer",
                    }}
                  >
                    ✓
                  </button>
                </td>
                <td style={{ ...tdStyle, textAlign: "center" }}>
                  <button
                    onClick={() => deleteWorkout(w.id)}
                    style={{ border: "none", background: "transparent", color: C.danger, cursor: "pointer", fontSize: 14 }}
                    title="מחיקה"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>סרטוני כושר</div>
        <div className="video-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
          <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 12, overflow: "hidden", background: "#000" }}>
            <iframe
              title="fitness-video"
              src={`https://www.youtube.com/embed/${selectedVideo}`}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
              {videos.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVideo(v.id)}
                  style={{
                    textAlign: "right",
                    border: `1px solid ${selectedVideo === v.id ? C.gold : C.border}`,
                    background: selectedVideo === v.id ? `${C.gold}1A` : "transparent",
                    color: selectedVideo === v.id ? C.goldLight : C.textMuted,
                    borderRadius: 10,
                    padding: "8px 10px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  ▶ {v.title}
                </button>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${C.borderSoft}`, paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              <input
                placeholder="הדביקו קישור YouTube"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                style={smallInputStyle}
              />
              <input
                placeholder="כותרת (אופציונלי)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                style={smallInputStyle}
              />
              <button onClick={addVideo} style={addBtnStyle}>+ הוספת סרטון</button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

const numInputStyle = {
  width: 56,
  background: C.panelAlt,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  color: C.text,
  padding: "4px 8px",
  fontSize: 13,
  textAlign: "center",
};
const selectMini = {
  background: "transparent",
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  color: C.text,
  fontSize: 12,
  padding: "4px 6px",
};
const addBtnStyle = {
  border: `1px solid ${C.gold}`,
  background: `${C.gold}1A`,
  color: C.goldLight,
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: 12,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
const smallInputStyle = {
  background: C.panelAlt,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  color: C.text,
  padding: "6px 10px",
  fontSize: 12,
};

/* ============================== Music Tab ============================== */
function MusicTab({ playlists, selected, setSelected, newLink, setNewLink, newTitle, setNewTitle, addPlaylist }) {
  const current = playlists.find((p) => p.id === selected) || playlists[0];
  return (
    <div>
      <SectionTitle sub="פלייליסטים ורקע מוזיקלי לעבודה ולאימון">מוזיקה</SectionTitle>

      <div className="video-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
        <Card padding={0} style={{ overflow: "hidden" }}>
          <div style={{ position: "relative", paddingTop: "56.25%", background: "#000" }}>
            <iframe
              title="music-player"
              src={`https://www.youtube.com/embed/${selected}`}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>{current?.emoji || "🎵"}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{current?.title}</div>
              <div style={{ fontSize: 12, color: C.textFaint }}>מתנגן כרגע</div>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>הפלייליסטים שלי</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
            {playlists.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textAlign: "right",
                  border: `1px solid ${selected === p.id ? C.gold : C.border}`,
                  background: selected === p.id ? `${C.gold}1A` : "transparent",
                  color: selected === p.id ? C.goldLight : C.textMuted,
                  borderRadius: 10,
                  padding: "8px 10px",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 16 }}>{p.emoji}</span>
                {p.title}
              </button>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${C.borderSoft}`, marginTop: 12, paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            <input
              placeholder="הדביקו קישור YouTube (שיר/פלייליסט)"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              style={smallInputStyle}
            />
            <input
              placeholder="כותרת (אופציונלי)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={smallInputStyle}
            />
            <button onClick={addPlaylist} style={addBtnStyle}>+ הוספת פלייליסט</button>
          </div>
        </Card>
      </div>
    </div>
  );
}
