import { describe, expect, it } from "vitest";
import {
  ANOMALY_REPORT_EXCEL_MIME_TYPE,
  createAnomalyReportExcelFile,
  getAnomalyReportFileName,
} from "./excel-file";
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
    occurrenceDescription: "Descrição da ocorrência.",
    immediateActions: "Ações imediatas.",
    firstAid: true,
    externalMedicalCare: false,
    spillEndTime: "",
    uncontainedVolume: "",
    containedVolume: "",
    spilledProduct: "",
    fdsMetadata: null,
    ...overrides,
  };
}

describe("excel-file", () => {
  it("gera nome correto do arquivo", () => {
    expect(getAnomalyReportFileName("OPMAR-20260714-091530-A1B2C3D4")).toBe(
      "Informe_Anomalia_OPMAR-20260714-091530-A1B2C3D4.xlsx",
    );
  });

  it("cria File com MIME type correto e conteúdo", () => {
    const file = createAnomalyReportExcelFile(baseForm());
    expect(file.name).toBe(
      "Informe_Anomalia_OPMAR-20260714-091530-A1B2C3D4.xlsx",
    );
    expect(file.type).toBe(ANOMALY_REPORT_EXCEL_MIME_TYPE);
    expect(file.size).toBeGreaterThan(0);
  });
});
