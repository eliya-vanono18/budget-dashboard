import React, { useState, useMemo } from "react";
import {
  LayoutDashboard,
  FileBarChart2,
  Settings,
  Plus,
  X,
  Menu,
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart as PieIcon,
  CreditCard,
  Banknote,
  Landmark,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

/* ---------------------------------------------------------
   Mock Data
--------------------------------------------------------- */
const CATEGORY_COLORS = {
  "מגורים": "#8B5CF6",
  "מזון": "#C4B5FD",
  "תחבורה": "#A78BFA",
  "בילויים": "#DDD6FE",
  "בריאות": "#6D28D9",
  "אחר": "#EDE9FE",
};

const PAYMENT_ICONS = {
  "אשראי": CreditCard,
  "מזומן": Banknote,
  "העברה בנקאית": Landmark,
};

const INITIAL_TRANSACTIONS = [
  { id: 1, date: "2026-09-10", desc: "שכר עבודה - חברת טכנולוגיה", category: "הכנסה", amount: 15200, type: "income", payment: "העברה בנקאית" },
  { id: 2, date: "2026-09-09", desc: "שכירות דירה", category: "מגורים", amount: -4200, type: "expense", payment: "העברה בנקאית" },
  { id: 3, date: "2026-09-08", desc: "סופרמרקט שופרסל", category: "מזון", amount: -640, type: "expense", payment: "אשראי" },
  { id: 4, date: "2026-09-07", desc: "דלק - פז", category: "תחבורה", amount: -320, type: "expense", payment: "אשראי" },
  { id: 5, date: "2026-09-05", desc: "קולנוע ומסעדה", category: "בילויים", amount: -280, type: "expense", payment: "מזומן" },
  { id: 6, date: "2026-09-03", desc: "קופת חולים - תרופות", category: "בריאות", amount: -150, type: "expense", payment: "אשראי" },
  { id: 7, date: "2026-09-01", desc: "עבודה פרילנס", category: "הכנסה", amount: 2300, type: "income", payment: "העברה בנקאית" },
  { id: 8, date: "2026-08-29", desc: "מנוי חדר כושר", category: "אחר", amount: -180, type: "expense", payment: "אשראי" },
];

const MONTHLY_HISTORY = [
  { month: "אפר׳", הכנסות: 16400, הוצאות: 11200 },
  { month: "מאי", הכנסות: 15800, הוצאות: 12500 },
  { month: "יונ׳", הכנסות: 17200, הוצאות: 10800 },
  { month: "יול׳", הכנסות: 16900, הוצאות: 13100 },
  { month: "אוג׳", הכנסות: 15500, הוצאות: 12900 },
  { month: "ספט׳", הכנסות: 17500, הוצאות: 5770 },
];

const BUDGET_LIMITS = {
  "מגורים": 4500,
  "מזון": 2000,
  "תחבורה": 1000,
  "בילויים": 800,
  "בריאות": 500,
  "אחר": 400,
};

const NAV_ITEMS = [
  { id: "dashboard", label: "דשבורד", icon: LayoutDashboard },
  { id: "report", label: "דוח הכנסות/הוצאות", icon: FileBarChart2 },
  { id: "settings", label: "הגדרות תקציב", icon: Settings },
];

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */
const formatILS = (num) =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(num);

const formatDate = (d) =>
  new Date(d).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });

