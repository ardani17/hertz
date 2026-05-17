# Outlook Public Reader Refresh Design

Date: 2026-05-17
Status: Ready for user review

## Goal

Refresh the public Outlook reading experience so it feels like a social-friendly market insight feed, not only a conventional article archive. The first implementation focus is the reader-facing flow: `/outlook` and `/outlook/[slug]`.

Admin and API changes are in scope only where they support the public reader experience. Publisher workflow must stay lightweight: all new Outlook metadata fields are optional.

## Approved Direction

Use a public-first refresh.

- Listing `/outlook`: mixed content insight feed.
- Detail `/outlook/[slug]`: adaptive detail view based on content type.
- Style target: social-friendly insight, aligned with HERTZ.
- Mobile: use the same HERTZ mobile shell and bottom navigation for consistency.
- Publisher inputs: optional, never required.

## Content Types

Outlook must support these content shapes as first-class public formats:

- Video Outlook: recorded market direction, embedded video, or video link.
- Long Read: longer narrative article or market research note.
- Chart Note: TradingView screenshot or market chart with a short caption.

The UI should not assume every Outlook entry is a long article.

## Listing Design

`/outlook` becomes an Insight Feed.

Desktop:

- Keep the existing HERTZ shell.
- Main column is the feed.
- Right sidebar may remain, but it must not visually overpower the feed.
- Feed cards support video, long read, and chart note layouts.
- Video and chart cards show meaningful media previews.
- Long read cards can be text-first and must not use fake thumbnails.

Mobile:

- One-column feed.
- Use the same HERTZ mobile footer/bottom nav.
- Video and chart entries can show larger media previews.
- Long reads should remain compact and readable.
- Snapshot metadata appears as compact horizontal chips when present.

Each feed item should show available public context:

- content type label
- title
- summary, caption, or excerpt fallback
- author handle when available
- publish time
- optional snapshot chips

## Detail Design

`/outlook/[slug]` adapts to content type:

- Video Outlook: video/embed first, then snapshot, caption/summary, and optional article body.
- Long Read: headline, snapshot when present, then comfortable article typography.
- Chart Note: chart image displayed large without cropping, then caption, snapshot, and optional notes.

Media handling must avoid cropping chart screenshots or attached images. The reader should be able to inspect chart content clearly.

## Optional Snapshot Fields

The public UI may display these fields when present:

- bias
- timeframe
- market
- sentiment
- risk
- key points

All fields are optional. Public fallback behavior:

- If snapshot fields are empty, do not render empty labels or broken placeholders.
- If summary/caption is empty, use an excerpt from body content.
- If no media exists, show a clean text-first card.
- If chart image exists, show it uncropped.
- If video exists, show the video format on listing and detail.

## Admin And Data Rules

New publisher-facing fields must not be required.

Optional fields:

- content type: video / article / chart note
- video URL or embed reference
- chart image or cover image
- bias
- timeframe
- market
- sentiment
- risk
- key points
- summary/caption

If `contentType` is empty, the public layer should infer the best display mode from available data:

- video URL exists: Video Outlook
- chart/cover image exists with short body: Chart Note
- otherwise: Long Read

This inference is a fallback only. It must not block publishers from saving.

## Implementation Boundaries

This spec does not include a full editorial system rebuild.

In scope:

- Public Outlook listing UI refresh.
- Public Outlook detail UI refresh.
- Optional metadata support where needed.
- Responsive behavior for desktop and mobile.
- Basic tests for mapping/fallback behavior.

Out of scope for the first pass:

- Required editorial workflow.
- Complex approval/publishing pipeline.
- Analytics dashboards.
- Paid content or permission changes.
- Large admin redesign unrelated to the optional fields above.

## Verification

Implementation should be verified without starting a dev server on the VPS.

Required checks:

- Relevant unit tests for Outlook mapping/fallbacks.
- Type/check or build command used by this repository.
- Manual live verification by the user after deploy.

Important manual cases:

- Video Outlook entry with no long body.
- Long Read entry with no media.
- Chart Note entry with screenshot and short caption.
- Entry with no optional snapshot fields.
- Mobile listing uses the same HERTZ bottom nav.
- Chart and attached images are not cropped.
