# caret-landing-page

Marketing landing page for **[Caret](https://github.com/precious112/caret)** — an AI design tool in your IDE.

Plain static site (HTML + CSS + vanilla JS), no build step. Auto-deployed to Netlify on every push to `main`.

## Structure
```
index.html      # the page
styles.css      # styling (dark navy + electric-blue, editorial)
main.js         # download handling, OS detection, scroll reveal, star modal
netlify.toml    # deploy config (publish root, no build)
assets/
  caret-logo.png
  gifs/         # feature demo GIFs
```

## Local preview
Open `index.html` in a browser, or:
```bash
python3 -m http.server 8080   # then visit http://localhost:8080
```

## Download buttons
The OS download buttons point at the latest Caret IDE release assets via stable URLs
(`https://github.com/precious112/caret-ide/releases/latest/download/...`), so they always serve
the newest build with no GitHub redirect. After a download starts, a modal nudges a GitHub star.

## Deploy
Connected to Netlify (continuous deploy from `main`). Custom domain is configured in the
Netlify dashboard.
