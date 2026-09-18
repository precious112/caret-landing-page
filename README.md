# caret-landing-page

Marketing landing page for **[Caret](https://github.com/precious112/caret-desktop)**, a design
layer that lives in your repo.

Plain static site (HTML + CSS + vanilla JS), no build step. Auto-deployed to Netlify on every
push to `main`.

## Structure
```
index.html      # the page
styles.css      # styling (warm paper + Caret blue, editorial serif)
hero-shader.js  # the WebGL wash behind the hero and footer
sections.js     # hero diff panel, feature rail, why line, logo ring
main.js         # download handling, OS detection, scroll reveal, star modal
netlify.toml    # deploy config (publish root, no build)
assets/
  caret-logo.png
  logos/        # harness and provider marks
  video/        # hero loop + feature demos (mp4 + poster jpg)
```

## The argument the page makes

The order of sections is the argument, and it is worth keeping in that order:

> Hero → Problem → Insight → Solution → **Mechanism** → Objections → Download

The mechanism section (`#how`) is the one that is easy to drop and must not be. Caret's design
layer lives in `.caret/`, *beside* the app rather than inside it: same repo, both tracked, but
Caret does not write to your app on its own. Copy that says Caret "edits your real code" or that
changes "land in the files you ship" describes a different product and scares off exactly the
person with a production codebase. Say **repo**, not app source.

## The hero diff panel

The code panel beside the hero video is real: every line is from
`.caret/pages/chair/index.tsx` in the `test3` project that was recorded, at the line numbers it
actually occupies. The two edits in the loop are a colour pick on the topbar CTA (line 49,
`bg-neutral-900` → `bg-brand-500`, which is `#d64b2a` in that project's theme) and a drag-resize
of the gallery image (line 99, `w-[345px]` → `w-[825px]`).

The animation is driven off the video's own `currentTime`, so it lands on the frame the edit
lands and the loop re-arms itself. The beat times in `sections.js` (`BEATS`) were measured off
the file by sampling the green confirmation toast, not eyeballed. **If you ever re-cut
`hero-loop.mp4`, re-measure them and update `LOOP` too.**

## Local preview

The video needs HTTP Range support to seek, which `python3 -m http.server` does not have. For
plain reading it is fine; for anything touching the hero panel use a server that supports it:

```bash
npx serve .          # then visit the printed URL
```

## Download buttons

The OS download buttons point at the latest `caret-desktop` release assets via stable URLs
(`https://github.com/precious112/caret-desktop/releases/latest/download/...`), so they always
serve the newest build with no GitHub redirect. After a download starts, a modal nudges a
GitHub star.

## Deploy

Connected to Netlify (continuous deploy from `main`). Custom domain is configured in the
Netlify dashboard.