/* ---------------------------------------------------------
   Reusable UI pieces
--------------------------------------------------------- */
function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-[0_4px_20px_rgba(124,58,237,0.08)] p-5 ${className}`}>
      {children}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, tone = "neutral", sub }) {
  const toneMap = {
    positive: "text-emerald-600 bg-emerald-50",
    negative: "text-rose-600 bg-rose-50",
    neutral: "text-violet-600 bg-violet-50",
  };
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${toneMap[tone]}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="text-2xl font-semibold text-gray-800">{value}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </Card>
  );
}

/* ---------------------------------------------------------
   Modal: Add Transaction
--------------------------------------------------------- */
function TransactionModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    desc: "",
    category: "מזון",
    amount: "",
    type: "expense",
    payment: "אשראי",
  });

  const categories = form.type === "income" ? ["הכנסה"] : Object.keys(CATEGORY_COLORS);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.desc || !form.amount) return;
    const numericAmount = Math.abs(Number(form.amount));
    onSave({
      id: Date.now(),
      date: form.date,
      desc: form.desc,
      category: form.type === "income" ? "הכנסה" : form.category,
      amount: form.type === "income" ? numericAmount : -numericAmount,
      type: form.type,
      payment: form.payment,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute left-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
        <h3 className="text-lg font-semibold text-gray-800 mb-5">הוספת תנועה חדשה</h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: "expense", category: "מזון" }))}
              className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                form.type === "expense" ? "bg-violet-600 text-white" : "bg-violet-50 text-violet-600"
              }`}
            >
              הוצאה
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: "income", category: "הכנסה" }))}
              className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                form.type === "income" ? "bg-violet-600 text-white" : "bg-violet-50 text-violet-600"
              }`}
            >
              הכנסה
            </button>
          </div>

          <label className="flex flex-col gap-1 text-sm text-gray-600">
            תיאור
            <input
              type="text"
              value={form.desc}
              onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
              placeholder="לדוגמה: קניות בסופר"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm text-gray-600">
              סכום (₪)
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
                placeholder="0"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-600">
              תאריך
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm text-gray-600">
              קטגוריה
              <select
                value={form.category}
                disabled={form.type === "income"}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:bg-gray-50 disabled:text-gray-400"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-600">
              אמצעי תשלום
              <select
                value={form.payment}
                onChange={(e) => setForm((f) => ({ ...f, payment: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
              >
                {Object.keys(PAYMENT_ICONS).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="submit"
            className="mt-2 bg-violet-600 hover:bg-violet-700 transition-colors text-white rounded-xl py-2.5 font-medium"
          >
            שמור תנועה
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Transactions Table
--------------------------------------------------------- */
function TransactionsTable({ transactions }) {
  return (
    <Card>
      <h3 className="text-base font-semibold text-gray-800 mb-4">תנועות אחרונות</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100">
              <th className="py-2 font-medium">תאריך</th>
              <th className="py-2 font-medium">תיאור</th>
              <th className="py-2 font-medium">קטגוריה</th>
              <th className="py-2 font-medium">אמצעי תשלום</th>
              <th className="py-2 font-medium">סכום</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => {
              const PayIcon = PAYMENT_ICONS[t.payment] || CreditCard;
              return (
                <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-violet-50/40 transition-colors">
                  <td className="py-3 text-gray-500">{formatDate(t.date)}</td>
                  <td className="py-3 text-gray-700">{t.desc}</td>
                  <td className="py-3">
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[t.category] || "#EDE9FE"}33`,
                        color: CATEGORY_COLORS[t.category] || "#7C3AED",
                      }}
                    >
                      {t.category}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <PayIcon size={14} />
                      {t.payment}
                    </div>
                  </td>
                  <td className={`py-3 font-medium ${t.amount > 0 ? "text-emerald-600" : "text-gray-700"}`}>
                    {t.amount > 0 ? "+" : ""}
                    {formatILS(t.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------
   Dashboard View
--------------------------------------------------------- */
function DashboardView({ transactions, totals, categoryData }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={TrendingUp} label="סך הכנסות" value={formatILS(totals.income)} tone="positive" sub="החודש הנוכחי" />
        <KpiCard icon={TrendingDown} label="סך הוצאות" value={formatILS(totals.expense)} tone="negative" sub="החודש הנוכחי" />
        <KpiCard icon={Wallet} label="מאזן נטו" value={formatILS(totals.balance)} tone={totals.balance >= 0 ? "positive" : "negative"} sub="הכנסות פחות הוצאות" />
        <KpiCard
          icon={PieIcon}
          label="ניצול תקציב"
          value={`${totals.budgetUsedPct}%`}
          tone={totals.budgetUsedPct > 100 ? "negative" : "neutral"}
          sub={`מתוך ${formatILS(totals.totalBudget)}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-base font-semibold text-gray-800 mb-2">התפלגות הוצאות לפי קטגוריה</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {categoryData.map((entry) => (
                  <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#C4B5FD"} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatILS(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {categoryData.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c.name] }} />
                {c.name}
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <h3 className="text-base font-semibold text-gray-800 mb-2">הכנסות מול הוצאות - השוואה חודשית</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={MONTHLY_HISTORY} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F0FB" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => formatILS(v)} />
              <Legend />
              <Bar dataKey="הכנסות" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="הוצאות" fill="#DDD6FE" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <TransactionsTable transactions={transactions.slice(0, 6)} />
    </div>
  );
}

/* ---------------------------------------------------------
   Report View
--------------------------------------------------------- */
function ReportView({ transactions }) {
  const [filter, setFilter] = useState("all");
  const filtered = transactions.filter((t) => filter === "all" || t.type === filter);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">דוח הכנסות והוצאות מלא</h3>
          <div className="flex gap-2">
            {[
              { id: "all", label: "הכל" },
              { id: "income", label: "הכנסות" },
              { id: "expense", label: "הוצאות" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-sm transition-colors ${
                  filter === f.id ? "bg-violet-600 text-white" : "bg-violet-50 text-violet-600 hover:bg-violet-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>
      <TransactionsTable transactions={filtered} />
    </div>
  );
}

/* ---------------------------------------------------------
   Settings View
--------------------------------------------------------- */
function SettingsView({ budgetLimits, onChange }) {
  return (
    <Card>
      <h3 className="text-base font-semibold text-gray-800 mb-1">הגדרות תקציב חודשי</h3>
      <p className="text-sm text-gray-400 mb-5">קבע תקרת הוצאה חודשית לכל קטגוריה</p>
      <div className="flex flex-col gap-4">
        {Object.entries(budgetLimits).map(([cat, val]) => (
          <div key={cat} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-40">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
              <span className="text-sm text-gray-600">{cat}</span>
            </div>
            <input
              type="range"
              min="0"
              max="8000"
              step="100"
              value={val}
              onChange={(e) => onChange(cat, Number(e.target.value))}
              className="flex-1 accent-violet-600"
            />
            <span className="w-24 text-sm text-gray-700 font-medium text-left">{formatILS(val)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------
   Main App
--------------------------------------------------------- */
export default function BudgetDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [budgetLimits, setBudgetLimits] = useState(BUDGET_LIMITS);
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const totals = useMemo(() => {
    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = Math.abs(transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0));
    const totalBudget = Object.values(budgetLimits).reduce((s, v) => s + v, 0);
    const budgetUsedPct = totalBudget ? Math.round((expense / totalBudget) * 100) : 0;
    return { income, expense, balance: income - expense, totalBudget, budgetUsedPct };
  }, [transactions, budgetLimits]);

  const categoryData = useMemo(() => {
    const map = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
      });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const handleAddTransaction = (tx) => setTransactions((prev) => [tx, ...prev]);
  const handleBudgetChange = (cat, val) => setBudgetLimits((prev) => ({ ...prev, [cat]: val }));

  const NavContent = () => (
    <>
      <div className="flex items-center gap-2 px-1">
        <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold">
          ₪
        </div>
        <div>
          <div className="font-semibold text-gray-800 text-sm">תקציב חכם</div>
          <div className="text-xs text-gray-400">ניהול פיננסי אישי</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileNavOpen(false);
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActive ? "bg-violet-600 text-white shadow-sm" : "text-gray-500 hover:bg-violet-50 hover:text-violet-600"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <button
        onClick={() => {
          setModalOpen(true);
          setMobileNavOpen(false);
        }}
        className="mt-auto flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 transition-colors text-white rounded-xl py-2.5 text-sm font-medium"
      >
        <Plus size={16} />
        הוסף תנועה
      </button>
    </>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F6FB] flex font-sans" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      {/* Sidebar - desktop only */}
      <aside className="hidden md:flex w-64 bg-white border-l border-gray-100 flex-col p-5 gap-8 shrink-0">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-30">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 hover:bg-violet-50 hover:text-violet-600 transition-colors"
          aria-label="פתח תפריט"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800 text-sm">תקציב חכם</span>
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
            ₪
          </div>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative w-64 bg-white h-full flex flex-col p-5 gap-8 shadow-2xl mr-0">
            <button
              onClick={() => setMobileNavOpen(false)}
              className="absolute left-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="סגור תפריט"
            >
              <X size={20} />
            </button>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 pt-20 md:pt-6 overflow-y-auto overflow-x-hidden">
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-gray-800">
            {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
          </h1>
          <p className="text-sm text-gray-400">ספטמבר 2026</p>
        </header>

        {activeTab === "dashboard" && (
          <DashboardView transactions={transactions} totals={totals} categoryData={categoryData} />
        )}
        {activeTab === "report" && <ReportView transactions={transactions} />}
        {activeTab === "settings" && <SettingsView budgetLimits={budgetLimits} onChange={handleBudgetChange} />}
      </main>

      {modalOpen && <TransactionModal onClose={() => setModalOpen(false)} onSave={handleAddTransaction} />}
    </div>
  );
}
