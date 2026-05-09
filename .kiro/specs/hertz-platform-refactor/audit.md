# Spec Audit: HERTZ Platform Refactor

Tanggal: 2026-05-09
Status: Passed after spec patch

## Sumber Yang Diaudit

- `docs/hertz-refactor/DISCUSSION.md`
- `.kiro/specs/hertz-platform-refactor/requirements.md`
- `.kiro/specs/hertz-platform-refactor/design.md`
- `.kiro/specs/hertz-platform-refactor/tasks.md`
- Figma file `wAvK5fG4g8PK5YZX2htijA`

## Figma Frames

- `40:2` - `V3 / Desktop Final Draft`
- `84:2` - `V3 / Outlook Desktop Draft`
- `84:1368` - `V3 / Blog Desktop Draft`
- `84:2770` - `V3 / Tools Desktop Draft`
- `84:4014` - `V3 / Direct Message Desktop Draft`
- `104:2` - `Horizon Landing / Desktop Mock 02`

## Coverage Result

| Area | Status | Evidence |
| --- | --- | --- |
| Horizon landing `/` | Covered | Requirements 2, 3; Design route map and landing UI; Tasks 7.1 |
| HERTZ `/hertz` | Covered | Requirements 1, 2, 4, 8; Design route map and shell; Tasks 7.2-7.4 |
| Post detail `/hertz/post/[shortId]` | Covered | Requirements 2, 8; Design API/UI; Tasks 5.1, 5.3, 7.5 |
| Short text ID | Covered | Requirements 2.9-2.11; Tasks 5.1 |
| Full HERTZ naming | Covered | Requirements 1; Design overview; Tasks 1.1, 6.1 |
| Pulse replacement | Covered | Requirements 1.5-1.6, 9; Design models/API; Tasks 5.4 |
| Figma desktop shell | Covered | Requirements 4; Design Figma source of truth; Tasks 7.2 |
| Figma stale labels guard | Covered | Requirements 4.13-4.15, 14.21, 20.14-20.15; Design source of truth; Tasks 7.2, 12.3 |
| Full black background | Covered | Requirement 4.16; Design HERTZ shell; Tasks 7.2 |
| Category tabs | Covered | Requirements 4.17, 8.13; Design feed post; Tasks 7.4 |
| Market right rail | Covered | Requirements 5; Design shell; Tasks 7.3 |
| Blog verified member publish | Covered | Requirement 11; Design Blog; Tasks 8.1 |
| Outlook WordPress preservation | Covered | Requirement 12; Design Outlook; Tasks 8.2 |
| Tools shell integration | Covered | Requirement 13; Design route map; Tasks 8.3 |
| Direct Message real feature | Covered | Requirement 14; Design DM; Tasks 9 |
| DM attachments | Covered | Requirements 14.12-14.15; Design DM model; Tasks 9.2 |
| DM privacy/report | Covered | Requirements 14.16-14.18; Design Security; Tasks 9.4 |
| Guest read-only | Covered | Requirement 6; Tasks 4.3, 7.4, 12.1 |
| Telegram membership verification | Covered | Requirement 7; Design Auth; Tasks 4 |
| Telegram `/publish` flow | Covered | Requirement 18; Design Telegram; Tasks 6 |
| Admin `/admin/hertz` | Covered | Requirement 15; Design Admin API; Tasks 10 |
| Credit admin settings | Covered | Requirement 17; Design Credit; Tasks 10.2 |
| Credit idempotency | Covered | Requirement 17.6-17.8; Design Credit; Tasks 3.7, 12.1 |
| Community note source URL | Covered | Requirement 10; Design Community Notes; Tasks 5.5 |
| Data reset and schema `hertz_*` | Covered | Requirement 16; Design Database; Tasks 2 |
| Seed lengkap | Covered | Requirement 20; Tasks 11 |
| Docker QA | Covered | Requirement 20.11; Tasks 12.4 |
| Code organization | Covered | Requirement 21; Design structure; Tasks 1.2, 3 |

## Findings Fixed During Audit

1. Figma metadata still had stale layer names including `Signal Ledger`, `Gallery`, and `HERTS`.
   - Fixed by adding non-authoritative stale-layer guardrails to requirements, design, and tasks.
2. Figma frame/node IDs were not explicit in spec.
   - Fixed by adding file key and node IDs to design and visual QA requirements.
3. Desktop UI details from Figma were too general.
   - Fixed by adding icon direction, full black background, category tabs, composer chip treatment, spine icon states, and DM tabs.
4. Task requirement references did not include the newly added UI acceptance criteria.
   - Fixed by expanding task requirement ranges.

## Final Verdict

The spec is ready for implementation. Based on the current discussion document and Figma metadata, all agreed product decisions and desktop UI references are represented in requirements, design, and tasks.
