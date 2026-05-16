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

The rebuilt `.next` CSS contains the landing `box-sizing:border-box` fix. The currently running `127.0.0.1:3888` Docker frontend still served the previous bundle during the second sweep, so it continued to report the same landing overflow until the running frontend container is refreshed from the new build.

## Remaining Manual Check

After the production frontend container is rebuilt/restarted, rerun the responsive sweep or manually check `/` at 320px. Other checked routes did not report horizontal overflow in the sweep.
