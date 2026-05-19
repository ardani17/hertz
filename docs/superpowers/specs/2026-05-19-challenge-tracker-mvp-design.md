# Challenge Tracker MVP Design

## Goal

Build a new member-owned **Challenge Tracker** tool for `/tools/challenge-tracker` that helps logged-in Telegram members track multiple trading challenges/accounts, journal trades manually, monitor rule compliance, review analytics, and prepare AI review context.

This tool is separate from Profitability Simulator. Profitability Simulator remains a probability simulator; Challenge Tracker is a live progress and journal tracker.

## User and data ownership

Challenge Tracker data is stored in the database per logged-in member.

- A member logs in through Telegram/HERTZ auth.
- Every challenge account belongs to `users.id` through `user_id`.
- Every trade belongs to a challenge account through `challenge_account_id`.
- Every AI review belongs to a challenge account.
- Custom AI personas belong to the member and can be reused across challenges.
- API routes must reject unauthenticated users with `AUTH_REQUIRED`.
- API queries must always filter by `user_id` or join through a table filtered by `user_id`.

## Primary route and navigation

Add a new route:

- `/tools/challenge-tracker`

Add a new Tools menu item:

```text
Semua tools | Pivot Point | Profitability | Challenge Tracker | Elliott Wave | Kalender Ekonomi | Order Book | Likuiditas Bursa | CFTC COT
```

English mode:

```text
All tools | Pivot Point | Profitability | Challenge Tracker | Elliott Wave | Economic Calendar | Order Book | Exchange Liquidity | CFTC COT
```

The page uses `HertzAppShell` like other tool pages and visually follows the Profitability Simulator/HERTZ style:

- dark background
- green/tosca accent
- rounded cards
- dark inputs
- responsive layout
- compact but readable cards
- status badges with clear color semantics

## Page header

Eyebrow:

```text
CHALLENGE
```

Title:

```text
Challenge Tracker
```

Subtitle:

```text
Pantau target profit, drawdown, aturan evaluasi, risiko harian, dan jurnal trading agar akun tetap berada di zona aman.
```

English subtitle:

```text
Track profit targets, drawdown, evaluation rules, daily risk, and trading journal so the account stays in the safe zone.
```

Add an accordion similar to Profitability Simulator.

Accordion title:

```text
Penjelasan input challenge
```

English:

```text
Challenge input guide
```

Accordion content explains:

- Saldo awal / Starting balance
- Saldo/equity saat ini / Current balance/equity
- Target profit / Profit target
- Max daily loss
- Max overall drawdown
- Minimum trading days
- Tanggal mulai / Start date
- Tipe challenge / Challenge type
- Mode drawdown / Drawdown mode
- Risk per trade
- Status akun / Account status

## Multiple challenges per member

Members can have multiple challenge accounts from the start because a member may trade several accounts.

Top-of-page control:

```text
Challenge: [Prop Firm Phase 1 ▼]  [+ Challenge Baru]
```

English:

```text
Challenge: [Prop Firm Phase 1 ▼]  [+ New Challenge]
```

Required behavior:

- The selected challenge drives all tabs.
- The selected challenge ID is stored in URL query or client state.
- If the selected challenge is missing or archived, fallback to the latest active challenge.
- If the member has no challenge, show an empty state with a create challenge CTA.
- Members can create, edit, archive, and delete challenges.
- Archive hides a challenge from the default switcher but keeps data.
- Delete removes the challenge and associated dependent data only after confirmation.

MVP does not need a compare-challenges view.

## Challenge creation presets

When creating a new challenge, show a preset picker first:

1. **Prop Firm Standard**
   - target profit: 10%
   - max daily loss: 5%
   - max overall drawdown: 10%
   - minimum trading days: 5
   - type: Evaluation
   - drawdown mode: Static

2. **Prop Firm Conservative**
   - target profit: 8%
   - max daily loss: 4%
   - max overall drawdown: 8%
   - minimum trading days: 5
   - type: Evaluation
   - drawdown mode: Static

