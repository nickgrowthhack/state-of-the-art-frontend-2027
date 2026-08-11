<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:design-system-rules -->

# Design System: ALWAYS use shadcn/ui components in EVERYTHING

This project has its own fully defined design system built with shadcn, and it must be followed religiously: always use the component that matches the context, and never override any part of it. The theme comes from shadcn preset `b3uv3ZyQIE` with base `aria` and RTL enabled (style `lyra`, base color `neutral`, theme `indigo`, chart color `indigo`, icon library `tabler`, font `geist`, font heading `geist-mono`, radius `default` (`none`), menu accent `subtle`, menu color `default-translucent`) and is materialized in the shadcn monorepo layout: the design system lives in `packages/ui` (components in `packages/ui/src/components`, theme in `packages/ui/src/styles/globals.css`) and there are two `components.json` files (`apps/web/components.json` and `packages/ui/components.json`) — never edit any of them. It is fully defined — there is no styling decision left for you to make.

Imports: UI components come from `@workspace/ui/components/<name>`, `cn` from `@workspace/ui/lib/utils`. To add a component: `pnpm dlx shadcn@latest add <name> -c apps/web` (files land in `packages/ui`).

Always use the `shadcn` skill before writing UI, and interpret "almost as a rule" everything it merely treats as advice ("best practice" = "practically a rule in this project").

<!-- END:design-system-rules -->
