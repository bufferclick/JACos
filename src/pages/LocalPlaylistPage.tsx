import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import {
  getLocalPlaylist,
  renameLocalPlaylist,
  deleteLocalPlaylist,
  removeTrackFromLocalPlaylist,
  moveTrackInLocalPlaylist,
  localPlaylistDuration,
  onLocalLibraryChange,
  hashPlaylistId,
  markPlaylistPrivate,
} from '../lib/localLibrary';
import { artwork } from '../lib/soundcloud';
import { fmtCount, fmtTotalDuration } from '../lib/format';
import { usePlayer } from '../state/PlayerContext';
import { navigate } from '../lib/router';
import TrackRow from '../components/TrackRow';
import Artwork from '../components/Artwork';
import NotFound from './NotFound';
import ForkButton from '../components/ForkButton';
import CreatePlaylistModal from '../components/CreatePlaylistModal';
import { toast } from '../lib/toast';

export default function LocalPlaylistPage({ id }: { id: string }) {
  const { playQueue, toggle, status, source, shuffle, toggleShuffle } = usePlayer();
  const [tick, setTick] = useState(0);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [makingPrivate, setMakingPrivate] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const dragRef = useRef<{ from: number; over: number | null } | null>(null);

  useEffect(() => onLocalLibraryChange(() => setTick((t) => t + 1)), []);

  useEffect(() => {
    if (!confirmingDelete) return;
    const t = window.setTimeout(() => setConfirmingDelete(false), 4000);
    return () => window.clearTimeout(t);
  }, [confirmingDelete]);

  const playlist = useMemo(() => getLocalPlaylist(id), [id, tick]);

  const total = playlist ? localPlaylistDuration(playlist) : 0;
  const isThisList = !!playlist && source?.type === 'local' && source.id === hashPlaylistId(playlist.id);
  const isPlaying = isThisList && status === 'playing';
  const isLoading = isThisList && status === 'loading';

  const sourceInfo = useMemo(
    () => (playlist ? { type: 'local' as const, id: hashPlaylistId(playlist.id), title: playlist.name } : { type: 'local' as const }),
    [playlist],
  );

  const playAll = useCallback(() => {
    if (!playlist || playlist.tracks.length === 0) return;
    if (isThisList) {
      toggle();
      return;
    }
    playQueue(playlist.tracks, 0, sourceInfo as { type: 'local'; id: number; title: string });
  }, [playlist, isThisList, toggle, playQueue, sourceInfo]);

  const shuffleAll = useCallback(() => {
    if (!playlist || playlist.tracks.length === 0) return;
    if (!shuffle) toggleShuffle();
    const start = Math.floor(Math.random() * playlist.tracks.length);
    playQueue(playlist.tracks, start, sourceInfo as { type: 'local'; id: number; title: string });
  }, [playlist, shuffle, toggleShuffle, playQueue, sourceInfo]);

  /** Move a track and announce it (the library emits a change, so the page re-renders). */
  const move = useCallback(
    (from: number, to: number) => {
      if (!playlist) return;
      const length = playlist.tracks.length;
      if (to < 0 || to >= length || from === to) return;
      const moved = playlist.tracks[from];
      if (!moveTrackInLocalPlaylist(playlist.id, from, to)) return;
      setAnnouncement(`Moved ${moved?.title ?? 'the track'} to position ${to + 1} of ${length}.`);
    },
    [playlist],
  );

  const toggleReorder = useCallback(() => setReordering((on) => !on), []);

  // leaving reorder mode drops any in-flight drag state and the global cursor
  useEffect(() => {
    if (reordering) return;
    dragRef.current = null;
    setDragFrom(null);
    setDragOver(null);
    document.body.classList.remove('is-reordering');
  }, [reordering]);

  // Escape leaves reorder mode (and aborts a drag in progress)
  useEffect(() => {
    if (!reordering) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      dragRef.current = null;
      setDragFrom(null);
      setDragOver(null);
      document.body.classList.remove('is-reordering');
      setReordering(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reordering]);

  // dragging: pointer events work for mouse, pen and touch
  useEffect(() => {
    if (dragFrom === null) return;
    const onMove = (e: PointerEvent) => {
      const el = typeof document.elementFromPoint === 'function' ? document.elementFromPoint(e.clientX, e.clientY) : null;
      const row = el instanceof Element ? (el.closest('[data-reorder-index]') as HTMLElement | null) : null;
      const parsed = row?.dataset.reorderIndex !== undefined ? Number(row.dataset.reorderIndex) : NaN;
      const over = Number.isInteger(parsed) ? parsed : null;
      if (dragRef.current) dragRef.current.over = over;
      setDragOver((prev) => (prev === over ? prev : over));
    };
    const finish = () => {
      const state = dragRef.current;
      dragRef.current = null;
      setDragFrom(null);
      setDragOver(null);
      document.body.classList.remove('is-reordering');
      if (state && state.over !== null && state.over !== state.from) move(state.from, state.over);
    };
    const cancel = () => {
      dragRef.current = null;
      setDragFrom(null);
      setDragOver(null);
      document.body.classList.remove('is-reordering');
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', cancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', cancel);
      document.body.classList.remove('is-reordering');
    };
  }, [dragFrom, move]);

  const startDrag = (index: number) => (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!reordering) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    // preventDefault would otherwise swallow focus, and the handle is the
    // keyboard route for moving a track
    try {
      e.currentTarget.focus({ preventScroll: true });
    } catch {
      /* older browsers */
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture is best-effort */
    }
    dragRef.current = { from: index, over: null };
    setDragFrom(index);
    setDragOver(null);
    document.body.classList.add('is-reordering');
  };

  const onHandleKeyDown = (index: number) => (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!playlist) return;
    const last = playlist.tracks.length - 1;
    const target =
      e.key === 'ArrowUp' ? index - 1 :
      e.key === 'ArrowDown' ? index + 1 :
      e.key === 'Home' ? 0 :
      e.key === 'End' ? last :
      null;
    if (target === null) return;
    e.preventDefault();
    move(index, target);
  };

  if (!playlist) return <NotFound />;

  const first = playlist.tracks[0];
  const art = first ? artwork(first.artwork_url, 't500x500') : null;

  const commitRename = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== playlist.name) {
      renameLocalPlaylist(playlist.id, trimmed);
      toast('Playlist renamed.');
    }
    setEditing(false);
  };

  const remove = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    deleteLocalPlaylist(playlist.id);
    toast(`Deleted “${playlist.name}”.`);
    navigate('/playlists');
  };

  return (
    <div className="page container playlist-layout">
      {/* left rail */}
      <aside className="playlist-side">
        <div className="playlist-art">
          <Artwork src={art} title={playlist.name} fluid />
          <button className="playlist-art-play" onClick={playAll} aria-label={isPlaying ? 'Pause' : 'Play playlist'} disabled={playlist.tracks.length === 0}>
            {isLoading ? (
              <span className="card-play-spinner" aria-hidden="true" />
            ) : isPlaying ? (
              <svg viewBox="0 0 24 24" width="34" height="34" fill="#fff" aria-hidden="true"><rect x="7" y="5.5" width="3.8" height="13" rx="1"/><rect x="13.2" y="5.5" width="3.8" height="13" rx="1"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="34" height="34" fill="#fff" aria-hidden="true"><path d="M9 6.4v11.2a.85.85 0 0 0 1.3.72l8.9-5.6a.85.85 0 0 0 0-1.44l-8.9-5.6A.85.85 0 0 0 9 6.4Z"/></svg>
            )}
          </button>
        </div>

        {editing ? (
          <div className="rename-row">
            <input
              className="text-input"
              value={name}
              autoFocus
              maxLength={80}
              spellCheck={false}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setEditing(false);
              }}
              aria-label="Playlist name"
            />
          </div>
        ) : (
          <h1 className="playlist-title local-title">
            {playlist.name}
            <button className="icon-btn rename-btn" onClick={() => { setName(playlist.name); setEditing(true); }} aria-label="Rename playlist" title="Rename playlist">
              <svg viewBox="0 0 18 18" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12.6 2.6a1.8 1.8 0 0 1 2.5 2.5L7 13.2 3.5 14.2 4.5 10.7l8.1-8.1Z"/></svg>
            </button>
          </h1>
        )}

        <div className="playlist-stats">
          {playlist.visibility === 'public' && playlist.slug ? (
            <span className="public-chip" title={`https://jac-os.pages.dev/${playlist.slug}`}>Public · jac-os.pages.dev/{playlist.slug}</span>
          ) : (
            <span className="local-chip">Local playlist · private</span>
          )}
          <span className="dot-sep" aria-hidden="true" />
          <span>{playlist.tracks.length} track{playlist.tracks.length === 1 ? '' : 's'}</span>
          <span className="dot-sep" aria-hidden="true" />
          <span>{fmtTotalDuration(total)}</span>
        </div>

        <div className="playlist-cta">
          <button className="btn btn-orange-solid btn-block" onClick={playAll} disabled={playlist.tracks.length === 0}>
            {isLoading ? 'Loading…' : isPlaying ? 'Pause' : 'Play playlist'}
          </button>
          <button className="btn btn-outline btn-block" onClick={shuffleAll} disabled={playlist.tracks.length === 0}>
            Shuffle play
          </button>
          <button className="btn btn-outline btn-block" onClick={toggleReorder} disabled={playlist.tracks.length < 2}>
            {reordering ? 'Done reordering' : 'Reorder tracks'}
          </button>
          <ForkButton name={playlist.name} tracks={playlist.tracks} />
        </div>
        <div className="playlist-links">
          {playlist.visibility === 'public' && playlist.slug ? (
            <>
              <button className="linkish" onClick={() => { void navigator.clipboard?.writeText(`https://jac-os.pages.dev/${playlist.slug}`); toast('Public link copied.'); }}>
                Copy public link
              </button>
              <button className="linkish" onClick={() => {
                setMakingPrivate(true);
                void markPlaylistPrivate(playlist.id).then(() => {
                  setMakingPrivate(false);
                  toast('Playlist is private again — the link no longer works.');
                });
              }} disabled={makingPrivate}>
                {makingPrivate ? 'Making private…' : 'Make private'}
              </button>
            </>
          ) : (
            <button className="linkish" onClick={() => setPublishOpen(true)}>Make public…</button>
          )}
          <button className={`linkish${confirmingDelete ? ' danger-linkish' : ''}`} onClick={remove}>
            {confirmingDelete ? 'Really delete this playlist?' : 'Delete playlist'}
          </button>
        </div>
      </aside>

      {/* tracklist */}
      <section className="playlist-main" aria-label="Tracklist">
        <div className="tracklist-head" aria-hidden="true">
          <span>{reordering ? '⇅' : '#'}</span>
          <span />
          <span>Track</span>
          <span className="th-wave">Waveform</span>
          <span>Likes</span>
          <span>Time</span>
          <span />
        </div>
        {reordering && (
          <p className="reorder-hint" role="note">
            Drag a track by its handle, or focus the handle and press <kbd>↑</kbd> / <kbd>↓</kbd> (<kbd>Home</kbd> /{' '}
            <kbd>End</kbd> jump to the ends).
            {playlist.visibility === 'public' ? ' The public link follows the new order.' : ''}
          </p>
        )}
        {playlist.tracks.map((track, i) => (
          <TrackRow
            key={track.id}
            track={track}
            index={i}
            queueTracks={playlist.tracks}
            source={sourceInfo as { type: 'local'; id: number; title: string }}
            onRemove={() => {
              removeTrackFromLocalPlaylist(playlist.id, track.id);
              toast('Removed from the playlist.');
            }}
            reorder={
              reordering
                ? {
                    dragging: dragFrom === i,
                    dropTarget: dragFrom !== null && dragOver === i && dragOver !== dragFrom,
                    onPointerDown: startDrag(i),
                    onKeyDown: onHandleKeyDown(i),
                  }
                : undefined
            }
          />
        ))}
        <p className="sr-only" aria-live="polite">{announcement}</p>
        {playlist.tracks.length === 0 && (
          <div className="empty-panel">
            <h2>Empty playlist</h2>
            <p>Press the add button (＋) on any track anywhere in JACos to put it here.</p>
          </div>
        )}
        {playlist.visibility === 'public' && playlist.slug ? (
          <p className="list-note">Public at <strong>jac-os.pages.dev/{playlist.slug}</strong> — anyone with the link can listen. Tracks stream from SoundCloud&rsquo;s CDN.</p>
        ) : (
          <p className="list-note">Stored only in this browser — nothing is uploaded. Tracks stream from SoundCloud&rsquo;s CDN.</p>
        )}
      </section>
      <CreatePlaylistModal open={publishOpen} onClose={() => setPublishOpen(false)} publishOf={playlist} onCreated={() => setTick((t) => t + 1)} />
    </div>
  );
}