3. **Funded Account**
   - target profit: 0% / optional
   - max daily loss: 5%
   - max overall drawdown: 10%
   - minimum trading days: 0
   - type: Funded
   - drawdown mode: Static

4. **Personal Account**
   - target profit: custom
   - max daily loss: custom
   - max overall drawdown: custom
   - minimum trading days: 0
   - type: Personal
   - drawdown mode: Balance-based

5. **Custom Manual**
   - all values manually entered

Flow:

```text
+ Challenge Baru
→ Choose preset
→ Fill name, currency, starting balance, start date
→ Rules auto-fill from preset
→ User can edit values
→ Save
```

## Internal tabs

Default tab: `Overview`.

Tabs:

```text
Overview | Rules | Journal | Analytics | Risk Monitor | AI Review
```

Tabs can be implemented as client state in the page for MVP. Each tab reads from the selected challenge and its trade list.

## Overview tab

Overview is the main dashboard. It must be the easiest section to read.

Cards:

- Saldo awal / Starting balance
- Saldo saat ini / Current balance
- Equity saat ini / Current equity
- Profit/loss berjalan / Running P/L
- Progress target profit
- Sisa target profit / Remaining target
- Daily loss hari ini / Today's daily loss
- Sisa batas daily loss / Remaining daily loss limit
- Overall drawdown saat ini / Current overall drawdown
- Sisa batas drawdown / Remaining drawdown limit
- Total trade
- Win rate
- Profit factor
- Average RR
- Status akun / Account status

Progress bars:

- profit target progress
- daily loss usage
- overall drawdown usage
- minimum trading days progress

Account status badge:

- `safe` / Aman: account is far from rule breach
- `warning` / Waspada: account approaches risk limits
- `danger` / Bahaya: account is very close to breach
- `failed` / Gagal: a challenge rule is breached

Status priority:

1. failed if daily loss or overall drawdown limit is breached
2. danger if daily loss or drawdown usage >= 90%
3. warning if daily loss or drawdown usage >= 70%
4. safe otherwise

## Rules tab

Rules tab edits the selected challenge configuration.

Required fields:

- Nama challenge / Challenge name
- Mata uang akun / Account currency: IDR, USD, EUR, GBP
- Saldo awal / Starting balance
- Saldo saat ini / Current balance
- Equity saat ini / Current equity
- Target profit percent
- Target profit amount
- Max daily loss percent
- Max daily loss amount
- Max overall drawdown percent
- Max overall drawdown amount
- Minimum trading days
- Start date
- End date optional
- Account type: Personal, Prop Firm, Funded, Evaluation
- Drawdown mode: Static, Trailing, Balance-based, Equity-based
- News trading allowed: Yes/No
- Hold overnight allowed: Yes/No
- Hold weekend allowed: Yes/No
- Consistency rule optional
- Max lot optional
- Max risk per trade optional
- Max trades per day optional, useful for overtrade warning

Calculation behavior:

- target amount = initial balance × target percent
- max daily loss amount = initial balance × max daily loss percent
- max overall drawdown amount = initial balance × max overall drawdown percent
- if percent changes, amount recalculates
- if amount changes manually, percent recalculates
- current balance/equity can be derived from trades in a future import/sync phase; MVP allows manual edits in Rules/Overview to handle partial historical data

## Journal tab

Journal MVP uses manual input first. No CSV or MT5 import in Phase 1.

Journal has three areas:

1. Journal Input
2. Journal Dashboard
3. Journal Table

### Journal Input

Add/edit trade form fields:

- Date
- Pair / symbol
- Session: Asia, London, New York
- Direction: Buy / Sell
- Entry price
- Stop loss
- Take profit
- Exit price
- Lot size
- Risk nominal
- Risk percent
- Result: Win, Loss, BE
- Profit/loss nominal
- Profit/loss percent
- RR planned
- RR realized
- Setup name
- Entry reason
- Exit reason
- Emotion at entry
- Mistake category
- Confidence level: 1-5
- Discipline score inputs:
  - discipline score 1-5
  - trade quality: A+, A, B, C, D
  - followed plan: Yes/No
- Screenshot setup optional URL
- Evaluation notes

