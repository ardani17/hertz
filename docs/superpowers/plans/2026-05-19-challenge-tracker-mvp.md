# Challenge Tracker MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build `/tools/challenge-tracker` as a database-backed, member-owned tracker with multiple challenges per Telegram member, manual journal input, analytics, risk monitoring, and mock AI review context.

**Architecture:** Persist private Challenge Tracker data in PostgreSQL tables keyed by `users.id`. Put durable domain types and database access in `shared/`, expose protected Next.js API routes under `/api/tools/challenge-tracker`, and render a client-side HERTZ-styled tool page that fetches and mutates the current member's selected challenge. Keep calculations in pure helper functions so they can be unit tested independently from React and API routes.

**Tech Stack:** Next.js App Router 16, React 19 client components, TypeScript, PostgreSQL SQL migrations, shared repository/service classes, Vitest unit tests, existing `HertzAppShell`, existing `ToolShell.module.css` styling.

---

## Files and responsibilities

### Database
- Create: `db/migrations/014_create_challenge_tracker.sql`
  - Creates `challenge_accounts`, `challenge_trades`, `challenge_personas`, and `challenge_ai_reviews`.
  - Adds indexes for member ownership, selected-account loading, journal filters, and review history.

### Shared domain and persistence
- Create: `shared/types/challengeTracker.ts`
  - Public TypeScript types, enums, request input types, DTOs, and calculation result types.
- Create: `shared/repositories/challengeTrackerRepository.ts`
  - SQL queries for accounts, trades, personas, and AI reviews.
  - Every read/write method accepts `userId` and enforces ownership in SQL.
- Create: `shared/services/challengeTrackerService.ts`
  - Validation, defaults, preset creation, percent/amount normalization, orchestration of repository calls.
- Modify: `shared/types/index.ts`
  - Export challenge tracker types if this index exists and follows the repo pattern.

### Frontend model and UI
- Create: `frontend/src/components/tools/challengeTrackerModel.ts`
  - Pure helpers: presets, `calculateDisciplineScore`, `calculateChallengeAnalytics`, `calculateRiskStatus`, `calculateChallengeOverview`, `buildAIReviewContext`.
- Create: `frontend/src/components/tools/ChallengeTrackerToolPage.tsx`
  - Page wrapper copy, help accordion, auth/empty state shell, and `ChallengeTrackerTool` mount.
- Create: `frontend/src/components/tools/ChallengeTrackerTool.tsx`
  - Client orchestration: load accounts, selected challenge state, tab state, API calls.
- Create: `frontend/src/components/tools/ChallengeTrackerTabs.tsx`
  - Tab navigation for Overview, Rules, Journal, Analytics, Risk Monitor, AI Review.
- Create: `frontend/src/components/tools/ChallengeTrackerOverview.tsx`
  - Overview cards and progress bars.
- Create: `frontend/src/components/tools/ChallengeTrackerRules.tsx`
  - Rules form and preset-driven create/edit flow.
- Create: `frontend/src/components/tools/ChallengeTrackerJournal.tsx`
  - Manual trade form, journal dashboard, filters, trade table.
- Create: `frontend/src/components/tools/ChallengeTrackerAnalytics.tsx`
  - Analytics stats and simple chart cards with prepared data.
- Create: `frontend/src/components/tools/ChallengeTrackerRiskMonitor.tsx`
  - Rule warnings and status badges.
- Create: `frontend/src/components/tools/ChallengeTrackerAIReview.tsx`
  - Persona/settings sidebar, mock chat, context preview.
- Modify: `frontend/src/components/tools/ToolNav.tsx`
  - Add `Challenge Tracker` nav item in ID and EN.
- Modify: `frontend/src/components/tools/ToolsHub.tsx`
  - Add Challenge Tracker card to tools index in ID and EN.
- Create: `frontend/src/app/tools/challenge-tracker/page.tsx`
  - Server route using `HertzAppShell`, `getCurrentMember`, and `ChallengeTrackerToolPage`.

### API routes
- Create: `frontend/src/app/api/tools/challenge-tracker/accounts/route.ts`
  - `GET` list accounts; `POST` create account.
- Create: `frontend/src/app/api/tools/challenge-tracker/accounts/[accountId]/route.ts`
  - `GET`, `PATCH`, `DELETE` selected account.
