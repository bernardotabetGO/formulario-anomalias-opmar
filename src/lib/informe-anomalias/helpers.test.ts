import { describe, expect, it } from "vitest";
import { formatBrazilianDate, generateRecordNumber } from "./record-number";
import { parseOptionalNumber, normalizeDecimalInput } from "./number-normalization";
import { toDraftPayload } from "./form-storage";
import type { AnomalyReportFormData } from "./types";

describe("record-number e datas", () => {
  it("gera número no padrão OPMAR-AAAAMMDD-HHMMSS-XXXXXXXX", () => {
    const date = new Date(2026, 6, 14, 9, 15, 30);
    const value = generateRecordNumber(date);
    expect(value).toMatch(/^OPMAR-20260714-091530-[A-F0-9]{8}$/);
  });

  it("formata YYYY-MM-DD sem conversão UTC", () => {
    expect(formatBrazilianDate("2026-07-14")).toBe("14/07/2026");
    expect(formatBrazilianDate("2026-01-01")).toBe("01/01/2026");
  });
});

describe("number-normalization", () => {
  it("aceita vírgula e ponto", () => {
    expect(normalizeDecimalInput("1,5")).toBe("1.5");
    expect(parseOptionalNumber("1,5")).toBe(1.5);
    expect(parseOptionalNumber("-23,55")).toBe(-23.55);
  });
});

describe("form-storage", () => {
  it("não inclui metadados binários da FDS no rascunho", () => {
    const data = {
      recordNumber: "OPMAR-20260714-091530-A1B2C3D4",
      createdAt: "2026-07-14T12:15:30.000Z",
      communicationTime: "2026-07-14T12:15:30.000Z",
      primaryImpact: "meio_ambiente",
      hasAdditionalImpacts: "nao",
      additionalImpacts: [],
      peopleAnswer: null,
      materialAnswer: null,
      environmentAnswer: "sim",
      classifications: ["Acidente ambiental"],
      occurrenceDate: "2026-07-10",
      occurrenceTime: "08:30:00",
      informant: "Maria",
      informantRole: "Técnica",
      location: "Píer",
      latitude: "",
      longitude: "",
      company: "Empresa",
      management: "Gerência",
      occurrenceDescription: "Vazamento",
      immediateActions: "Contenção",
      firstAid: false,
      externalMedicalCare: false,
      spillEndTime: "09:00:00",
      uncontainedVolume: "1",
      containedVolume: "2",
      spilledProduct: "Óleo",
      fdsMetadata: {
        name: "fds.pdf",
        type: "application/pdf",
        size: 1000,
      },
    } satisfies AnomalyReportFormData;

    const draft = toDraftPayload(data);
    expect(draft.fdsMetadata).toBeNull();
    expect(draft.hadFdsAttachment).toBe(true);
    expect(JSON.stringify(draft)).not.toContain("fds.pdf");
  });
});