### Discipline score

Each trade gets a computed `discipline_score` from 0 to 100.

Initial formula:

- start at 100
- subtract 20 if `followed_plan = false`
- subtract 15 if `mistake_category != no_mistake`
- subtract 10 if `emotional_state` is one of FOMO, Revenge, Greedy, Fear, Overconfident
- subtract 10 if `risk_percent > max_risk_per_trade_percent`
- subtract 10 if `trade_quality` is C or D
- clamp at 0 minimum

### Journal Dashboard

Show summary cards:

- Total trade
- Net P/L
- Win rate
- Average RR
- Profit factor
- Best setup
- Worst setup
- Best pair
- Worst pair
- Best session
- Worst session
- Most frequent mistake
- Most frequent loss emotion
- Trades today
- Current loss streak
- Average risk per trade
- Discipline Score today
- Average Discipline Score
- Best discipline day
- Worst discipline day

Automatic insights:

- low win rate but high RR can still be profitable if reward-risk is maintained
- high win rate but account loss means average loss may be too large
- warn if a pair often loses
- warn if a session often loses
- warn for repeated FOMO, Fear, Revenge, Greedy, Hesitant, Overconfident
- warn for overtrade
- warn if current loss streak >= 3

### Journal Table

Columns:

- Date
- Pair
- Session
- Buy/Sell
- Risk
- P/L
- RR
- Result
- Setup
- Discipline Score
- Notes
- Actions: edit, delete

Filters:

- date range
- pair
- result
- session
- setup

## Analytics tab

Analytics reads from the selected challenge trades.

Statistics:

- Total trade
- Win rate
- Loss rate
- Break-even rate
- Total profit
- Total loss
- Net profit
- Average win
- Average loss
- Biggest win
- Biggest loss
- Average RR
- Profit factor
- Expectancy
- Max losing streak
- Max winning streak
- Best/worst pair
- Best/worst session
- Best/worst setup
- Most frequent mistake
- Most frequent emotional state during losses

Charts for MVP can be simple visual cards with real prepared data shapes:

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

If a chart visualization is intentionally simple in Phase 1, the component must still receive prepared data so the visualization can be upgraded without changing analytics contracts.

## Risk Monitor tab

Risk Monitor focuses on warnings and rule compliance.

Automatic warnings:

- daily loss >= 70% of limit → Waspada
- daily loss >= 90% of limit → Bahaya
- daily loss > limit → Gagal
- overall drawdown >= 70% of limit → Waspada
- overall drawdown >= 90% of limit → Bahaya
- overall drawdown > limit → Gagal
- overtrade based on `max_trades_per_day` if set
- current loss streak >= 3
- risk per trade greater than max risk rule
- news trading violation if news trading is disabled and trade marked as news trade
- overnight/weekend violation if future trade flags are added

Example warning copy:

- “Daily loss sudah mencapai 82% dari batas harian. Kurangi risiko atau berhenti trading hari ini.”
- “Overall drawdown mendekati batas maksimum. Akun masuk zona bahaya.”
- “Risk per trade melebihi aturan challenge.”
- “Loss streak terdeteksi. Evaluasi setup sebelum entry berikutnya.”

## AI Review tab

AI Review MVP has complete UI and context generation, but provider integration can be mocked.

Layout:

- Left sidebar: Persona & Review Settings
- Right area: Chat interface

### Persona and settings sidebar

Persona options:

- Strict Prop Firm Coach
- Calm Trading Mentor
- Risk Manager
- Psychology Coach
- Scalping Coach
- Swing Trading Coach
- Custom Persona

Custom persona fields:

- personaName
- personaDescription
- personaContent
- createdAt
- updatedAt

Members can:

- create persona
- edit persona
- delete persona
- select active persona

Custom personas are saved in database per member, not localStorage, because the product direction is member database-backed.

Default persona example:

Name:

```text
Prop Firm Evaluator
```

Content:

