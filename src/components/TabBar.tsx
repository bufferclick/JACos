import { useHashRoute } from '../lib/router';
import { HomeIcon, LibraryIcon, SearchIcon } from './NavIcons';

/**
 * Phone bottom navigation — the app equivalent of SoundCloud's Home / Search /
 * Library tabs. This is what was missing: before it, Likes and Playlists had no
 * reachable entry point at all below 1160px (the right column was hidden).
 */
export default function TabBar() {
  const route = useHashRoute();
  const onLibrary =
    route.name === 'library' ||
    route.name === 'likes' ||
    route.name === 'playlists' ||
    route.name === 'localplaylist' ||
    route.name === 'publicplaylist';

  const tabs = [
    { key: 'home', href: '#/', label: 'Home', icon: <HomeIcon size={22} />, active: route.name === 'home' },
    { key: 'search', href: '#/search', label: 'Search', icon: <SearchIcon size={22} />, active: route.name === 'search' },
    { key: 'library', href: '#/library', label: 'Library', icon: <LibraryIcon size={22} />, active: onLibrary },
  ];

  return (
    <nav className="tabbar" aria-label="Main">
      {tabs.map((tab) => (
        <a
          key={tab.key}
          className={`tab${tab.active ? ' is-active' : ''}`}
          href={tab.href}
          aria-current={tab.active ? 'page' : undefined}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </a>
      ))}
    </nav>
  );
}