- Create: `frontend/src/app/api/tools/challenge-tracker/accounts/[accountId]/archive/route.ts`
  - `POST` archives/unarchives an account.
- Create: `frontend/src/app/api/tools/challenge-tracker/accounts/[accountId]/trades/route.ts`
  - `GET` list trades; `POST` create trade.
- Create: `frontend/src/app/api/tools/challenge-tracker/trades/[tradeId]/route.ts`
  - `PATCH`, `DELETE` trade.
- Create: `frontend/src/app/api/tools/challenge-tracker/personas/route.ts`
  - `GET` list personas; `POST` create persona.
- Create: `frontend/src/app/api/tools/challenge-tracker/personas/[personaId]/route.ts`
  - `PATCH`, `DELETE` persona.
- Create: `frontend/src/app/api/tools/challenge-tracker/accounts/[accountId]/ai-reviews/route.ts`
  - `GET` review history; `POST` build context and store mock AI response.

### Tests
- Create: `tests/unit/frontend/challengeTrackerModel.test.ts`
  - Pure calculation tests for discipline score, risk status, analytics, AI context builder.
- Create: `tests/unit/shared/challengeTrackerService.test.ts`
  - Validation/default normalization tests for account and trade inputs.

---

## Task 1: Database migration

**Files:**
- Create: `db/migrations/014_create_challenge_tracker.sql`

- [x] **Step 1: Create migration file**