```text
Kamu adalah evaluator prop firm. Tugasmu adalah menilai apakah trader layak lanjut challenge berdasarkan jurnal, kepatuhan rules, risk management, dan konsistensi. Berikan penilaian dalam format:
1. Status akun
2. Pelanggaran rules
3. Masalah utama
4. Trade terbaik
5. Trade terburuk
6. Kesalahan berulang
7. Rekomendasi besok
8. Batas risiko besok
9. Kesimpulan lulus/tidak layak lanjut sementara
```

Review scopes:

- all journal trades
- today trades
- this week
- this month
- last trade
- only losing trades
- only trades with mistake
- challenge rules and risk status

Review styles:

- Ringkas / Brief
- Detail
- Tegas / Strict
- Edukatif / Educational
- Checklist
- Action plan

Model provider dropdown for future integration:

- OpenAI
- OpenRouter
- Local Model
- Custom API

Do not hardcode one provider in data model. Store provider selection as a string/enum and route calls through an adapter boundary.

### Chat interface

Elements:

- message history
- input at bottom
- Review Journal button
- Review Last Trade button
- Review Risk button
- Create Action Plan button
- Clear Chat button
- Context preview panel

MVP behavior:

- Build context.
- Store user message and mock assistant response.
- Show mock response:

```text
AI Review belum terhubung ke provider. Context sudah berhasil dibuat.
```

- Show preview of `systemPrompt`, `contextPrompt`, and `userPrompt`.

Helper function:

```ts
buildAIReviewContext({
  challengeConfig,
  trades,
  analytics,
  riskStatus,
  selectedPersona,
  customPersonaText,
  reviewScope,
  reviewStyle,
  userMessage,
})
```

Return shape:

```ts
{
  systemPrompt: string,
  contextPrompt: string,
  userPrompt: string,
}
```

## Proposed database tables

### challenge_accounts

- id uuid primary key
- user_id uuid not null references users(id) on delete cascade
- name text not null
- account_currency text not null
- initial_balance numeric not null
- current_balance numeric not null
- current_equity numeric not null
- profit_target_percent numeric
- profit_target_amount numeric
- max_daily_loss_percent numeric
- max_daily_loss_amount numeric
- max_overall_drawdown_percent numeric
- max_overall_drawdown_amount numeric
- min_trading_days integer not null default 0
- start_date date
- end_date date
- account_type text not null
- drawdown_mode text not null
- news_trading_allowed boolean not null default false
- hold_overnight_allowed boolean not null default false
- hold_weekend_allowed boolean not null default false
- consistency_rule_percent numeric
- max_lot numeric
- max_risk_per_trade_percent numeric
- max_trades_per_day integer
- preset_id text
- archived_at timestamptz
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

Indexes:

- `(user_id, archived_at)`
- `(user_id, created_at desc)`

### challenge_trades

- id uuid primary key
- challenge_account_id uuid not null references challenge_accounts(id) on delete cascade
- user_id uuid not null references users(id) on delete cascade
- trade_date date not null
- symbol text not null
- session text
- direction text
- entry_price numeric
- stop_loss numeric
- take_profit numeric
- exit_price numeric
- lot_size numeric
- risk_amount numeric
- risk_percent numeric
- result text not null
- pnl_amount numeric not null default 0
- pnl_percent numeric
- rr_planned numeric
- rr_realized numeric
- setup_name text
- entry_reason text
- exit_reason text
- emotional_state text
- mistake_category text
- confidence_level integer
- discipline_input_score integer
- trade_quality text
- followed_plan boolean
- discipline_score integer not null default 100
- screenshot_url text
- evaluation_notes text
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

Indexes:

- `(challenge_account_id, trade_date desc)`
- `(user_id, trade_date desc)`
- `(challenge_account_id, result)`
- `(challenge_account_id, symbol)`

### challenge_personas

- id uuid primary key
- user_id uuid not null references users(id) on delete cascade
- name text not null
- description text
- content text not null
- is_default boolean not null default false
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

Indexes:

- `(user_id, created_at desc)`

### challenge_ai_reviews

