# Reference project coding style audit

Audited 2026-11-07 at `../reference-project/project-nextjs-press-frontend`. This nested directory is the actual project; the outer `reference-project` directory is not a Git repository. Its Git branch is `module-32`. The reference is read-only.

| Concern | Observed source and convention | FixItNow application |
|---|---|---|
| Routes and filenames | `app/page.tsx`, `app/blogs/page.tsx`, `app/blogs/[slug]/page.tsx`, and colocated `loading.tsx`; App Router file conventions and PascalCase component names | Use the same direct route and component organization, with descriptive page names |
| Server and client | `app/blogs/page.tsx` is an async server page with an inline `fetch`; `app/blogs/[slug]/page.tsx` awaits Promise `params`; `app/ui/LikeButton.tsx` and `DislikeButton.tsx` use `"use client"` only for click handlers | Keep display and data fetching on the server where possible; isolate forms/actions as client components |
| Components | `app/ui/LikeButton.tsx` and `DislikeButton.tsx` use small arrow functions and default exports; the slug page passes a directly typed prop | Favor simple small functions and typed props; build shared controls only for repeated needs |
| Layout | `app/layout.tsx`, `app/blogs/layout.tsx`, and `app/blogs/authors/layout.tsx` compose children directly, without providers or abstraction layers | Keep role layouts direct; add providers only where required by actual behavior |
| Imports | `app/page.tsx` uses relative imports for nearby UI; slug page uses the configured `@/` alias | Use nearby relative imports and `@/` aliases consistently |
| Loading | `app/blogs/[slug]/loading.tsx` exports one small component | Keep route-level loading files; use installed shadcn skeletons for meaningful shapes |
| API | `app/blogs/page.tsx` calls `fetch` inline and parses JSON; there is no API client or Axios layer | Use straightforward Axios calls against the verified Express API, with a small shared client only where auth/error handling demands it |
| Forms and validation | No forms, Zod schemas, submit state, or inline error examples exist in any reference `app/` file; `package.json` has no Zod, Axios, or form libraries | Follow the mandatory project Zod contract under root `validations/`; do not claim reference form patterns were audited |
| Visual system | Reference has no shadcn preset or component library; `app/globals.css` is minimal | FixItNow's installed `base-mira` and `mist` tokens in `components.json` and `app/globals.css` govern visuals |

The reference is a sparse learning exercise. Its page structure, direct functions, client boundaries, and brevity are useful conventions. It provides no evidence for forms, tables, state management, error handling, Axios, or shadcn composition. Next.js 16.4.5 in FixItNow takes precedence where version guidance differs. No reference files were edited.
