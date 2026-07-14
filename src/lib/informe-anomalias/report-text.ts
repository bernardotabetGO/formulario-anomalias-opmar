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

export function buildWhatsAppReportText(data: AnomalyReportFormData): string {
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
    "*INFORME DE ANOMALIA — OPMAR*",
    "",
    `📌 *Registro:* ${fieldOrDefault(data.recordNumber, "Não informado")}`,
    `⚠️ *Tipo de ocorrência:* ${formatClassifications(classifications) || "Não informado"}`,
    `🎯 *Impacto principal:* ${data.primaryImpact ? IMPACT_LABELS[data.primaryImpact] : "Não informado"}`,
    `➕ *Outros impactos:* ${additionalLabels || "Nenhum"}`,
    "",
    "*CLASSIFICAÇÃO DOS IMPACTOS*",
    "",
  ];

  for (const impact of selectedImpacts) {
    lines.push(
      `- *${IMPACT_LABELS[impact]}:* ${impactAnswerLabel(impact, data)} — ${impactClassificationLabel(impact, data)}`,
    );
  }

  lines.push(
    "",
    "*INFORMAÇÕES GERAIS*",
    "",
    `📅 *Data da ocorrência:* ${formatBrazilianDate(data.occurrenceDate) || "Não informado"}`,
    `🕒 *Hora da ocorrência:* ${fieldOrDefault(data.occurrenceTime, "Não informado")}`,
    `📣 *Hora da comunicação:* ${formatCommunicationTime(data.communicationTime) || "Não informado"}`,
    `👤 *Informante:* ${fieldOrDefault(data.informant, "Não informado")}`,
    `💼 *Função:* ${fieldOrDefault(data.informantRole, "Não informado")}`,
    `📍 *Local:* ${fieldOrDefault(data.location, "Não informado")}`,
    `🏢 *Empresa:* ${fieldOrDefault(data.company, "Não informado")}`,
    `🧭 *Gerência envolvida:* ${fieldOrDefault(data.management, "Não informado")}`,
  );

  const latitude = displayValue(data.latitude);
  const longitude = displayValue(data.longitude);
  if (latitude) {
    lines.push(`🌐 *Latitude:* ${latitude}`);
  }
  if (longitude) {
    lines.push(`🌐 *Longitude:* ${longitude}`);
  }

  lines.push(
    "",
    "*DESCRIÇÃO DA OCORRÊNCIA*",
    "",
    fieldOrDefault(data.occurrenceDescription, "Não informado"),
    "",
    "*AÇÕES IMEDIATAS*",
    "",
    fieldOrDefault(data.immediateActions, "Não informado"),
  );

  if (hasPersonalAccident(classifications)) {
    lines.push(
      "",
      "*ATENDIMENTO À PESSOA*",
      "",
      `- *Primeiros socorros:* ${data.firstAid ? "Sim" : "Não"}`,
      `- *Atendimento médico externo:* ${data.externalMedicalCare ? "Sim" : "Não"}`,
    );
  }

  if (hasEnvironmentalAccident(classifications)) {
    lines.push(
      "",
      "*DADOS AMBIENTAIS*",
      "",
      `- *Hora do fim do vazamento:* ${fieldOrDefault(data.spillEndTime, "Não informado")}`,
      `- *Volume não contido:* ${fieldOrDefault(data.uncontainedVolume, "Não informado")} m³`,
      `- *Volume contido:* ${fieldOrDefault(data.containedVolume, "Não informado")} m³`,
      `- *Produto vazado:* ${fieldOrDefault(data.spilledProduct, "Não informado")}`,
    );
  }

  if (hasEnvironmentalOccurrence(classifications)) {
    lines.push(
      "",
      "*FDS*",
      "",
      `- *Arquivo:* ${data.fdsMetadata?.name ?? "Não anexado"}`,
    );
  }

  lines.push(
    "",
    "_Gerado pelo Formulário de Informe de Anomalias da OPMAR._",
  );

  return lines.join("\n");
}
