import Layout from "@/components/Layout";
import PageHero from "@/components/shared/PageHero";
import { juniorCompanyRanking } from "@/lib/companyData";

export default function EmpresaRankingJunior() {
  return (
    <Layout>
      <PageHero title="Ranking de empresas para carreira inicial" subtitle="Empresas com mais oportunidades simuladas para estágio, trainee e júnior." accent="blue" />
      <section className="container py-12">
        <div className="card-brutal overflow-hidden rounded-2xl bg-white">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-violet-700 text-white">
              <tr><th className="p-4 text-left">Posição</th><th className="p-4 text-left">Empresa</th><th className="p-4 text-left">Vagas iniciais abertas</th><th className="p-4 text-left">Áreas que mais contrata</th></tr>
            </thead>
            <tbody>
              {juniorCompanyRanking.map((row) => (
                <tr key={row.company} className="border-t-2 border-slate-100">
                  <td className="p-4 font-black">#{row.position}</td>
                  <td className="p-4 font-bold">
                    <span className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-slate-900 bg-white p-2 shadow-[2px_2px_0_#0f172a]">
                        <img src={row.logoUrl} alt={`Logo ${row.company}`} className="h-6 w-6 object-contain" loading="lazy" />
                      </span>
                      {row.company}
                    </span>
                  </td>
                  <td className="p-4">{row.juniorJobs}</td>
                  <td className="p-4">{row.areas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Layout>
  );
}
