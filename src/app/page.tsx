import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-800">
          OPMAR
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold text-slate-900 sm:text-4xl">
          Sistema de registros operacionais
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-700">
          Utilize o Formulário de Informe de Anomalias para registrar ocorrências
          com classificação automática, revisão e exportação para Excel.
        </p>
        <div className="mt-6">
          <Link
            href="/informe-anomalias"
            className="inline-flex rounded-lg bg-teal-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
          >
            Informe de Anomalias
          </Link>
        </div>
      </section>
    </div>
  );
}
