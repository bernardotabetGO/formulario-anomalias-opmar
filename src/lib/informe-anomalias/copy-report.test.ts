import { afterEach, describe, expect, it, vi } from "vitest";
import { copyReportText } from "./copy-report";

function createMockDocument(options: {
  execCommandResult?: boolean;
  onCreateElement?: (element: {
    value: string;
    style: Record<string, string>;
    select: ReturnType<typeof vi.fn>;
    setSelectionRange: ReturnType<typeof vi.fn>;
  }) => void;
}) {
  const appendChild = vi.fn();
  const removeChild = vi.fn();
  const execCommand = vi.fn().mockReturnValue(options.execCommandResult ?? true);

  const createElement = vi.fn(() => {
    const element = {
      value: "",
      style: {} as Record<string, string>,
      select: vi.fn(),
      setSelectionRange: vi.fn(),
      setAttribute: vi.fn(),
    };
    options.onCreateElement?.(element);
    return element;
  });

  return {
    body: { appendChild, removeChild },
    createElement,
    execCommand,
  };
}

describe("copyReportText", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("copia via Clipboard API", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const result = await copyReportText("Texto do informe");

    expect(result).toEqual({ success: true, method: "clipboard" });
    expect(writeText).toHaveBeenCalledWith("Texto do informe");
  });

  it("usa execCommand quando Clipboard API falha", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const mockDocument = createMockDocument({ execCommandResult: true });
    vi.stubGlobal("document", mockDocument);

    const result = await copyReportText("Texto alternativo");

    expect(result).toEqual({ success: true, method: "execCommand" });
    expect(mockDocument.execCommand).toHaveBeenCalledWith("copy");
    expect(mockDocument.body.appendChild).toHaveBeenCalled();
    expect(mockDocument.body.removeChild).toHaveBeenCalled();
  });

  it("retorna falha quando nenhum método funciona", async () => {
    vi.stubGlobal("navigator", {});

    const mockDocument = createMockDocument({ execCommandResult: false });
    vi.stubGlobal("document", mockDocument);

    const result = await copyReportText("Texto indisponível");

    expect(result).toEqual({ success: false, method: "failed" });
  });
});
