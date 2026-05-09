import { NavLink } from "react-router-dom";

const NAV_ITEMS: ReadonlyArray<{ label: string; to: string }> = [
  { label: "Admin Control", to: "/app/admin" },
  { label: "Analytics", to: "/app/admin/analytics" },
  { label: "Operations", to: "/app/admin/operations" },
];

export function AdminTopNav() {
  return (
    <nav
      aria-label="Admin pages"
      className="liquid-glass inline-flex w-fit items-center gap-1 rounded-full p-1"
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `rounded-full px-3 py-1.5 text-xs transition-colors sm:text-sm ${
              isActive
                ? "bg-white/20 text-white"
                : "text-white/75 hover:bg-white/10 hover:text-white"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
