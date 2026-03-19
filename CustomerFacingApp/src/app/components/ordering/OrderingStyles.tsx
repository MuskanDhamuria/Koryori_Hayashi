export function OrderingStyles() {
  return (
    <style>{`
      :root {
        --paper: #f4efe2;
        --paper-strong: #e8decb;
        --paper-soft: rgba(255, 251, 244, 0.76);
        --ink: #28345a;
        --ink-soft: #6d7282;
        --gold: #c4a35b;
        --gold-soft: #e0c997;
        --olive: #71826f;
        --wood: #8d6642;
        --rose: #c48376;
        --wine: #8b4d4a;
        --navy: #1a2240;
        --navy-light: #2a3560;
        --cream: #f5f0e8;
        --cream-muted: #cdc6b8;
        --bg-cream: #ede8dc;
        --card-bg: #faf7f2;
        --border: #ddd6c8;
        --gold-light: #e0c97a;
        --gold-dark: #a8862e;
        --gold-bg: #f5edd8;
        --text-muted: #7a7060;
        --skeleton: #e5dfd4;
      }

      body {
        font-family: "Manrope", sans-serif;
      }

      .paper-panel {
        background:
          linear-gradient(180deg, rgba(255, 253, 248, 0.88), rgba(255, 249, 240, 0.75));
        border: 1px solid rgba(40, 52, 90, 0.12);
        box-shadow:
          0 24px 70px rgba(38, 45, 70, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.55);
        backdrop-filter: blur(18px);
      }

      .paper-panel-dark {
        background:
          linear-gradient(180deg, rgba(40, 52, 90, 0.96), rgba(45, 57, 92, 0.92));
        border: 1px solid rgba(196, 163, 91, 0.2);
        box-shadow: 0 28px 64px rgba(28, 33, 47, 0.22);
      }

      .menu-kicker {
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--ink-soft);
      }

      .menu-rule {
        height: 1px;
        width: 100%;
        background: linear-gradient(90deg, transparent, rgba(40, 52, 90, 0.42), transparent);
      }

      .menu-title {
        font-family: "Cormorant Garamond", "Noto Serif JP", serif;
        letter-spacing: 0.05em;
        color: var(--ink);
      }

      .stamp-badge {
        border: 1px solid rgba(40, 52, 90, 0.14);
        background: rgba(255, 255, 255, 0.72);
        color: var(--ink);
        backdrop-filter: blur(12px);
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

      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(5deg); }
      }
      @keyframes float-delayed {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-25px) rotate(-5deg); }
      }
      .animate-float { animation: float 6s ease-in-out infinite; }
      .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
    `}</style>
  );
}
