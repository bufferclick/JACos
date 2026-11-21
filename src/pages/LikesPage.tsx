import { useEffect, useMemo, useState } from 'react';
import { getLikedTracks, migrateLegacyLikes, replaceLikedTracks, onLocalLibraryChange } from '../lib/localLibrary';
import { fmtTotalDuration } from '../lib/format';
import { usePlayer } from '../state/PlayerContext';
import TrackRow from '../components/TrackRow';
import { toast } from '../lib/toast';

/** SoundCloud app's "Your likes" screen: title, shuffle + round play, then rows. */
export default function LikesPage() {
  const { playQueue, source, status, toggle, shuffle, toggleShuffle } = usePlayer();
  const [tick, setTick] = useState(0);
  const [confirmingClear, setConfirmingClear] = useState(false);

  useEffect(() => {
    void migrateLegacyLikes();
    const unsub = onLocalLibraryChange(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  useEffect(() => {
    if (!confirmingClear) return;
    const t = window.setTimeout(() => setConfirmingClear(false), 4000);
    return () => window.clearTimeout(t);
  }, [confirmingClear]);

  const likes = useMemo(() => getLikedTracks(), [tick]);
  const totalDuration = likes.reduce((sum, t) => sum + (typeof t.duration === 'number' ? t.duration : 0), 0);
  const isThisList = source?.type === 'tracks' && source.title === 'Likes';
  const isPlaying = isThisList && status === 'playing';
  const isLoading = isThisList && status === 'loading';

  const playAll = () => {
    if (likes.length === 0) return;
    if (isThisList) {
      toggle();
      return;
    }
    playQueue(likes, 0, { type: 'tracks', id: 2_000_000_001, title: 'Likes' });
  };

  const shuffleAll = () => {
    if (likes.length === 0) return;
    if (!shuffle) toggleShuffle();
    const start = Math.floor(Math.random() * likes.length);
    playQueue(likes, start, { type: 'tracks', id: 2_000_000_001, title: 'Likes' });
  };

  const clearAll = () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }
    replaceLikedTracks([]);
    setConfirmingClear(false);
    toast('All likes cleared.');
  };

  return (
    <div className="page container list-page">
      <header className="list-hero">
        <div className="list-hero-text">
          <p className="list-eyebrow">Your library</p>
          <h1>Your likes</h1>
          <p className="list-sub">
            {likes.length} track{likes.length === 1 ? '' : 's'}
            {likes.length > 0 && <> · {fmtTotalDuration(totalDuration)}</>}
            {' · '}stored in this browser
          </p>
        </div>
        <div className="list-hero-actions">
          {likes.length > 0 && (
            <button
              className={`round-btn${confirmingClear ? ' is-danger' : ''}`}
              onClick={clearAll}
              aria-label={confirmingClear ? 'Confirm clearing all likes' : 'Clear all likes'}
              title={confirmingClear ? 'Tap again to clear all likes' : 'Clear all likes'}
            >
              <svg viewBox="0 0 20 20" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4.5 4.5h11M8 4.5V3h4v1.5M6 4.5l.7 11h6.6l.7-11M8.6 7.5v5M11.4 7.5v5" />
              </svg>
            </button>
          )}
          <button className="round-btn" onClick={shuffleAll} disabled={likes.length === 0} aria-label="Shuffle play" title="Shuffle play">
            <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 5.5h3l7 9h6M2 14.5h3l2.2-2.8M18 5.5h-6l-2.4 3M15 3l3 2.5L15 8M15 12l3 2.5-3 2.5" /></svg>
          </button>
          <button className="round-play" onClick={playAll} disabled={likes.length === 0} aria-label={isPlaying ? 'Pause' : 'Play all'}>
            {isLoading ? (
              <span className="round-play-spinner" aria-hidden="true" />
            ) : isPlaying ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><rect x="7" y="5.5" width="3.6" height="13" rx="1" /><rect x="13.4" y="5.5" width="3.6" height="13" rx="1" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M8.5 5.5v13a1 1 0 0 0 1.53.85l10.2-6.5a1 1 0 0 0 0-1.7L10 4.65a1 1 0 0 0-1.5.85Z" /></svg>
            )}
          </button>
        </div>
      </header>

      {likes.length === 0 ? (
        <div className="empty-panel">
          <h2>No likes yet</h2>
          <p>Tap the heart on any track — here, on profiles, in playlists, or in search — and it will live here.</p>
        </div>
      ) : (
        <div className="track-list">
          <div className="tracklist-head" aria-hidden="true">
            <span>#</span>
            <span />
            <span>Track</span>
            <span className="th-wave">Waveform</span>
            <span>Likes</span>
            <span>Time</span>
            <span />
          </div>
          {likes.map((t, i) => (
            <TrackRow key={t.id} track={t} index={i} queueTracks={likes} source={{ type: 'tracks', id: 2_000_000_001, title: 'Likes' }} />
          ))}
        </div>
      )}
    </div>
  );
}
