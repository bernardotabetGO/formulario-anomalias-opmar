import { describe, expect, it } from "vitest";
import {
  buildEmailMailtoBody,
  buildEmailMailtoUrl,
  buildEmailSubject,
  buildShareSummary,
  buildWhatsAppShareUrl,
} from "./share-summary";
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

describe("share-summary", () => {
  it("gera resumo de acidente pessoal com atendimento", () => {
    const summary = buildShareSummary(baseForm());
    expect(summary).toContain("Informe de Anomalia da OPMAR");
    expect(summary).toContain("Número de registro: OPMAR-20260714-091530-A1B2C3D4");
    expect(summary).toContain("Tipo de ocorrência: Acidente pessoal");
    expect(summary).toContain("Data da ocorrência: 10/07/2026");
    expect(summary).toContain("Atendimento à pessoa:");
    expect(summary).toContain("Primeiros socorros: Sim");
    expect(summary).toContain("Atendimento médico externo: Sim");
    expect(summary).toContain(
      "Planilha completa do informe: Informe_Anomalia_OPMAR-20260714-091530-A1B2C3D4.xlsx",
    );
  });

  it("gera resumo de acidente ambiental com campos aplicáveis", () => {
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

    expect(summary).toContain("Tipo de ocorrência: Acidente ambiental");
    expect(summary).toContain("Produto vazado: Óleo diesel");
    expect(summary).toContain("Volume contido: 2");
    expect(summary).toContain("Volume não contido: 1,5");
    expect(summary).toContain("Hora do fim do vazamento: 10:15:00");
    expect(summary).toContain("FDS selecionada: fds-diesel.pdf");
    expect(summary).not.toContain("Atendimento à pessoa");
  });

  it("não inclui campos não aplicáveis nem valores inválidos", () => {
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

    expect(summary).not.toContain("Atendimento à pessoa");
    expect(summary).not.toContain("Produto vazado");
    expect(summary).not.toContain("undefined");
    expect(summary).not.toContain("null");
    expect(summary).not.toContain("[object Object]");
  });

  it("monta assunto do e-mail", () => {
    expect(buildEmailSubject("OPMAR-20260714-091530-A1B2C3D4")).toBe(
      "Informe de Anomalia OPMAR - OPMAR-20260714-091530-A1B2C3D4",
    );
  });

  it("monta corpo do e-mail com instrução de anexo manual", () => {
    const body = buildEmailMailtoBody(baseForm());
    expect(body).toContain("Descrição:");
    expect(body).toContain("Anexe manualmente o arquivo Informe_Anomalia_OPMAR-20260714-091530-A1B2C3D4.xlsx");
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
