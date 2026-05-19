'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type React from 'react';
import type { ChallengeAccountDto, ChallengeAIReviewDto, ChallengePersonaDto, ChallengeTradeDto } from '@shared/types/challengeTracker';
import styles from './ToolShell.module.css';
import { useToolsLanguage } from './useToolsLanguage';
import { buildAIReviewContext, calculateChallengeAnalytics, calculateChallengeOverview, calculateRiskStatus, challengePresets, defaultPersonas } from './challengeTrackerModel';

type TabId = 'overview' | 'rules' | 'journal' | 'analytics' | 'risk' | 'ai';
type ApiResult<T> = { success: true; data: T } | { success: false; error?: { message?: string } };
type AccountForm = Record<string, string | boolean>;
type TradeForm = Record<string, string | boolean>;

type Copy = typeof copy.id;

const copy = {
  id: {
    tabs: { overview: 'Overview', rules: 'Rules', journal: 'Journal', analytics: 'Analytics', risk: 'Risk Monitor', ai: 'AI Review' },
    account: 'Akun challenge', newAccount: 'Challenge baru', saveRules: 'Simpan rules', createAccount: 'Buat challenge', archive: 'Archive', restore: 'Restore', refresh: 'Refresh',
    empty: 'Belum ada challenge. Isi Rules lalu simpan challenge pertama.', loading: 'Memuat data challenge...', error: 'Terjadi kesalahan',
    status: { safe: 'Aman', warning: 'Waspada', danger: 'Bahaya', failed: 'Gagal' },
    metrics: {
      initial: 'Saldo awal', balance: 'Saldo saat ini', equity: 'Equity saat ini', pnl: 'P/L berjalan', targetProgress: 'Progress target', remainingTarget: 'Sisa target', dailyLoss: 'Daily loss hari ini', dailyRemaining: 'Sisa daily loss', drawdown: 'Overall drawdown', ddRemaining: 'Sisa drawdown', trades: 'Total trade', winRate: 'Win rate', profitFactor: 'Profit factor', averageRR: 'Average RR', status: 'Status akun', minDays: 'Trading days', discipline: 'Discipline avg', todayTrades: 'Trade hari ini', lossStreak: 'Loss streak', avgRisk: 'Avg risk/trade', expectancy: 'Expectancy', netProfit: 'Net P/L', totalProfit: 'Total profit', totalLoss: 'Total loss', averageWin: 'Average win', averageLoss: 'Average loss', biggestWin: 'Biggest win', biggestLoss: 'Biggest loss', bestPair: 'Pair paling profit', worstPair: 'Pair paling rugi', bestSession: 'Session paling profit', worstSession: 'Session paling rugi', bestSetup: 'Setup terbaik', worstSetup: 'Setup terburuk', mistake: 'Kesalahan sering', emotion: 'Emosi loss sering' },
    sections: { overview: 'Dashboard challenge', progress: 'Progress rules', rules: 'Rules challenge', presets: 'Preset cepat', journalInput: 'Journal Input', journalDash: 'Journal Dashboard', journalTable: 'Journal Table', filters: 'Filter journal', analytics: 'Analytics jurnal', charts: 'Chart sederhana', risk: 'Peringatan risiko', aiSettings: 'Persona & Review Settings', aiChat: 'Chat review', context: 'Preview context' },
    fields: { name: 'Nama challenge', currency: 'Mata uang', initial: 'Saldo awal', currentBalance: 'Saldo saat ini', currentEquity: 'Equity saat ini', targetPct: 'Target profit %', targetAmount: 'Target nominal', dailyPct: 'Max daily loss %', dailyAmount: 'Daily loss nominal', ddPct: 'Max drawdown %', ddAmount: 'Drawdown nominal', minDays: 'Minimum trading days', start: 'Tanggal mulai', end: 'Tanggal berakhir', accountType: 'Tipe akun', drawdownMode: 'Mode drawdown', news: 'News trading boleh', overnight: 'Hold overnight', weekend: 'Hold weekend', consistency: 'Consistency %', maxLot: 'Max lot', maxRisk: 'Max risk/trade %' },
    trade: { date: 'Tanggal', symbol: 'Pair / symbol', session: 'Session', direction: 'Buy/Sell', entry: 'Entry price', sl: 'Stop loss', tp: 'Take profit', exit: 'Exit price', lot: 'Lot size', riskAmount: 'Risk nominal', riskPercent: 'Risk %', result: 'Result', pnl: 'P/L nominal', pnlPercent: 'P/L %', rrPlanned: 'RR planned', rrRealized: 'RR realized', setup: 'Setup name', entryReason: 'Alasan entry', exitReason: 'Alasan exit', emotion: 'Emosi', mistake: 'Kesalahan', confidence: 'Confidence 1-5', disciplineInput: 'Discipline 1-5', quality: 'Quality', followedPlan: 'Followed plan', screenshot: 'Screenshot URL', notes: 'Catatan evaluasi', add: 'Tambah trade', clear: 'Reset form', delete: 'Delete' },
    ai: { persona: 'Persona', personaName: 'Nama persona', personaDescription: 'Deskripsi persona', personaFile: 'Persona File', savePersona: 'Simpan persona', deletePersona: 'Hapus', scope: 'Data direview', style: 'Gaya review', provider: 'Model AI', message: 'Pertanyaan user', reviewJournal: 'Review Journal', reviewLast: 'Review Last Trade', reviewRisk: 'Review Risk', actionPlan: 'Create Action Plan', clear: 'Clear Chat', mock: 'AI Review belum terhubung ke provider. Context sudah berhasil dibuat.' },
    insights: { rr: 'Win rate rendah tetapi RR tinggi. Strategi masih bisa profit jika risk reward dijaga.', loss: 'Win rate tinggi namun akun masih loss. Evaluasi average loss dan disiplin cut loss.', overtrade: 'Jumlah trade hari ini melebihi batas. Pertimbangkan berhenti trading.', lossStreak: 'Loss streak mencapai 3 atau lebih. Istirahat dan evaluasi setup sebelum entry berikutnya.', noWarnings: 'Belum ada warning besar dari data jurnal.' },
  },
  en: {
    tabs: { overview: 'Overview', rules: 'Rules', journal: 'Journal', analytics: 'Analytics', risk: 'Risk Monitor', ai: 'AI Review' },
    account: 'Challenge account', newAccount: 'New challenge', saveRules: 'Save rules', createAccount: 'Create challenge', archive: 'Archive', restore: 'Restore', refresh: 'Refresh',
    empty: 'No challenge yet. Fill Rules and save your first challenge.', loading: 'Loading challenge data...', error: 'Something went wrong',
    status: { safe: 'Safe', warning: 'Warning', danger: 'Danger', failed: 'Failed' },
    metrics: { initial: 'Starting balance', balance: 'Current balance', equity: 'Current equity', pnl: 'Running P/L', targetProgress: 'Target progress', remainingTarget: 'Remaining target', dailyLoss: 'Daily loss today', dailyRemaining: 'Daily remaining', drawdown: 'Overall drawdown', ddRemaining: 'Drawdown remaining', trades: 'Total trades', winRate: 'Win rate', profitFactor: 'Profit factor', averageRR: 'Average RR', status: 'Account status', minDays: 'Trading days', discipline: 'Discipline avg', todayTrades: 'Trades today', lossStreak: 'Loss streak', avgRisk: 'Avg risk/trade', expectancy: 'Expectancy', netProfit: 'Net P/L', totalProfit: 'Total profit', totalLoss: 'Total loss', averageWin: 'Average win', averageLoss: 'Average loss', biggestWin: 'Biggest win', biggestLoss: 'Biggest loss', bestPair: 'Best pair', worstPair: 'Worst pair', bestSession: 'Best session', worstSession: 'Worst session', bestSetup: 'Best setup', worstSetup: 'Worst setup', mistake: 'Frequent mistake', emotion: 'Frequent loss emotion' },
    sections: { overview: 'Challenge dashboard', progress: 'Rules progress', rules: 'Challenge rules', presets: 'Quick presets', journalInput: 'Journal Input', journalDash: 'Journal Dashboard', journalTable: 'Journal Table', filters: 'Journal filters', analytics: 'Journal analytics', charts: 'Simple charts', risk: 'Risk warnings', aiSettings: 'Persona & Review Settings', aiChat: 'Review chat', context: 'Context preview' },
    fields: { name: 'Challenge name', currency: 'Currency', initial: 'Starting balance', currentBalance: 'Current balance', currentEquity: 'Current equity', targetPct: 'Profit target %', targetAmount: 'Target amount', dailyPct: 'Max daily loss %', dailyAmount: 'Daily loss amount', ddPct: 'Max drawdown %', ddAmount: 'Drawdown amount', minDays: 'Minimum trading days', start: 'Start date', end: 'End date', accountType: 'Account type', drawdownMode: 'Drawdown mode', news: 'News trading allowed', overnight: 'Hold overnight', weekend: 'Hold weekend', consistency: 'Consistency %', maxLot: 'Max lot', maxRisk: 'Max risk/trade %' },
    trade: { date: 'Date', symbol: 'Pair / symbol', session: 'Session', direction: 'Buy/Sell', entry: 'Entry price', sl: 'Stop loss', tp: 'Take profit', exit: 'Exit price', lot: 'Lot size', riskAmount: 'Risk amount', riskPercent: 'Risk %', result: 'Result', pnl: 'P/L amount', pnlPercent: 'P/L %', rrPlanned: 'RR planned', rrRealized: 'RR realized', setup: 'Setup name', entryReason: 'Entry reason', exitReason: 'Exit reason', emotion: 'Emotion', mistake: 'Mistake', confidence: 'Confidence 1-5', disciplineInput: 'Discipline 1-5', quality: 'Quality', followedPlan: 'Followed plan', screenshot: 'Screenshot URL', notes: 'Evaluation notes', add: 'Add trade', clear: 'Reset form', delete: 'Delete' },
    ai: { persona: 'Persona', personaName: 'Persona name', personaDescription: 'Persona description', personaFile: 'Persona File', savePersona: 'Save persona', deletePersona: 'Delete', scope: 'Review data', style: 'Review style', provider: 'AI model', message: 'User question', reviewJournal: 'Review Journal', reviewLast: 'Review Last Trade', reviewRisk: 'Review Risk', actionPlan: 'Create Action Plan', clear: 'Clear Chat', mock: 'AI Review is not connected to a provider yet. Context was built successfully.' },
    insights: { rr: 'Win rate is low but RR is high. The strategy can still work if reward-risk is maintained.', loss: 'Win rate is high but the account is losing. Review average loss and cutting discipline.', overtrade: 'Trades today exceed the rule. Consider stopping for the day.', lossStreak: 'Loss streak is 3 or more. Rest and review setup quality before the next entry.', noWarnings: 'No major journal warning yet.' },
  },
};

