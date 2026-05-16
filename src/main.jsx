import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  BellRing,
  Bot,
  CheckCircle2,
  ChevronDown,
  Filter,
  RotateCcw,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  DatabaseBackup,
  Download,
  FileText,
  Globe2,
  Landmark,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  MessageSquareText,
  Pencil,
  Search,
  Send,
  ShieldCheck,
  Plus,
  Trash2,
  Sparkles,
  MessageCircleWarning,
  TrendingUp,
  UsersRound,
  X,
  Zap,
} from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import clsx from 'clsx';
import { supabase } from './supabaseClient';
import './styles.css';
// ---- constants ----------------------------------------------------------------
const STAGES = ['Add Inquiry', 'Intent', 'Quote Sent', 'Deposit Pending', 'Deposit Paid', 'Balance Closed', 'Lost'];
const STAGE_CN = ['添加询盘录入', '意向', '已发送报价', '待收定金', '已付定金', '尾款结清', '失败'];
const CHANNELS = ['WhatsApp', '小红书', '官网', 'Telegram', 'Instagram', '展会', '老客户推荐', '其他'];
const COLORS = ['#2563EB', '#0EA5E9', '#6366F1', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#84CC16', '#F97316'];

const todayForInput = new Date().toISOString().slice(0, 10);

const pageTitles = {
  dashboard: ['DeepSea Professional', '首页看板'],
  intake: ['Add Inquiry', '添加询盘'],
  leads: ['Trade Memory', '商机记忆库'],
  markets: ['Country Intelligence', '去向国家'],
  finance: ['Finance & Pricing', '金融与报价'],
  contracts: ['Contract Generator', '合同生成'],
};

const intakeJson = {
  contact_name: '',
  company_cn: '',
  company_en: '',
  title: '',
  phone: '',
  email: '',
  whatsapp: '',
  qualification: '',
  country: '',
  port: '',
  brand: '',
  models: [''],
  year: '',
  power_type: '',
  steering: 'LHD',
  color: '',
  vin: '',
  quantity: '',
  moq: '',
  target_price: '',
  currency: 'USD',
  trade_terms: '',
  delivery_date: '',
  source: '',
  request: '',
  competitor: '',
};

const contractTemplateMergedRanges = [
  'A1:D1', 'E1:F1', 'A2:D2', 'E2:F2', 'A3:D3', 'E3:F3', 'A4:F4', 'A5:F5',
  'A7:D7', 'E7:F7', 'A8:B8', 'C8:D8', 'E8:F8', 'A9:B9', 'C9:D9', 'E9:F9',
  'A10:B10', 'C10:D10', 'E10:F10', 'A11:B11', 'C11:D11', 'E11:F11',
  'A12:B12', 'C12:D12', 'E12:F12',
];

const initialFilters = { stage: '', country: '', model: '', source: '' };

// ---- helpers ------------------------------------------------------------------
function formatMoney(value) {
  return Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function numberToEnglishWords(value) {
  const number = Math.round(Number(value) || 0);
  if (number === 0) return 'ZERO';
  const belowTwenty = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  function chunkToWords(chunk) {
    const words = [];
    const hundred = Math.floor(chunk / 100);
    const rest = chunk % 100;
    if (hundred) words.push(belowTwenty[hundred] + ' HUNDRED');
    if (rest < 20) { if (rest) words.push(belowTwenty[rest]); }
    else { const ten = Math.floor(rest / 10); const unit = rest % 10; words.push(unit ? tens[ten] + '-' + belowTwenty[unit] : tens[ten]); }
    return words.join(' ');
  }
  const units = [[1000000000, 'BILLION'], [1000000, 'MILLION'], [1000, 'THOUSAND']];
  let remaining = number;
  const words = [];
  for (const [unitValue, unitName] of units) {
    const chunk = Math.floor(remaining / unitValue);
    if (chunk) { words.push(chunkToWords(chunk) + ' ' + unitName); remaining %= unitValue; }
  }
  if (remaining) words.push(chunkToWords(remaining));
  return words.join(' ');
}

function getDateToken(dateText) {
  return (dateText || todayForInput).replaceAll('-', '');
}

function getNextContractNumberPreview(dateText) {
  const dateToken = getDateToken(dateText);
  const c = Number(window.localStorage.getItem('vvcrm-contract-count-' + dateToken) || '0');
  return 'HP' + dateToken + String(c + 1).padStart(2, '0') + '-ZW';
}

function reserveNextContractNumber(dateText) {
  const dateToken = getDateToken(dateText);
  const key = 'vvcrm-contract-count-' + dateToken;
  const n = Number(window.localStorage.getItem(key) || '0') + 1;
  window.localStorage.setItem(key, String(n));
  return 'HP' + dateToken + String(n).padStart(2, '0') + '-ZW';
}

function copyRowStyle(sheet, src, tgt) {
  const sr = sheet.getRow(src);
  const tr = sheet.getRow(tgt);
  tr.height = sr.height;
  for (let c = 1; c <= 5; c++) {
    const sc = sr.getCell(c);
    const tc = tr.getCell(c);
    tc.style = { ...sc.style };
    tc.numFmt = sc.numFmt;
    tc.alignment = sc.alignment ? { ...sc.alignment } : undefined;
    tc.border = sc.border ? { ...sc.border } : undefined;
    tc.fill = sc.fill ? { ...sc.fill } : undefined;
    tc.font = sc.font ? { ...sc.font } : undefined;
  }
}

function shiftMergedRange(range, rowDelta) {
  return range.replace(/([A-Z]+)(\d+)/g, (_, col, row) => col + (Number(row) >= 13 ? Number(row) + rowDelta : row));
}

function resetContractTemplateMerges(sheet, rowDelta) {
  const merges = sheet.model?.merges ?? [];
  for (const r of merges) { try { sheet.unMergeCells(r); } catch (e) {} }
  for (const r of contractTemplateMergedRanges) {
    try { sheet.mergeCells(shiftMergedRange(r, rowDelta)); } catch (e) {}
  }
}

function getDueFollowUps(inquiries) {
  const now = new Date();
  return inquiries.filter((inq) => {
    if (inq.completed) return false;
    if (!inq.next_follow_up_at) return false;
    return new Date(inq.next_follow_up_at) <= now;
  });
}

// ---- Auth: Login / Register ------------------------------------------------
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
      }
      onAuth();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#0F172A] px-4 py-8 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.25),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.22),transparent_32%)]" />
      <section className="relative w-full max-w-md rounded-[1.75rem] bg-white p-8 shadow-2xl sm:p-10">
        <div className="inline-flex items-center gap-3 rounded-2xl bg-slate-100 p-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#2563EB]"><Landmark size={22} /></div>
          <div>
            <p className="text-sm font-semibold text-slate-950">VVCRM 2026</p>
            <p className="text-xs text-slate-500">DeepSea Professional</p>
          </div>
        </div>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight text-slate-950">
          {mode === 'login' ? '登录系统' : '注册账号'}
        </h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Email</span>
            <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#2563EB] focus:bg-white" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">密码</span>
            <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#2563EB] focus:bg-white" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </label>
          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
          <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-5 py-4 text-sm font-semibold text-white shadow-blueglow transition hover:bg-blue-700" type="submit" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            {mode === 'login' ? '登录' : '注册'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === 'login' ? '没有账号？' : '已有账号？'}
          <button className="ml-1 font-semibold text-[#2563EB] hover:underline" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? '注册' : '登录'}
          </button>
        </p>
      </section>
    </div>
  );
}

