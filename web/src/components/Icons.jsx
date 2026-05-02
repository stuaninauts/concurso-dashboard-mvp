export function Ico({ name, size = 16, stroke = 1.5, ...rest }) {
  const paths = {
    sparkle: <><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></>,
    home: <><path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9z"/></>,
    book: <><path d="M4 4h11a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z"/><path d="M4 4v12a4 4 0 0 0 4 4"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></>,
    check_list: <><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1.5 1.5L8 5"/><path d="M4 12l1.5 1.5L8 11"/><path d="M4 18l1.5 1.5L8 17"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    chart: <><path d="M3 3v18h18"/><path d="M7 14l4-4 4 3 5-7"/></>,
    flame: <><path d="M12 2c1 4 4 6 4 10a4 4 0 0 1-8 0c0-2 1-3 1-5"/><path d="M12 22a6 6 0 0 0 6-6c0-3-2-5-3-7-1 3-3 4-3 7"/></>,
    trend_up: <><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></>,
    trend_down: <><path d="M3 7l6 6 4-4 8 8"/><path d="M14 17h7v-7"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>,
    chevron: <><path d="M9 6l6 6-6 6"/></>,
    chevron_down: <><path d="M6 9l6 6 6-6"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    x: <><path d="M18 6L6 18M6 6l12 12"/></>,
    check: <><path d="M5 12l4 4L19 6"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M12 11v5"/></>,
    warning: <><path d="M12 3l10 18H2L12 3z"/><path d="M12 9v5M12 17v.01"/></>,
    star: <><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></>,
    bolt: <><path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
    filter: <><path d="M3 4h18l-7 9v6l-4 2v-8L3 4z"/></>,
    refresh: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></>,
    trash: <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>,
    palette: <><path d="M12 2a10 10 0 1 0 10 10c0-3-3-3-3-5s2-3 0-5-7-2-7 0z"/><circle cx="7.5" cy="11.5" r="1.5" fill="currentColor"/><circle cx="12" cy="7.5" r="1.5" fill="currentColor"/><circle cx="16.5" cy="11.5" r="1.5" fill="currentColor"/></>,
    layers: <><path d="M12 2L2 8l10 6 10-6-10-6z"/><path d="M2 16l10 6 10-6"/><path d="M2 12l10 6 10-6"/></>,
    medal: <><circle cx="12" cy="15" r="6"/><path d="M8 7l-3-5h6l3 5"/><path d="M16 7l3-5h-6l-3 5"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {paths[name]}
    </svg>
  );
}