Use this SQL:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS challenge_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_currency TEXT NOT NULL DEFAULT 'USD' CHECK (account_currency IN ('IDR', 'USD', 'EUR', 'GBP')),
  initial_balance NUMERIC(18, 4) NOT NULL CHECK (initial_balance >= 0),
  current_balance NUMERIC(18, 4) NOT NULL CHECK (current_balance >= 0),
  current_equity NUMERIC(18, 4) NOT NULL CHECK (current_equity >= 0),
  profit_target_percent NUMERIC(8, 4),
  profit_target_amount NUMERIC(18, 4),
  max_daily_loss_percent NUMERIC(8, 4),
  max_daily_loss_amount NUMERIC(18, 4),
  max_overall_drawdown_percent NUMERIC(8, 4),
  max_overall_drawdown_amount NUMERIC(18, 4),
  min_trading_days INTEGER NOT NULL DEFAULT 0 CHECK (min_trading_days >= 0),
  start_date DATE,
  end_date DATE,
  account_type TEXT NOT NULL DEFAULT 'evaluation' CHECK (account_type IN ('personal', 'prop_firm', 'funded', 'evaluation')),
  drawdown_mode TEXT NOT NULL DEFAULT 'static' CHECK (drawdown_mode IN ('static', 'trailing', 'balance_based', 'equity_based')),
  news_trading_allowed BOOLEAN NOT NULL DEFAULT false,
  hold_overnight_allowed BOOLEAN NOT NULL DEFAULT false,
  hold_weekend_allowed BOOLEAN NOT NULL DEFAULT false,
  consistency_rule_percent NUMERIC(8, 4),
  max_lot NUMERIC(18, 4),
  max_risk_per_trade_percent NUMERIC(8, 4),
  max_trades_per_day INTEGER CHECK (max_trades_per_day IS NULL OR max_trades_per_day >= 0),
  preset_id TEXT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_accounts_user_active ON challenge_accounts(user_id, archived_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_accounts_user_created ON challenge_accounts(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS challenge_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_account_id UUID NOT NULL REFERENCES challenge_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trade_date DATE NOT NULL,
  symbol TEXT NOT NULL,
  session TEXT CHECK (session IS NULL OR session IN ('asia', 'london', 'new_york')),
  direction TEXT CHECK (direction IS NULL OR direction IN ('buy', 'sell')),
  entry_price NUMERIC(18, 6),
  stop_loss NUMERIC(18, 6),
  take_profit NUMERIC(18, 6),
  exit_price NUMERIC(18, 6),
  lot_size NUMERIC(18, 4),
  risk_amount NUMERIC(18, 4),
  risk_percent NUMERIC(8, 4),
  result TEXT NOT NULL CHECK (result IN ('win', 'loss', 'be')),
  pnl_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
  pnl_percent NUMERIC(8, 4),
  rr_planned NUMERIC(10, 4),
  rr_realized NUMERIC(10, 4),
  setup_name TEXT,
  entry_reason TEXT,
  exit_reason TEXT,
  emotional_state TEXT CHECK (emotional_state IS NULL OR emotional_state IN ('calm', 'fomo', 'revenge', 'fear', 'greedy', 'hesitant', 'overconfident')),
  mistake_category TEXT CHECK (mistake_category IS NULL OR mistake_category IN ('no_mistake', 'late_entry', 'early_entry', 'moved_sl', 'no_sl', 'overlot', 'revenge_trade', 'news_trade', 'broke_rules', 'bad_setup')),
  confidence_level INTEGER CHECK (confidence_level IS NULL OR confidence_level BETWEEN 1 AND 5),
  discipline_input_score INTEGER CHECK (discipline_input_score IS NULL OR discipline_input_score BETWEEN 1 AND 5),
  trade_quality TEXT CHECK (trade_quality IS NULL OR trade_quality IN ('a_plus', 'a', 'b', 'c', 'd')),
  followed_plan BOOLEAN,
  discipline_score INTEGER NOT NULL DEFAULT 100 CHECK (discipline_score BETWEEN 0 AND 100),
  screenshot_url TEXT,
  evaluation_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_trades_account_date ON challenge_trades(challenge_account_id, trade_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_trades_user_date ON challenge_trades(user_id, trade_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_trades_account_result ON challenge_trades(challenge_account_id, result);
CREATE INDEX IF NOT EXISTS idx_challenge_trades_account_symbol ON challenge_trades(challenge_account_id, symbol);

CREATE TABLE IF NOT EXISTS challenge_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_personas_user_created ON challenge_personas(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS challenge_ai_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_account_id UUID NOT NULL REFERENCES challenge_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES challenge_personas(id) ON DELETE SET NULL,
  provider TEXT,
  review_scope TEXT NOT NULL,
  review_style TEXT NOT NULL,
  user_message TEXT,
  system_prompt TEXT NOT NULL,
  context_prompt TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  assistant_response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_ai_reviews_account_created ON challenge_ai_reviews(challenge_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_ai_reviews_user_created ON challenge_ai_reviews(user_id, created_at DESC);
```

- [x] **Step 2: Verify migration syntax through frontend build-compatible SQL only**

Run:

```bash
npm run build:frontend
```

Expected: build succeeds. This does not execute the migration, but confirms no accidental TypeScript changes were introduced in this task.

- [x] **Step 3: Commit**

```bash
git add db/migrations/014_create_challenge_tracker.sql
git commit -m "Add Challenge Tracker database schema"
```

---

## Task 2: Shared types and pure model tests

**Files:**
- Create: `shared/types/challengeTracker.ts`
- Create: `frontend/src/components/tools/challengeTrackerModel.ts`
- Create: `tests/unit/frontend/challengeTrackerModel.test.ts`

- [x] **Step 1: Create shared type definitions**

Add enums/unions and DTOs for currencies, account types, drawdown modes, trade result, session, direction, emotional state, mistake category, trade quality, account DTO, trade DTO, persona DTO, review DTO, analytics summary, and risk status.

Required union names:

```ts
export type ChallengeCurrency = 'IDR' | 'USD' | 'EUR' | 'GBP';
export type ChallengeAccountType = 'personal' | 'prop_firm' | 'funded' | 'evaluation';
export type ChallengeDrawdownMode = 'static' | 'trailing' | 'balance_based' | 'equity_based';
export type ChallengeTradeResult = 'win' | 'loss' | 'be';
export type ChallengeSession = 'asia' | 'london' | 'new_york';
export type ChallengeDirection = 'buy' | 'sell';
export type ChallengeEmotionalState = 'calm' | 'fomo' | 'revenge' | 'fear' | 'greedy' | 'hesitant' | 'overconfident';
export type ChallengeMistakeCategory = 'no_mistake' | 'late_entry' | 'early_entry' | 'moved_sl' | 'no_sl' | 'overlot' | 'revenge_trade' | 'news_trade' | 'broke_rules' | 'bad_setup';
export type ChallengeTradeQuality = 'a_plus' | 'a' | 'b' | 'c' | 'd';
export type ChallengeStatus = 'safe' | 'warning' | 'danger' | 'failed';
```

- [x] **Step 2: Write failing tests for model helpers**

Create `tests/unit/frontend/challengeTrackerModel.test.ts` with tests for:

```ts
import { describe, expect, it } from 'vitest';
import {
  buildAIReviewContext,
  calculateChallengeAnalytics,
  calculateDisciplineScore,
  calculateRiskStatus,
  challengePresets,
} from '@/components/tools/challengeTrackerModel';

describe('challengeTrackerModel', () => {
  it('computes discipline score penalties', () => {
    const score = calculateDisciplineScore(
      {
        followedPlan: false,
        mistakeCategory: 'moved_sl',
        emotionalState: 'revenge',
        riskPercent: 2.5,
        tradeQuality: 'c',
      },
      { maxRiskPerTradePercent: 1 },
    );
    expect(score).toBe(35);
  });

  it('returns failed risk status when daily loss breaches limit', () => {
    const status = calculateRiskStatus(
      { initialBalance: 10000, maxDailyLossAmount: 500, maxOverallDrawdownAmount: 1000, maxTradesPerDay: 5, maxRiskPerTradePercent: 1 },
      [{ tradeDate: '2026-05-19', pnlAmount: -550, result: 'loss', riskPercent: 0.5 }],
      '2026-05-19',
    );
    expect(status.status).toBe('failed');
    expect(status.dailyLossUsagePct).toBeGreaterThan(100);
  });

  it('calculates analytics from journal trades', () => {
    const analytics = calculateChallengeAnalytics([
      { tradeDate: '2026-05-19', symbol: 'XAUUSD', session: 'london', result: 'win', pnlAmount: 200, rrRealized: 2, setupName: 'breakout' },
      { tradeDate: '2026-05-19', symbol: 'XAUUSD', session: 'london', result: 'loss', pnlAmount: -100, rrRealized: -1, setupName: 'breakout' },
      { tradeDate: '2026-05-20', symbol: 'EURUSD', session: 'asia', result: 'be', pnlAmount: 0, rrRealized: 0, setupName: 'retest' },
    ]);
    expect(analytics.totalTrades).toBe(3);
    expect(analytics.winRate).toBeCloseTo(33.333, 2);
    expect(analytics.netProfit).toBe(100);
    expect(analytics.profitFactor).toBe(2);
  });

  it('builds AI review context with persona, account, analytics, and user prompt', () => {
    const context = buildAIReviewContext({
      challengeConfig: { name: 'Phase 1', accountCurrency: 'USD', initialBalance: 10000 },
      trades: [{ symbol: 'XAUUSD', result: 'loss', pnlAmount: -100 }],
      analytics: { totalTrades: 1, netProfit: -100, winRate: 0 },
      riskStatus: { status: 'warning', warnings: ['Daily loss mendekati batas.'] },
      selectedPersona: 'Risk Manager',
      customPersonaText: '',
      reviewScope: 'last_trade',
      reviewStyle: 'Action plan',
      userMessage: 'Review trade terakhir saya.',
    });
    expect(context.systemPrompt).toContain('risk manager');
    expect(context.contextPrompt).toContain('Phase 1');
    expect(context.userPrompt).toContain('Review trade terakhir saya.');
  });

  it('exposes creation presets', () => {
    expect(challengePresets.map((preset) => preset.id)).toContain('prop_firm_standard');
    expect(challengePresets.map((preset) => preset.id)).toContain('custom_manual');
  });
});
```

- [x] **Step 3: Run failing test**

```bash
npm test -- tests/unit/frontend/challengeTrackerModel.test.ts
```

Expected: FAIL because `challengeTrackerModel.ts` does not exist or helper exports are missing.

- [x] **Step 4: Implement pure model helpers**

In `frontend/src/components/tools/challengeTrackerModel.ts`, implement the exported helpers used by the test. Keep function inputs permissive enough for DTOs and tests, but typed.

- [x] **Step 5: Run model tests**

```bash
npm test -- tests/unit/frontend/challengeTrackerModel.test.ts
```

Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add shared/types/challengeTracker.ts frontend/src/components/tools/challengeTrackerModel.ts tests/unit/frontend/challengeTrackerModel.test.ts
git commit -m "Add Challenge Tracker domain model"
```

---

## Task 3: Repository and service layer

**Files:**
- Create: `shared/repositories/challengeTrackerRepository.ts`
- Create: `shared/services/challengeTrackerService.ts`
- Create: `tests/unit/shared/challengeTrackerService.test.ts`

- [x] **Step 1: Write service tests**

Test that account input defaults and trade input discipline score are normalized without database access by exporting pure normalization functions from the service file:

```ts
import { describe, expect, it } from 'vitest';
import { normalizeChallengeAccountInput, normalizeChallengeTradeInput } from '@shared/services/challengeTrackerService';

describe('challengeTrackerService normalization', () => {
  it('derives target and loss amounts from percentages', () => {
    const input = normalizeChallengeAccountInput({
      name: 'Phase 1',
      accountCurrency: 'USD',
      initialBalance: 10000,
      profitTargetPercent: 10,
      maxDailyLossPercent: 5,
      maxOverallDrawdownPercent: 10,
      accountType: 'evaluation',
      drawdownMode: 'static',
    });
    expect(input.profitTargetAmount).toBe(1000);
    expect(input.maxDailyLossAmount).toBe(500);
    expect(input.maxOverallDrawdownAmount).toBe(1000);
    expect(input.currentBalance).toBe(10000);
    expect(input.currentEquity).toBe(10000);
  });

  it('computes discipline score for trade input', () => {
    const trade = normalizeChallengeTradeInput(
      { tradeDate: '2026-05-19', symbol: 'XAUUSD', result: 'loss', pnlAmount: -100, followedPlan: false, mistakeCategory: 'bad_setup', emotionalState: 'fomo', riskPercent: 2, tradeQuality: 'd' },
      { maxRiskPerTradePercent: 1 },
    );
    expect(trade.disciplineScore).toBe(35);
  });
});
```

- [x] **Step 2: Run failing service tests**

```bash
npm test -- tests/unit/shared/challengeTrackerService.test.ts
```

Expected: FAIL because the service file does not exist.

- [x] **Step 3: Implement repository class**

Repository methods:

- `listAccounts(userId)`
- `getAccount(userId, accountId)`
- `createAccount(userId, input)`
- `updateAccount(userId, accountId, input)`
- `deleteAccount(userId, accountId)`
- `archiveAccount(userId, accountId, archived)`
- `listTrades(userId, accountId, filters)`
- `createTrade(userId, accountId, input)`
- `updateTrade(userId, tradeId, input)`
- `deleteTrade(userId, tradeId)`
- `listPersonas(userId)`
- `createPersona(userId, input)`
- `updatePersona(userId, personaId, input)`
- `deletePersona(userId, personaId)`
- `listAIReviews(userId, accountId)`
- `createAIReview(userId, accountId, input)`

Every account-specific query must include ownership in SQL. Example pattern:

```sql
SELECT * FROM challenge_accounts WHERE id = $1 AND user_id = $2
```

For trades, include account ownership through join or both IDs:

```sql
SELECT t.*
FROM challenge_trades t
JOIN challenge_accounts a ON a.id = t.challenge_account_id
WHERE t.id = $1 AND a.user_id = $2
```

- [x] **Step 4: Implement service class and normalization exports**

Service methods wrap repository calls and use normalizers from Step 1.

- [x] **Step 5: Run service tests**

```bash
npm test -- tests/unit/shared/challengeTrackerService.test.ts
```

Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add shared/repositories/challengeTrackerRepository.ts shared/services/challengeTrackerService.ts tests/unit/shared/challengeTrackerService.test.ts
git commit -m "Add Challenge Tracker service layer"
```

---

## Task 4: Protected API routes

**Files:**
- Create API route files listed in the API routes section.

- [x] **Step 1: Implement account routes**

Use existing response/auth pattern:

```ts
import { NextRequest } from 'next/server';
import { ChallengeTrackerService } from '@shared/services/challengeTrackerService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

export const dynamic = 'force-dynamic';

const service = new ChallengeTrackerService();

export async function GET() {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const accounts = await service.listAccounts(user.id);
    return apiSuccess({ accounts });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
```

Implement the same auth guard in all Challenge Tracker API routes.

- [x] **Step 2: Implement trade routes**

All trade routes must pass `user.id` and account/trade IDs to service methods. Do not accept `userId` from request body.

- [x] **Step 3: Implement persona routes**

Personas are per member. Do not require a challenge ID.

- [x] **Step 4: Implement AI review routes**

`POST /accounts/[accountId]/ai-reviews` builds AI review context through `buildAIReviewContext`, stores mock response, and returns `{ review, contextPreview }`.

Mock response:

```text
AI Review belum terhubung ke provider. Context sudah berhasil dibuat.
```

- [x] **Step 5: Verify build**

```bash
npm run build:frontend
```

Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add frontend/src/app/api/tools/challenge-tracker
git commit -m "Add Challenge Tracker API routes"
```

---

## Task 5: Route, nav, and tools hub entry

**Files:**
- Create: `frontend/src/app/tools/challenge-tracker/page.tsx`
- Create: `frontend/src/components/tools/ChallengeTrackerToolPage.tsx`
- Modify: `frontend/src/components/tools/ToolNav.tsx`
- Modify: `frontend/src/components/tools/ToolsHub.tsx`

- [x] **Step 1: Add route page**

Use the Profitability route pattern:

```tsx
import type { Metadata } from 'next';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
import { ChallengeTrackerToolPage } from '@/components/tools/ChallengeTrackerToolPage';
import { getCurrentMember } from '@/lib/memberAuth';

export const metadata: Metadata = {
  title: 'Challenge Tracker',
  description: 'Pantau target profit, drawdown, rules evaluasi, dan jurnal trading.',
};

export default async function ChallengeTrackerPage() {
  const currentUser = await getCurrentMember();

  return (
    <HertzAppShell active="tools" title="Tools" description="Challenge tracker untuk akun prop firm, funded, evaluasi, dan personal." currentUser={currentUser}>
      <ChallengeTrackerToolPage currentUser={currentUser} />
    </HertzAppShell>
  );
}
```

- [x] **Step 2: Add ToolNav item**

Insert Challenge Tracker after Profitability in both nav copy sets.

- [x] **Step 3: Add ToolsHub card**

Add Challenge Tracker card with localized ID/EN text and `href: '/tools/challenge-tracker'`.

- [x] **Step 4: Create page shell component**

`ChallengeTrackerToolPage.tsx` renders:

- `ToolNav`
- header with eyebrow `CHALLENGE`, title `Challenge Tracker`, subtitle
- help accordion
- auth required panel if `currentUser` is null
- `ChallengeTrackerTool` if logged in

- [x] **Step 5: Verify build**

```bash
npm run build:frontend
```

Expected: PASS and route list includes `/tools/challenge-tracker`.

- [x] **Step 6: Commit**

```bash
git add frontend/src/app/tools/challenge-tracker/page.tsx frontend/src/components/tools/ChallengeTrackerToolPage.tsx frontend/src/components/tools/ToolNav.tsx frontend/src/components/tools/ToolsHub.tsx
git commit -m "Add Challenge Tracker route"
```

---

## Task 6: Main client tool and challenge switcher

**Files:**
- Create: `frontend/src/components/tools/ChallengeTrackerTool.tsx`
- Create: `frontend/src/components/tools/ChallengeTrackerTabs.tsx`
- Modify: `frontend/src/components/tools/ToolShell.module.css`

- [x] **Step 1: Implement tab component**

Tabs: `overview`, `rules`, `journal`, `analytics`, `risk`, `ai_review`.

Labels ID:

```text
Overview | Rules | Journal | Analytics | Risk Monitor | AI Review
```

Use same labels in EN for MVP except translatable surrounding text.

- [x] **Step 2: Implement ChallengeTrackerTool state**

State:

- accounts
- selectedAccountId
- selectedAccount
- trades
- personas
- aiReviews
- activeTab
- loading/error states

Initial load:

- fetch `/api/tools/challenge-tracker/accounts`
- select first non-archived account
- if account selected, fetch trades, personas, and reviews

- [x] **Step 3: Implement challenge switcher skeleton**

Top controls:

- select account
- `+ Challenge Baru` button
- archive/delete buttons shown for selected challenge

If no accounts, show preset cards and create form entry point.

- [x] **Step 4: Add CSS utility classes**

Add focused classes to `ToolShell.module.css` for:

- `.challengeToolbar`
- `.challengeTabs`
- `.challengeTabActive`
- `.statusBadgeSafe`, `.statusBadgeWarning`, `.statusBadgeDanger`, `.statusBadgeFailed`
- `.progressTrack`, `.progressFill`
- `.chartPlaceholder`

- [x] **Step 5: Verify build**

```bash
npm run build:frontend
```

Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add frontend/src/components/tools/ChallengeTrackerTool.tsx frontend/src/components/tools/ChallengeTrackerTabs.tsx frontend/src/components/tools/ToolShell.module.css
git commit -m "Add Challenge Tracker shell"
```

---

## Task 7: Rules and create challenge workflow

**Files:**
- Create: `frontend/src/components/tools/ChallengeTrackerRules.tsx`
- Modify: `frontend/src/components/tools/ChallengeTrackerTool.tsx`

- [x] **Step 1: Implement preset picker**

Use `challengePresets` from `challengeTrackerModel.ts`.

Preset cards:

- Prop Firm Standard
- Prop Firm Conservative
- Funded Account
- Personal Account
- Custom Manual

- [x] **Step 2: Implement create/edit form**

Fields from spec. Use dark input styles inherited from global/tool CSS.

- [x] **Step 3: Implement percent/amount reciprocal calculation**

On percent change, calculate amount. On amount change, calculate percent. Keep values in controlled state.

- [x] **Step 4: Wire API calls**

- create: `POST /api/tools/challenge-tracker/accounts`
- update: `PATCH /api/tools/challenge-tracker/accounts/[accountId]`
- archive: `POST /api/tools/challenge-tracker/accounts/[accountId]/archive`
- delete: `DELETE /api/tools/challenge-tracker/accounts/[accountId]`

After mutate, reload accounts and selected account.

- [x] **Step 5: Verify build**

```bash
npm run build:frontend
```

Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add frontend/src/components/tools/ChallengeTrackerRules.tsx frontend/src/components/tools/ChallengeTrackerTool.tsx
git commit -m "Add Challenge Tracker rules workflow"
```

---

## Task 8: Overview and risk monitor

**Files:**
- Create: `frontend/src/components/tools/ChallengeTrackerOverview.tsx`
- Create: `frontend/src/components/tools/ChallengeTrackerRiskMonitor.tsx`
- Modify: `frontend/src/components/tools/ChallengeTrackerTool.tsx`

- [x] **Step 1: Implement overview cards**

Use `calculateChallengeOverview` and `calculateRiskStatus`.

Cards include balances, progress, remaining target, daily loss, drawdown, trades, win rate, profit factor, average RR, account status.

- [x] **Step 2: Implement progress bars**

Progress bars for target, daily loss usage, drawdown usage, and minimum trading days.

- [x] **Step 3: Implement Risk Monitor warnings**

Render warnings from `calculateRiskStatus`. Group by severity.

- [x] **Step 4: Verify model tests and build**

```bash
npm test -- tests/unit/frontend/challengeTrackerModel.test.ts
npm run build:frontend
```

Expected: both PASS.

- [x] **Step 5: Commit**

```bash
git add frontend/src/components/tools/ChallengeTrackerOverview.tsx frontend/src/components/tools/ChallengeTrackerRiskMonitor.tsx frontend/src/components/tools/ChallengeTrackerTool.tsx
git commit -m "Add Challenge Tracker overview and risk monitor"
```

---

## Task 9: Manual journal input, dashboard, and table

**Files:**
- Create: `frontend/src/components/tools/ChallengeTrackerJournal.tsx`
- Modify: `frontend/src/components/tools/ChallengeTrackerTool.tsx`

- [x] **Step 1: Implement manual trade form**

Fields from spec, grouped into:

- Trade details
- Risk and result
- Setup notes
- Psychology and discipline

- [x] **Step 2: Compute discipline score preview**

As user changes psychology/risk fields, show computed discipline score using `calculateDisciplineScore`.

- [x] **Step 3: Wire create/update/delete trade API calls**

- create: `POST /accounts/[accountId]/trades`
- update: `PATCH /trades/[tradeId]`
- delete: `DELETE /trades/[tradeId]`

Reload trades after mutation.

- [x] **Step 4: Implement Journal Dashboard**

Cards from analytics:

- total trade
- net P/L
- win rate
- average RR
- profit factor
- best/worst setup
- best/worst pair
- best/worst session
- most frequent mistake
- loss emotion
- trades today
- loss streak
- average risk
- discipline score today/average

- [x] **Step 5: Implement Journal Table and filters**

Filters:

- date range
- pair
- result
- session
- setup

Table columns from spec.

- [x] **Step 6: Verify tests and build**

```bash
npm test -- tests/unit/frontend/challengeTrackerModel.test.ts
npm run build:frontend
```

Expected: both PASS.

- [x] **Step 7: Commit**

```bash
git add frontend/src/components/tools/ChallengeTrackerJournal.tsx frontend/src/components/tools/ChallengeTrackerTool.tsx
git commit -m "Add Challenge Tracker journal"
```

---

## Task 10: Analytics tab

**Files:**
- Create: `frontend/src/components/tools/ChallengeTrackerAnalytics.tsx`
- Modify: `frontend/src/components/tools/ChallengeTrackerTool.tsx`

- [x] **Step 1: Implement analytics stat grid**

Use `calculateChallengeAnalytics`.

- [x] **Step 2: Implement simple chart cards**

Use prepared data from model helpers. Render simple SVG/bars similar to Profitability Simulator for:

- Equity curve
- Daily P/L
- Discipline score trend
- Profit by pair
- Profit by session
- Profit by setup
- Drawdown chart
- Mistake distribution
- Emotion distribution
- RR distribution

- [x] **Step 3: Verify build**

```bash
npm run build:frontend
```

Expected: PASS.

- [x] **Step 4: Commit**

```bash
git add frontend/src/components/tools/ChallengeTrackerAnalytics.tsx frontend/src/components/tools/ChallengeTrackerTool.tsx
git commit -m "Add Challenge Tracker analytics"
```

---

## Task 11: AI Review tab and persona manager

**Files:**
- Create: `frontend/src/components/tools/ChallengeTrackerAIReview.tsx`
- Modify: `frontend/src/components/tools/ChallengeTrackerTool.tsx`

- [x] **Step 1: Implement persona sidebar**

Persona options:

- Strict Prop Firm Coach
- Calm Trading Mentor
- Risk Manager
- Psychology Coach
- Scalping Coach
- Swing Trading Coach
- Custom Persona

Custom persona manager uses database persona API routes.

- [x] **Step 2: Implement review settings**

Fields:

- review scope
- review style
- provider dropdown

- [x] **Step 3: Implement mock chat actions**

Buttons:

- Review Journal
- Review Last Trade
- Review Risk
- Create Action Plan
- Clear Chat

POST to `/api/tools/challenge-tracker/accounts/[accountId]/ai-reviews`.

- [x] **Step 4: Render context preview**

Show system prompt, context prompt, and user prompt in collapsed/scrollable cards.

- [x] **Step 5: Verify build**

```bash
npm run build:frontend
```

Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add frontend/src/components/tools/ChallengeTrackerAIReview.tsx frontend/src/components/tools/ChallengeTrackerTool.tsx
git commit -m "Add Challenge Tracker AI review"
```

---

## Task 12: Final verification, Docker rebuild, and push

**Files:**
- No new files expected.

- [x] **Step 1: Run focused tests**

```bash
npm test -- tests/unit/frontend/challengeTrackerModel.test.ts tests/unit/shared/challengeTrackerService.test.ts
```

Expected: PASS.

- [x] **Step 2: Run frontend build**

```bash
npm run build:frontend
```

Expected: PASS and route list includes `/tools/challenge-tracker`.

- [x] **Step 3: Rebuild Docker frontend**

```bash
docker compose build frontend && docker compose up -d frontend
```

Expected: image builds, `horizon-frontend` is recreated and starts healthy.

- [x] **Step 4: Check live route**

```bash
curl -I --max-time 10 http://127.0.0.1:3888/tools/challenge-tracker
```

Expected: `HTTP/1.1 200 OK`.

- [x] **Step 5: Browser smoke check without dev server**

Use Playwright against `http://127.0.0.1:3888/tools/challenge-tracker`:

- logged-out state renders auth panel
- route has no horizontal overflow at 1440, 768, and 390 widths
- Tools nav contains Challenge Tracker

- [x] **Step 6: Commit any final fixes**

If verification requires fixes, commit only files changed by this feature:

```bash
git status --short
git add <feature-files>
git commit -m "Finalize Challenge Tracker MVP"
```

- [x] **Step 7: Push main if requested**

```bash
git push origin main
```

Expected: `main -> main` succeeds.

---

## Self-review checklist

- Spec coverage: all core spec items are mapped to tasks: database, multiple challenge switcher, presets, tabs, manual journal, dashboard, analytics, risk monitor, AI Review mock, persona manager, route/nav, tests, build, Docker verification.
- Ownership: API and repository tasks explicitly require `user.id` and reject unauthenticated requests.
- Scope: import/export and real AI provider integration stay outside MVP implementation; CSV/JSON/Markdown helper names are reserved for an export phase.
- Verification: every implementation group ends with tests/build and commit.
