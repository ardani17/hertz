# Profitability Simulator Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Upgrade Profitability Simulator from a numeric Monte Carlo calculator into a decision-support tool with presets, goal modes, insight summaries, risk recommendations, danger metrics, and simple visual charts.

**Architecture:** Move deterministic simulation and analysis helpers into a focused model module, keep the React component responsible for state and rendering, and add unit tests against the model. UI additions reuse the existing `ToolShell.module.css` patterns so the page remains native to the HERTZ tools shell.

**Tech Stack:** Next.js App Router, React client component, TypeScript, CSS Modules, Vitest.

---

### Task 1: Extract and test profitability model

**Files:**
- Create: `frontend/src/components/tools/profitabilityModel.ts`
- Create: `tests/unit/frontend/profitabilityModel.test.ts`
- Modify: `frontend/src/components/tools/ProfitabilityTool.tsx`

- [x] Move input types, currency helpers, parser/formatter helpers, seeded random, `normalizeInputs`, and `runSimulation` into `profitabilityModel.ts`.
- [x] Export pure helpers needed by the UI: `currencyConfigs`, `parseBalanceInput`, `formatNumberInput`, `formatCurrency`, `normalizeInputs`, `runSimulation`.
- [x] Add Vitest coverage for safe input clamps, deterministic seed output, IDR/USD parsing, and drawdown/profitable metrics.
- [x] Update `ProfitabilityTool.tsx` to import helpers from the model file.

### Task 2: Add presets, goal modes, and analysis helpers

**Files:**
- Modify: `frontend/src/components/tools/profitabilityModel.ts`
- Modify: `tests/unit/frontend/profitabilityModel.test.ts`
- Modify: `frontend/src/components/tools/ProfitabilityTool.tsx`

- [x] Add `GoalMode` and `PresetId` types.
- [x] Add preset definitions for Conservative, Balanced, Aggressive, High RR, Scalping, Swing, and Prop Firm Safe.
- [x] Add `analyzeSimulation()` that returns grade, verdict, risk level, danger metrics, and risk recommendation from normalized inputs and simulation results.
- [x] Test that high risk/drawdown produces danger warnings and Prop Firm Safe produces conservative recommendations.

### Task 3: Render Phase 1 UX

**Files:**
- Modify: `frontend/src/components/tools/ProfitabilityTool.tsx`
- Modify: `frontend/src/components/tools/ProfitabilityToolPage.tsx`
- Modify: `frontend/src/components/tools/ToolShell.module.css`

- [x] Add Goal Mode select and preset buttons above the run button.
- [x] Add insight panel above result metrics with verdict, risk label, risk recommendation, and key warnings.
- [x] Add danger zone cards for drawdown breach probability.
- [x] Add simple CSS/SVG charts for equity curve, result distribution, and drawdown curve using existing simulation output.
- [x] Keep mobile layout one column, with compact cards and no horizontal overflow.

### Task 4: Verify and commit

**Files:**
- Modify only files from Tasks 1-3 and this plan.

- [x] Run `npm test -- tests/unit/frontend/profitabilityModel.test.ts`.
- [x] Run `npm run build:frontend`.
- [x] Check `git diff --stat` and avoid staging unrelated pre-existing dirty files.
- [x] Commit relevant files with a focused message.