// ---- App -----------------------------------------------------------------
function App() {
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [leads, setLeads] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI state
  const [activePage, setActivePage] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(initialFilters);

  // Check auth on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (!session) { setLoading(false); return; }
    loadData();
  }, [session]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [leadsRes, inqRes] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('inquiry_events').select('*').order('created_at', { ascending: false }),
      ]);
      if (leadsRes.error) throw leadsRes.error;
      if (inqRes.error) throw inqRes.error;
      setLeads(leadsRes.data || []);
      setInquiries(inqRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddLead(lead) {
    const { data, error: err } = await supabase.from('leads').insert({ ...lead, user_id: session.user.id }).select().single();
    if (err) { setError(err.message); return; }
    setLeads((prev) => [data, ...prev]);
  }

  async function handleUpdateLead(id, updates) {
    const { error: err } = await supabase.from('leads').update(updates).eq('id', id);
    if (err) { setError(err.message); return; }
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  }

  async function handleDeleteLead(id) {
    const { error: err } = await supabase.from('leads').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    setLeads((prev) => prev.filter((l) => l.id !== id));
    if (selectedLead?.id === id) setSelectedLead(null);
  }

  async function handleAddInquiry(inquiry) {
    const { data, error: err } = await supabase.from('inquiry_events').insert({ ...inquiry, user_id: session.user.id }).select().single();
    if (err) { setError(err.message); return; }
    setInquiries((prev) => [data, ...prev]);
  }

  async function handleUpdateInquiry(id, updates) {
    const { error: err } = await supabase.from('inquiry_events').update(updates).eq('id', id);
    if (err) { setError(err.message); return; }
    setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  }

  async function handleDeleteInquiry(id) {
    const { error: err } = await supabase.from('inquiry_events').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    setInquiries((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setLeads([]);
    setInquiries([]);
    setIsModalOpen(false);
  }

  // Derived data
  const dueFollowUps = useMemo(() => getDueFollowUps(inquiries), [inquiries]);

  const filterOptions = useMemo(() => ({
    stages: [...new Set(leads.map((l) => l.stage))],
    countries: [...new Set(leads.map((l) => l.destination_country))],
    models: [...new Set(leads.map((l) => l.target_model))],
    sources: [...new Set(leads.map((l) => l.lead_source).filter(Boolean))],
  }), [leads]);

  const activeFilterCount = useMemo(() => Object.values(filters).filter(Boolean).length, [filters]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const n = query.trim().toLowerCase();
      if (n) {
        const s = (lead.full_name + ' ' + lead.destination_country + ' ' + lead.target_model + ' ' + lead.stage + ' ' + (lead.lead_source || '')).toLowerCase();
        if (s.indexOf(n) === -1) return false;
      }
      if (filters.stage && lead.stage !== filters.stage) return false;
      if (filters.country && lead.destination_country !== filters.country) return false;
      if (filters.model && lead.target_model !== filters.model) return false;
      if (filters.source && lead.lead_source !== filters.source) return false;
      return true;
    });
  }, [leads, query, filters]);

  const modelStats = useMemo(() => {
    const map = {};
    leads.forEach((l) => { map[l.target_model] = (map[l.target_model] || 0) + 1; });
    return Object.entries(map).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  }, [leads]);

  const tradeFlow = useMemo(() => {
    return inquiries.slice(0, 10).map((inq) => [inq.target_model, inq.destination_country, inq.event_note, formatRelativeTime(inq.created_at)]);
  }, [inquiries]);

  const funnel = useMemo(() => {
    const stages = ['AI Intake', 'Intent', 'Quote Sent', 'Deposit Pending', 'Deposit Paid'];
    const stageCN = ['新询盘', '意向', '已发送报价', '待收定金', '已付定金'];
    const total = leads.length || 1;
    return stages.map((s, i) => {
      const count = leads.filter((l) => {
        const idx = STAGES.indexOf(l.stage);
        const targetIdx = STAGES.indexOf(s);
        return idx >= targetIdx;
      }).length;
      return [stageCN[i], count, Math.round((count / total) * 100)];
    });
  }, [leads]);

  // Loading
  if (!authChecked || loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-[#2563EB]" />
          <p className="text-sm text-slate-500">Loading VVCRM...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return <AuthScreen onAuth={() => supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s))} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {error && (
        <div className="fixed top-4 right-4 z-[100] max-w-sm rounded-2xl border border-red-200 bg-red-50 px-5 py-4 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* Mobile nav overlay */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileNavOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-[#0F172A] p-5">
            <Sidebar activePage={activePage} dueCount={dueFollowUps.length} onPageChange={(p) => { setActivePage(p); setIsMobileNavOpen(false); }} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <Sidebar activePage={activePage} dueCount={dueFollowUps.length} onPageChange={setActivePage} />
        </div>
        <main className="flex-1 overflow-hidden">
          <Header
            activePage={activePage}
            dueCount={dueFollowUps.length}
            onOpenIntake={() => setIsModalOpen(true)}
            onLogout={handleLogout}
            onOpenMobileNav={() => setIsMobileNavOpen(true)}
          />
          {activePage === 'dashboard' && (
            <DashboardPage
              dueFollowUps={dueFollowUps}
              filteredLeads={filteredLeads}
              filters={filters}
              filterOptions={filterOptions}
              activeFilterCount={activeFilterCount}
              inquiries={inquiries}
              query={query}
              selectedLead={selectedLead}
              modelStats={modelStats}
              tradeFlow={tradeFlow}
              funnel={funnel}
              leads={leads}
              onQuery={setQuery}
              onSetFilter={setFilters}
              onSelectLead={setSelectedLead}
              onUpdateInquiry={handleUpdateInquiry}
              onDeleteLead={handleDeleteLead}
              onDeleteInquiry={handleDeleteInquiry}
            />
          )}
          {activePage === 'contracts' && <ContractBuilder />}
          {activePage !== 'dashboard' && activePage !== 'contracts' && (
            <ModulePlaceholder activePage={activePage} onOpenIntake={() => setIsModalOpen(true)} />
          )}
        </main>
      </div>
      {isModalOpen && (
        <IntakeModal
          onClose={() => setIsModalOpen(false)}
          onAddLead={handleAddLead}
          onAddInquiry={handleAddInquiry}
        />
      )}
      {dueFollowUps.length > 0 && (
        <FollowUpModal dueFollowUps={dueFollowUps} onUpdateInquiry={handleUpdateInquiry} />
      )}
    </div>
  );
}

