import type { Metadata } from "next";
import { AnomalyReportForm } from "@/components/informe-anomalias/AnomalyReportForm";

export const metadata: Metadata = {
  title: "Formulário de Informe de Anomalias da OPMAR",
  description:
    "Formulário progressivo para informe de anomalias com classificação automática e exportação Excel.",
};

export default function InformeAnomaliasPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-800">
          OPMAR
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Formulário de Informe de Anomalias da OPMAR
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-700 sm:text-base">
          Preencha somente as perguntas necessárias. A classificação da
          ocorrência é calculada automaticamente. O rascunho é salvo neste
          navegador e, ao final, você pode exportar o informe em Excel.
        </p>
      </header>
      <AnomalyReportForm />
    </div>
  );
}
