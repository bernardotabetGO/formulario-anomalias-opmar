import {
  calculateClassifications,
  formatClassifications,
  hasEnvironmentalAccident,
  hasPersonalAccident,
} from "./classification";
import { getAnomalyReportFileName } from "./excel-file";
import { formatBrazilianDate } from "./record-number";
import type { AnomalyReportFormData } from "./types";

function displayValue(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return null;
  if (trimmed === "[object Object]") return null;
  return trimmed;
}

function appendLine(
  lines: string[],
  label: string,
  value: string | null | undefined,
): void {
  const formatted = displayValue(value);
  if (formatted) {
    lines.push(`${label}: ${formatted}`);
  }
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
  const fileName = getAnomalyReportFileName(data.recordNumber);
  const lines: string[] = ["Informe de Anomalia da OPMAR", ""];

  appendLine(lines, "Número de registro", data.recordNumber);
  appendLine(
    lines,
    "Tipo de ocorrência",
    formatClassifications(classifications),
  );
  appendLine(
    lines,
    "Data da ocorrência",
    formatBrazilianDate(data.occurrenceDate),
  );
  appendLine(lines, "Hora da ocorrência", data.occurrenceTime);
  appendLine(lines, "Local", data.location);
  appendLine(lines, "Empresa", data.company);
  appendLine(lines, "Gerência envolvida", data.management);
  appendLine(lines, "Informante", data.informant);

  lines.push("");
  lines.push("Descrição:");
  lines.push(displayValue(data.occurrenceDescription) ?? "Não informado");
  lines.push("");
  lines.push("Ações imediatas:");
  lines.push(displayValue(data.immediateActions) ?? "Não informado");

  if (hasPersonalAccident(classifications)) {
    lines.push("");
    lines.push("Atendimento à pessoa:");
    lines.push(`Primeiros socorros: ${data.firstAid ? "Sim" : "Não"}`);
    lines.push(
      `Atendimento médico externo: ${data.externalMedicalCare ? "Sim" : "Não"}`,
    );
  }

  if (hasEnvironmentalAccident(classifications)) {
    appendLine(lines, "Produto vazado", data.spilledProduct);
    appendLine(lines, "Volume contido", data.containedVolume);
    appendLine(lines, "Volume não contido", data.uncontainedVolume);
    appendLine(lines, "Hora do fim do vazamento", data.spillEndTime);
  }

  if (data.fdsMetadata?.name) {
    appendLine(lines, "FDS selecionada", data.fdsMetadata.name);
  }

  lines.push("");
  lines.push(`Planilha completa do informe: ${fileName}`);

  return lines.join("\n");
}

export function buildEmailMailtoBody(
  data: AnomalyReportFormData,
  manualAttachmentNote = true,
): string {
  const summary = buildShareSummary(data);
  if (!manualAttachmentNote) return summary;

  const fileName = getAnomalyReportFileName(data.recordNumber);
  return `${summary}\n\nO arquivo Excel foi baixado no dispositivo. Anexe manualmente o arquivo ${fileName} antes de enviar este e-mail.`;
}

export function buildShareTitle(recordNumber: string): string {
  return `Informe de Anomalia ${recordNumber}`;
}

export function buildWhatsAppFallbackMessage(recordNumber: string): string {
  const fileName = getAnomalyReportFileName(recordNumber);
  return `O Excel foi baixado. No WhatsApp, anexe manualmente o arquivo ${fileName}.`;
}
