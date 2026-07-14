"use client";

import {
  formatClassifications,
  getSelectedImpacts,
  hasEnvironmentalAccident,
  hasEnvironmentalOccurrence,
  hasPersonalAccident,
} from "@/lib/informe-anomalias/classification";
import { formatFileSize } from "@/lib/informe-anomalias/number-normalization";
import {
  formatBrazilianDate,
  formatBrazilianDateTime,
  formatCommunicationTime,
} from "@/lib/informe-anomalias/record-number";
import type { AnomalyReportFormData } from "@/lib/informe-anomalias/types";
import {
  ENVIRONMENT_ANSWER_LABELS,
  IMPACT_LABELS,
  MATERIAL_ANSWER_LABELS,
  PEOPLE_ANSWER_LABELS,
} from "@/lib/informe-anomalias/types";
import { SectionCard } from "./ui";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-2 sm:grid-cols-[220px_1fr]">
      <dt className="text-sm font-medium text-slate-700">{label}</dt>
      <dd className="whitespace-pre-wrap text-sm text-slate-900">{value}</dd>
    </div>
  );
}

export function ReportReview({ data }: { data: AnomalyReportFormData }) {
  const classifications = data.classifications;
  const selectedImpacts = getSelectedImpacts(
    data.primaryImpact,
    data.additionalImpacts,
  );
  const additional = data.additionalImpacts
    .filter((impact) => impact !== data.primaryImpact)
    .map((impact) => IMPACT_LABELS[impact])
    .join("; ");

  return (
    <SectionCard
      id="revisao"
      title="Revisão do informe"
      description="Confira os dados antes de exportar. Você pode voltar e corrigir qualquer informação."
    >
      <div className="space-y-6">
        <section>
          <h3 className="mb-2 text-base font-semibold text-slate-900">
            1. Classificação
          </h3>
          <dl>
            <Row
              label="Tipo de ocorrência"
              value={formatClassifications(classifications) || "—"}
            />
            <Row
              label="Impacto principal"
              value={
                data.primaryImpact
                  ? IMPACT_LABELS[data.primaryImpact]
                  : "—"
              }
            />
            <Row label="Outros impactos" value={additional || "Nenhum"} />
            {selectedImpacts.includes("pessoas") && data.peopleAnswer ? (
              <Row
                label="Pessoas"
                value={PEOPLE_ANSWER_LABELS[data.peopleAnswer]}
              />
            ) : null}
            {selectedImpacts.includes("material") && data.materialAnswer ? (
              <Row
                label="Material"
                value={MATERIAL_ANSWER_LABELS[data.materialAnswer]}
              />
            ) : null}
            {selectedImpacts.includes("meio_ambiente") &&
            data.environmentAnswer ? (
              <Row
                label="Meio Ambiente"
                value={ENVIRONMENT_ANSWER_LABELS[data.environmentAnswer]}
              />
            ) : null}
          </dl>
        </section>

        <section>
          <h3 className="mb-2 text-base font-semibold text-slate-900">
            2. Informações gerais
          </h3>
          <dl>
            <Row label="Número de registro" value={data.recordNumber} />
            <Row
              label="Data e hora de criação"
              value={formatBrazilianDateTime(data.createdAt)}
            />
            <Row
              label="Hora da comunicação"
              value={formatCommunicationTime(data.communicationTime)}
            />
            <Row
              label="Data da ocorrência"
              value={formatBrazilianDate(data.occurrenceDate)}
            />
            <Row label="Hora da ocorrência" value={data.occurrenceTime} />
            <Row label="Informante" value={data.informant} />
            <Row label="Função do informante" value={data.informantRole} />
            <Row label="Local" value={data.location} />
            <Row
              label="Latitude"
              value={data.latitude || "Não informado"}
            />
            <Row
              label="Longitude"
              value={data.longitude || "Não informado"}
            />
            <Row label="Empresa" value={data.company} />
            <Row label="Gerência envolvida" value={data.management} />
          </dl>
        </section>

        <section>
          <h3 className="mb-2 text-base font-semibold text-slate-900">
            3. Informações sobre a ocorrência
          </h3>
          <dl>
            <Row
              label="Descrição da ocorrência"
              value={data.occurrenceDescription}
            />
            <Row label="Ações imediatas" value={data.immediateActions} />
          </dl>
        </section>

        {hasPersonalAccident(classifications) ? (
          <section>
            <h3 className="mb-2 text-base font-semibold text-slate-900">
              4. Atendimento à pessoa
            </h3>
            <dl>
              <Row
                label="Primeiros socorros"
                value={data.firstAid ? "Sim" : "Não"}
              />
              <Row
                label="Deslocamento para atendimento médico externo"
                value={data.externalMedicalCare ? "Sim" : "Não"}
              />
            </dl>
          </section>
        ) : null}

        {hasEnvironmentalAccident(classifications) ? (
          <section>
            <h3 className="mb-2 text-base font-semibold text-slate-900">
              5. Dados ambientais
            </h3>
            <dl>
              <Row
                label="Hora do fim do vazamento"
                value={data.spillEndTime}
              />
              <Row
                label="Volume estimado não contido (m³)"
                value={data.uncontainedVolume}
              />
              <Row
                label="Volume estimado contido (m³)"
                value={data.containedVolume}
              />
              <Row label="Produto vazado" value={data.spilledProduct} />
            </dl>
          </section>
        ) : null}

        {hasEnvironmentalOccurrence(classifications) ? (
          <section>
            <h3 className="mb-2 text-base font-semibold text-slate-900">
              6. Informações da FDS
            </h3>
            <dl>
              <Row
                label="Nome do arquivo"
                value={data.fdsMetadata?.name ?? "Não informado"}
              />
              <Row
                label="Tipo do arquivo"
                value={data.fdsMetadata?.type ?? "Não informado"}
              />
              <Row
                label="Tamanho do arquivo"
                value={
                  data.fdsMetadata
                    ? formatFileSize(data.fdsMetadata.size)
                    : "Não informado"
                }
              />
              <Row
                label="Observação"
                value="O arquivo FDS não está incorporado à planilha."
              />
            </dl>
          </section>
        ) : null}
      </div>
    </SectionCard>
  );
}
