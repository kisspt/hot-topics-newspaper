export function SVGSprites() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <symbol id="ic-masks" viewBox="0 0 64 64">
          <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 16h24v10c0 9-5 15-12 15S8 35 8 26z"/>
            <circle cx="16" cy="25" r="1.6"/><circle cx="26" cy="25" r="1.6"/>
            <path d="M15 33c4 3 9 3 13 0"/>
            <path d="M32 12h24v10c0 9-5 15-12 15-2 0-4-.5-5.5-1.4"/>
            <circle cx="40" cy="21" r="1.6"/><circle cx="50" cy="21" r="1.6"/>
            <path d="M39 31c4-3 9-3 13 0"/>
          </g>
        </symbol>
        <symbol id="ic-gear" viewBox="0 0 64 64">
          <g stroke="currentColor" strokeWidth="1.8" fill="none">
            <circle cx="32" cy="32" r="14"/><circle cx="32" cy="32" r="5"/>
            <g strokeLinecap="round">
              <line x1="32" y1="9" x2="32" y2="17"/><line x1="32" y1="47" x2="32" y2="55"/>
              <line x1="9" y1="32" x2="17" y2="32"/><line x1="47" y1="32" x2="55" y2="32"/>
              <line x1="15" y1="15" x2="21" y2="21"/><line x1="43" y1="43" x2="49" y2="49"/>
              <line x1="49" y1="15" x2="43" y2="21"/><line x1="21" y1="43" x2="15" y2="49"/>
            </g>
          </g>
        </symbol>
        <symbol id="ic-brain" viewBox="0 0 64 64">
          <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M30 11c-5 0-8 3-8 6-4 0-6 3-6 6 0 2 1 3 2 4-1 2-2 3-2 6 0 5 4 9 9 9 1 3 3 4 6 4 4 0 6-2 6-6V15c0-2-2-4-4-4z"/>
            <path d="M34 11c5 0 8 3 8 6 4 0 6 3 6 6 0 2-1 3-2 4 1 2 2 3 2 6 0 5-4 9-9 9-1 3-3 4-6 4"/>
            <circle cx="20" cy="26" r="1.4" fill="currentColor"/><circle cx="44" cy="34" r="1.4" fill="currentColor"/><circle cx="25" cy="42" r="1.4" fill="currentColor"/>
          </g>
        </symbol>
        <symbol id="ic-quill" viewBox="0 0 64 64">
          <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M52 8c-17 2-31 12-37 31l-4 14 14-4c19-6 29-20 31-37-1-2-2-3-4-4z"/>
            <path d="M15 49c7-13 16-23 28-29"/><path d="M25 43c2-6 5-11 9-15"/>
          </g>
        </symbol>
        <symbol id="ic-fleuron" viewBox="0 0 120 24">
          <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M60 6c-4 6-10 6-14 3M60 6c4 6 10 6 14 3"/>
            <path d="M46 9c-10 4-22 3-34-1M74 9c10 4 22 3 34-1"/>
            <circle cx="60" cy="12" r="2.4" fill="currentColor" stroke="none"/>
            <path d="M12 8c6 0 10 3 12 6M108 8c-6 0-10 3-12 6"/>
          </g>
        </symbol>
      </defs>
    </svg>
  );
}
