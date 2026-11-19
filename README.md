# WinRecorder site

Landing page, installer host and updater endpoint for WinRecorder, a small screen recorder for Windows.

- Next.js 16 (App Router) · TypeScript · Tailwind CSS v4
- Deployed on Vercel (hobby)
- Release binaries and metadata live in Vercel Blob; `content/release.json` is the seed used before a blob store exists.

## Local development

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # production build
```

No environment variables are required locally: the site falls back to `content/release.json` and the installers committed in `public/downloads`.

## API

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/latest` | GET | Tauri updater manifest (`version`, `notes`, `pub_date`, `platforms.windows-x86_64`). |
| `/api/download` | GET/HEAD | 302 to the newest installer. Stable link for the site and README. |
| `/api/release` | GET | Current release record (public, no secrets). |
| `/api/release` | POST | Publish a release manifest. Requires `Authorization: Bearer $RELEASE_TOKEN`. |
| `/api/release/asset?kind=installer\|updater\|signature` | POST | Upload one file (raw body, `x-file-name` header, max 4 MB) and receive its blob URL. |

### Publishing a release

Assets are uploaded one request at a time so each stays under the serverless body limit, then the manifest is written.

```bash
SITE=https://winrecorder-site.vercel.app
TOKEN=$RELEASE_TOKEN

# 1. installer (.exe)
curl -X POST "$SITE/api/release/asset?kind=installer" \
  -H "authorization: Bearer $TOKEN" \
  -H "x-file-name: WinRecorder_2.0.0_x64-setup.exe" \
  --data-binary @WinRecorder_2.0.0_x64-setup.exe

# 2. updater payload (.nsis.zip)
curl -X POST "$SITE/api/release/asset?kind=updater" \
  -H "authorization: Bearer $TOKEN" \
  -H "x-file-name: WinRecorder_2.0.0_x64-setup.nsis.zip" \
  --data-binary @WinRecorder_2.0.0_x64-setup.nsis.zip

# 3. manifest
curl -X POST "$SITE/api/release" \
  -H "authorization: Bearer $TOKEN" \
  -H "content-type: application/json" \
  -d '{
    "version": "2.0.0",
    "notes": "What changed",
    "installer": { "name": "..._x64-setup.exe", "size": 2576253, "url": "<url from step 1>" },
    "updater":   { "name": "..._x64-setup.nsis.zip", "size": 2557045, "url": "<url from step 2>", "signature": "<contents of .nsis.zip.sig>" }
  }'
```

## Environment variables

| Name | Scope | Notes |
| --- | --- | --- |
| `RELEASE_TOKEN` | Production, Preview | Shared secret for `POST /api/release*`. Without it, publishing returns 503. |
| `BLOB_READ_WRITE_TOKEN` | Production, Preview | Injected by Vercel when a Blob store is connected. Without it, the seed file is served. |
| `NEXT_PUBLIC_SITE_URL` | Production | Absolute origin used in the updater manifest. |

## Deploy

```bash
pnpm dlx vercel link      # first time, links this directory to the Vercel project
pnpm dlx vercel env add RELEASE_TOKEN production
pnpm dlx vercel --prod
```

Then point the desktop app's updater endpoint (`src-tauri/tauri.conf.json`) at `https://<domain>/api/latest`.

## Media

`public/media/winrecorder-hero.mp4` and `winrecorder-poster.jpg` are the clipped hero recording. They are stored in Git (under 400 KB combined) rather than blob storage so the page renders without extra env vars.

## License

Site code: MIT. WinRecorder itself is MIT as well.
