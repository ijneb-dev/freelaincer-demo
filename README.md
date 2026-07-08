# freelAInswer demo

Public static GitHub Pages package for the Benny handoff.

- Public repo Pages link: `https://ijneb-dev.github.io/freelaincer-demo/`
- Public repo: `https://github.com/ijneb-dev/freelaincer-demo`
- Demo entry: `/demo/`
- Link generator: `/links.html`
- Phone handoff: `/qr.html?u=<encoded-demo-url>`

This repository intentionally contains only static demo assets and fictional data. It does not call live services and does not write browser storage.

The private source repo owns the generator:

```bash
pnpm demo:pages:build
pnpm demo:pages:smoke
pnpm demo:pages:link -- --base https://ijneb-dev.github.io/freelaincer-demo/
```

To sync this package from the private repo into this public repo:

```bash
pnpm demo:pages:sync -- --repo /path/to/freelaincer-demo
```