// ---- UI Components: Sidebar & Header -------------------------------------
function Sidebar({ activePage, dueCount, onPageChange }) {
  const nav = [
    [LayoutDashboard, 'Dashboard', '首页看板', 'dashboard'],
    [Bot, 'AI Intake', 'AI 询盘解析', 'intake'],
    [UsersRound, 'Leads', '商机记忆库', 'leads'],
    [Globe2, 'Markets', '去向国家', 'markets'],
    [CircleDollarSign, 'Finance', '金融与报价', 'finance'],
    [FileText, 'Contract', '合同生成', 'contracts'],
  ];
  return (
    <aside className="min-h-screen w-72 shrink-0 bg-[#0F172A] p-5 text-white">
      <div className="flex items-center gap-3 rounded-2xl bg-white/7 p-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#2563EB]"><Landmark size={22} /></div>
        <div>
          <p className="text-sm font-semibold tracking-wide">VVCRM 2026</p>
          <p className="text-xs text-slate-300">DeepSea 专业版</p>
        </div>
      </div>
      <nav className="mt-8 space-y-2">
        {nav.map(([Icon, en, cn, page]) => (
          <button key={en} onClick={() => onPageChange(page)}
            className={clsx('flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition',
              activePage === page ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/8 hover:text-white')}>
            <span className="flex items-center gap-3"><Icon size={18} /><span>{en}</span>
              {page === 'dashboard' && dueCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{dueCount}</span>}
            </span>
            <span className="text-xs opacity-70">{cn}</span>
          </button>
        ))}
      </nav>
      <div className="mt-8 rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100"><ShieldCheck size={18} /> LHD 左舵合规</div>
        <p className="mt-2 text-xs leading-5 text-slate-300">所有商机默认带有左舵验证标记，方便出口合规审查</p>
      </div>
    </aside>
  );
}

function Header({ activePage, dueCount, onOpenIntake, onLogout, onOpenMobileNav }) {
  const [_, title] = pageTitles[activePage] ?? pageTitles.dashboard;
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-[#F8FAFC]/92 px-3 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onOpenMobileNav} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"><Menu size={20} /></button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="icon-button relative" aria-label="Notifications">
            <BellRing size={18} />
            {dueCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{dueCount}</span>}
          </button>
          <button className="primary-button" onClick={onOpenIntake}><Sparkles size={18} />添加询盘</button>
          <button className="secondary-button" onClick={onLogout}><LogOut size={17} />退出</button>
        </div>
      </div>
    </header>
  );
}

function ModulePlaceholder({ activePage, onOpenIntake }) {
  const [_, title] = pageTitles[activePage] ?? pageTitles.dashboard;
  return (
    <div className="px-4 pb-8 pt-4 sm:px-6 lg:px-8">
      <section className="panel">
        <p className="eyebrow">模块入口</p>
        <h2 className="section-title">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">当前模块已可以从左侧导航切换。完整业务页面会按照现有设计语言扩展；点击右上角 "添加询盘" 按钮开始录入。</p>
        <button className="primary-button mt-5" onClick={onOpenIntake}><Sparkles size={18} />打开 添加询盘</button>
      </section>
    </div>
  );
}

// ---- Dashboard -----------------------------------------------------------
function DashboardPage({ dueFollowUps, filteredLeads, filters, filterOptions, activeFilterCount, inquiries, query, selectedLead, modelStats, tradeFlow, funnel, onQuery, onSetFilter, onSelectLead, onUpdateInquiry, onDeleteLead, onDeleteInquiry }) {
  return (
    <div className="grid gap-5 px-3 pb-8 pt-4 sm:px-6 lg:grid-cols-[1.45fr_0.85fr] lg:px-8">
      <section className="space-y-5">
        <MarketInsight modelStats={modelStats} />
        <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <ConversionFunnel funnel={funnel} />
          <FollowUpReminder dueFollowUps={dueFollowUps} inquiries={inquiries} onUpdateInquiry={onUpdateInquiry} />
        </div>
        <LeadsMemory
            leads={filteredLeads}
            inquiries={inquiries}
            selectedLead={selectedLead}
            query={query}
            filters={filters}
            filterOptions={filterOptions}
            activeFilterCount={activeFilterCount}
            onQuery={onQuery}
            onSetFilter={onSetFilter}
            onSelect={onSelectLead}
            onDelete={onDeleteLead}
            onUpdateInquiry={onUpdateInquiry}
            onDeleteInquiry={onDeleteInquiry}
          />
      </section>
      <aside className="space-y-5">
        <StrategicSignal leads={filteredLeads} />
        <TradeFlow tradeFlow={tradeFlow} />
        <LeadProfile lead={selectedLead} />
        <DataHealth leads={filteredLeads} inquiries={inquiries} />
      </aside>
    </div>
  );
}

function MarketInsight({ modelStats }) {
  const isEmpty = !modelStats.length;
  return (
    <section className="panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="eyebrow">市场洞察</p><h2 className="section-title">车型分布</h2></div>
      </div>
      {isEmpty ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <TrendingUp className="mx-auto text-slate-300" size={40} />
          <p className="mt-3 text-sm text-slate-500">暂无数据，添加客户后自动生成分布图</p>
          <p className="mt-1 text-xs text-slate-400">使用右上角 "添加询盘" 开始录入</p>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[1.5rem] border border-slate-100 bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">热门车型分布</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={modelStats} dataKey="value" innerRadius={62} outerRadius={92} paddingAngle={3}>
                      {modelStats.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [v, '条']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {modelStats.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name}</span>
                    <span className="font-semibold text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function ConversionFunnel({ funnel }) {
  const isEmpty = funnel.every(([, count]) => count === 0);
  return (
    <section className="panel">
      <p className="eyebrow">转化漏斗</p>
      <h2 className="section-title">询盘转化漏斗</h2>
      {isEmpty ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-500">暂无转化数据</p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {funnel.map(([label, count, width]) => (
            <div key={label}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{label}</span>
                <span className="font-semibold text-slate-950">{count}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#2563EB] transition-all" style={{ width: width + '%' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FollowUpReminder({ dueFollowUps, onUpdateInquiry }) {
  if (dueFollowUps.length === 0) {
    return (
      <section className="panel">
        <div className="flex items-center justify-between gap-3">
          <div><p className="eyebrow">2 天回访提醒</p><h2 className="section-title">客户该跟进</h2></div>
          <CheckCircle2 className="text-emerald-500" size={20} />
        </div>
        <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">所有回访任务已完成</p>
          <p className="mt-1 text-xs text-emerald-600">暂无逾期未跟进的询盘</p>
        </div>
      </section>
    );
  }
  return (
    <section className="panel">
      <div className="flex items-center justify-between gap-3">
        <div><p className="eyebrow">2 天回访提醒</p><h2 className="section-title">客户该跟进</h2></div>
        <Clock3 className="text-[#2563EB]" size={20} />
      </div>
      <div className="mt-5 space-y-3 max-h-64 overflow-y-auto">
        {dueFollowUps.map((inq) => (
          <div key={inq.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">{inq.full_name}</p>
                <p className="mt-1 text-xs text-slate-500">{inq.target_model} · {inq.destination_country}</p>
              </div>
              <span className="status-pill bg-red-50 text-red-700">逾期</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{inq.event_note}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>{inq.channel}</span>
              <span>{inq.status}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---- Leads Memory --------------------------------------------------------
function LeadsMemory({ leads, inquiries, selectedLead, query, filters, filterOptions, activeFilterCount, onQuery, onSetFilter, onSelect, onDelete, onUpdateInquiry, onDeleteInquiry }) {
  const [view, setView] = useState('leads');
  const [showFilters, setShowFilters] = useState(false);
  const [editing, setEditing] = useState(null);

  const displayItems = view === 'inquiries' ? (inquiries || []) : leads;
  const hasQuery = query && query.trim();
  const filteredItems = hasQuery
    ? displayItems.filter((item) => {
        const searchable = view === 'inquiries'
          ? (item.full_name + " " + item.destination_country + " " + item.target_model + " " + (item.channel || "")).toLowerCase()
          : (item.full_name + " " + item.destination_country + " " + item.target_model + " " + item.stage + " " + (item.lead_source || "")).toLowerCase();
        return searchable.includes(query.trim().toLowerCase());
      })
    : displayItems;
  const isEmpty = displayItems.length === 0;

  function openEdit(item) {
    if (view === 'inquiries') {
      setEditing({ type: 'inquiry', data: { ...item } });
    }
  }

  async function handleSaveEdit() {
    if (!editing) return;
    const { type, data } = editing;
    if (type === 'inquiry') {
      await onUpdateInquiry(data.id, {
        full_name: data.full_name,
        destination_country: data.destination_country,
        target_model: data.target_model,
        event_note: data.event_note,
        channel: data.channel,
        status: data.status,
        vin: data.vin,
        trade_terms: data.trade_terms,
      });
    }
    setEditing(null);
  }

  return (
    <section className="panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">商机记忆库</p>
          <h2 className="section-title">
            {view === 'inquiries' ? "全部询盘" : "全部客户"} ({displayItems.length})
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="secondary-button" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={17} />筛选{activeFilterCount > 0 ? " (" + activeFilterCount + ")" : ""}
          </button>
          {activeFilterCount > 0 && (
            <button className="secondary-button" onClick={() => onSetFilter(initialFilters)}><RotateCcw size={17} />重置</button>
          )}
        </div>
      </div>

      {/* View Toggle */}
      <div className="mt-4 flex gap-1 rounded-2xl bg-slate-100 p-1">
        {['leads', 'inquiries'].map((v) => (
          <button
            key={v}
            className={clsx(
              "flex-1 rounded-xl px-4 py-2 text-sm font-medium transition",
              view === v ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
            onClick={() => setView(v)}
          >
            {v === 'leads' ? "客户商机" : "询盘记录"}
          </button>
        ))}
      </div>

      {/* Filters (only for leads view) */}
      {view === 'leads' && showFilters && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {['stage', 'country', 'model', 'source'].map((key) => (
            <label key={key} className="block">
              <span className="text-xs font-semibold text-slate-500">{key === 'stage' ? "阶段" : key === 'country' ? "国家" : key === 'model' ? "车型" : "渠道"}</span>
              <select className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={filters[key]} onChange={(e) => onSetFilter({ ...filters, [key]: e.target.value })}>
                <option value="">全部</option>
                {((filterOptions[key + 's']) || []).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2">
        <Search size={17} className="text-slate-400" />
        <input className="w-full bg-transparent text-sm outline-none" placeholder={view === 'inquiries' ? "搜索询盘名称、国家、车型..." : "搜索客户名称、国家、车型..."} value={query} onChange={(e) => onQuery(e.target.value)} />
        {query && <button onClick={() => onQuery("")}><X size={16} className="text-slate-400" /></button>}
      </div>

      {/* List */}
      <div className="mt-4 space-y-2">
        {isEmpty ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <UsersRound className="mx-auto text-slate-300" size={40} />
            <p className="mt-3 text-sm font-medium text-slate-600">{view === 'inquiries' ? "暂无询盘记录" : "暂无客户数据"}</p>
            <p className="mt-1 text-xs text-slate-400">点击右上角 "添加询盘" 添加第一个客户</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-500">没有匹配的记录</p>
            <button className="mt-2 text-xs font-semibold text-[#2563EB] hover:underline" onClick={() => { onQuery(""); if (view === 'leads') onSetFilter(initialFilters); }}>清除筛选条件</button>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className={clsx("flex items-center gap-3 rounded-2xl border p-3 transition", selectedLead?.id === item.id && view === 'leads' ? "border-[#2563EB] bg-blue-50/50" : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50")}>
              <button className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#0F172A] text-sm font-bold text-white" onClick={() => { if (view === 'leads') onSelect(item); }}>
                {(item.full_name || "?").slice(0, 1)}
                <span className="absolute -right-1 -top-1 rounded-full bg-[#0EA5E9] px-1.5 py-0.5 text-[9px] font-bold text-white">{item.steering || "LHD"}</span>
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-950">{item.brand ? item.brand + " " : ""}{item.target_model}</p>
                <p className="truncate text-xs text-slate-500">{item.destination_country}{item.port ? " · " + item.port : ""}{item.quantity ? " · " + item.quantity + "台" : ""}</p>
                <p className="truncate text-xs text-slate-500">
                  {item.full_name} · {item.whatsapp || item.channel} · {item.lead_source || item.channel || ""}
                </p>
                {view === 'inquiries' && item.event_note && (
                  <p className="mt-0.5 truncate text-xs text-slate-400">{item.event_note}</p>
                )}
              </div>
              <span className={clsx("shrink-0 rounded-full px-3 py-1 text-xs font-semibold", view === 'inquiries' ? "bg-slate-100 text-slate-600" : "status-pill")}>{view === 'inquiries' ? (item.status || "待处理") : item.stage}</span>
              <button className="shrink-0 rounded-xl p-2 text-slate-300 hover:bg-blue-50 hover:text-blue-500 transition" onClick={() => openEdit(item)} title="编辑">
                <Pencil size={16} />
              </button>
              <button className="shrink-0 rounded-xl p-2 text-slate-300 hover:bg-red-50 hover:text-red-500 transition" onClick={() => {
                const label = view === 'inquiries' ? "该询盘" : "该客户";
                if (window.confirm("确定删除" + label + "？")) {
                  if (view === 'inquiries') onDeleteInquiry(item.id);
                  else onDelete(item.id);
                }
              }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-md" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded-[1.75rem] bg-white shadow-command" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">
                编辑{editing.type === 'inquiry' ? "询盘记录" : "客户商机"}
              </h2>
              <button className="icon-button" onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="space-y-4 p-5">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">客户姓名</span>
                <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:bg-white"
                  value={editing.data.full_name || ""}
                  onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, full_name: e.target.value } }))} />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500">目标国家</span>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:bg-white"
                    value={editing.data.destination_country || ""}
                    onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, destination_country: e.target.value } }))} />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500">目标车型</span>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:bg-white"
                    value={editing.data.target_model || ""}
                    onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, target_model: e.target.value } }))} />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">询盘内容</span>
                <textarea className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:bg-white" rows={3}
                  value={editing.data.event_note || ""}
                  onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, event_note: e.target.value } }))} />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500">渠道</span>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:bg-white"
                    value={editing.data.channel || ""}
                    onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, channel: e.target.value } }))} />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500">状态</span>
                  <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    value={editing.data.status || "pending"}
                    onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, status: e.target.value } }))}>
                    <option value="pending">待处理</option>
                    <option value="跟进中">跟进中</option>
                    <option value="已报价">已报价</option>
                    <option value="已确认意向">已确认意向</option>
                    <option value="签订合同中">签订合同中</option>
                    <option value="已付款">已付款</option>
                    <option value="已发货">已发货</option>
                    <option value="失败">失败</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500">VIN 码</span>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:bg-white"
                    value={editing.data.vin || ""}
                    onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, vin: e.target.value } }))} />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500">贸易术语</span>
                  <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    value={editing.data.trade_terms || ""}
                    onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, trade_terms: e.target.value } }))}>
                    <option value="">-</option>
                    <option value="FCA">FCA (货交承运人)</option>
                    <option value="FOB">FOB (装运港船上交货)</option>
                    <option value="CFR">CFR (成本加运费)</option>
                    <option value="CIF">CIF (到岸价)</option>
                    <option value="EXW">EXW (工厂交货)</option>
                    <option value="DAP">DAP (目的地交货)</option>
                  </select>
                </label>
              </div>
              <button
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] px-5 py-4 text-sm font-semibold text-white shadow-blueglow transition hover:opacity-90"
                onClick={handleSaveEdit}
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
function LeadProfile({ lead }) {
  if (!lead) {
    return (
      <section className="panel">
        <div className="flex items-center justify-between gap-3">
          <div><p className="eyebrow">客户画像</p><h2 className="section-title">客户详情</h2></div>
          <MessageSquareText className="text-[#2563EB]" size={20} />
        </div>
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-500">点击左侧客户卡片查看详情</p>
        </div>
      </section>
    );
  }
  const activeIdx = STAGES.indexOf(lead.stage);
  return (
    <section className="panel">
      <div className="flex items-center justify-between gap-3">
        <div><p className="eyebrow">客户画像</p><h2 className="section-title">客户详情</h2></div>
        <MessageSquareText className="text-[#2563EB]" size={20} />
      </div>
      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <p className="font-semibold text-slate-950">{lead.full_name}</p>
        <p className="mt-1 text-sm text-slate-500">{lead.target_model} · {lead.destination_country}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="status-pill">{lead.lead_source}</span>
          <span className="status-pill bg-sky-50 text-sky-700">{lead.whatsapp}</span>
          <span className="status-pill bg-indigo-50 text-indigo-700">{lead.steering} 已验证</span>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {STAGES.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div className={clsx('grid h-7 w-7 place-items-center rounded-full border text-xs', i <= activeIdx ? 'border-[#2563EB] bg-[#2563EB] text-white' : 'border-slate-200 bg-white text-slate-400')}>
              {i <= activeIdx ? <CheckCircle2 size={15} /> : i + 1}
            </div>
            <span className={clsx('text-sm', i <= activeIdx ? 'font-semibold text-slate-800' : 'text-slate-400')}>{s} ({STAGE_CN[i]})</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function StrategicSignal({ leads }) {
  const countryCount = leads.reduce((m, l) => { m[l.destination_country] = (m[l.destination_country] || 0) + 1; return m; }, {});
  const topCountry = Object.entries(countryCount).sort((a, b) => b[1] - a[1])[0];
  const modelCount = leads.reduce((m, l) => { m[l.target_model] = (m[l.target_model] || 0) + 1; return m; }, {});
  const topModel = Object.entries(modelCount).sort((a, b) => b[1] - a[1])[0];
  if (!topCountry && !topModel) {
    return (
      <section className="rounded-[1.5rem] border border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 p-5">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2563EB]"><Zap size={22} /></div><div><p className="text-sm font-semibold">大 数据价值提示</p></div></div>
        <p className="mt-4 text-sm leading-6 text-slate-500">录入数据后将自动分析热门市场与车型趋势</p>
      </section>
    );
  }
  return (
    <section className="rounded-[1.5rem] border border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 p-5">
      <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2563EB]"><Zap size={22} /></div><div><p className="text-sm font-semibold">大数据价值提示</p></div></div>
      <p className="mt-4 text-lg font-semibold leading-tight text-slate-950">{topModel?.[0] || 'N/A'} 在 {topCountry?.[0] || 'N/A'} 兴趣飙升</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">当前总计 {leads.length} 条商机，建议优先备货 {topModel?.[0] || ''} LHD 库存</p>
    </section>
  );
}

function TradeFlow({ tradeFlow }) {
  return (
    <section className="panel">
      <div className="flex items-center justify-between">
        <div><p className="eyebrow">实时贸易流</p><h2 className="section-title">最新询盘</h2></div>
        <Send className="text-[#0EA5E9]" size={20} />
      </div>
      {tradeFlow.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-500">暂无询盘记录</p>
        </div>
      ) : (
        <div className="mt-4 max-h-80 space-y-3 overflow-y-auto">
          {tradeFlow.map(([model, country, note, time], i) => (
            <div className="trade-row" key={i}>
              <div><p className="text-sm font-semibold text-slate-900">{model} → {country}</p><p className="text-xs text-slate-500 truncate max-w-[200px]">{note}</p></div>
              <span className="text-xs text-slate-400 shrink-0">{time}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DataHealth({ leads, inquiries }) {
  return (
    <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <DatabaseBackup className="mt-0.5 text-amber-600" size={20} />
        <div>
          <p className="text-sm font-semibold text-amber-950">数据健康</p>
          <p className="mt-1 text-sm leading-6 text-amber-800">客户 {leads.length} 条 · 询盘 {inquiries.length} 条</p>
          <p className="text-xs text-amber-600">数据实时同步至 Supabase，手机可访问</p>
        </div>
      </div>
    </section>
  );
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return mins + ' 分钟前';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + ' 小时前';
  return Math.floor(hrs / 24) + ' 天前';
}

// ---- Intake Modal --------------------------------------------------------
function IntakeModal({ onClose, onAddLead, onAddInquiry }) {
  const [form, setForm] = useState(intakeJson);
  const [saving, setSaving] = useState(false);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

    async function handleSave() {
    console.log('handleSave called', form.contact_name, form.country, form.models);
    if (!form.contact_name || !form.country) { alert('请填写联系人和目标国家'); return; }
    const modelsArr = (form.models || []).filter(Boolean);
    const modelsStr = modelsArr.join(", ");
    if (!modelsStr) { alert('请至少添加一个车型'); return; }
    setSaving(true);
    console.log('saving...');
    const now = new Date().toISOString();
    await onAddLead({
      full_name: form.contact_name,
      company_cn: form.company_cn || "",
      company_en: form.company_en || "",
      title: form.title || "",
      phone: form.phone || "",
      email: form.email || "",
      whatsapp: form.whatsapp || "",
      qualification: form.qualification || "",
      destination_country: form.country,
      destination_port: form.port || "",
      brand: form.brand || "",
      target_model: modelsStr,
      year: form.year || "",
      power_type: form.power_type || "",
      steering: form.steering || "LHD",
      color: form.color || "",
      vin: form.vin || "",
      quantity: form.quantity || "",
      moq: form.moq || "",
      target_price: form.target_price || "",
      currency: form.currency || "USD",
      trade_terms: form.trade_terms || "",
      delivery_date: form.delivery_date || "",
      lead_source: form.source || "",
      competitor: form.competitor || "",
      stage: "New Lead",
    });
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 2);
    await onAddInquiry({
      full_name: form.contact_name,
      company_cn: form.company_cn || "",
      company_en: form.company_en || "",
      destination_country: form.country,
      port: form.port || "",
      target_model: modelsStr,
      vin: form.vin || "",
      quantity: form.quantity || "",
      trade_terms: form.trade_terms || "",
      event_note: form.request || "",
      channel: form.source || "",
      status: "pending",
      last_inquiry_at: now,
      next_follow_up_at: nextDate.toISOString(),
      follow_ups: [],
      completed: false,
    });
    setSaving(false);
    console.log('save done, closing');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-md">
      <section className="max-h-[92vh] w-full max-w-5xl overflow-auto rounded-[1.75rem] bg-white shadow-command">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div><p className="eyebrow">添加询盘引擎</p><h2 className="text-xl font-semibold text-slate-950">新询盘录入</h2></div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl bg-[#0F172A] p-5 text-white">
            <p className="text-sm font-semibold">录入 JSON 预览</p>
            <pre className="mt-4 overflow-auto rounded-2xl bg-white/8 p-4 text-xs leading-6 text-sky-100">{JSON.stringify(form, null, 2)}</pre>
          </div>
          <div className="space-y-4">
            {/* Customer Info */}
            <fieldset className="rounded-2xl border border-slate-200 p-3">
              <legend className="px-2 text-xs font-semibold text-slate-500">客户信息</legend>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["company_cn", "公司名称（中文）"],
                  ["company_en", "Company (English)"],
                  ["contact_name", "联系人 *"],
                  ["title", "职位"],
                  ["phone", "电话"],
                  ["email", "邮箱"],
                  ["whatsapp", "WhatsApp"],
                  ["qualification", "客户资质"],
                ].map(([k, label]) => (
                  <label key={k} className={k === "company_cn" || k === "company_en" || k === "qualification" ? "col-span-2" : ""}>
                    <span className="text-[11px] font-semibold text-slate-500">{label}</span>
                    <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={form[k]} onChange={(e) => update(k, e.target.value)} placeholder={k === "qualification" ? "采购记录、进口许可证" : ""} />
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Demand Details */}
            <fieldset className="rounded-2xl border border-slate-200 p-3">
              <legend className="px-2 text-xs font-semibold text-slate-500">需求详情</legend>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["brand", "品牌"],
                  ["year", "年款"],
                ].map(([k, label]) => (
                  <label key={k} className="block">
                    <span className="text-[11px] font-semibold text-slate-500">{label}</span>
                    <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={form[k]} onChange={(e) => update(k, e.target.value)} />
                  </label>
                ))}
                <label className="col-span-2">
                  <span className="text-[11px] font-semibold text-slate-500">车型 * (多个用逗号分隔或逐个添加)</span>
                  {(form.models || [""]).map((m, i) => (
                    <div key={i} className="flex gap-1 mt-1">
                      <input className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                        value={m}
                        onChange={(e) => { const arr = [...(form.models || [""])]; arr[i] = e.target.value; setForm({...form, models: arr}); }}
                        placeholder="如 BYD Qin L" />
                      {(form.models || [""]).length > 1 && (
                        <button className="shrink-0 rounded-xl p-2 text-slate-300 hover:bg-red-50 hover:text-red-500" onClick={() => { setForm({...form, models: (form.models || [""]).filter((_, idx) => idx !== i)}); }}><X size={14} /></button>
                      )}
                    </div>
                  ))}
                  <button className="mt-1 text-xs font-medium text-[#2563EB] hover:underline" onClick={() => { setForm({...form, models: [...(form.models || [""]), ""]}); }}>+ 添加车型</button>
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold text-slate-500">动力类型</span>
                  <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={form.power_type} onChange={(e) => update("power_type", e.target.value)}>
                    <option value="">请选择</option>
                    <option value="燃油">燃油</option>
                    <option value="纯电">纯电</option>
                    <option value="混动">混动</option>
                  </select>
                </label>
<label className="block">
                <span className="text-[11px] font-semibold text-slate-500">方向盘</span>
                <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={form.steering} onChange={(e) => {
                  const v = e.target.value;
                  if (v === "LHD" && RHD_COUNTRIES.some(c => form.country.toLowerCase().includes(c.toLowerCase()))) {
                    if (!window.confirm("该国家通常为右舵市场，确认选择左舵？")) return;
                  }
                  update("steering", v);
                }}>
                  <option value="LHD">LHD (左舵)</option>
                  <option value="RHD">RHD (右舵)</option>
                </select>
              </label>
              {[
                ["color", "颜色"],
                ["quantity", "意向台数"],
                ["moq", "MOQ"],
              ].map(([k, label]) => (
                <label key={k} className="block">
                  <span className="text-[11px] font-semibold text-slate-500">{label}</span>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" type={k === "quantity" || k === "moq" ? "number" : "text"} value={form[k]} onChange={(e) => update(k, e.target.value)} />
                </label>
              ))}
              <label className="col-span-2">
                <span className="text-[11px] font-semibold text-slate-500">VIN 码 (车架号，可多个)</span>
                <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={form.vin} onChange={(e) => update("vin", e.target.value)} placeholder="不限长度，多个用逗号分隔" />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-slate-500">Trade Terms</span>
                <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={form.trade_terms} onChange={(e) => update("trade_terms", e.target.value)}>
                  <option value="">请选择</option>
                  <option value="FCA">FCA (货交承运人)</option>
                  <option value="FOB">FOB (装运港船上交货)</option>
                  <option value="CFR">CFR (成本加运费)</option>
                  <option value="CIF">CIF (到岸价)</option>
                  <option value="EXW">EXW (工厂交货)</option>
                  <option value="DAP">DAP (目的地交货)</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-slate-500">目标单价</span>
                <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" type="number" value={form.target_price} onChange={(e) => update("target_price", e.target.value)} />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-slate-500">货币</span>
                <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={form.currency} onChange={(e) => update("currency", e.target.value)}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="CNY">CNY</option>
                  <option value="RUB">RUB</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-slate-500">交货期</span>
                <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" type="date" value={form.delivery_date} onChange={(e) => update("delivery_date", e.target.value)} />
              </label>
            </div>
          </fieldset>

          {/* Source & Notes */}
            {[
              ["source", "来源渠道"],
              ["country", "目标国家 *"],
              ["port", "目的港"],
              ["request", "需求描述"],
              ["competitor", "竞争对手"],
            ].map(([k, label]) => (
              <label key={k} className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
                {k === "request" ? (
                  <textarea className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:bg-white" rows={3} value={form[k]} onChange={(e) => update(k, e.target.value)} />
                ) : (
                  <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:bg-white" value={form[k]} onChange={(e) => update(k, e.target.value)} />
                )}
              </label>
            ))}
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] px-5 py-4 text-sm font-semibold text-white shadow-blueglow transition hover:opacity-90 disabled:opacity-60" onClick={handleSave} disabled={saving || !form.contact_name || !form.country || !(form.models || []).filter(Boolean).length}>
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              保存询盘至 Supabase
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---- Follow-up Modal -----------------------------------------------------
function FollowUpModal({ dueFollowUps, onUpdateInquiry }) {
  const [forms, setForms] = useState({});
  const statusOptions = ['跟进中', '已报价', '已确认意向', '签订合同中', '已付款', '已发货', '失败'];

  if (dueFollowUps.length === 0) return null;

  function updateForm(id, field, value) {
    setForms((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function handleSubmit(inqId) {
    const form = forms[inqId] || {};
    const status = form.status || '跟进中';
    const note = (form.note || '').trim();
    if (!note) return;
    const now = new Date().toISOString();
    const inquiry = dueFollowUps.find((i) => i.id === inqId);
    const followUps = [...(inquiry?.follow_ups || [])];
    followUps.push({ at: now, note, status });

    if (status === '失败') {
      await onUpdateInquiry(inqId, { status, follow_ups: followUps, completed: true });
    } else {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 2);
      await onUpdateInquiry(inqId, {
        status,
        follow_ups: followUps,
        last_inquiry_at: now,
        next_follow_up_at: nextDate.toISOString(),
      });
    }
    setForms((prev) => { const n = { ...prev }; delete n[inqId]; return n; });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm px-4 py-10">
      <div className="w-full max-w-xl rounded-[1.75rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-100"><BellRing className="text-red-600" size={20} /></div>
            <div><p className="text-lg font-semibold text-slate-950">2 天回访提醒</p><p className="text-xs text-slate-500">· {dueFollowUps.length} 条逾期询盘要跟进</p></div>
          </div>
          <span className="grid h-7 min-w-7 place-items-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">{dueFollowUps.length}</span>
        </div>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
          {dueFollowUps.map((inq) => {
            const form = forms[inq.id] || {};
            return (
              <div key={inq.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{inq.full_name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{inq.target_model} · {inq.destination_country} · {inq.channel}</p>
                  </div>
                  <span className="status-pill bg-red-50 text-red-700 text-xs">逾期</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{inq.event_note}</p>
                {inq.follow_ups?.length > 0 && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-semibold text-slate-500">历史跟进</p>
                    {inq.follow_ups.map((fu, idx) => (
                      <p key={idx} className="mt-1 text-xs text-slate-600">
                        {new Date(fu.at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} [{fu.status}] {fu.note}
                      </p>
                    ))}
                  </div>
                )}
                <div className="mt-4 space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-500">跟进结果</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {statusOptions.map((opt) => (
                        <button key={opt} onClick={() => updateForm(inq.id, 'status', opt)}
                          className={clsx('rounded-full px-3 py-1.5 text-xs font-medium transition', form.status === opt ? 'bg-[#2563EB] text-white' : 'bg-white text-slate-600 border border-slate-200')}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2563EB]" rows={2} placeholder="输入跟进备注..." value={form.note || ''} onChange={(e) => updateForm(inq.id, 'note', e.target.value)} />
                  <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700" onClick={() => handleSubmit(inq.id)} disabled={!(form.note || '').trim()}>
                    <Send size={16} />提交跟进
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---- Contract Builder (unchanged core logic) -----------------------------
function ContractBuilder() {
  const [contract, setContract] = useState({
    buyerName: '',
    buyerAddress: '',
    contractDate: todayForInput,
    signingPlace: 'BEIJING',
    destination: '',
    loadingPort: 'Ningbo',
    latestShipmentDate: todayForInput,
    remark: '汽车下卡片钥匙/脚垫+7KW充电桩',
    depositAmount: '',
    items: [
      { model: '', quantity: '', color: '', unitPrice: '' },
      { model: '', quantity: '', color: '', unitPrice: '' },
      { model: '', quantity: '', color: '', unitPrice: '' },
      { model: '', quantity: '', color: '', unitPrice: '' },
    ],
  });
  const [generated, setGenerated] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const contractPreview = getNextContractNumberPreview(contract.contractDate);
  const totalAmount = contract.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);

  useEffect(() => { return () => { if (generated?.url) window.URL.revokeObjectURL(generated.url); }; }, [generated]);

  function updateContract(key, value) { setContract((c) => ({ ...c, [key]: value })); }
  function updateItem(index, key, value) {
    setContract((c) => ({ ...c, items: c.items.map((item, i) => i === index ? { ...item, [key]: value } : item) }));
  }
  function addVehicleRow() {
    setContract((c) => ({ ...c, items: [...c.items, { model: '', quantity: '', color: '', unitPrice: '' }] }));
  }
  function removeVehicleRow(index) {
    setContract((c) => ({ ...c, items: c.items.length === 1 ? c.items : c.items.filter((_, i) => i !== index) }));
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setError('');
    try {
      const contractNo = reserveNextContractNumber(contract.contractDate);
      const response = await fetch('/templates/sales-contract-template.xlsx');
      if (!response.ok) throw new Error('模板文件读取失败');
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await response.arrayBuffer());
      const sheet = workbook.worksheets[0];
      const activeItems = contract.items.filter((item) => item.model || item.quantity || item.color || item.unitPrice);
      const rowCount = Math.max(activeItems.length, 1);
      const templateVehicleRows = 4;
      const extraRows = Math.max(rowCount - 4, 0);
      const unusedTemplateRows = Math.max(templateVehicleRows - rowCount, 0);

      if (extraRows > 0) {
        sheet.spliceRows(13, 0, ...Array.from({ length: extraRows }, () => []));
        for (let row = 13; row < 13 + extraRows; row += 1) copyRowStyle(sheet, 12, row);
      }
      if (unusedTemplateRows > 0) sheet.spliceRows(9 + rowCount, unusedTemplateRows);
      resetContractTemplateMerges(sheet, rowCount - templateVehicleRows);

      const totalRow = 9 + rowCount;
      const remarkRow = totalRow + 1;
      const totalValueRow = totalRow + 2;
      const shipmentRow = totalRow + 3;
      const destinationRow = totalRow + 4;
      const marginRow = totalRow + 17;

      sheet.getCell('E1').value = contractNo;
      sheet.getCell('E2').value = contract.contractDate;
      sheet.getCell('E3').value = contract.signingPlace;
      sheet.getCell('A4').value = 'THE BUYER: ' + contract.buyerName;
      sheet.getCell('A5').value = 'ADDRESS: ' + contract.buyerAddress;
      sheet.getCell('A' + remarkRow).value = '备注: ' + contract.remark;
      sheet.getCell('A' + totalValueRow).value = 'TOTAL VALUE/合计: ' + numberToEnglishWords(totalAmount) + ' ONLY';
      sheet.getCell('B' + shipmentRow).value = contract.latestShipmentDate;
      sheet.getCell('B' + destinationRow).value = contract.destination;
      sheet.getCell('E' + destinationRow).value = contract.loadingPort;
      sheet.getCell('A' + marginRow).value = 'Margin Clause/保证金条款：To expedite the delivery of the order, the buyer can first pay 30%-25% of the contract amount as a deposit: RMB ' + formatMoney(Number(contract.depositAmount) || 0);

      for (let i = 0; i < activeItems.length; i += 1) {
        const row = 9 + i;
        sheet.getCell('A' + row).value = i + 1;
        sheet.getCell('B' + row).value = activeItems[i].model;
        sheet.getCell('C' + row).value = Number(activeItems[i].quantity) || 0;
        sheet.getCell('D' + row).value = activeItems[i].color;
        sheet.getCell('E' + row).value = Number(activeItems[i].unitPrice) || 0;
      }

      const buf = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      setGenerated({ url, name: contractNo + '.xlsx' });
    } catch (err) {
      setError(err.message || '生成失败');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="grid gap-5 px-3 pb-8 pt-4 sm:px-6 lg:grid-cols-[1.35fr_0.85fr] lg:px-8">
      <section className="space-y-5">
        <div className="panel">
          <div className="flex items-center justify-between gap-3">
            <div><p className="eyebrow">合同生成器</p><h2 className="section-title">销售合同</h2></div>
            <FileText className="text-[#2563EB]" size={20} />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="买方名称" value={contract.buyerName} onChange={(v) => updateContract('buyerName', v)} />
            <Field label="买方地址" value={contract.buyerAddress} onChange={(v) => updateContract('buyerAddress', v)} />
            <Field label="合同日期" type="date" value={contract.contractDate} onChange={(v) => updateContract('contractDate', v)} />
            <Field label="签订地点" value={contract.signingPlace} onChange={(v) => updateContract('signingPlace', v)} />
            <Field label="目的国" value={contract.destination} onChange={(v) => updateContract('destination', v)} />
            <Field label="装运港" value={contract.loadingPort} onChange={(v) => updateContract('loadingPort', v)} />
            <Field label="最晚装船日" type="date" value={contract.latestShipmentDate} onChange={(v) => updateContract('latestShipmentDate', v)} />
            <Field label="定金金额 (RMB)" type="number" value={contract.depositAmount} onChange={(v) => updateContract('depositAmount', v)} />
            <Field className="sm:col-span-2" label="备注" value={contract.remark} onChange={(v) => updateContract('remark', v)} />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">车辆明细</h3>
              <button className="secondary-button" onClick={addVehicleRow}><Plus size={16} />添加行</button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500">
                    <th className="pb-2">车型</th><th className="pb-2">数量</th><th className="pb-2">颜色</th><th className="pb-2">单价 (RMB)</th><th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {contract.items.map((item, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="py-2 pr-2"><input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={item.model} onChange={(e) => updateItem(i, 'model', e.target.value)} /></td>
                      <td className="py-2 pr-2"><input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} /></td>
                      <td className="py-2 pr-2"><input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={item.color} onChange={(e) => updateItem(i, 'color', e.target.value)} /></td>
                      <td className="py-2 pr-2"><input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" type="number" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} /></td>
                      <td className="py-2"><button className="rounded-xl p-2 text-slate-300 hover:bg-red-50 hover:text-red-500" onClick={() => removeVehicleRow(i)}><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button className="primary-button flex-1 justify-center" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              {isGenerating ? '生成中...' : '生成 Excel 合同'}
            </button>
          </div>
          {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
          {generated && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-sm font-semibold text-emerald-800">合同已生成</p><p className="text-xs text-emerald-600">{generated.name}</p></div>
                <a className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white" href={generated.url} download={generated.name}>
                  <Download size={16} />下载
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-5">
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-500">合同编号预览</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{contractPreview}</p>
          <p className="mt-1 text-xs text-slate-400">HP{getDateToken(contract.contractDate)}XX-ZW</p>
        </section>
        <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-950">当前合同合计</p>
          <p className="mt-2 text-3xl font-semibold text-amber-950">RMB {formatMoney(totalAmount)}</p>
          <p className="mt-2 text-sm text-amber-800">{numberToEnglishWords(totalAmount)} ONLY</p>
        </section>
      </aside>
    </div>
  );
}

function Field({ className, label, onChange, type = 'text', value }) {
  return (
    <label className={clsx('block', className)}>
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2563EB]" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

// ---- Mount ------------------------------------------------------------------
createRoot(document.getElementById('root')).render(<App />);
