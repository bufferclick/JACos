# JACo's Soundcloud

**Just Another Copy of Sweden's Soundcloud** — paste a public SoundCloud profile or playlist URL and stream what they publish, straight from SoundCloud's own CDN.

[![version](https://img.shields.io/badge/version-0.2.1-ff5500.svg)](package.json)
[![license](https://img.shields.io/badge/license-MIT-ff5500.svg)](LICENSE)

Open source (MIT), made by **Buffer**. Not affiliated with SoundCloud AB — all audio belongs to its uploaders.

## Features

- **Basically SoundCloud, open source** — search the entire catalog, paste a profile (`soundcloud.com/bfrend`), a playlist (`soundcloud.com/bfrend/sets/mix`), a full URL, or a bare `@handle`. Link-style URLs work on the hosted site too (`jac-os.pages.dev/bfrend`). Plain-word searches always open results — never someone's profile.
- **Search like SoundCloud** — the top search box finds **tracks**, **playlists** and **people** across all of SoundCloud, with SoundCloud-style result sections and pagination.
- **Likes & playlists — private or public** — like any track and it lands in **Likes**; create unlimited **local playlists** with the ＋ button on any row or in the player. **Reorder any playlist** with the handle (drag it, or press ↑ / ↓) — the order sticks and a public link follows it. Private playlists stay in this browser only — nothing is uploaded or synced. Make any playlist **public** and it gets a shareable link (`jac-os.pages.dev/<your-slug>`) that anyone can open — no account needed; the link follows your edits and can be made private again any time.
- **Fork any playlist** — one tap copies any SoundCloud, public or local playlist into your own private copy, ready to trim, extend and rename.
- **Full player** — play, shuffle, repeat, seek (drag the bar — audio only jumps when you release), like, volume (defaults to 50%), keyboard shortcuts (Space / arrows / L), and lock-screen controls via the Media Session API. Navigation mirrors SoundCloud: a left rail (Home / Search / Library, your playlists) on desktop and a **Home · Search · Library** tab bar on phones, with a Library page holding likes, playlists and recently played.
- **Dark & light themes** — perfect dark mode, a light theme faithful to SoundCloud, or follow your system. Toggle in the top bar or Settings → Appearance.
- **SoundCloud's actual catalog and rules** — unavailable or uploader-blocked tracks are simply not playable; everything public that SoundCloud allows streams here.
- **Zero-config connection** — on Cloudflare Pages a tiny built-in **Pages Function** (`functions/api/sc`) talks to SoundCloud server-side and handles the web player's `client_id` handshake automatically. Nothing to paste, nothing to sign up for.
- **Static-host fallback** — if the build is hosted somewhere without Functions, JACos falls back to a browser route chain with an auto-detected, verified `client_id` (and remembers the route that works). A custom `client_id` and CORS proxy can be set in Settings as an escape hatch. Stuck connection? Settings → **Reset connection** clears the remembered state.
- **Never trusts one stream** — every track gets a source chain: cached copy → each SoundCloud transcoding (progressive MP3, then every HLS preset) → your own download API, if you configured one. Search rows are hydrated to their full track object first, because api-v2 search results ship without stream formats. The first source that plays wins, is remembered for that track *and* for the tracks that follow, and its audio is downloaded in the background into the browser cache. A track that failed yesterday starts from the source that worked today.
- **Downloads what it can** — when a format won't stream in `<audio>`, JACos downloads it through the API instead (progressive files directly, HLS by fetching the playlist plus every segment and joining them), verifies the result, and stores it in Cache Storage. Replays never touch the network.
- **Tracklist parity** — plays, duration, likes and waveform-style seeks, just like the real thing. Because it is a copy of the real thing.

> Note on playback: audio comes straight from SoundCloud's CDN — `<audio>` for progressive MP3s, hls.js (or every HLS preset, one after another) for HLS — and the winning copy is cached in your browser (`Cache Storage`, opt-out in Settings). Nothing is kept on JACo's servers. Tracks that are region-locked or uploader-disabled on SoundCloud can't play here either; everything else gets as many attempts as SoundCloud offers formats.

## How it works

```
┌────────────┐   same-origin    ┌──────────────────────┐   server-side    ┌──────────────┐
│  Browser    │  /api/sc?path=  │  Pages Function      │  api-v2 with a   │  SoundCloud  │
│  (React SPA)│ ──────────────► │  functions/api/sc    │ ───────────────► │  api-v2      │
│             │ ◄────────────── │  (scrape client_id,  │ ◄─────────────── │              │
└────────────┘   JSON           │   cache, retry 401)  │   JSON           └──────────────┘
      │                          └──────────────────────┘
      │  audio: <audio>/hls.js direct from SoundCloud's CDN (signed URL)
      ▼
  soundcloud CDN
```

- The SPA is a static Vite + React build. Audio goes straight from SoundCloud's CDN to the browser; JACo's stores nothing server-side, ever.
- Public playlists are the one place JACo's keeps data: a Supabase table of slug → track-ID snapshots, written anonymously (insert-only for everyone; updates/deletes require the creator's per-playlist editor key). No accounts, no analytics.
- `functions/api/sc` is a generic, server-side bridge to `https://api-v2.soundcloud.com`. It scrapes the same `client_id` the web player uses (or `SOUNDCLOUD_CLIENT_ID` if set), caches it in memory, retries once on 401, and negative-caches upstream failures briefly.
- Stream URLs are short-lived, signed CDN URLs. The browser tries each one in order (`src/lib/mediaSources.ts`) and moves on the moment one fails to produce audio — a dead preset costs a few seconds, not the track.
- The source that worked is remembered per track and globally (`source_pref` / `source_stats` in localStorage), so the next attempt starts with it. Global winners reorder the chain for everything else too.
- After playback starts, the winner is downloaded in the background (HLS playlists are resolved and their segments joined) and stored in the browser's Cache Storage. The cache is checked before any network call, so cached tracks start instantly and survive CDN outages. Ceiling: 300 MB / 400 tracks, oldest evicted first; turn it off or clear it in Settings → Playback & cache.
- Nothing is written on the server. Audio lives in the browser cache only, and only when caching is on.

## Develop

```bash
npm ci
npm run dev        # vite dev server
npm run build      # → dist/
npm run preview    # preview the production build
npm run typecheck
```

To emulate the Pages Function locally:

```bash
npm run build
npx wrangler pages dev dist
```

(The bridge needs outbound network access to soundcloud.com; you can also set `SOUNDCLOUD_CLIENT_ID` to skip scraping.)

## Deploy (Cloudflare Pages)

1. Fork this repo.
2. Create a Pages project connected to the fork (or push to your own).
3. Build command `npm run build`, output directory `dist`. `public/_redirects` ships the SPA fallback; `functions/` is picked up automatically as a Pages Function — that's the whole setup.
4. Every push to `main` rebuilds the site. Check the footer tooltip (or Settings → About) for the build time to confirm the deploy you are looking at is the one you just shipped.
5. Optional: set the `SOUNDCLOUD_CLIENT_ID` environment variable to pin a client_id instead of scraping.

## Routes

Hash routes: `#/`, `#/user/<permalink>`, `#/playlist/<id>`, `#/search/<query>`, `#/likes`, `#/playlists`, `#/playlists/<id>`. On the Pages site, link-style URLs like `/bfrend` or `/bfrend/sets/<set>` are rewritten to the right page at boot.

## Settings

Gear icon → Settings, **Playback & cache**: cache usage and on/off, cached-audio clearing, the source scoreboard (which format has been winning for you), "Forget source memory", and an optional **download API** endpoint used when SoundCloud's own formats won't play (JSON with `downloadUrl`, `url` or `audio`).

Settings, **SoundCloud connection**: source of the `client_id`, remembered route, test connection, optional custom `client_id` / CORS proxy for non-Pages hosting.

Settings, **About**: version and build timestamp of the running build, GitHub link, and a page reload button.

The version in the footer comes from `package.json` at build time (see `src/lib/buildInfo.ts`) — if the live site shows an older number, the deploy is stale, not the code.

## Changelog

### 0.2.1

- **Fixed: a song that played before can stop working.** Every SoundCloud stream URL is *signed*, and the signature (`track_authorization`, a JWT) expires within hours. Tracks saved in your likes, playlists or history kept the signature they were saved with, and the player's "this track already has stream formats, no need to ask again" shortcut trusted it forever — so a saved song kept answering 403 long after it stopped being playable. An expired token now counts as *missing* data, so the track is re-fetched with fresh URLs before playback.
- If the whole chain still fails, the player re-fetches the track once (bypassing the 5-minute track memo) and walks every source again before showing an error.
- **Likes and Recently played no longer store signed URLs at all** — only the fields the UI needs — so saved tracks always go through a fresh lookup. Smaller in `localStorage` too.
- Removed the numbered **"How it works"** three-step block from the home page.
- **Modals render through a portal** with an opaque, blurred backdrop, so page content can no longer paint over or through an open dialog (the New playlist sheet was showing the page's search field across its name field).
- Version 0.2.1.

### 0.2.0

**A SoundCloud-shaped shell — the mobile app's navigation, on every screen size.**

- **You can reach your library on a phone now.** That was the real bug: below 1160px the only Likes/Playlists surface was the right-hand column, which `styles.css` hid — and below 640px the header links were hidden too, so the pages existed but nothing linked to them. There is now a bottom tab bar (**Home · Search · Library**) on phones and tablets, the player bar floats above it as a mini-player pill, and **Library** is a first-class page.
- **Library page** (`#/library`) mirrors the app's Library tab: Your likes / Playlists rows with counts and chevrons, then **Recently played** (a new 24-track history, recorded when a track actually starts) and your playlists with artwork, "Playlist · n tracks" and a public marker.
- **Desktop gets soundcloud.com's left rail** instead of the old right-hand column: Home / Search / Library, library shortcuts with live counts, your playlists with artwork, a **New playlist** action and the "stays in this browser" note. Content sits in a single centred column beside it.
- **Track rows are phone-native.** Under 760px each row is artwork · title/artist/"▶ plays · duration" · like · add — the index, waveform and duration columns are gone, and tapping the artwork plays. Reordering still works on touch: the handle column comes back only while reorder mode is on.
- **Likes and Playlists pages rebuilt as app list screens**: big title, track count and total duration, a round shuffle button and a big round orange play button, plus a filter field on Playlists. Playlists are rows now, not a card grid.
- **Search tab** opens a real search screen (`#/search` with no query): its own field, then results as usual.
- Mini-player on phones: artwork, title/artist, round play/pause and like, above the tabs; shuffle/prev/next/repeat/volume stay on desktop where there is room.
- `src/components/Sidebar.tsx` is gone (superseded by `NavRail`, `TabBar` and `LibraryPage`); new `src/components/NavIcons.tsx`, `src/lib/localLibrary.ts` gained `getRecentlyPlayed()` / `recordPlayedTrack()`.
- Version 0.2.0.

### 0.1.8

- **Reorder tracks in your playlists.** Open a local playlist → **Reorder tracks**, then drag a track by its handle (mouse, pen or touch) or focus the handle and press ↑ / ↓ — Home / End send it to the front or back, Escape leaves reorder mode. The order is saved to the playlist immediately, and a public playlist's snapshot follows within a second or two.
- Reordering never disturbs what is currently playing: the player keeps its own queue, so the next play from the playlist uses the new order.
- Track rows for local playlists are now keyed by track id instead of position, so keyboard focus stays on the handle after a move; moves are announced through an `aria-live` region.
- New `moveTrackInLocalPlaylist(id, from, to)` in `localLibrary.ts` (clamped, no-ops on invalid input, persists and syncs).
- Version 0.1.8.

### 0.1.7

- **Fixed "This track has no playable stream" on search results.** api-v2 `/search/tracks` returns shallow rows without `media.transcodings`, so the source chain was built from nothing and playback gave up without a single attempt — even for tracks that play fine on soundcloud.com. The player now hydrates the track first (`/tracks/{id}`, then `/resolve` on the permalink), which brings back every format *and* `track_authorization`.
- Hydrated tracks are remembered for 5 minutes, so the extra lookup happens once per track; already-full tracks (playlists, likes) never make it.
- Failure messages now say which case it is: uploader disabled streaming (`streamable: false`), region-blocked (`policy: BLOCK`/`DENY`), or "SoundCloud listed no formats".
- Version 0.1.7.

### 0.1.6

- Fresh release so Cloudflare Pages builds and publishes the current `main` again (a new commit on `main` is what triggers the deploy).
- No behaviour changes: same playback chain, cache and settings as 0.1.5 — the footer and Settings → About now read `v0.1.6` with a new build timestamp, which is the proof the deploy landed.

### 0.1.5

- **Build stamp** — the version in the footer is the version that build was made from, and the footer tooltip plus Settings → About show the build time (injected by `vite.config.ts`, no hardcoded numbers anywhere). A page that looks older than your change is a stale deploy, and now you can prove it.
- **Reload page** button in Settings → About for exactly that situation.
- Version 0.1.5.

### 0.1.4

- **Multi-source playback chain** — cached copy → every SoundCloud transcoding (progressive, then all HLS presets) → optional custom download API. The player walks the chain until something actually plays, instead of betting on one URL.
- **Source memory** — the winning source is remembered per track and globally, so the next play starts with whatever is working on your network. Player error now retries on the next source (up to 6 hops) instead of stopping, and pressing play on a failed track re-runs the whole chain.
- **Audio cache** — the winning source is downloaded (HLS playlists are fetched and their segments joined) and stored in Cache Storage; cached audio is played before any network call, damaged entries are dropped automatically. 300 MB / 400 tracks ceiling, LRU eviction, on/off switch and stats in Settings → Playback & cache.
- **Download API setting** — plug your own resolver/downloader (`?url=` or a `{url}` placeholder, JSON with `downloadUrl`) in as the last resort.
- Version 0.1.4 (first release after 0.1.3).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please keep the UI faithful to SoundCloud — JACos is a loving copy, not a reimagining.

## License

[MIT](LICENSE). Made by **Buffer**.