const today = () => new Date().toISOString().slice(0, 10);
const emptyAccountForm = (): AccountForm => ({ name: 'Phase 1', accountCurrency: 'USD', initialBalance: '10000', currentBalance: '10000', currentEquity: '10000', profitTargetPercent: '10', profitTargetAmount: '1000', maxDailyLossPercent: '5', maxDailyLossAmount: '500', maxOverallDrawdownPercent: '10', maxOverallDrawdownAmount: '1000', minTradingDays: '5', startDate: today(), endDate: '', accountType: 'evaluation', drawdownMode: 'static', newsTradingAllowed: false, holdOvernightAllowed: false, holdWeekendAllowed: false, consistencyRulePercent: '', maxLot: '', maxRiskPerTradePercent: '1', maxTradesPerDay: '5', presetId: 'prop_firm_standard' });
const emptyTradeForm = (): TradeForm => ({ tradeDate: today(), symbol: 'XAUUSD', session: 'london', direction: 'buy', entryPrice: '', stopLoss: '', takeProfit: '', exitPrice: '', lotSize: '', riskAmount: '', riskPercent: '1', result: 'loss', pnlAmount: '', pnlPercent: '', rrPlanned: '', rrRealized: '', setupName: '', entryReason: '', exitReason: '', emotionalState: 'calm', mistakeCategory: 'no_mistake', confidenceLevel: '3', disciplineInputScore: '3', tradeQuality: 'b', followedPlan: true, screenshotUrl: '', evaluationNotes: '' });
const filtersDefault = { date: '', symbol: '', result: '', session: '', setup: '' };

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) } });
  const json = await res.json().catch(() => null) as ApiResult<T> | null;
  if (!res.ok || !json || !json.success) throw new Error(json && !json.success ? json.error?.message ?? 'API error' : 'API error');
  return json.data;
}

function n(value: unknown) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function f(value: number, currency = 'USD') { return new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: currency === 'IDR' ? 0 : 2 }).format(value || 0); }
function p(value: number) { return `${(value || 0).toFixed(1)}%`; }
function safeValue(value: unknown) { return value === null || value === undefined || value === '' ? null : value; }

