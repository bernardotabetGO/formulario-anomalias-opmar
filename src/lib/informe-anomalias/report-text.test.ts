import { describe, expect, it } from "vitest";
import { buildWhatsAppReportText } from "./report-text";
import type { AnomalyReportFormData } from "./types";

function baseForm(
  overrides: Partial<AnomalyReportFormData> = {},
): AnomalyReportFormData {
  return {
    recordNumber: "OPMAR-20260714-091530-A1B2C3D4",
    createdAt: "2026-07-14T12:15:30.000Z",
    communicationTime: "2026-07-14T12:15:30.000Z",
    primaryImpact: "pessoas",
    hasAdditionalImpacts: "nao",
    additionalImpacts: [],
    peopleAnswer: "houve_lesao",
    materialAnswer: null,
    environmentAnswer: null,
    classifications: ["Acidente pessoal"],
    occurrenceDate: "2026-07-10",
    occurrenceTime: "08:30:00",
    informant: "João Silva",
    informantRole: "Operador",
    location: "Área 12",
    latitude: "",
    longitude: "",
    company: "Empresa Exemplo",
    management: "Gerência Operacional",
    occurrenceDescription: "Colaborador escorregou na área molhada.",
    immediateActions: "Área isolada e primeiros socorros aplicados.",
    firstAid: true,
    externalMedicalCare: true,
    spillEndTime: "",
    uncontainedVolume: "",
    containedVolume: "",
    spilledProduct: "",
    fdsMetadata: null,
    ...overrides,
  };
}

