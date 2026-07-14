import { describe, expect, it, vi } from "vitest";
import {
  buildEmailMailtoUrl,
  buildEmailSubject,
  buildShareSummary,
  buildWhatsAppShareUrl,
} from "./share-summary";
import {
  openExternalUrl,
  shareAnomalyReportViaEmail,
  shareAnomalyReportViaWhatsApp,
} from "./share-export";
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

describe("buildShareSummary", () => {
  it("contém classificação e informações gerais", () => {
    const summary = buildShareSummary(baseForm());
    expect(summary).toContain("INFORME DE ANOMALIA DA OPMAR");
    expect(summary).toContain("1. CLASSIFICAÇÃO");
    expect(summary).toContain("Número de registro: OPMAR-20260714-091530-A1B2C3D4");
    expect(summary).toContain("Tipo de ocorrência: Acidente pessoal");
    expect(summary).toContain("Impacto principal: Pessoas");
    expect(summary).toContain("Outros impactos: Nenhum");
    expect(summary).toContain("- Pessoas: Houve lesão — Acidente pessoal");
    expect(summary).toContain("2. INFORMAÇÕES GERAIS");
    expect(summary).toContain("Data da ocorrência: 10/07/2026");
    expect(summary).toContain("Hora da ocorrência: 08:30:00");
    expect(summary).toContain("Informante: João Silva");
    expect(summary).toContain("Latitude: Não informada");
    expect(summary).toContain("Longitude: Não informada");
  });

  it("contém descrição e ações imediatas completas", () => {
    const summary = buildShareSummary(baseForm());
    expect(summary).toContain("3. INFORMAÇÕES SOBRE A OCORRÊNCIA");
    expect(summary).toContain("Colaborador escorregou na área molhada.");
    expect(summary).toContain("Área isolada e primeiros socorros aplicados.");
  });

  it("inclui atendimento à pessoa somente em acidente pessoal", () => {
    const summary = buildShareSummary(baseForm());
    expect(summary).toContain("4. ATENDIMENTO À PESSOA");
    expect(summary).toContain("Primeiros socorros: Sim");
    expect(summary).toContain(
      "Deslocamento para atendimento médico externo: Sim",
    );
  });

  it("inclui dados ambientais e FDS somente quando aplicável", () => {
    const summary = buildShareSummary(
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

    expect(summary).toContain("5. DADOS AMBIENTAIS");
    expect(summary).toContain("Produto vazado: Óleo diesel");
    expect(summary).toContain("Volume estimado contido: 2 m³");
    expect(summary).toContain("Volume estimado não contido: 1,5 m³");
    expect(summary).toContain("6. FDS");
    expect(summary).toContain("Arquivo FDS: fds-diesel.pdf");
    expect(summary).not.toContain("4. ATENDIMENTO À PESSOA");
  });

  it("não inclui campos não selecionados nem valores inválidos", () => {
    const summary = buildShareSummary(
      baseForm({
        primaryImpact: "material",
        peopleAnswer: null,
        materialAnswer: "nao",
        classifications: ["Incidente"],
        firstAid: false,
        externalMedicalCare: false,
        spillEndTime: "10:00",
        spilledProduct: "resíduo",
      }),
    );

    expect(summary).not.toContain("- Pessoas:");
    expect(summary).not.toContain("5. DADOS AMBIENTAIS");
    expect(summary).not.toContain("4. ATENDIMENTO À PESSOA");
    expect(summary).not.toContain("undefined");
    expect(summary).not.toContain("null");
    expect(summary).not.toContain("[object Object]");
    expect(summary).toContain(
      "Informe gerado pelo Formulário de Informe de Anomalias da OPMAR.",
    );
  });

  it("monta assunto do e-mail", () => {
    expect(buildEmailSubject("OPMAR-20260714-091530-A1B2C3D4")).toBe(
      "Informe de Anomalia OPMAR - OPMAR-20260714-091530-A1B2C3D4",
    );
  });

  it("monta URL do WhatsApp com texto codificado", () => {
    const url = buildWhatsAppShareUrl("Informe de teste");
    expect(url).toBe("https://wa.me/?text=Informe%20de%20teste");
  });

  it("monta mailto com assunto e corpo codificados", () => {
    const url = buildEmailMailtoUrl("Assunto", "Corpo do e-mail");
    expect(url.startsWith("mailto:?subject=")).toBe(true);
    expect(decodeURIComponent(url)).toContain("Assunto");
    expect(decodeURIComponent(url)).toContain("Corpo do e-mail");
  });
});

describe("share-export", () => {
  it("WhatsApp abre wa.me com texto codificado", () => {
    const openMock = vi.fn(() => ({ focus: vi.fn() }));
    vi.stubGlobal("window", { open: openMock });

    shareAnomalyReportViaWhatsApp(baseForm());

    expect(openMock).toHaveBeenCalledTimes(1);
    const calls = openMock.mock.calls as unknown as Array<[string]>;
    expect(calls[0]?.[0]).toContain("https://wa.me/?text=");
    expect(decodeURIComponent(calls[0]?.[0] ?? "")).toContain(
      "INFORME DE ANOMALIA DA OPMAR",
    );

    vi.unstubAllGlobals();
  });

  it("e-mail abre mailto com assunto e corpo completos", () => {
    const openMock = vi.fn(() => ({ focus: vi.fn() }));
    vi.stubGlobal("window", { open: openMock });

    shareAnomalyReportViaEmail(baseForm());

    expect(openMock).toHaveBeenCalledTimes(1);
    const calls = openMock.mock.calls as unknown as Array<[string]>;
    const url = decodeURIComponent(calls[0]?.[0] ?? "");
    expect(url).toContain("mailto:?subject=");
    expect(url).toContain("Informe de Anomalia OPMAR - OPMAR-20260714-091530-A1B2C3D4");
    expect(url).toContain("Colaborador escorregou na área molhada.");

    vi.unstubAllGlobals();
  });

  it("openExternalUrl retorna false quando popup é bloqueado", () => {
    vi.stubGlobal("window", { open: vi.fn(() => null) });
    expect(openExternalUrl("https://example.com")).toBe(false);
    vi.unstubAllGlobals();
  });
});
