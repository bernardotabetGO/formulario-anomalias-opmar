import {
  calculateClassifications,
  formatClassifications,
  getSelectedImpacts,
  hasEnvironmentalAccident,
  hasEnvironmentalOccurrence,
  hasPersonalAccident,
} from "./classification";
import {
  formatBrazilianDate,
  formatBrazilianDateTime,
  formatCommunicationTime,
} from "./record-number";
import type { AnomalyReportFormData, ImpactType } from "./types";
import {
  ENVIRONMENT_ANSWER_LABELS,
  IMPACT_LABELS,
  MATERIAL_ANSWER_LABELS,
  PEOPLE_ANSWER_LABELS,
} from "./types";

function displayValue(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return null;
  if (trimmed === "[object Object]") return null;
  return trimmed;
}

function fieldOrDefault(
  value: string | null | undefined,
  fallback: string,
): string {
  return displayValue(value) ?? fallback;
}

function impactAnswerLabel(
  impact: ImpactType,
  data: AnomalyReportFormData,
): string {
  if (impact === "pessoas") {
    return data.peopleAnswer
      ? PEOPLE_ANSWER_LABELS[data.peopleAnswer]
      : "Não informado";
  }
  if (impact === "material") {
    return data.materialAnswer
      ? MATERIAL_ANSWER_LABELS[data.materialAnswer]
      : "Não informado";
  }
  return data.environmentAnswer
    ? ENVIRONMENT_ANSWER_LABELS[data.environmentAnswer]
    : "Não informado";
}

function impactClassificationLabel(
  impact: ImpactType,
  data: AnomalyReportFormData,
): string {
  const classifications = calculateClassifications({
    primaryImpact: impact,
    additionalImpacts: [],
    peopleAnswer: data.peopleAnswer,
    materialAnswer: data.materialAnswer,
    environmentAnswer: data.environmentAnswer,
  });
  return classifications[0] ?? "Não informado";
}

export function buildEmailSubject(recordNumber: string): string {
  return `Informe de Anomalia OPMAR - ${recordNumber}`;
}

export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildEmailMailtoUrl(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildShareSummary(data: AnomalyReportFormData): string {
  const classifications = calculateClassifications(data);
  const selectedImpacts = getSelectedImpacts(
    data.primaryImpact,
    data.additionalImpacts,
  );
  const additionalLabels = data.additionalImpacts
    .filter((impact) => impact !== data.primaryImpact)
    .map((impact) => IMPACT_LABELS[impact])
    .join("; ");

  const lines: string[] = [
    "INFORME DE ANOMALIA DA OPMAR",
    "",
    "1. CLASSIFICAÇÃO",
    "",
    `Número de registro: ${fieldOrDefault(data.recordNumber, "Não informado")}`,
    `Tipo de ocorrência: ${formatClassifications(classifications) || "Não informado"}`,
    `Impacto principal: ${data.primaryImpact ? IMPACT_LABELS[data.primaryImpact] : "Não informado"}`,
    `Outros impactos: ${additionalLabels || "Nenhum"}`,
    "",
    "Classificação dos impactos:",
  ];

  for (const impact of selectedImpacts) {
    lines.push(
      `- ${IMPACT_LABELS[impact]}: ${impactAnswerLabel(impact, data)} — ${impactClassificationLabel(impact, data)}`,
    );
  }

  lines.push(
    "",
    "2. INFORMAÇÕES GERAIS",
    "",
    `Data e hora de criação: ${formatBrazilianDateTime(data.createdAt) || "Não informado"}`,
    `Hora da comunicação: ${formatCommunicationTime(data.communicationTime) || "Não informado"}`,
    `Data da ocorrência: ${formatBrazilianDate(data.occurrenceDate) || "Não informado"}`,
    `Hora da ocorrência: ${fieldOrDefault(data.occurrenceTime, "Não informado")}`,
    `Informante: ${fieldOrDefault(data.informant, "Não informado")}`,
    `Função do informante: ${fieldOrDefault(data.informantRole, "Não informado")}`,
    `Local: ${fieldOrDefault(data.location, "Não informado")}`,
    `Latitude: ${fieldOrDefault(data.latitude, "Não informada")}`,
    `Longitude: ${fieldOrDefault(data.longitude, "Não informada")}`,
    `Empresa: ${fieldOrDefault(data.company, "Não informado")}`,
    `Gerência envolvida: ${fieldOrDefault(data.management, "Não informado")}`,
    "",
    "3. INFORMAÇÕES SOBRE A OCORRÊNCIA",
    "",
    "Descrição da ocorrência:",
    fieldOrDefault(data.occurrenceDescription, "Não informado"),
    "",
    "Ações imediatas:",
    fieldOrDefault(data.immediateActions, "Não informado"),
  );

  if (hasPersonalAccident(classifications)) {
    lines.push(
      "",
      "4. ATENDIMENTO À PESSOA",
      "",
      `Primeiros socorros: ${data.firstAid ? "Sim" : "Não"}`,
      `Deslocamento para atendimento médico externo: ${data.externalMedicalCare ? "Sim" : "Não"}`,
    );
  }

  if (hasEnvironmentalAccident(classifications)) {
    lines.push(
      "",
      "5. DADOS AMBIENTAIS",
      "",
      `Hora do fim do vazamento: ${fieldOrDefault(data.spillEndTime, "Não informado")}`,
      `Volume estimado não contido: ${fieldOrDefault(data.uncontainedVolume, "Não informado")} m³`,
      `Volume estimado contido: ${fieldOrDefault(data.containedVolume, "Não informado")} m³`,
      `Produto vazado: ${fieldOrDefault(data.spilledProduct, "Não informado")}`,
    );
  }

  if (hasEnvironmentalOccurrence(classifications)) {
    lines.push(
      "",
      "6. FDS",
      "",
      `Arquivo FDS: ${data.fdsMetadata?.name ?? "Não anexado"}`,
    );
  }

  lines.push(
    "",
    "Informe gerado pelo Formulário de Informe de Anomalias da OPMAR.",
  );

  return lines.join("\n");
}
