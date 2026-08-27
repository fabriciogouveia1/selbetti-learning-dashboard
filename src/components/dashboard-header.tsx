import Link from "next/link";

const TABS = [
  { href: "/", label: "Visão Executiva" },
  { href: "/usuarios", label: "Usuários & Empresas" },
];

export function DashboardHeader({
  title,
  subtitle,
  active,
}: {
  title: string;
  subtitle: string;
  active: string;
}) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-selbetti-green-dark via-selbetti-green to-selbetti-green-dark px-8 py-10">
      <div className="relative max-w-6xl mx-auto">
        <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
          Selbetti Learning · Dashboard
        </span>
        <h1 className="mt-4 text-2xl sm:text-3xl font-semibold text-white max-w-2xl leading-snug">
          {title}
        </h1>
        <p className="mt-2 text-sm text-white/70 max-w-xl">{subtitle}</p>

        <nav className="mt-6 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                "rounded-full px-4 py-1.5 text-sm font-medium " +
                (tab.href === active
                  ? "bg-selbetti-orange text-white"
                  : "bg-white/10 text-white/90 hover:bg-white/20")
              }
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
