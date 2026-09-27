# Duha Cloudflare content pilot

This pilot is intentionally read-only and isolated from the live application.

## Current resources

- D1 database: `duha-content-index`
- D1 id: `88f179a9-4cab-4649-8981-fece0c155ba2`
- D1 table: `content_index`
- Seeded records: 5 verification records only
- R2: not created; Cloudflare returned `403` and requires R2 activation in the dashboard
- Worker: `duha-content-worker.js`, validated locally with Wrangler dry-run, not deployed because this sandbox has no Wrangler login

## Worker API

- `GET /health`
- `GET /content?subject=biology&section=curriculum&limit=20`
- `GET /content?q=physics`

The Worker is read-only. It does not write to Supabase, does not handle authentication, and does not handle messages, points, games, or exam results. Those remain on Supabase/Render until a separate migration is designed and tested.

## Deployment after explicit Cloudflare login

```bash
npx wrangler login
npx wrangler deploy cloudflare/duha-content-worker.js \
  --config cloudflare/wrangler.duha-content.toml
```

Do not change the live frontend API URL until the Worker is deployed and its response is verified against the same lesson IDs and sample content.
