import { useEffect, useMemo, useState } from 'react';
import {
  getLikedTracks,
  getLocalPlaylists,
  getRecentlyPlayed,
  onLocalLibraryChange,
} from '../lib/localLibrary';
import { artwork } from '../lib/soundcloud';
import { fmtCount } from '../lib/format';
import { openSettings } from '../lib/router';
import { usePlayer } from '../state/PlayerContext';
import Artwork from '../components/Artwork';
import { ChevronRightIcon, GearIcon, HeartIcon, PlaylistIcon } from '../components/NavIcons';

/**
 * Library — the screen SoundCloud's app opens from its Library tab: shortcuts
 * to Your likes / Playlists, then recently played, then your playlists.
 */
export default function LibraryPage() {
  const [tick, setTick] = useState(0);
  const { playQueue, current, status } = usePlayer();

  useEffect(() => onLocalLibraryChange(() => setTick((t) => t + 1)), []);

  const likes = useMemo(() => getLikedTracks(), [tick]);
  const playlists = useMemo(() => getLocalPlaylists(), [tick]);
  const recent = useMemo(() => getRecentlyPlayed(), [tick]);

  return (
    <div className="page container library-page">
      <header className="lib-header">
        <h1>Library</h1>
        <button className="icon-btn" onClick={() => openSettings()} aria-label="Settings" title="Settings">
          <GearIcon />
        </button>
      </header>

      <nav className="lib-shortcuts" aria-label="Your library">
        <a className="lib-shortcut" href="#/likes">
          <span className="lib-shortcut-icon is-heart" aria-hidden="true"><HeartIcon size={22} filled /></span>
          <span className="lib-shortcut-label">Your likes</span>
          <span className="lib-shortcut-count">{likes.length}</span>
          <ChevronRightIcon className="lib-shortcut-chevron" />
        </a>
        <a className="lib-shortcut" href="#/playlists">
          <span className="lib-shortcut-icon" aria-hidden="true"><PlaylistIcon size={22} /></span>
          <span className="lib-shortcut-label">Playlists</span>
          <span className="lib-shortcut-count">{playlists.length}</span>
          <ChevronRightIcon className="lib-shortcut-chevron" />
        </a>
      </nav>

      {recent.length > 0 && (
        <section className="lib-section" aria-label="Recently played">
          <div className="section-head">
            <h2>Recently played</h2>
            <a className="section-link" href="#/likes">See all</a>
          </div>
          <div className="recent-strip">
            {recent.slice(0, 12).map((track, i) => {
              const art = artwork(track.artwork_url, 't300x300');
              const isCurrent = current?.id === track.id;
              return (
                <button
                  key={track.id}
                  className={`recent-tile${isCurrent ? ' is-active' : ''}`}
                  onClick={() => playQueue(recent, i, { type: 'tracks', id: 2_000_000_003, title: 'Recently played' })}
                  title={`Play ${track.title}`}
                >
                  <span className="recent-art">
                    <Artwork src={art} title={track.title} fluid />
                    <span className={`recent-play${isCurrent && status === 'playing' ? ' is-playing' : ''}`} aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff">
                        <path d="M8.5 5.5v13a1 1 0 0 0 1.53.85l10.2-6.5a1 1 0 0 0 0-1.7L10 4.65a1 1 0 0 0-1.5.85Z" />
                      </svg>
                    </span>
                  </span>
                  <span className="recent-title">{track.title}</span>
                  <span className="recent-sub">{track.user?.username ?? 'Unknown artist'}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="lib-section" aria-label="Your playlists">
        <div className="section-head">
          <h2>Your playlists</h2>
          <a className="section-link" href="#/playlists">Manage</a>
        </div>
        {playlists.length === 0 ? (
          <div className="empty-panel">
            <h2>No playlists yet</h2>
            <p>Create one from any track with the ＋ button, or start from the Playlists page.</p>
            <a className="btn btn-orange-solid btn-sm" href="#/playlists">Create a playlist</a>
          </div>
        ) : (
          <ul className="lib-list">
            {playlists.map((p) => {
              const art = artwork(p.tracks[0]?.artwork_url, 't200x200');
              const total = p.tracks.length;
              return (
                <li key={p.id}>
                  <a className="lib-item" href={`#/playlists/${encodeURIComponent(p.id)}`}>
                    <span className="lib-item-art">
                      <Artwork src={art} title={p.name} fluid />
                    </span>
                    <span className="lib-item-meta">
                      <span className="lib-item-title">{p.name}</span>
                      <span className="lib-item-sub">
                        {p.visibility === 'public' ? 'Public playlist' : 'Playlist'} · {total} track{total === 1 ? '' : 's'}
                        {p.visibility === 'public' && (
                          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" style={{ marginLeft: 5, verticalAlign: '-2px' }}>
                            <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" />
                            <path d="M5.8 7V5.2a2.2 2.2 0 0 1 4.4 0V7" />
                          </svg>
                        )}
                      </span>
                    </span>
                    <span className="lib-item-trailing">
                      {typeof p.tracks[0]?.playback_count === 'number' && p.tracks.length > 0 && (
                        <span className="lib-item-plays">{fmtCount(p.tracks[0].playback_count)}</span>
                      )}
                      <ChevronRightIcon className="lib-item-chevron" />
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
