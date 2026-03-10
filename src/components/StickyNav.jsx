import React, { useEffect, useRef, useState } from 'react';

const DEFAULT_SECTIONS = [
  { id: 'executive',  label: 'Executive Summary' },
  { id: 'quantitative', label: 'Quantitative' },
  { id: 'key-ratios', label: 'Key Ratios' },
  { id: 'growth',     label: 'Growth & Rule of 40' },
  { id: 'market-tam', label: 'Market & TAM' },
  { id: 'peers',      label: 'Peer Comparison' },
  { id: 'forecasts',  label: 'Forecasts' },
  { id: 'risk',       label: 'Risk Dashboard' },
  { id: 'qualitative', label: 'Qualitative' },
  { id: 'call-to-action', label: 'Call to Action' },
  { id: 'podcast',    label: 'Podcast' },
];

export default function StickyNav({ sections }) {
  const items = sections?.length ? sections : DEFAULT_SECTIONS;
  const [activeId, setActiveId] = useState(items[0]?.id || '');
  const navRef = useRef(null);

  useEffect(() => {
    const ids = items.map((s) => s.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  // Scroll the active nav item into view within the horizontal nav
  useEffect(() => {
    if (!navRef.current) return;
    const activeLink = navRef.current.querySelector('.sticky-nav-link--active');
    if (activeLink) {
      activeLink.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeId]);

  return (
    <nav className="sticky-nav no-print" ref={navRef} aria-label="Report sections">
      <ul className="sticky-nav-list">
        {items.map((section) => (
          <li key={section.id} className="sticky-nav-item">
            <a
              href={`#${section.id}`}
              className={`sticky-nav-link ${
                activeId === section.id ? 'sticky-nav-link--active' : ''
              }`}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
