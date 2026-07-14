import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import {
  buildAnomalyReportWorkbook,
  buildDadosRow,
  buildInformeSheetRows,
  workbookToArrayBuffer,
} from "./excel-export";
import type { AnomalyReportFormData } from "./types";

function baseForm(
  overrides: Partial<AnomalyReportFormData> = {},
): AnomalyReportFormData {
  return {
    recordNumber: "OPMAR-20260714-091530-A1B2C3D4",
    createdAt: "2026-07-14T12:15:30.000Z",
    communicationTime: "2026-07-14T12:15:30.000Z",
    primaryImpact: null,
    hasAdditionalImpacts: "nao",
    additionalImpacts: [],
    peopleAnswer: null,
    materialAnswer: null,
    environmentAnswer: null,
    classifications: [],
    occurrenceDate: "2026-07-10",
    occurrenceTime: "08:30:00",
    informant: "João Silva",
    informantRole: "Operador",
    location: "Área 12",
    latitude: "-23,5505",
    longitude: "-46.6333",
    company: "Empresa Exemplo",
    management: "Gerência Operacional",
    occurrenceDescription: "Descrição detalhada da ocorrência para teste.",
    immediateActions: "Ações imediatas tomadas após a identificação.",
    firstAid: false,
    externalMedicalCare: false,
    spillEndTime: "",
    uncontainedVolume: "",
    containedVolume: "",
    spilledProduct: "",
    fdsMetadata: null,
    ...overrides,
  };
}

function sheetMatrix(workbook: XLSX.WorkBook, name: string): unknown[][] {
  const sheet = workbook.Sheets[name];
  expect(sheet).toBeDefined();
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: true,
  }) as unknown[][];
}

describe("excel-export", () => {
  it("exporta acidente pessoal com atendimento e sem campos ambientais", () => {
    const data = baseForm({
      primaryImpact: "pessoas",
      peopleAnswer: "houve_lesao",
      classifications: ["Acidente pessoal"],
      firstAid: true,
      externalMedicalCare: true,
    });

    const workbook = buildAnomalyReportWorkbook(data);
    const buffer = workbookToArrayBuffer(workbook);
    const reopened = XLSX.read(buffer, { type: "array" });

    expect(reopened.SheetNames).toEqual(["Informe", "Dados"]);

    const informe = sheetMatrix(reopened, "Informe");
    const flat = informe.map((row) => row.join("|")).join("\n");
    expect(flat).toContain("OPMAR-20260714-091530-A1B2C3D4");
    expect(flat).toContain("Acidente pessoal");
    expect(flat).toContain("Descrição detalhada da ocorrência para teste.");
    expect(flat).toContain("Ações imediatas tomadas após a identificação.");
    expect(flat).toContain("Primeiros socorros");
    expect(flat).toContain("Atendimento à pessoa");
    expect(flat).not.toContain("Dados ambientais");
    expect(flat).not.toContain("Volume estimado não contido");
    expect(flat).not.toContain("undefined");
    expect(flat).not.toContain("null");
    expect(flat).not.toContain("[object Object]");

    const dados = sheetMatrix(reopened, "Dados");
    expect(dados).toHaveLength(2);
    expect(dados[0]).toContain("numero_registro");
    expect(dados[1][0]).toBe("OPMAR-20260714-091530-A1B2C3D4");
    const headers = dados[0] as string[];
    const row = Object.fromEntries(
      headers.map((header, index) => [header, dados[1][index]]),
    );
    expect(row.tipo_ocorrencia).toBe("Acidente pessoal");
    expect(row.primeiros_socorros).toBe("Sim");
    expect(row.hora_fim_vazamento).toBe("");
    expect(row.fds_nome).toBe("");
    expect(row.data_ocorrencia).toBe("10/07/2026");
    expect(row.latitude).toBeCloseTo(-23.5505);
    expect(row.longitude).toBeCloseTo(-46.6333);
  });

  it("exporta acidente com dano ao patrimônio sem campos pessoais/ambientais", () => {
    const data = baseForm({
      primaryImpact: "material",
      materialAnswer: "sim",
      classifications: ["Acidente com dano ao patrimônio"],
      latitude: "",
      longitude: "",
    });

    const rows = buildInformeSheetRows(data);
    const flat = rows.map((row) => row.join("|")).join("\n");
    expect(flat).toContain("Acidente com dano ao patrimônio");
    expect(flat).not.toContain("Atendimento à pessoa");
    expect(flat).not.toContain("Dados ambientais");
    expect(flat).not.toContain("Ficha de Dados de Segurança");

    const dados = buildDadosRow(data);
    expect(dados.material_classificacao).toBe(
      "Acidente com dano ao patrimônio",
    );
    expect(dados.primeiros_socorros).toBe("");
    expect(dados.produto_vazado).toBe("");
  });

  it("exporta acidente ambiental com metadados da FDS e volumes numéricos", () => {
    const data = baseForm({
      primaryImpact: "meio_ambiente",
      environmentAnswer: "sim",
      classifications: ["Acidente ambiental"],
      spillEndTime: "10:15:00",
      uncontainedVolume: "1,5",
      containedVolume: "2.25",
      spilledProduct: "Óleo diesel",
      fdsMetadata: {
        name: "fds-diesel.pdf",
        type: "application/pdf",
        size: 2048,
      },
    });

    const workbook = buildAnomalyReportWorkbook(data);
    const buffer = workbookToArrayBuffer(workbook);
    const reopened = XLSX.read(buffer, { type: "array" });
    const informe = sheetMatrix(reopened, "Informe");
    const flat = informe.map((row) => row.join("|")).join("\n");

    expect(flat).toContain("Acidente ambiental");
    expect(flat).toContain("Dados ambientais");
    expect(flat).toContain("Óleo diesel");
    expect(flat).toContain("fds-diesel.pdf");
    expect(flat).toContain("O arquivo FDS não está incorporado à planilha.");
    expect(flat).not.toContain("Atendimento à pessoa");

    const dados = sheetMatrix(reopened, "Dados");
    expect(dados).toHaveLength(2);
    const headers = dados[0] as string[];
    const row = Object.fromEntries(
      headers.map((header, index) => [header, dados[1][index]]),
    );
    expect(row.tipo_ocorrencia).toBe("Acidente ambiental");
    expect(row.volume_nao_contido_m3).toBe(1.5);
    expect(row.volume_contido_m3).toBe(2.25);
    expect(row.fds_nome).toBe("fds-diesel.pdf");
    expect(row.fds_tamanho_bytes).toBe(2048);
    expect(row.primeiros_socorros).toBe("");
  });

  it("não exporta respostas de impactos não selecionados na planilha Dados", () => {
    const data = baseForm({
      primaryImpact: "material",
      materialAnswer: "nao",
      peopleAnswer: "houve_lesao",
      environmentAnswer: "sim",
      classifications: ["Incidente"],
    });

    const dados = buildDadosRow(data);
    expect(dados.pessoas_resposta).toBe("");
    expect(dados.pessoas_classificacao).toBe("");
    expect(dados.meio_ambiente_resposta).toBe("");
    expect(dados.material_resposta).toBe("Não");
    expect(dados.material_classificacao).toBe("Incidente");
  });

  it("formata data YYYY-MM-DD sem deslocar o dia no fuso", () => {
    const rows = buildInformeSheetRows(
      baseForm({
        primaryImpact: "pessoas",
        peopleAnswer: "ocorrencia_saude",
        occurrenceDate: "2026-07-14",
      }),
    );
    const dateRow = rows.find((row) => row[0] === "Data da ocorrência");
    expect(dateRow?.[1]).toBe("14/07/2026");
  });
});