- id uuid primary key
- challenge_account_id uuid not null references challenge_accounts(id) on delete cascade
- user_id uuid not null references users(id) on delete cascade
- persona_id uuid references challenge_personas(id) on delete set null
- provider text
- review_scope text not null
- review_style text not null
- user_message text
- system_prompt text not null
- context_prompt text not null
- user_prompt text not null
- assistant_response text not null
- created_at timestamptz not null default now()

Indexes:

- `(challenge_account_id, created_at desc)`
- `(user_id, created_at desc)`

## API design

All routes are dynamic and require current member.

Accounts:

- `GET /api/tools/challenge-tracker/accounts`
- `POST /api/tools/challenge-tracker/accounts`
- `GET /api/tools/challenge-tracker/accounts/[accountId]`
- `PATCH /api/tools/challenge-tracker/accounts/[accountId]`
- `DELETE /api/tools/challenge-tracker/accounts/[accountId]`
- `POST /api/tools/challenge-tracker/accounts/[accountId]/archive`

Trades:

- `GET /api/tools/challenge-tracker/accounts/[accountId]/trades`
- `POST /api/tools/challenge-tracker/accounts/[accountId]/trades`
- `PATCH /api/tools/challenge-tracker/trades/[tradeId]`
- `DELETE /api/tools/challenge-tracker/trades/[tradeId]`

Personas:

- `GET /api/tools/challenge-tracker/personas`
- `POST /api/tools/challenge-tracker/personas`
- `PATCH /api/tools/challenge-tracker/personas/[personaId]`
- `DELETE /api/tools/challenge-tracker/personas/[personaId]`

AI Review:

- `GET /api/tools/challenge-tracker/accounts/[accountId]/ai-reviews`
- `POST /api/tools/challenge-tracker/accounts/[accountId]/ai-review`

Export can be added after the MVP database workflow is stable:

- CSV journal export
- JSON journal export
- Markdown AI review export

## Shared model/service structure

Recommended files:

- `shared/types/challengeTracker.ts`
- `shared/repositories/challengeTrackerRepository.ts`
- `shared/services/challengeTrackerService.ts`
- `frontend/src/components/tools/challengeTrackerModel.ts`
- `frontend/src/components/tools/ChallengeTrackerToolPage.tsx`
- `frontend/src/components/tools/ChallengeTrackerTool.tsx`
- `frontend/src/components/tools/ChallengeTracker*.tsx` for focused tab components if needed

Keep calculations in model/service helpers, not embedded directly in JSX.

Core helper functions:

- `calculateChallengeOverview(config, trades)`
- `calculateChallengeAnalytics(config, trades)`
- `calculateRiskStatus(config, trades)`
- `calculateDisciplineScore(trade, config)`
- `buildAIReviewContext(input)`
- `serializeJournalCsv(trades)` for export phase
- `serializeJournalJson(trades)` for export phase

## Empty and auth states

If not logged in:

- Show HERTZ-themed auth required panel.
- Explain that Challenge Tracker stores private challenge data per Telegram member.
- CTA to login with Telegram if existing login component is available.

If logged in but no challenge:

- Show empty state.
- CTA: `Buat Challenge Pertama` / `Create First Challenge`.
- Show preset cards.

If selected challenge has no trades:

- Overview still shows rules and zeroed metrics.
- Journal shows empty table and CTA to add the first trade.
- Analytics and Risk Monitor explain that insights improve after journal entries exist.

## MVP non-goals

Phase 1 does not include:

- MT5 import
- CSV import
- real AI provider calls
- multi-account comparison dashboard
- public sharing
- image upload pipeline for screenshots
- mobile app API beyond web route usage

## Success criteria

- Logged-in member can create multiple challenges.
- Logged-in member can switch selected challenge.
- Logged-in member can edit rules for selected challenge.
- Logged-in member can manually add/edit/delete journal trades for selected challenge.
- Overview updates from rules and journal data.
- Risk Monitor flags warning/danger/failed state correctly.
- Journal Dashboard calculates discipline score and key journal quality metrics.
- AI Review tab builds and stores mock review context.
- No member can access another member's challenge/trade/persona/review data.
- UI matches HERTZ/Profitability visual style and is responsive.
