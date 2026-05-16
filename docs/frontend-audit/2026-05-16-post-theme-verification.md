# HERTZ Theme Verification

Date: 2026-05-16

## Build

Passed:

```bash
npm --prefix frontend run build
```

## Responsive Sweep

Command used Playwright against the deployed local endpoint:

```bash
http://127.0.0.1:3888
```

Routes checked at 390px, 320px, and 1440px:

- `/`
- `/hertz`
- `/hertz/messages`
- `/hertz/profile`
- `/outlook`
- `/blog`
- `/gallery`
- `/tools`
- `/tools/profitability`
- `/tools/order-book`
- `/tools/economic-calendar`
- `/admin/login`

## Result

The first sweep found one overflow on `/` at 320px: `scrollWidth 353 / clientWidth 320`.

Fix applied in `frontend/src/app/HorizonLanding.module.css` by adding `box-sizing: border-box` to the landing sections that combine width and padding.

After rebuilding/restarting the frontend container, the responsive sweep passed for all listed routes at 390px, 320px, and 1440px.

## Remaining Manual Check

Full create/edit/delete owner flow still needs a manual run in the user's real browser session if we want to verify the complete destructive workflow end to end.