describe("buildWhatsAppReportText", () => {
  it("gera texto de acidente pessoal", () => {
    const text = buildWhatsAppReportText(baseForm());
    expect(text).toContain("*INFORME DE ANOMALIA — OPMAR*");
    expect(text).toContain("📌 *Registro:* OPMAR-20260714-091530-A1B2C3D4");
    expect(text).toContain("⚠️ *Tipo de ocorrência:* Acidente pessoal");
    expect(text).toContain("*ATENDIMENTO À PESSOA*");
    expect(text).toContain("- *Primeiros socorros:* Sim");
    expect(text).toContain("- *Atendimento médico externo:* Sim");
  });

  it("gera texto de incidente pessoal", () => {
    const text = buildWhatsAppReportText(
      baseForm({
        peopleAnswer: "nao_houve_lesao",
        classifications: ["Incidente"],
        firstAid: false,
        externalMedicalCare: false,
      }),
    );
    expect(text).toContain("⚠️ *Tipo de ocorrência:* Incidente");
    expect(text).not.toContain("*ATENDIMENTO À PESSOA*");
  });

  it("gera texto de acidente com dano ao patrimônio", () => {
    const text = buildWhatsAppReportText(
      baseForm({
        primaryImpact: "material",
        peopleAnswer: null,
        materialAnswer: "sim",
        classifications: ["Acidente com dano ao patrimônio"],
        firstAid: false,
        externalMedicalCare: false,
      }),
    );
    expect(text).toContain(
      "⚠️ *Tipo de ocorrência:* Acidente com dano ao patrimônio",
    );
    expect(text).toContain(
      "- *Material:* Sim — Acidente com dano ao patrimônio",
    );
    expect(text).not.toContain("- *Pessoas:*");
  });

  it("gera texto de acidente ambiental", () => {
    const text = buildWhatsAppReportText(
      baseForm({
        primaryImpact: "meio_ambiente",
        peopleAnswer: null,
        environmentAnswer: "sim",
        classifications: ["Acidente ambiental"],
        firstAid: false,
        externalMedicalCare: false,
        spillEndTime: "10:15:00",
        uncontainedVolume: "1,5",
        containedVolume: "2",
        spilledProduct: "Óleo diesel",
        fdsMetadata: {
          name: "fds-diesel.pdf",
          type: "application/pdf",
          size: 2048,
        },
      }),
    );
    expect(text).toContain("⚠️ *Tipo de ocorrência:* Acidente ambiental");
    expect(text).toContain("*DADOS AMBIENTAIS*");
    expect(text).toContain("- *Produto vazado:* Óleo diesel");
    expect(text).toContain("- *Volume contido:* 2 m³");
    expect(text).toContain("- *Volume não contido:* 1,5 m³");
    expect(text).toContain("*FDS*");
    expect(text).toContain("- *Arquivo:* fds-diesel.pdf");
  });

  it("gera texto de incidente ambiental", () => {
    const text = buildWhatsAppReportText(
      baseForm({
        primaryImpact: "meio_ambiente",
        peopleAnswer: null,
        environmentAnswer: "nao",
        classifications: ["Incidente ambiental"],
        firstAid: false,
        externalMedicalCare: false,
        fdsMetadata: null,
      }),
    );
    expect(text).toContain("⚠️ *Tipo de ocorrência:* Incidente ambiental");
    expect(text).not.toContain("*DADOS AMBIENTAIS*");
    expect(text).toContain("*FDS*");
    expect(text).toContain("- *Arquivo:* Não anexado");
  });

  it("gera texto com múltiplos impactos", () => {
    const text = buildWhatsAppReportText(
      baseForm({
        hasAdditionalImpacts: "sim",
        additionalImpacts: ["pessoas", "material"],
        materialAnswer: "sim",
        classifications: ["Acidente pessoal", "Acidente com dano ao patrimônio"],
      }),
    );
    expect(text).toContain("➕ *Outros impactos:* Material");
    expect(text).toContain("- *Pessoas:* Houve lesão — Acidente pessoal");
    expect(text).toContain(
      "- *Material:* Sim — Acidente com dano ao patrimônio",
    );
  });

  it("omite campos não aplicáveis", () => {
    const text = buildWhatsAppReportText(
      baseForm({
        primaryImpact: "material",
        peopleAnswer: null,
        materialAnswer: "nao",
        classifications: ["Incidente"],
        firstAid: false,
        externalMedicalCare: false,
      }),
    );
    expect(text).not.toContain("- *Pessoas:*");
    expect(text).not.toContain("*DADOS AMBIENTAIS*");
    expect(text).not.toContain("*ATENDIMENTO À PESSOA*");
    expect(text).not.toContain("*FDS*");
  });

  it("usa datas no padrão brasileiro", () => {
    const text = buildWhatsAppReportText(baseForm());
    expect(text).toContain("📅 *Data da ocorrência:* 10/07/2026");
  });

  it("preserva quebras de linha", () => {
    const text = buildWhatsAppReportText(baseForm());
    expect(text.split("\n").length).toBeGreaterThan(10);
  });

  it("usa formatação com asteriscos para títulos", () => {
    const text = buildWhatsAppReportText(baseForm());
    expect(text).toContain("*CLASSIFICAÇÃO DOS IMPACTOS*");
    expect(text).toContain("*INFORMAÇÕES GERAIS*");
    expect(text).toContain("*DESCRIÇÃO DA OCORRÊNCIA*");
    expect(text).toContain("*AÇÕES IMEDIATAS*");
  });

  it("não inclui undefined, null ou [object Object]", () => {
    const text = buildWhatsAppReportText(
      baseForm({
        latitude: "undefined",
        longitude: "null",
      }),
    );
    expect(text).not.toContain("undefined");
    expect(text).not.toContain("null");
    expect(text).not.toContain("[object Object]");
  });

  it("preserva descrição completa", () => {
    const description =
      "Descrição longa com várias linhas.\nSegunda linha detalhada.";
    const text = buildWhatsAppReportText(
      baseForm({ occurrenceDescription: description }),
    );
    expect(text).toContain(description);
  });

  it("preserva ações imediatas completas", () => {
    const actions = "Isolamento imediato.\nAcionamento da brigada.";
    const text = buildWhatsAppReportText(
      baseForm({ immediateActions: actions }),
    );
    expect(text).toContain(actions);
  });

  it("inclui coordenadas somente quando preenchidas", () => {
    const withoutCoords = buildWhatsAppReportText(baseForm());
    expect(withoutCoords).not.toContain("*Latitude:*");
    expect(withoutCoords).not.toContain("*Longitude:*");

    const withCoords = buildWhatsAppReportText(
      baseForm({ latitude: "-22.9035", longitude: "-43.2096" }),
    );
    expect(withCoords).toContain("🌐 *Latitude:* -22.9035");
    expect(withCoords).toContain("🌐 *Longitude:* -43.2096");
  });

  it("inclui FDS somente quando aplicável", () => {
    const personal = buildWhatsAppReportText(baseForm());
    expect(personal).not.toContain("*FDS*");
  });

  it("é compatível com WhatsApp", () => {
    const text = buildWhatsAppReportText(baseForm());
    expect(text).toContain(
      "_Gerado pelo Formulário de Informe de Anomalias da OPMAR._",
    );
    expect(text).not.toContain("Excel");
    expect(text).not.toContain("anex");
    expect(text).not.toMatch(/\|.*\|/);
  });
});
