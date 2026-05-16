<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:user-workflow-preferences -->
# User workflow preferences

After completing code edits and verification, commit the relevant changes immediately so the project history stays traceable. Keep unrelated pre-existing working tree changes out of the commit unless explicitly requested.

This workspace is on a VPS. Do not start a dev server for verification; run the relevant build/check command instead because the user verifies changes directly on the live web environment.
<!-- END:user-workflow-preferences -->

<!-- BEGIN:superpowers-style-workflow -->
# Superpowers-style workflow preference

When the user gives a normal coding or product prompt without explicitly asking for a different process, default to the Superpowers development workflow and adapt it to the actual task size.

- For ambiguous feature or UI requests, start with brainstorming before writing code: clarify intent, explore alternatives, and present the design in small sections for validation. Save a design note when the task is large enough to need one.
- After design approval for non-trivial work, use an isolated branch/worktree workflow when practical. Do not disturb unrelated dirty worktree changes.
- Before implementation, write a concrete plan with small tasks, exact file paths, and verification steps.
- During implementation, prefer test-driven development where feasible: write or identify the failing test/check first, make the minimal change, verify it passes, then refactor.
- For multi-step work, execute the plan task by task. Use subagents only when the user explicitly asks for delegated/parallel agent work, because this Codex environment requires explicit user authorization for subagents.
- Request or perform code-review style checks between substantial tasks. Critical issues block completion until fixed or explicitly deferred.
- Before claiming completion, run the relevant verification command. On this VPS, do not start a dev server; build/check instead.
- When the task is complete, commit the relevant changes immediately while keeping unrelated existing changes out of the commit.

If the Superpowers plugin/skills are not available in the current environment, follow this workflow behaviorally and state that the plugin itself is not active.
<!-- END:superpowers-style-workflow -->
