import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ANOMALY_REPORT_EXCEL_MIME_TYPE,
  createAnomalyReportExcelFile,
} from "./excel-file";
import {
  canShareFiles,
  isWebShareSupported,
  openExternalUrl,
  shareAnomalyReportViaEmail,
  shareAnomalyReportViaWhatsApp,
} from "./share-export";
import type { AnomalyReportFormData } from "./types";

const formData: AnomalyReportFormData = {
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
  occurrenceDescription: "Descrição.",
  immediateActions: "Ações.",
  firstAid: false,
  externalMedicalCare: false,
  spillEndTime: "",
  uncontainedVolume: "",
  containedVolume: "",
  spilledProduct: "",
  fdsMetadata: null,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("web share helpers", () => {
  it("detecta ausência de navigator.share", () => {
    expect(isWebShareSupported()).toBe(false);
  });

  it("detecta suporte a navigator.share", () => {
    vi.stubGlobal("navigator", {
      share: vi.fn(),
      canShare: vi.fn(() => true),
    });
    expect(isWebShareSupported()).toBe(true);
  });

  it("detecta canShare com arquivo", () => {
    const file = new File(["x"], "test.xlsx", {
      type: ANOMALY_REPORT_EXCEL_MIME_TYPE,
    });
    const canShare = vi.fn(() => true);
    vi.stubGlobal("navigator", {
      share: vi.fn(),
      canShare,
    });
    expect(canShareFiles(file)).toBe(true);
    expect(canShare).toHaveBeenCalledWith({ files: [file] });
  });

  it("retorna false quando canShare falha", () => {
    const file = new File(["x"], "test.xlsx", {
      type: ANOMALY_REPORT_EXCEL_MIME_TYPE,
    });
    vi.stubGlobal("navigator", {
      share: vi.fn(),
      canShare: vi.fn(() => {
        throw new Error("unsupported");
      }),
    });
    expect(canShareFiles(file)).toBe(false);
  });

  it("usa fallback do WhatsApp quando share com arquivo não está disponível", async () => {
    const openMock = vi.fn(() => ({ focus: vi.fn() }));
    vi.stubGlobal("window", {
      open: openMock,
    });
    vi.stubGlobal("document", {
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
      createElement: vi.fn(() => ({
        click: vi.fn(),
        style: {},
      })),
    });
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal("navigator", {});

    const result = await shareAnomalyReportViaWhatsApp(formData);
    expect(result.mode).toBe("fallback");
    expect(result.channel).toBe("whatsapp");
    expect(openMock).toHaveBeenCalled();
    const calls = openMock.mock.calls as unknown as Array<[string]>;
    expect(calls[0]?.[0]).toContain("https://wa.me/?text=");
  });

  it("usa fallback de e-mail com mailto", async () => {
    const openMock = vi.fn(() => ({ focus: vi.fn() }));
    vi.stubGlobal("window", { open: openMock });
    vi.stubGlobal("document", {
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
      createElement: vi.fn(() => ({ click: vi.fn(), style: {} })),
    });
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal("navigator", {});

    const result = await shareAnomalyReportViaEmail(formData);
    expect(result.mode).toBe("fallback");
    expect(result.channel).toBe("email");
    const calls = openMock.mock.calls as unknown as Array<[string]>;
    expect(calls[0]?.[0]).toContain("mailto:?subject=");
  });

  it("openExternalUrl retorna false quando popup é bloqueado", () => {
    vi.stubGlobal("window", { open: vi.fn(() => null) });
    expect(openExternalUrl("https://example.com")).toBe(false);
  });

  it("gera File compartilhável a partir do workbook", () => {
    const file = createAnomalyReportExcelFile(formData);
    expect(file.type).toBe(ANOMALY_REPORT_EXCEL_MIME_TYPE);
    expect(file.name).toContain("Informe_Anomalia_");
  });
});
