export type CopyReportResult =
  | { success: true; method: "clipboard" | "execCommand" }
  | { success: false; method: "failed" };

export async function copyReportText(text: string): Promise<CopyReportResult> {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, method: "clipboard" };
    } catch {
      // tenta fallback abaixo
    }
  }

  if (typeof document !== "undefined") {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      const copied = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (copied) {
        return { success: true, method: "execCommand" };
      }
    } catch {
      // falha no fallback
    }
  }

  return { success: false, method: "failed" };
}