function formFromAccount(account: ChallengeAccountDto): AccountForm {
  return {
    name: account.name, accountCurrency: account.accountCurrency, initialBalance: String(account.initialBalance), currentBalance: String(account.currentBalance), currentEquity: String(account.currentEquity), profitTargetPercent: String(account.profitTargetPercent ?? ''), profitTargetAmount: String(account.profitTargetAmount ?? ''), maxDailyLossPercent: String(account.maxDailyLossPercent ?? ''), maxDailyLossAmount: String(account.maxDailyLossAmount ?? ''), maxOverallDrawdownPercent: String(account.maxOverallDrawdownPercent ?? ''), maxOverallDrawdownAmount: String(account.maxOverallDrawdownAmount ?? ''), minTradingDays: String(account.minTradingDays), startDate: account.startDate ?? '', endDate: account.endDate ?? '', accountType: account.accountType, drawdownMode: account.drawdownMode, newsTradingAllowed: account.newsTradingAllowed, holdOvernightAllowed: account.holdOvernightAllowed, holdWeekendAllowed: account.holdWeekendAllowed, consistencyRulePercent: String(account.consistencyRulePercent ?? ''), maxLot: String(account.maxLot ?? ''), maxRiskPerTradePercent: String(account.maxRiskPerTradePercent ?? ''), maxTradesPerDay: String(account.maxTradesPerDay ?? ''), presetId: account.presetId ?? ''
  };
}

function accountPayload(form: AccountForm) {
  return { ...form, profitTargetAmount: safeValue(form.profitTargetAmount), maxDailyLossAmount: safeValue(form.maxDailyLossAmount), maxOverallDrawdownAmount: safeValue(form.maxOverallDrawdownAmount), endDate: safeValue(form.endDate), consistencyRulePercent: safeValue(form.consistencyRulePercent), maxLot: safeValue(form.maxLot), maxRiskPerTradePercent: safeValue(form.maxRiskPerTradePercent), maxTradesPerDay: safeValue(form.maxTradesPerDay), presetId: safeValue(form.presetId) };
}
function tradePayload(form: TradeForm) {
  return { ...form, entryPrice: safeValue(form.entryPrice), stopLoss: safeValue(form.stopLoss), takeProfit: safeValue(form.takeProfit), exitPrice: safeValue(form.exitPrice), lotSize: safeValue(form.lotSize), riskAmount: safeValue(form.riskAmount), riskPercent: safeValue(form.riskPercent), pnlPercent: safeValue(form.pnlPercent), rrPlanned: safeValue(form.rrPlanned), rrRealized: safeValue(form.rrRealized), setupName: safeValue(form.setupName), entryReason: safeValue(form.entryReason), exitReason: safeValue(form.exitReason), confidenceLevel: safeValue(form.confidenceLevel), disciplineInputScore: safeValue(form.disciplineInputScore), screenshotUrl: safeValue(form.screenshotUrl), evaluationNotes: safeValue(form.evaluationNotes) };
}

function Metric({ label, value, primary, tone }: { label: string; value: string; primary?: boolean; tone?: 'bad' | 'good' }) {
  return <article className={`${styles.metric} ${primary ? styles.metricPrimary : ''}`}><span>{label}</span><strong className={tone === 'bad' ? styles.negativeValue : tone === 'good' ? styles.positiveValue : ''}>{value}</strong></article>;
}
function Progress({ label, value }: { label: string; value: number }) {
  return <div className={styles.progressItem}><div><span>{label}</span><strong>{p(value)}</strong></div><div className={styles.progressTrack}><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div></div>;
}
function StatusBadge({ status, labels }: { status: 'safe' | 'warning' | 'danger' | 'failed'; labels: Copy['status'] }) {
  const cls = status === 'safe' ? styles.badge : status === 'warning' ? styles.badgeWarning : styles.badgeDanger;
  return <span className={cls}>{labels[status]}</span>;
}
function TextField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <div className={styles.field}><label>{label}</label><input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}
function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <div className={styles.field}><label>{label}</label><select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></div>;
}

