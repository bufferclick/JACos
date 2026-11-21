import { useEffect, useMemo, useState } from 'react';
import { getLocalPlaylists, deleteLocalPlaylist, onLocalLibraryChange } from '../lib/localLibrary';
import CreatePlaylistModal from '../components/CreatePlaylistModal';
import { navigate } from '../lib/router';
import Artwork from '../components/Artwork';
import { artwork } from '../lib/soundcloud';
import { toast } from '../lib/toast';
import { ChevronRightIcon } from '../components/NavIcons';

/**
 * Playlists — SoundCloud app's list screen: a search field, one "Create new"
 * action and a row per playlist (artwork, name, type · track count).
 */
export default function PlaylistsPage() {
  const [tick, setTick] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => onLocalLibraryChange(() => setTick((t) => t + 1)), []);

  const playlists = useMemo(() => getLocalPlaylists(), [tick]);
  const q = filter.trim().toLowerCase();
  const shown = q ? playlists.filter((p) => p.name.toLowerCase().includes(q)) : playlists;

  const remove = (id: string, playlistName: string) => {
    if (confirmingId !== id) {
      setConfirmingId(id);
      window.setTimeout(() => setConfirmingId((c) => (c === id ? null : c)), 4000);
      return;
    }
    setConfirmingId(null);
    deleteLocalPlaylist(id);
    toast(`Deleted “${playlistName}”.`);
  };

  return (
    <div className="page container list-page">
      <header className="list-hero">
        <div className="list-hero-text">
          <h1>Playlists</h1>
          <p className="list-sub">{playlists.length} playlist{playlists.length === 1 ? '' : 's'}</p>
        </div>
        <div className="list-hero-actions">
          <button className="btn btn-orange-solid btn-sm btn-create" onClick={() => setCreateOpen(true)}>
            <span aria-hidden="true">＋</span> Create new
          </button>
        </div>
      </header>

      {playlists.length > 0 && (
        <form className="search list-search" role="search" onSubmit={(e) => e.preventDefault()}>
          <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5.2" stroke="currentColor" strokeWidth="1.6" />
            <path d="m11.2 11.2 3.4 3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={`Search ${playlists.length} playlist${playlists.length === 1 ? '' : 's'}`}
            aria-label="Search your playlists"
            spellCheck={false}
          />
        </form>
      )}

      {playlists.length === 0 ? (
        <div className="empty-panel">
          <h2>No playlists yet</h2>
          <p>Create one above — or press the add button (＋) on any track anywhere in JACos and start there.</p>
        </div>
      ) : shown.length === 0 ? (
        <div className="empty-panel">
          <h2>Nothing matches “{filter.trim()}”</h2>
          <p>Try a shorter search.</p>
        </div>
      ) : (
        <ul className="lib-list">
          {shown.map((p) => {
            const art = artwork(p.tracks[0]?.artwork_url, 't200x200');
            const count = p.tracks.length;
            return (
              <li key={p.id} className="lib-item-row">
                <a className="lib-item" href={`#/playlists/${encodeURIComponent(p.id)}`}>
                  <span className="lib-item-art">
                    <Artwork src={art} title={p.name} fluid />
                  </span>
                  <span className="lib-item-meta">
                    <span className="lib-item-title">{p.name}</span>
                    <span className="lib-item-sub">
                      {p.visibility === 'public' ? 'Public playlist' : 'Playlist'} · {count} track{count === 1 ? '' : 's'}
                    </span>
                  </span>
                  <span className="lib-item-trailing">
                    <ChevronRightIcon className="lib-item-chevron" />
                  </span>
                </a>
                <button
                  className={`lib-item-delete${confirmingId === p.id ? ' is-confirming' : ''}`}
                  onClick={() => remove(p.id, p.name)}
                  aria-label={confirmingId === p.id ? `Confirm deleting ${p.name}` : `Delete ${p.name}`}
                  title={confirmingId === p.id ? 'Tap again to delete' : 'Delete playlist'}
                >
                  {confirmingId === p.id ? (
                    <span className="lib-item-delete-text">Delete?</span>
                  ) : (
                    <svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                      <path d="M4.5 4.5h11M8 4.5V3h4v1.5M6 4.5l.7 11h6.6l.7-11M8.6 7.5v5M11.4 7.5v5" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <CreatePlaylistModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(pl) => navigate(`/playlists/${encodeURIComponent(pl.id)}`)}
      />
    </div>
  );
}
