import { getCompaniesOverview } from "@/lib/twygo";
import { DashboardHeader } from "@/components/dashboard-header";
import { StatCard } from "@/components/stat-card";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const companies = await getCompaniesOverview();

  const totalUsers = companies.reduce((sum, c) => sum + c.totalUsers, 0);
  const totalActive = companies.reduce((sum, c) => sum + c.activeUsers, 0);
  const totalCompanies = companies.length;
  const totalExternalCompanies = companies.filter((c) => !c.isInternal).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <DashboardHeader
        active="/usuarios"
        title="Usuários por empresa"
        subtitle="Quem está cadastrado na Twygo, agrupado pela empresa informada no cadastro."
      />

      <main className="max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Usuários cadastrados" value={totalUsers} />
          <StatCard label="Usuários ativos" value={totalActive} />
          <StatCard label="Empresas cadastradas" value={totalCompanies} />
          <StatCard label="Empresas clientes (externas)" value={totalExternalCompanies} />
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500 dark:text-zinc-400">
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Usuários cadastrados</th>
                <th className="px-4 py-3 font-medium">Ativos</th>
                <th className="px-4 py-3 font-medium">Inativos</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr
                  key={c.name}
                  className="border-b border-zinc-100 dark:border-zinc-900 last:border-0"
                >
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                    {c.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium " +
                        (c.isInternal
                          ? "bg-selbetti-green/10 text-selbetti-green"
                          : "bg-selbetti-orange/10 text-selbetti-orange")
                      }
                    >
                      {c.isInternal ? "Interna (Selbetti)" : "Cliente"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {c.totalUsers}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {c.activeUsers}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {c.inactiveUsers}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
