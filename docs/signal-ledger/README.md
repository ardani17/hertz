# Signal Ledger Design Reference

This folder keeps the visual reference for the Horizon feed refactor.

## Primary Mock

- `signal-ledger-mock-03.png`

## Documents

- `DISCUSSION.md`: discussion log and product decisions.
- `SPEC.md`: technical specification for implementation and audit.
- `SPEC-AUDIT.md`: cross-check between the discussion decisions and the Kiro spec.
- `.kiro/specs/signal-ledger/`: requirements-first implementation spec used for build tasks.

## Direction

Use mock 03 as the implementation reference for the new Signal Ledger feed:

- Dark green trading-community identity, not a direct X/Twitter clone.
- Center timeline with a Horizon-specific signal spine.
- Telegram-origin posts remain a first-class source.
- Web posting is supported for verified Horizon Telegram group members.
- Trading posts should show market context such as pair, risk, source, and time.
- Chart/media previews are important for Trading Room posts.
- `Signal` replaces generic like behavior.
- Repost, quote repost, save, community notes, and note ratings are real product features, not decorative placeholders.
- Guests can read only. Posting and interactions require verified Telegram group membership.

Implementation should follow `SPEC.md` and use this mock as the visual reference.
