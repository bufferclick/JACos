import { useEffect, useMemo, useState } from 'react';
import { useHashRoute, navigate } from '../lib/router';
import {
  getLikedTracks,
  getLocalPlaylists,
  onLocalLibraryChange,
} from '../lib/localLibrary';
import { artwork } from '../lib/soundcloud';
import CreatePlaylistModal from './CreatePlaylistModal';
import { ChevronRightIcon, HeartIcon, HomeIcon, LibraryIcon, PlaylistIcon, SearchIcon } from './NavIcons';

/**
 * Desktop left rail — soundcloud.com's shape: browse links on top, then the
 * library shortcuts and your playlists. The right-hand column is gone; on
 * phones the TabBar does this job instead.
 */
export default function NavRail() {
  const route = useHashRoute();
  const [tick, setTick] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  // parseHash() returns a fresh object per render, so key effects and memos off
  // a stable signature instead of the object identity.
  const routeKey = JSON.stringify(route);

  useEffect(() => onLocalLibraryChange(() => setTick((t) => t + 1)), []);
  useEffect(() => setTick((t) => t + 1), [routeKey]);

  const likes = useMemo(() => getLikedTracks(), [tick, routeKey]);
  const playlists = useMemo(() => getLocalPlaylists(), [tick, routeKey]);

  const onLibrary = route.name === 'library' || route.name === 'likes' || route.name === 'playlists';

  return (
    <aside className="rail" aria-label="Browse and your library">
      <nav className="rail-nav" aria-label="Browse">
        <a className={`rail-link${route.name === 'home' ? ' is-active' : ''}`} href="#/" aria-current={route.name === 'home' ? 'page' : undefined}>
          <HomeIcon />
          <span>Home</span>
        </a>
        <a className={`rail-link${route.name === 'search' ? ' is-active' : ''}`} href="#/search" aria-current={route.name === 'search' ? 'page' : undefined}>
          <SearchIcon />
          <span>Search</span>
        </a>
        <a className={`rail-link${onLibrary ? ' is-active' : ''}`} href="#/library" aria-current={onLibrary ? 'page' : undefined}>
          <LibraryIcon />
          <span>Library</span>
        </a>
      </nav>

      <div className="rail-group">
        <div className="rail-head">Your library</div>
        <a className={`rail-link rail-link-sm${route.name === 'likes' ? ' is-active' : ''}`} href="#/likes">
          <HeartIcon size={18} />
          <span>Likes</span>
          <span className="rail-count">{likes.length}</span>
        </a>
        <a className={`rail-link rail-link-sm${route.name === 'playlists' ? ' is-active' : ''}`} href="#/playlists">
          <PlaylistIcon size={18} />
          <span>Playlists</span>
          <span className="rail-count">{playlists.length}</span>
        </a>
      </div>

      <div className="rail-group">
        <div className="rail-head">
          <span>Playlists</span>
          <a className="rail-head-link" href="#/playlists">
            All <ChevronRightIcon size={13} />
          </a>
        </div>
        {playlists.length === 0 ? (
          <p className="rail-empty">Playlists you make live here — and only in this browser, unless you publish one.</p>
        ) : (
          <ul className="rail-playlists">
            {playlists.slice(0, 8).map((p) => {
              const art = artwork(p.tracks[0]?.artwork_url, 't120x120');
              const active = route.name === 'localplaylist' && route.id === p.id;
              return (
                <li key={p.id}>
                  <a
                    className={`rail-playlist${active ? ' is-active' : ''}`}
                    href={`#/playlists/${encodeURIComponent(p.id)}`}
                    title={`${p.name} — ${p.tracks.length} track${p.tracks.length === 1 ? '' : 's'}`}
                  >
                    <span className="rail-art">
                      {art ? (
                        <img src={art} alt="" width={36} height={36} loading="lazy" />
                      ) : (
                        <span className="rail-art-fallback" aria-hidden="true">{p.name.slice(0, 1).toUpperCase()}</span>
                      )}
                    </span>
                    <span className="rail-playlist-meta">
                      <span className="rail-playlist-name">{p.name}</span>
                      <span className="rail-playlist-sub">
                        {p.tracks.length} track{p.tracks.length === 1 ? '' : 's'}
                        {p.visibility === 'public' ? ' · public' : ''}
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
        <button className="rail-new" onClick={() => setCreateOpen(true)}>
          <span aria-hidden="true">＋</span> New playlist
        </button>
      </div>

      <p className="rail-note">Your likes and playlists stay in this browser. Nothing is uploaded unless you make a playlist public.</p>

      <CreatePlaylistModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(pl) => navigate(`/playlists/${encodeURIComponent(pl.id)}`)}
      />
    </aside>
  );
}
