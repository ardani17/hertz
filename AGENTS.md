<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:user-workflow-preferences -->
# User workflow preferences

After completing code edits and verification, commit the relevant changes immediately so the project history stays traceable. Keep unrelated pre-existing working tree changes out of the commit unless explicitly requested.

This workspace is on a VPS. Do not start a dev server for verification; run the relevant build/check command instead because the user verifies changes directly on the live web environment.
<!-- END:user-workflow-preferences -->

<!-- BEGIN:superpowers-workflow -->
# Superpowers workflow preference

The Superpowers plugin is installed for this Codex environment. When the user gives a normal coding or product prompt without explicitly asking for a different process, default to the Superpowers workflow and adapt it to the actual task size.

- At the start of a task, check for and use relevant Superpowers skills first. Prefer the real plugin skill invocation when the session exposes it. If the current session has not refreshed the plugin skill list yet, read the installed skill files from `/root/.codex/plugins/cache/openai-curated/superpowers/dc902811/skills/` and follow them behaviorally.
- For ambiguous feature or UI requests, use `using-superpowers` then `brainstorming` before writing code: clarify intent, explore alternatives, and present the design in small sections for validation. Save a design note when the task is large enough to need one.
- After design approval for non-trivial work, use an isolated branch/worktree workflow when practical. Do not disturb unrelated dirty worktree changes.
- Before implementation, use `writing-plans` for non-trivial work: write a concrete plan with small tasks, exact file paths, and verification steps.
- During implementation, use `test-driven-development` where feasible: write or identify the failing test/check first, make the minimal change, verify it passes, then refactor.
- For multi-step work, use `executing-plans` task by task. Use `subagent-driven-development` only when the user explicitly asks for delegated/parallel agent work, because this Codex environment requires explicit user authorization for subagents.
- Use `requesting-code-review` or a code-review style pass between substantial tasks. Critical issues block completion until fixed or explicitly deferred.
- Before claiming completion, use `verification-before-completion` behavior and run the relevant verification command. On this VPS, do not start a dev server; build/check instead.
- When the task is complete, commit the relevant changes immediately while keeping unrelated existing changes out of the commit.
<!-- END:superpowers-workflow -->