export function ChallengeTrackerTool() {
  const { language } = useToolsLanguage();
  const t = copy[language];
  const [tab, setTab] = useState<TabId>('overview');
  const [accounts, setAccounts] = useState<ChallengeAccountDto[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [trades, setTrades] = useState<ChallengeTradeDto[]>([]);
  const [personas, setPersonas] = useState<ChallengePersonaDto[]>([]);
  const [reviews, setReviews] = useState<ChallengeAIReviewDto[]>([]);
  const [accountForm, setAccountForm] = useState<AccountForm>(emptyAccountForm);
  const [tradeForm, setTradeForm] = useState<TradeForm>(emptyTradeForm);
  const [filters, setFilters] = useState(filtersDefault);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiState, setAiState] = useState({ selectedPersona: 'Strict Prop Firm Coach', customPersonaText: '', personaName: 'Prop Firm Evaluator', personaDescription: '', reviewScope: 'all', reviewStyle: 'Action plan', provider: 'OpenAI', userMessage: '', contextPreview: '', assistant: '' });

  const selected = accounts.find((account) => account.id === selectedId) ?? null;
  const analytics = useMemo(() => calculateChallengeAnalytics(trades), [trades]);
  const effectiveAccount = useMemo(() => selected ? { ...selected, currentBalance: selected.initialBalance + analytics.netProfit, currentEquity: selected.initialBalance + analytics.netProfit } : null, [selected, analytics.netProfit]);
  const overview = useMemo(() => effectiveAccount ? calculateChallengeOverview(effectiveAccount, trades) : null, [effectiveAccount, trades]);
  const riskStatus = overview?.riskStatus;
  const filteredTrades = useMemo(() => trades.filter((trade) => (!filters.date || trade.tradeDate === filters.date) && (!filters.symbol || trade.symbol.toLowerCase().includes(filters.symbol.toLowerCase())) && (!filters.result || trade.result === filters.result) && (!filters.session || trade.session === filters.session) && (!filters.setup || (trade.setupName ?? '').toLowerCase().includes(filters.setup.toLowerCase()))), [trades, filters]);
  const journalInsights = useMemo(() => {
    const items: string[] = [];
    if (analytics.winRate < 40 && analytics.averageRR >= 1.5) items.push(t.insights.rr);
    if (analytics.winRate > 55 && analytics.netProfit < 0) items.push(t.insights.loss);
    if (effectiveAccount?.maxTradesPerDay && analytics.tradesToday > effectiveAccount.maxTradesPerDay) items.push(t.insights.overtrade);
    if (analytics.currentLossStreak >= 3) items.push(t.insights.lossStreak);
    return items.length ? items : [t.insights.noWarnings];
  }, [analytics, effectiveAccount?.maxTradesPerDay, t]);

  async function loadAll(preferredId?: string) {
    setLoading(true);
    try {
      const data = await apiFetch<{ accounts: ChallengeAccountDto[] }>('/api/tools/challenge-tracker/accounts');
      setAccounts(data.accounts);
      const nextId = preferredId || selectedId || data.accounts[0]?.id || '';
      setSelectedId(nextId);
      const account = data.accounts.find((item) => item.id === nextId) || data.accounts[0];
      setAccountForm(account ? formFromAccount(account) : emptyAccountForm());
      if (nextId) {
        const [tradeData, personaData, reviewData] = await Promise.all([
          apiFetch<{ trades: ChallengeTradeDto[] }>(`/api/tools/challenge-tracker/accounts/${nextId}/trades`),
          apiFetch<{ personas: ChallengePersonaDto[] }>('/api/tools/challenge-tracker/personas'),
          apiFetch<{ reviews: ChallengeAIReviewDto[] }>(`/api/tools/challenge-tracker/accounts/${nextId}/ai-reviews`),
        ]);
        setTrades(tradeData.trades);
        setPersonas(personaData.personas);
        setReviews(reviewData.reviews);
      } else {
        setTrades([]); setReviews([]);
        const personaData = await apiFetch<{ personas: ChallengePersonaDto[] }>('/api/tools/challenge-tracker/personas');
        setPersonas(personaData.personas);
      }
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAll(); }, []);
  useEffect(() => { if (selected) setAccountForm(formFromAccount(selected)); }, [selectedId]);

  function setAccountField(key: string, value: string | boolean) {
    setAccountForm((form) => {
      const next = { ...form, [key]: value };
      const initial = n(next.initialBalance);
      if (key === 'initialBalance' || key === 'profitTargetPercent') next.profitTargetAmount = next.profitTargetPercent === '' ? next.profitTargetAmount : String((initial * n(next.profitTargetPercent)) / 100);
      if (key === 'initialBalance' || key === 'maxDailyLossPercent') next.maxDailyLossAmount = next.maxDailyLossPercent === '' ? next.maxDailyLossAmount : String((initial * n(next.maxDailyLossPercent)) / 100);
      if (key === 'initialBalance' || key === 'maxOverallDrawdownPercent') next.maxOverallDrawdownAmount = next.maxOverallDrawdownPercent === '' ? next.maxOverallDrawdownAmount : String((initial * n(next.maxOverallDrawdownPercent)) / 100);
      return next;
    });
  }
  function applyPreset(id: string) {
    const preset = challengePresets.find((item) => item.id === id);
    if (!preset) return;
    const initial = n(accountForm.initialBalance) || 10000;
    setAccountForm((form) => ({ ...form, presetId: preset.id, name: preset.name, profitTargetPercent: String(preset.profitTargetPercent), profitTargetAmount: String((initial * preset.profitTargetPercent) / 100), maxDailyLossPercent: String(preset.maxDailyLossPercent), maxDailyLossAmount: String((initial * preset.maxDailyLossPercent) / 100), maxOverallDrawdownPercent: String(preset.maxOverallDrawdownPercent), maxOverallDrawdownAmount: String((initial * preset.maxOverallDrawdownPercent) / 100), minTradingDays: String(preset.minTradingDays), accountType: preset.accountType, drawdownMode: preset.drawdownMode }));
  }
  async function saveAccount(event: FormEvent) {
    event.preventDefault();
    try {
      const payload = JSON.stringify(accountPayload(accountForm));
      const data = selectedId ? await apiFetch<{ account: ChallengeAccountDto }>(`/api/tools/challenge-tracker/accounts/${selectedId}`, { method: 'PATCH', body: payload }) : await apiFetch<{ account: ChallengeAccountDto }>('/api/tools/challenge-tracker/accounts', { method: 'POST', body: payload });
      await loadAll(data.account.id);
      setTab('overview');
    } catch (error) { setMessage(error instanceof Error ? error.message : t.error); }
  }
  async function archiveAccount(archived: boolean) {
    if (!selectedId) return;
    const data = await apiFetch<{ account: ChallengeAccountDto }>(`/api/tools/challenge-tracker/accounts/${selectedId}/archive`, { method: 'POST', body: JSON.stringify({ archived }) });
    await loadAll(data.account.id);
  }
  async function addTrade(event: FormEvent) {
    event.preventDefault();
    if (!selectedId) return;
    try {
      await apiFetch<{ trade: ChallengeTradeDto }>(`/api/tools/challenge-tracker/accounts/${selectedId}/trades`, { method: 'POST', body: JSON.stringify(tradePayload(tradeForm)) });
      setTradeForm(emptyTradeForm());
      await loadAll(selectedId);
    } catch (error) { setMessage(error instanceof Error ? error.message : t.error); }
  }
  async function deleteTrade(id: string) {
    await apiFetch<{ deleted: boolean }>(`/api/tools/challenge-tracker/trades/${id}`, { method: 'DELETE' });
    await loadAll(selectedId);
  }
  async function savePersona() {
    const data = await apiFetch<{ persona: ChallengePersonaDto }>('/api/tools/challenge-tracker/personas', { method: 'POST', body: JSON.stringify({ name: aiState.personaName, description: aiState.personaDescription, content: aiState.customPersonaText || defaultPersonas['Strict Prop Firm Coach'], isDefault: false }) });
    setPersonas((items) => [data.persona, ...items]);
    setAiState((state) => ({ ...state, selectedPersona: data.persona.name, customPersonaText: data.persona.content }));
  }
  async function deletePersona(id: string) {
    await apiFetch<{ deleted: boolean }>(`/api/tools/challenge-tracker/personas/${id}`, { method: 'DELETE' });
    setPersonas((items) => items.filter((item) => item.id !== id));
  }
  async function runReview(mode?: 'last_trade' | 'risk' | 'action') {
    if (!selectedId || !effectiveAccount) return;
    const reviewScope = mode === 'last_trade' ? 'last_trade' : mode === 'risk' ? 'risk' : aiState.reviewScope;
    const reviewStyle = mode === 'action' ? 'Action plan' : aiState.reviewStyle;
    const localContext = buildAIReviewContext({ challengeConfig: effectiveAccount, trades: trades as unknown as Array<Record<string, unknown>>, analytics, riskStatus: riskStatus ?? calculateRiskStatus(effectiveAccount, trades), selectedPersona: aiState.selectedPersona, customPersonaText: aiState.customPersonaText, reviewScope, reviewStyle, userMessage: aiState.userMessage });
    setAiState((state) => ({ ...state, contextPreview: [localContext.systemPrompt, localContext.contextPrompt, localContext.userPrompt].join('\n\n---\n\n') }));
    const data = await apiFetch<{ review: ChallengeAIReviewDto; prompts: { systemPrompt: string; contextPrompt: string; userPrompt: string } }>(`/api/tools/challenge-tracker/accounts/${selectedId}/ai-reviews`, { method: 'POST', body: JSON.stringify({ ...aiState, reviewScope, reviewStyle }) });
    setReviews((items) => [data.review, ...items]);
    setAiState((state) => ({ ...state, assistant: data.review.assistantResponse, contextPreview: [data.prompts.systemPrompt, data.prompts.contextPrompt, data.prompts.userPrompt].join('\n\n---\n\n') }));
  }

  if (loading) return <section className={styles.panel}><p>{t.loading}</p></section>;

  return (
    <section className={styles.challengeShell}>
      <div className={styles.challengeToolbar}>
        <div className={styles.field}>
          <label>{t.account}</label>
          <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            <option value="">{t.newAccount}</option>
            {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}{account.archivedAt ? ' (archived)' : ''}</option>)}
          </select>
        </div>
        <button type="button" className="btn-secondary" onClick={() => { setSelectedId(''); setAccountForm(emptyAccountForm()); setTrades([]); setTab('rules'); }}>{t.newAccount}</button>
        <button type="button" className="btn-secondary" onClick={() => void loadAll(selectedId)}>{t.refresh}</button>
      </div>
      {message ? <p className={styles.error}>{message}</p> : null}
      <nav className={styles.tabNav} aria-label="Challenge Tracker tabs">
        {(Object.keys(t.tabs) as TabId[]).map((item) => <button key={item} type="button" className={tab === item ? styles.tabActive : ''} onClick={() => setTab(item)}>{t.tabs[item]}</button>)}
      </nav>
      {!selected && tab !== 'rules' ? <section className={styles.emptyState}><p>{t.empty}</p><button type="button" onClick={() => setTab('rules')}>{t.createAccount}</button></section> : null}
      {tab === 'overview' && selected && effectiveAccount && overview && riskStatus ? <Overview t={t} account={effectiveAccount} analytics={analytics} overview={overview} riskStatus={riskStatus} /> : null}
      {tab === 'rules' ? <Rules t={t} form={accountForm} setField={setAccountField} applyPreset={applyPreset} onSubmit={saveAccount} selected={selected} onArchive={archiveAccount} /> : null}
      {tab === 'journal' && selected ? <Journal t={t} form={tradeForm} setForm={setTradeForm} onSubmit={addTrade} filters={filters} setFilters={setFilters} trades={filteredTrades} analytics={analytics} insights={journalInsights} onDelete={deleteTrade} currency={selected.accountCurrency} /> : null}
      {tab === 'analytics' && selected ? <Analytics t={t} analytics={analytics} trades={trades} currency={selected.accountCurrency} /> : null}
      {tab === 'risk' && selected && effectiveAccount && riskStatus ? <RiskMonitor t={t} account={effectiveAccount} analytics={analytics} riskStatus={riskStatus} insights={journalInsights} /> : null}
      {tab === 'ai' && selected ? <AIReview t={t} aiState={aiState} setAiState={setAiState} personas={personas} reviews={reviews} savePersona={savePersona} deletePersona={deletePersona} runReview={runReview} /> : null}
    </section>
  );
}

