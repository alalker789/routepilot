'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('routepilot_theme');

    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'routepilot_theme',
      darkMode ? 'dark' : 'light'
    );
  }, [darkMode]);

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleShortcut);

    return () => {
      window.removeEventListener('keydown', handleShortcut);
    };
  }, []);

  const logout = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('routepilot_token');
      router.push('/login');
    }
  };

  const items = [
    ['⌂', 'Dashboard', '/'],
    ['▣', 'Hosted Zones', '/zones'],
    ['◇', 'Traffic Policies', '/traffic-policies'],
    ['♥', 'Health Checks', '/health-checks'],
    ['◌', 'Resolver', '/resolver'],
    ['□', 'Profiles', '/profiles'],
  ];

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <header className="topbar">
        <div className="brand">
          Route<span>Pilot</span>
        </div>

        <input
          ref={searchRef}
          className="topsearch"
          placeholder="Search resources"
        />

        <div className="topright">
          <button
            className="themeToggle"
            onClick={() => setDarkMode((value) => !value)}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={
              darkMode ? 'Switch to light mode' : 'Switch to dark mode'
            }
          >
            {darkMode ? '☀' : '☾'}
          </button>

          <button
            onClick={logout}
            style={{
              background: 'none',
              border: 0,
              color: 'inherit',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="navtitle">DNS management</div>

          {items.map(([icon, label, href]) => (
            <Link
              key={href}
              href={href}
              className={
                'navitem ' +
                ((href === '/' ? path === '/' : path.startsWith(href))
                  ? 'active'
                  : '')
              }
              style={{
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              {icon} &nbsp; {label}
            </Link>
          ))}

          <div className="navtitle">Account</div>

          <div className="navitem">
            ▤ &nbsp; Saved views
          </div>

          <div className="navitem">
            ◫ &nbsp; Activity
          </div>
        </aside>

        <main className="main">{children}</main>
      </div>
    </div>
  );
}