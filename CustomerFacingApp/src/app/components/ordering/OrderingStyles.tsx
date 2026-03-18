export function OrderingStyles() {
  return (
    <style>{`
      :root {
        --navy:        #1a2240;
        --navy-light:  #2a3560;
        --cream:       #f5f0e8;
        --cream-muted: #cdc6b8;
        --bg-cream:    #ede8dc;
        --card-bg:     #faf7f2;
        --border:      #ddd6c8;
        --gold:        #c8a84b;
        --gold-light:  #e0c97a;
        --gold-dark:   #a8862e;
        --gold-bg:     #f5edd8;
        --text-muted:  #7a7060;
        --skeleton:    #e5dfd4;
      }

      .filter-chip {
        -webkit-tap-highlight-color: transparent;
        cursor: pointer;
        transition: background 0.15s, color 0.15s, border-color 0.15s;
        letter-spacing: 0.01em;
      }
      .filter-chip:hover {
        border-color: var(--navy) !important;
        color: var(--navy) !important;
      }

      .cat-tab {
        font-size: 0.8125rem;
        font-family: 'Georgia', serif;
        padding: 0.45rem 1rem 0.55rem;
        background: transparent;
        border: none;
        outline: none;
        cursor: pointer;
        letter-spacing: 0.01em;
        transition: color 0.15s, border-color 0.15s;
        -webkit-tap-highlight-color: transparent;
      }
      .cat-tab:hover { color: var(--navy) !important; }

      .cat-scroll {
        scrollbar-width: thin;
        scrollbar-color: var(--gold) var(--gold-bg);
      }
      .cat-scroll::-webkit-scrollbar { height: 5px; }
      .cat-scroll::-webkit-scrollbar-track {
        background: var(--gold-bg);
        border-radius: 99px;
        margin: 0 16px;
      }
      .cat-scroll::-webkit-scrollbar-thumb {
        background: var(--gold);
        border-radius: 99px;
        min-width: 24px;
      }

      .mi-wrap {
        display: flex !important;
        flex-direction: column !important;
      }
      .mi-wrap > * {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        height: 100% !important;
      }
      .mi-wrap > * > div:not(:first-child) {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
      }

      .mi-wrap > *,
      .mi-wrap > * > * {
        gap: 0 !important;
      }
      .mi-wrap > * > div {
        margin-top: 0 !important;
        margin-bottom: 0 !important;
      }
      .mi-wrap > * > div:first-child {
        padding-bottom: 0 !important;
        margin-bottom: 0 !important;
        line-height: 0;
      }
      .mi-wrap img {
        display: block;
        margin: 0 !important;
        padding: 0 !important;
        vertical-align: bottom;
      }
      .mi-wrap > * > div:not(:first-child) {
        padding-top: 10px !important;
        padding-bottom: 14px !important;
        padding-left: 12px !important;
        padding-right: 12px !important;
        margin-top: 0 !important;
      }
      .mi-wrap [class*="relative"]:has(img) {
        margin-bottom: 0 !important;
        padding-bottom: 0 !important;
        line-height: 0;
      }
      .mi-wrap [class*="p-4"],
      .mi-wrap [class*="p-3"] {
        padding-top: 10px !important;
        padding-left: 12px !important;
        padding-right: 12px !important;
        padding-bottom: 14px !important;
      }

      .menu-card-grid button {
        background: var(--navy) !important;
        color: var(--cream) !important;
      }
      .menu-card-grid button:hover {
        background: var(--navy-light) !important;
      }

      .mi-wrap [class*="badge"],
      .mi-wrap [class*="Badge"],
      .mi-wrap span[class*="absolute"],
      .mi-wrap div[class*="absolute"] span,
      .mi-wrap div[class*="absolute"] {
        font-size: 0.65rem !important;
        padding: 0.2rem 0.5rem !important;
        gap: 0.2rem !important;
      }
      .mi-wrap div[class*="absolute"] svg,
      .mi-wrap span[class*="absolute"] svg {
        width: 0.6rem !important;
        height: 0.6rem !important;
      }
      @media (min-width: 640px) {
        .mi-wrap [class*="badge"],
        .mi-wrap [class*="Badge"],
        .mi-wrap div[class*="absolute"] {
          font-size: 0.75rem !important;
          padding: 0.25rem 0.65rem !important;
        }
      }

      .fixed.bottom-6 button,
      .fixed.bottom-4 button,
      .fixed.bottom-6 > button,
      .fixed.bottom-4 > button,
      [class*="fixed"][class*="bottom"] button,
      [class*="fixed"][class*="bottom"] > button,
      [class*="fixed"][class*="bottom"] > div > button,
      [class*="fixed"][class*="bottom"] [class*="rounded-full"] {
        background: var(--navy) !important;
        background-color: var(--navy) !important;
        color: var(--cream) !important;
      }
      .fixed.bottom-6 button:hover,
      .fixed.bottom-4 button:hover,
      [class*="fixed"][class*="bottom"] button:hover {
        background: var(--navy-light) !important;
        background-color: var(--navy-light) !important;
      }

      .rec-card-grid button,
      .rec-card-grid [role="button"] {
        background: var(--navy) !important;
        color: var(--cream) !important;
      }
      .rec-card-grid button:hover {
        background: var(--navy-light) !important;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(5deg); }
      }
      .animate-float { animation: float 6s ease-in-out infinite; }
    `}</style>
  );
}
