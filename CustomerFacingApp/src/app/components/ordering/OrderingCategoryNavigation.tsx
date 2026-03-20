import { ORDERING_CATEGORIES } from "../../data/ordering";

type OrderingCategoryNavigationProps = {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
};

export function OrderingCategoryMobileNavigation({
  activeCategory,
  onSelectCategory,
}: OrderingCategoryNavigationProps) {
  return (
    <div className="mb-5 lg:hidden">
      <div className="mb-2.5 flex items-center gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 2.5h10M3 6h6M5 9.5h2"
              stroke="var(--gold-dark)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--text-muted)" }}
          >
            Filter
          </span>
        </div>
        <div className="h-px flex-1" style={{ background: "var(--border)" }} />
        <span className="text-[10px]" style={{ color: "var(--cream-muted)" }}>
          scroll &gt;
        </span>
      </div>

      <div className="relative">
        <div
          className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-10"
          style={{ background: "linear-gradient(to right, transparent, var(--bg-cream))" }}
        />

        <div className="cat-scroll -mx-4 overflow-x-scroll overflow-y-hidden px-4 pb-5" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex gap-2 pb-2" style={{ width: "max-content", minWidth: "120%" }}>
            {ORDERING_CATEGORIES.map((category) => (
              <button
                key={category.key}
                onClick={() => onSelectCategory(category.key)}
                className="filter-chip flex shrink-0 items-center gap-1.5 whitespace-nowrap transition-all"
                style={
                  activeCategory === category.key
                    ? {
                        background: "var(--navy)",
                        color: "var(--cream)",
                        border: "1.5px solid var(--navy)",
                        borderRadius: "999px",
                        padding: "0.3rem 0.85rem",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        fontFamily: "'Georgia', serif",
                      }
                    : {
                        background: "var(--card-bg)",
                        color: "var(--text-muted)",
                        border: "1.5px solid var(--border)",
                        borderRadius: "999px",
                        padding: "0.3rem 0.85rem",
                        fontSize: "0.8rem",
                        fontWeight: 400,
                        fontFamily: "'Georgia', serif",
                      }
                }
              >
                <span className="text-sm leading-none">{category.emoji}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        <style>{`
          .cat-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(156, 163, 175, 0.4) transparent;
            -webkit-overflow-scrolling: touch;
          }
          
          .cat-scroll::-webkit-scrollbar {
            height: 8px;
          }
          
          .cat-scroll::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 4px;
          }
          
          .cat-scroll::-webkit-scrollbar-thumb {
            background: rgba(156, 163, 175, 0.4);
            border-radius: 4px;
          }
          
          .cat-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(156, 163, 175, 0.6);
          }
        `}</style>
      </div>
    </div>
  );
}

export function OrderingCategorySidebar({
  activeCategory,
  onSelectCategory,
}: OrderingCategoryNavigationProps) {
  return (
    <aside className="hidden w-28 shrink-0 lg:block">
      <div
        className="sticky top-20 rounded-xl p-2"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
      >
        <div className="flex flex-col gap-1">
          {ORDERING_CATEGORIES.map((category) => (
            <button
              key={category.key}
              onClick={() => onSelectCategory(category.key)}
              className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-2.5 text-left transition-all"
              style={
                activeCategory === category.key
                  ? { background: "var(--navy)", color: "var(--cream)" }
                  : { color: "var(--navy)" }
              }
            >
              <span className="text-base">{category.emoji}</span>
              <span className="truncate text-xs font-medium">{category.label}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
