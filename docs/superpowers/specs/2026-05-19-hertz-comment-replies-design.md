# HERTZ Comment Replies Design

Date: 2026-05-19
Status: Approved for implementation

## Goal

Add social-media-style replies to HERTZ post comments so members can respond directly to an existing comment without disrupting the main post discussion.

## Current State

The database already has `hertz_comments.parent_comment_id`, but the repository, service, API, response type, and UI do not use it. Comments are displayed as a flat list, and users can only create top-level comments.

## Design

Use one-level nested replies:

- top-level comments render normally;
- each visible comment has a `Balas` action;
- clicking `Balas` opens a compact inline reply form below that comment;
- replies render indented below their parent;
- replying to a reply attaches to the top-level parent to avoid deeply nested mobile UI.

## Backend Behavior

- `POST /api/hertz/posts/[shortId]/comments` accepts optional `parentCommentId`.
- If provided, the parent comment must exist, be visible, not deleted, and belong to the same post.
- The repository stores `parent_comment_id`.
- Post detail maps comments into `comments[]` where each top-level comment has `replies[]`.
- Comment counts continue to count all visible comments, including replies.

## Notifications

- Existing post-owner comment notification remains.
- When replying to someone else's comment, notify the parent comment owner as a reply/comment activity.
- Avoid self-notifications and duplicate notifications to the same recipient where practical.

## UI Behavior

- Logged-in members see `Balas` under comments.
- Guests see existing login CTA behavior if they try to participate.
- Reply forms reuse the same 2000-character limit and error handling as normal comments.
- Reply list is visually indented but compact for mobile.

## Verification

- Add/extend unit tests for comment tree building and composer state.
- Run focused tests.
- Run `npm run build:frontend`.
- Commit only related changes.
