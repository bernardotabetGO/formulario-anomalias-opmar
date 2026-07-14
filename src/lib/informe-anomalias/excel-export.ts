import * as XLSX from "xlsx";
import {
  calculateClassifications,
  formatClassifications,
  getSelectedImpacts,
  hasEnvironmentalAccident,
  hasEnvironmentalOccurrence,
  hasPersonalAccident,
} from "./classification";
import { parseOptionalNumber } from "./number-normalization";
import {
  formatBrazilianDate,
  formatBrazilianDateTime,
  formatCommunicationTime,
  sanitizeFileName,
} from "./record-number";
import type { AnomalyReportFormData, ImpactType } from "./types";
import {
  ENVIRONMENT_ANSWER_LABELS,
  IMPACT_LABELS,
  IMPACT_QUESTIONS,
  MATERIAL_ANSWER_LABELS,
  PEOPLE_ANSWER_LABELS,
} from "./types";

function valueOrNotInformed(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "Não informado";
  }
  return value;
}

function yesNo(value: boolean): string {
  return value ? "Sim" : "Não";
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

function impactClassification(
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

function pushSection(
  rows: Array<[string, string | number]>,
  title: string,
): void {
  rows.push([title, ""]);
}

function pushRow(
  rows: Array<[string, string | number]>,
  field: string,
  value: string | number,
): void {
  rows.push([field, value]);
}

export function buildInformeSheetRows(
  data: AnomalyReportFormData,
): Array<[string, string | number]> {
  const classifications = calculateClassifications(data);
  const selected = getSelectedImpacts(
    data.primaryImpact,
    data.additionalImpacts,
  );
  const additionalLabels = data.additionalImpacts
    .filter((impact) => impact !== data.primaryImpact)
    .map((impact) => IMPACT_LABELS[impact])
    .join("; ");

  const rows: Array<[string, string | number]> = [];
  rows.push(["Campo", "Resposta"]);

  pushSection(rows, "Identificação");
  pushRow(rows, "Número de registro", data.recordNumber);
  pushRow(rows, "Data e hora de criação", formatBrazilianDateTime(data.createdAt));
  pushRow(
    rows,
    "Hora da comunicação",
    formatCommunicationTime(data.communicationTime),
  );
  pushRow(
    rows,
    "Tipo de ocorrência",
    formatClassifications(classifications) || "Não informado",
  );
  pushRow(
    rows,
    "Impacto principal",
    data.primaryImpact ? IMPACT_LABELS[data.primaryImpact] : "Não informado",
  );
  pushRow(rows, "Outros impactos", additionalLabels || "Nenhum");

  pushSection(rows, "Classificação dos impactos");
  for (const impact of selected) {
    pushRow(rows, "Tipo de impacto", IMPACT_LABELS[impact]);
    pushRow(rows, "Pergunta realizada", IMPACT_QUESTIONS[impact]);
    pushRow(rows, "Resposta fornecida", impactAnswerLabel(impact, data));
    pushRow(rows, "Classificação resultante", impactClassification(impact, data));
  }

  pushSection(rows, "Informações gerais");
  pushRow(rows, "Data da ocorrência", formatBrazilianDate(data.occurrenceDate));
  pushRow(rows, "Hora da ocorrência", data.occurrenceTime || "Não informado");
  pushRow(rows, "Informante", valueOrNotInformed(data.informant));
  pushRow(rows, "Função do informante", valueOrNotInformed(data.informantRole));
  pushRow(rows, "Local", valueOrNotInformed(data.location));
  pushRow(rows, "Latitude", valueOrNotInformed(data.latitude));
  pushRow(rows, "Longitude", valueOrNotInformed(data.longitude));
  pushRow(rows, "Empresa", valueOrNotInformed(data.company));
  pushRow(rows, "Gerência envolvida", valueOrNotInformed(data.management));

  pushSection(rows, "Informações sobre a ocorrência");
  pushRow(
    rows,
    "Descrição da ocorrência",
    valueOrNotInformed(data.occurrenceDescription),
  );
  pushRow(rows, "Ações imediatas", valueOrNotInformed(data.immediateActions));

  if (hasPersonalAccident(classifications)) {
    pushSection(rows, "Atendimento à pessoa");
    pushRow(rows, "Primeiros socorros", yesNo(data.firstAid));
    pushRow(
      rows,
      "Deslocamento para atendimento médico externo",
      yesNo(data.externalMedicalCare),
    );
  }

  if (hasEnvironmentalAccident(classifications)) {
    pushSection(rows, "Dados ambientais");
    pushRow(
      rows,
      "Hora do fim do vazamento",
      valueOrNotInformed(data.spillEndTime),
    );
    const uncontained = parseOptionalNumber(data.uncontainedVolume);
    const contained = parseOptionalNumber(data.containedVolume);
    pushRow(
      rows,
      "Volume estimado não contido, em m³",
      uncontained ?? valueOrNotInformed(data.uncontainedVolume),
    );
    pushRow(
      rows,
      "Volume estimado contido, em m³",
      contained ?? valueOrNotInformed(data.containedVolume),
    );
    pushRow(rows, "Produto vazado", valueOrNotInformed(data.spilledProduct));
  }

  if (hasEnvironmentalOccurrence(classifications)) {
    pushSection(rows, "Ficha de Dados de Segurança — FDS");
    pushRow(
      rows,
      "Nome do arquivo",
      data.fdsMetadata?.name ?? "Não informado",
    );
    pushRow(
      rows,
      "Tipo do arquivo",
      data.fdsMetadata?.type ?? "Não informado",
    );
    pushRow(
      rows,
      "Tamanho do arquivo",
      data.fdsMetadata ? data.fdsMetadata.size : "Não informado",
    );
    pushRow(
      rows,
      "Observação",
      "O arquivo FDS não está incorporado à planilha.",
    );
  }

  return rows;
}

export function buildDadosRow(
  data: AnomalyReportFormData,
): Record<string, string | number> {
  const classifications = calculateClassifications(data);
  const selected = getSelectedImpacts(
    data.primaryImpact,
    data.additionalImpacts,
  );
  const hasPeople = selected.includes("pessoas");
  const hasMaterial = selected.includes("material");
  const hasEnvironment = selected.includes("meio_ambiente");

  const additional = data.additionalImpacts
    .filter((impact) => impact !== data.primaryImpact)
    .map((impact) => IMPACT_LABELS[impact])
    .join("; ");

  const uncontained = parseOptionalNumber(data.uncontainedVolume);
  const contained = parseOptionalNumber(data.containedVolume);
  const latitude = parseOptionalNumber(data.latitude);
  const longitude = parseOptionalNumber(data.longitude);

  return {
    numero_registro: data.recordNumber,
    criado_em: formatBrazilianDateTime(data.createdAt),
    hora_comunicacao: formatCommunicationTime(data.communicationTime),
    impacto_principal: data.primaryImpact
      ? IMPACT_LABELS[data.primaryImpact]
      : "",
    impactos_adicionais: additional,
    tipo_ocorrencia: formatClassifications(classifications),
    pessoas_resposta:
      hasPeople && data.peopleAnswer
        ? PEOPLE_ANSWER_LABELS[data.peopleAnswer]
        : "",
    pessoas_classificacao: hasPeople
      ? impactClassification("pessoas", data)
      : "",
    material_resposta:
      hasMaterial && data.materialAnswer
        ? MATERIAL_ANSWER_LABELS[data.materialAnswer]
        : "",
    material_classificacao: hasMaterial
      ? impactClassification("material", data)
      : "",
    meio_ambiente_resposta:
      hasEnvironment && data.environmentAnswer
        ? ENVIRONMENT_ANSWER_LABELS[data.environmentAnswer]
        : "",
    meio_ambiente_classificacao: hasEnvironment
      ? impactClassification("meio_ambiente", data)
      : "",
    data_ocorrencia: formatBrazilianDate(data.occurrenceDate),
    hora_ocorrencia: data.occurrenceTime,
    informante: data.informant,
    funcao_informante: data.informantRole,
    local: data.location,
    latitude: latitude ?? "",
    longitude: longitude ?? "",
    empresa: data.company,
    gerencia_envolvida: data.management,
    descricao_ocorrencia: data.occurrenceDescription,
    acoes_imediatas: data.immediateActions,
    primeiros_socorros: hasPersonalAccident(classifications)
      ? yesNo(data.firstAid)
      : "",
    atendimento_medico_externo: hasPersonalAccident(classifications)
      ? yesNo(data.externalMedicalCare)
      : "",
    hora_fim_vazamento: hasEnvironmentalAccident(classifications)
      ? data.spillEndTime
      : "",
    volume_nao_contido_m3: hasEnvironmentalAccident(classifications)
      ? (uncontained ?? "")
      : "",
    volume_contido_m3: hasEnvironmentalAccident(classifications)
      ? (contained ?? "")
      : "",
    produto_vazado: hasEnvironmentalAccident(classifications)
      ? data.spilledProduct
      : "",
    fds_nome: hasEnvironmentalOccurrence(classifications)
      ? (data.fdsMetadata?.name ?? "")
      : "",
    fds_tipo: hasEnvironmentalOccurrence(classifications)
      ? (data.fdsMetadata?.type ?? "")
      : "",
    fds_tamanho_bytes: hasEnvironmentalOccurrence(classifications)
      ? (data.fdsMetadata?.size ?? "")
      : "",
  };
}

export function buildAnomalyReportWorkbook(
  data: AnomalyReportFormData,
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  const informeRows = buildInformeSheetRows(data);
  const informeSheet = XLSX.utils.aoa_to_sheet(informeRows);
  informeSheet["!cols"] = [{ wch: 48 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(workbook, informeSheet, "Informe");

  const dadosRow = buildDadosRow(data);
  const headers = Object.keys(dadosRow);
  const values = headers.map((key) => dadosRow[key]);
  const dadosSheet = XLSX.utils.aoa_to_sheet([headers, values]);
  dadosSheet["!cols"] = headers.map((header) => ({
    wch: Math.max(14, Math.min(40, header.length + 4)),
  }));
  XLSX.utils.book_append_sheet(workbook, dadosSheet, "Dados");

  return workbook;
}

export function workbookToArrayBuffer(workbook: XLSX.WorkBook): ArrayBuffer {
  const result = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  if (result instanceof ArrayBuffer) {
    return result;
  }

  if (result instanceof Uint8Array) {
    return result.buffer.slice(
      result.byteOffset,
      result.byteOffset + result.byteLength,
    ) as ArrayBuffer;
  }

  if (Array.isArray(result)) {
    const bytes = Uint8Array.from(result as number[]);
    return bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
  }

  throw new Error("Não foi possível serializar o workbook Excel.");
}

export function exportAnomalyReportToExcel(data: AnomalyReportFormData): void {
  const workbook = buildAnomalyReportWorkbook(data);
  const fileName = sanitizeFileName(
    `Informe_Anomalia_${data.recordNumber}.xlsx`,
  );
  XLSX.writeFile(workbook, fileName);
}
