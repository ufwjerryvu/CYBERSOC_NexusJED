"use client";
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';

const links: Array<{ label: string; href: string; key: string }> = [
  { label: 'General', href: '/forum/general', key: 'general' },
  { label: 'Team Finder', href: '/forum/team-finder', key: 'team-finder' },
  { label: 'Admin Alerts', href: '/forum/alerts', key: 'alerts' },
  { label: 'PEP Hours', href: '/forum/pep', key: 'pep' },
];

export default function ChatSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleNav = (href: string) => () => {
    if (pathname !== href) router.push(href);
  };

  return (
    <aside
      style={{
        width: 240,
        minWidth: 200,
        padding: '12px',
        borderRight: '1px solid #2a2a2a',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: 'rgba(0,0,0,0.2)'
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Nexus Channels</div>
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <button
            key={l.key}
            onClick={handleNav(l.href)}
            aria-current={active ? 'page' : undefined}
            style={{
              textAlign: 'left',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid ' + (active ? '#60a5fa' : '#3a3a3a'),
              background: active ? 'rgba(96,165,250,0.15)' : 'transparent',
              color: 'inherit',
              cursor: active ? 'default' : 'pointer',
            }}
            disabled={active}
          >
            {l.label}
          </button>
        );
      })}
    </aside>
  );
}
