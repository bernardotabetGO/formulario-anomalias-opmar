"use client";

import {
  formatClassifications,
} from "@/lib/informe-anomalias/classification";
import type { OccurrenceClassification } from "@/lib/informe-anomalias/types";

export function ClassificationSummary({
  classifications,
}: {
  classifications: OccurrenceClassification[];
}) {
  if (classifications.length === 0) return null;

  return (
    <section
      className="rounded-xl border border-teal-200 bg-teal-50 p-4"
      aria-labelledby="tipo-ocorrencia-title"
    >
      <h2
        id="tipo-ocorrencia-title"
        className="text-lg font-semibold text-teal-950"
      >
        Tipo de ocorrência
      </h2>
      <p className="mt-1 text-sm text-teal-900">
        Classificação calculada automaticamente (somente leitura).
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {classifications.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded-md border border-teal-700 bg-white px-2.5 py-1 text-sm font-medium text-teal-950"
          >
            <span aria-hidden="true">●</span>
            {item}
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm font-medium text-teal-950">
        {formatClassifications(classifications)}
      </p>
    </section>
  );
}