function Overview({ t, account, analytics, overview, riskStatus }: { t: Copy; account: ChallengeAccountDto; analytics: ReturnType<typeof calculateChallengeAnalytics>; overview: ReturnType<typeof calculateChallengeOverview>; riskStatus: ReturnType<typeof calculateRiskStatus> }) {
  const c = account.accountCurrency;
  const tradingDays = new Set((analytics.totalTrades ? [] : []) as string[]);
  return <section className={styles.panel}><div className={styles.sectionHeader}><div><h2>{t.sections.overview}</h2><p>{account.name}</p></div><StatusBadge status={riskStatus.status} labels={t.status} /></div><div className={styles.resultGrid}><Metric label={t.metrics.initial} value={f(account.initialBalance, c)} /><Metric label={t.metrics.balance} value={f(account.currentBalance, c)} /><Metric label={t.metrics.equity} value={f(account.currentEquity, c)} /><Metric label={t.metrics.pnl} value={f(overview.runningPnl, c)} tone={overview.runningPnl >= 0 ? 'good' : 'bad'} primary /><Metric label={t.metrics.remainingTarget} value={f(overview.remainingTarget, c)} /><Metric label={t.metrics.dailyLoss} value={f(riskStatus.dailyLoss, c)} tone="bad" /><Metric label={t.metrics.drawdown} value={f(riskStatus.overallDrawdown, c)} tone="bad" /><Metric label={t.metrics.status} value={t.status[riskStatus.status]} primary /><Metric label={t.metrics.trades} value={String(analytics.totalTrades)} /><Metric label={t.metrics.winRate} value={p(analytics.winRate)} /><Metric label={t.metrics.profitFactor} value={Number.isFinite(analytics.profitFactor) ? analytics.profitFactor.toFixed(2) : '∞'} /><Metric label={t.metrics.averageRR} value={`${analytics.averageRR.toFixed(2)}R`} /></div><div className={styles.progressGrid}><Progress label={t.metrics.targetProgress} value={overview.targetProgressPct} /><Progress label={t.metrics.dailyLoss} value={riskStatus.dailyLossUsagePct} /><Progress label={t.metrics.drawdown} value={riskStatus.overallDrawdownUsagePct} /><Progress label={t.metrics.minDays} value={account.minTradingDays ? (tradingDays.size / account.minTradingDays) * 100 : 100} /></div></section>;
}
function Rules({ t, form, setField, applyPreset, onSubmit, selected, onArchive }: { t: Copy; form: AccountForm; setField: (k: string, v: string | boolean) => void; applyPreset: (id: string) => void; onSubmit: (e: FormEvent) => void; selected: ChallengeAccountDto | null; onArchive: (archived: boolean) => void }) {
  return <form className={styles.panel} onSubmit={onSubmit}><div className={styles.sectionHeader}><div><h2>{t.sections.rules}</h2><p>{t.sections.presets}</p></div>{selected ? <button type="button" className="btn-secondary" onClick={() => void onArchive(!selected.archivedAt)}>{selected.archivedAt ? t.restore : t.archive}</button> : null}</div><div className={styles.presetGrid}>{challengePresets.map((preset) => <button type="button" key={preset.id} className={`${styles.presetButton} ${form.presetId === preset.id ? styles.presetActive : ''}`} onClick={() => applyPreset(preset.id)}><strong>{preset.name}</strong><span>{preset.profitTargetPercent}% target · {preset.maxDailyLossPercent}% daily · {preset.maxOverallDrawdownPercent}% DD</span></button>)}</div><div className={styles.formGridThree}><TextField label={t.fields.name} value={String(form.name)} onChange={(v) => setField('name', v)} /><SelectField label={t.fields.currency} value={String(form.accountCurrency)} onChange={(v) => setField('accountCurrency', v)}><option>IDR</option><option>USD</option><option>EUR</option><option>GBP</option></SelectField><TextField label={t.fields.initial} value={String(form.initialBalance)} onChange={(v) => setField('initialBalance', v)} type="number" /><TextField label={t.fields.currentBalance} value={String(form.currentBalance)} onChange={(v) => setField('currentBalance', v)} type="number" /><TextField label={t.fields.currentEquity} value={String(form.currentEquity)} onChange={(v) => setField('currentEquity', v)} type="number" /><TextField label={t.fields.targetPct} value={String(form.profitTargetPercent)} onChange={(v) => setField('profitTargetPercent', v)} type="number" /><TextField label={t.fields.targetAmount} value={String(form.profitTargetAmount)} onChange={(v) => setField('profitTargetAmount', v)} type="number" /><TextField label={t.fields.dailyPct} value={String(form.maxDailyLossPercent)} onChange={(v) => setField('maxDailyLossPercent', v)} type="number" /><TextField label={t.fields.dailyAmount} value={String(form.maxDailyLossAmount)} onChange={(v) => setField('maxDailyLossAmount', v)} type="number" /><TextField label={t.fields.ddPct} value={String(form.maxOverallDrawdownPercent)} onChange={(v) => setField('maxOverallDrawdownPercent', v)} type="number" /><TextField label={t.fields.ddAmount} value={String(form.maxOverallDrawdownAmount)} onChange={(v) => setField('maxOverallDrawdownAmount', v)} type="number" /><TextField label={t.fields.minDays} value={String(form.minTradingDays)} onChange={(v) => setField('minTradingDays', v)} type="number" /><TextField label={t.fields.start} value={String(form.startDate)} onChange={(v) => setField('startDate', v)} type="date" /><TextField label={t.fields.end} value={String(form.endDate)} onChange={(v) => setField('endDate', v)} type="date" /><SelectField label={t.fields.accountType} value={String(form.accountType)} onChange={(v) => setField('accountType', v)}><option value="personal">Personal</option><option value="prop_firm">Prop Firm</option><option value="funded">Funded</option><option value="evaluation">Evaluation</option></SelectField><SelectField label={t.fields.drawdownMode} value={String(form.drawdownMode)} onChange={(v) => setField('drawdownMode', v)}><option value="static">Static</option><option value="trailing">Trailing</option><option value="balance_based">Balance-based</option><option value="equity_based">Equity-based</option></SelectField><TextField label={t.fields.consistency} value={String(form.consistencyRulePercent)} onChange={(v) => setField('consistencyRulePercent', v)} type="number" /><TextField label={t.fields.maxLot} value={String(form.maxLot)} onChange={(v) => setField('maxLot', v)} type="number" /><TextField label={t.fields.maxRisk} value={String(form.maxRiskPerTradePercent)} onChange={(v) => setField('maxRiskPerTradePercent', v)} type="number" /></div><div className={styles.statusLine}>{(['newsTradingAllowed', 'holdOvernightAllowed', 'holdWeekendAllowed'] as const).map((key) => <label key={key} className={styles.checkPill}><input type="checkbox" checked={Boolean(form[key])} onChange={(event) => setField(key, event.target.checked)} />{key === 'newsTradingAllowed' ? t.fields.news : key === 'holdOvernightAllowed' ? t.fields.overnight : t.fields.weekend}</label>)}</div><div className={styles.actions}><button type="submit">{selected ? t.saveRules : t.createAccount}</button></div></form>;
}
function Journal({ t, form, setForm, onSubmit, filters, setFilters, trades, analytics, insights, onDelete, currency }: { t: Copy; form: TradeForm; setForm: React.Dispatch<React.SetStateAction<TradeForm>>; onSubmit: (e: FormEvent) => void; filters: typeof filtersDefault; setFilters: React.Dispatch<React.SetStateAction<typeof filtersDefault>>; trades: ChallengeTradeDto[]; analytics: ReturnType<typeof calculateChallengeAnalytics>; insights: string[]; onDelete: (id: string) => void; currency: string }) {
  const set = (k: string, v: string | boolean) => setForm((state) => ({ ...state, [k]: v }));
  return <section className={styles.detailSection}><form className={styles.panel} onSubmit={onSubmit}><h2>{t.sections.journalInput}</h2><div className={styles.formGridThree}><TextField label={t.trade.date} value={String(form.tradeDate)} onChange={(v) => set('tradeDate', v)} type="date" /><TextField label={t.trade.symbol} value={String(form.symbol)} onChange={(v) => set('symbol', v)} /><SelectField label={t.trade.session} value={String(form.session)} onChange={(v) => set('session', v)}><option value="asia">Asia</option><option value="london">London</option><option value="new_york">New York</option></SelectField><SelectField label={t.trade.direction} value={String(form.direction)} onChange={(v) => set('direction', v)}><option value="buy">Buy</option><option value="sell">Sell</option></SelectField><TextField label={t.trade.riskPercent} value={String(form.riskPercent)} onChange={(v) => set('riskPercent', v)} type="number" /><TextField label={t.trade.riskAmount} value={String(form.riskAmount)} onChange={(v) => set('riskAmount', v)} type="number" /><SelectField label={t.trade.result} value={String(form.result)} onChange={(v) => set('result', v)}><option value="win">Win</option><option value="loss">Loss</option><option value="be">BE</option></SelectField><TextField label={t.trade.pnl} value={String(form.pnlAmount)} onChange={(v) => set('pnlAmount', v)} type="number" /><TextField label={t.trade.rrPlanned} value={String(form.rrPlanned)} onChange={(v) => set('rrPlanned', v)} type="number" /><TextField label={t.trade.rrRealized} value={String(form.rrRealized)} onChange={(v) => set('rrRealized', v)} type="number" /><TextField label={t.trade.setup} value={String(form.setupName)} onChange={(v) => set('setupName', v)} /><SelectField label={t.trade.emotion} value={String(form.emotionalState)} onChange={(v) => set('emotionalState', v)}><option value="calm">Calm</option><option value="fomo">FOMO</option><option value="revenge">Revenge</option><option value="fear">Fear</option><option value="greedy">Greedy</option><option value="hesitant">Hesitant</option><option value="overconfident">Overconfident</option></SelectField><SelectField label={t.trade.mistake} value={String(form.mistakeCategory)} onChange={(v) => set('mistakeCategory', v)}><option value="no_mistake">No mistake</option><option value="late_entry">Late entry</option><option value="early_entry">Early entry</option><option value="moved_sl">Moved SL</option><option value="no_sl">No SL</option><option value="overlot">Overlot</option><option value="revenge_trade">Revenge trade</option><option value="news_trade">News trade</option><option value="broke_rules">Broke rules</option><option value="bad_setup">Bad setup</option></SelectField><TextField label={t.trade.confidence} value={String(form.confidenceLevel)} onChange={(v) => set('confidenceLevel', v)} type="number" /><TextField label={t.trade.disciplineInput} value={String(form.disciplineInputScore)} onChange={(v) => set('disciplineInputScore', v)} type="number" /><SelectField label={t.trade.quality} value={String(form.tradeQuality)} onChange={(v) => set('tradeQuality', v)}><option value="a_plus">A+</option><option value="a">A</option><option value="b">B</option><option value="c">C</option><option value="d">D</option></SelectField></div><div className={`${styles.field} ${styles.fullField}`}><label>{t.trade.notes}</label><textarea value={String(form.evaluationNotes)} onChange={(event) => set('evaluationNotes', event.target.value)} /></div><label className={styles.checkPill}><input type="checkbox" checked={Boolean(form.followedPlan)} onChange={(event) => set('followedPlan', event.target.checked)} />{t.trade.followedPlan}</label><div className={styles.actions}><button type="submit">{t.trade.add}</button><button type="button" className="btn-secondary" onClick={() => setForm(emptyTradeForm())}>{t.trade.clear}</button></div></form><section className={styles.panel}><h2>{t.sections.journalDash}</h2><div className={styles.resultGrid}><Metric label={t.metrics.trades} value={String(analytics.totalTrades)} /><Metric label={t.metrics.netProfit} value={f(analytics.netProfit, currency)} tone={analytics.netProfit >= 0 ? 'good' : 'bad'} /><Metric label={t.metrics.winRate} value={p(analytics.winRate)} /><Metric label={t.metrics.averageRR} value={`${analytics.averageRR.toFixed(2)}R`} /><Metric label={t.metrics.profitFactor} value={Number.isFinite(analytics.profitFactor) ? analytics.profitFactor.toFixed(2) : '∞'} /><Metric label={t.metrics.bestSetup} value={analytics.bestSetup ?? '-'} /><Metric label={t.metrics.worstSetup} value={analytics.worstSetup ?? '-'} /><Metric label={t.metrics.avgRisk} value={p(analytics.averageRiskPercent)} /><Metric label={t.metrics.discipline} value={analytics.averageDisciplineScore.toFixed(0)} /><Metric label={t.metrics.todayTrades} value={String(analytics.tradesToday)} /><Metric label={t.metrics.lossStreak} value={String(analytics.currentLossStreak)} /><Metric label={t.metrics.mistake} value={analytics.mostFrequentMistake ?? '-'} /></div><div className={styles.insightLists}><div><h3>Insight</h3><ul>{insights.map((item) => <li key={item}>{item}</li>)}</ul></div></div></section><section className={styles.panel}><h2>{t.sections.journalTable}</h2><div className={styles.formGrid}><TextField label={t.trade.date} value={filters.date} onChange={(v) => setFilters((s) => ({ ...s, date: v }))} type="date" /><TextField label={t.trade.symbol} value={filters.symbol} onChange={(v) => setFilters((s) => ({ ...s, symbol: v }))} /><SelectField label={t.trade.result} value={filters.result} onChange={(v) => setFilters((s) => ({ ...s, result: v }))}><option value="">All</option><option value="win">Win</option><option value="loss">Loss</option><option value="be">BE</option></SelectField><TextField label={t.trade.setup} value={filters.setup} onChange={(v) => setFilters((s) => ({ ...s, setup: v }))} /></div><div className={`${styles.tableWrap} ${styles.challengeTableWrap}`}><table className={`${styles.table} ${styles.challengeTable}`}><thead><tr><th>{t.trade.date}</th><th>{t.trade.symbol}</th><th>{t.trade.session}</th><th>{t.trade.direction}</th><th>Risk</th><th>P/L</th><th>RR</th><th>{t.trade.result}</th><th>{t.trade.setup}</th><th>{t.trade.notes}</th><th>Action</th></tr></thead><tbody>{trades.map((trade) => <tr key={trade.id}><td>{trade.tradeDate}</td><td>{trade.symbol}</td><td>{trade.session}</td><td>{trade.direction}</td><td>{p(trade.riskPercent ?? 0)}</td><td className={trade.pnlAmount >= 0 ? styles.positiveValue : styles.negativeValue}>{f(trade.pnlAmount, currency)}</td><td>{trade.rrRealized ?? '-'}</td><td>{trade.result}</td><td>{trade.setupName ?? '-'}</td><td>{trade.evaluationNotes ?? '-'}</td><td><button type="button" className="btn-secondary" onClick={() => void onDelete(trade.id)}>{t.trade.delete}</button></td></tr>)}</tbody></table></div></section></section>;
}
function Analytics({ t, analytics, trades, currency }: { t: Copy; analytics: ReturnType<typeof calculateChallengeAnalytics>; trades: ChallengeTradeDto[]; currency: string }) {
  const bars = trades.slice().reverse().reduce<number[]>((acc, trade) => [...acc, (acc.at(-1) ?? 0) + trade.pnlAmount], [0]);
  return <section className={styles.panel}><h2>{t.sections.analytics}</h2><div className={styles.resultGrid}><Metric label={t.metrics.totalProfit} value={f(analytics.totalProfit, currency)} tone="good" /><Metric label={t.metrics.totalLoss} value={f(analytics.totalLoss, currency)} tone="bad" /><Metric label={t.metrics.expectancy} value={f(analytics.expectancy, currency)} /><Metric label={t.metrics.biggestWin} value={f(analytics.biggestWin, currency)} /><Metric label={t.metrics.biggestLoss} value={f(analytics.biggestLoss, currency)} tone="bad" /><Metric label={t.metrics.bestPair} value={analytics.bestPair ?? '-'} /><Metric label={t.metrics.worstPair} value={analytics.worstPair ?? '-'} /><Metric label={t.metrics.bestSession} value={analytics.bestSession ?? '-'} /><Metric label={t.metrics.worstSession} value={analytics.worstSession ?? '-'} /><Metric label={t.metrics.emotion} value={analytics.mostFrequentLossEmotion ?? '-'} /></div><div className={styles.chartGrid}><Chart title="Equity curve" values={bars} /><Chart title="Daily P/L" values={trades.map((trade) => trade.pnlAmount)} /><Chart title="Discipline trend" values={trades.map((trade) => trade.disciplineScore)} /></div></section>;
}
function Chart({ title, values }: { title: string; values: number[] }) {
  const max = Math.max(1, ...values.map((value) => Math.abs(value)));
  return <article className={styles.chartCard}><h3>{title}</h3><div className={styles.distributionBars}>{(values.length ? values : [0]).slice(-12).map((value, index) => <span key={`${title}-${index}`} style={{ height: `${Math.max(6, (Math.abs(value) / max) * 88)}%`, opacity: value < 0 ? 0.45 : 1 }} />)}</div></article>;
}
function RiskMonitor({ t, account, analytics, riskStatus, insights }: { t: Copy; account: ChallengeAccountDto; analytics: ReturnType<typeof calculateChallengeAnalytics>; riskStatus: ReturnType<typeof calculateRiskStatus>; insights: string[] }) {
  const warnings = [...riskStatus.warnings, ...insights.filter((item) => item !== t.insights.noWarnings)];
  return <section className={styles.panel}><div className={styles.sectionHeader}><div><h2>{t.sections.risk}</h2><p>{account.name}</p></div><StatusBadge status={riskStatus.status} labels={t.status} /></div><div className={styles.progressGrid}><Progress label={t.metrics.dailyLoss} value={riskStatus.dailyLossUsagePct} /><Progress label={t.metrics.drawdown} value={riskStatus.overallDrawdownUsagePct} /><Progress label={t.metrics.avgRisk} value={account.maxRiskPerTradePercent ? (analytics.averageRiskPercent / account.maxRiskPerTradePercent) * 100 : 0} /></div><div className={styles.insightLists}><div><h3>Warnings</h3><ul>{(warnings.length ? warnings : [t.insights.noWarnings]).map((item) => <li key={item}>{item}</li>)}</ul></div></div></section>;
}
function AIReview({ t, aiState, setAiState, personas, reviews, savePersona, deletePersona, runReview }: { t: Copy; aiState: { selectedPersona: string; customPersonaText: string; personaName: string; personaDescription: string; reviewScope: string; reviewStyle: string; provider: string; userMessage: string; contextPreview: string; assistant: string }; setAiState: React.Dispatch<React.SetStateAction<{ selectedPersona: string; customPersonaText: string; personaName: string; personaDescription: string; reviewScope: string; reviewStyle: string; provider: string; userMessage: string; contextPreview: string; assistant: string }>>; personas: ChallengePersonaDto[]; reviews: ChallengeAIReviewDto[]; savePersona: () => void; deletePersona: (id: string) => void; runReview: (mode?: 'last_trade' | 'risk' | 'action') => void }) {
  const set = (k: string, v: string) => setAiState((state) => ({ ...state, [k]: v }));
  return <section className={styles.aiLayout}><aside className={styles.panel}><h2>{t.sections.aiSettings}</h2><SelectField label={t.ai.persona} value={aiState.selectedPersona} onChange={(v) => { const persona = personas.find((item) => item.name === v); setAiState((state) => ({ ...state, selectedPersona: v, customPersonaText: persona?.content ?? defaultPersonas[v] ?? state.customPersonaText })); }}>{Object.keys(defaultPersonas).map((name) => <option key={name}>{name}</option>)}{personas.map((persona) => <option key={persona.id}>{persona.name}</option>)}<option>Custom Persona</option></SelectField><TextField label={t.ai.personaName} value={aiState.personaName} onChange={(v) => set('personaName', v)} /><TextField label={t.ai.personaDescription} value={aiState.personaDescription} onChange={(v) => set('personaDescription', v)} /><div className={styles.field}><label>{t.ai.personaFile}</label><textarea value={aiState.customPersonaText} onChange={(event) => set('customPersonaText', event.target.value)} /></div><div className={styles.actions}><button type="button" onClick={() => void savePersona()}>{t.ai.savePersona}</button></div><div className={styles.signalCards}>{personas.map((persona) => <article key={persona.id} className={styles.signalCard}><h4>{persona.name}</h4><p>{persona.description}</p><button type="button" className="btn-secondary" onClick={() => void deletePersona(persona.id)}>{t.ai.deletePersona}</button></article>)}</div></aside><section className={styles.panel}><h2>{t.sections.aiChat}</h2><div className={styles.formGridThree}><SelectField label={t.ai.scope} value={aiState.reviewScope} onChange={(v) => set('reviewScope', v)}><option value="all">Review semua jurnal</option><option value="today">Review trade hari ini</option><option value="week">Review minggu ini</option><option value="month">Review bulan ini</option><option value="last_trade">Review trade terakhir</option><option value="losses">Review hanya trade loss</option><option value="mistakes">Review hanya trade mistake</option><option value="risk">Review rules & risk</option></SelectField><SelectField label={t.ai.style} value={aiState.reviewStyle} onChange={(v) => set('reviewStyle', v)}><option>Ringkas</option><option>Detail</option><option>Tegas</option><option>Edukatif</option><option>Checklist</option><option>Action plan</option></SelectField><SelectField label={t.ai.provider} value={aiState.provider} onChange={(v) => set('provider', v)}><option>OpenAI</option><option>OpenRouter</option><option>Local Model</option><option>Custom API</option></SelectField></div><div className={styles.field}><label>{t.ai.message}</label><textarea value={aiState.userMessage} onChange={(event) => set('userMessage', event.target.value)} placeholder="Review jurnal dan status challenge saya." /></div><div className={styles.actions}><button type="button" onClick={() => void runReview()}>{t.ai.reviewJournal}</button><button type="button" className="btn-secondary" onClick={() => void runReview('last_trade')}>{t.ai.reviewLast}</button><button type="button" className="btn-secondary" onClick={() => void runReview('risk')}>{t.ai.reviewRisk}</button><button type="button" className="btn-secondary" onClick={() => void runReview('action')}>{t.ai.actionPlan}</button><button type="button" className="btn-secondary" onClick={() => setAiState((state) => ({ ...state, assistant: '', contextPreview: '', userMessage: '' }))}>{t.ai.clear}</button></div><article className={styles.mobileDataCard}><h3>Assistant</h3><p>{aiState.assistant || reviews[0]?.assistantResponse || t.ai.mock}</p></article><div className={styles.field}><label>{t.sections.context}</label><textarea readOnly value={aiState.contextPreview || reviews[0]?.contextPrompt || ''} /></div></section></section>;
}
