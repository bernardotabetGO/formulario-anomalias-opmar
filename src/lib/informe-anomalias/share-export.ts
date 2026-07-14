import { createAnomalyReportExcelFile } from "./excel-file";
import {
  buildEmailMailtoBody,
  buildEmailMailtoUrl,
  buildEmailSubject,
  buildShareSummary,
  buildShareTitle,
  buildWhatsAppFallbackMessage,
  buildWhatsAppShareUrl,
} from "./share-summary";
import type { AnomalyReportFormData } from "./types";

export type ShareChannel = "whatsapp" | "email";

export interface ShareResult {
  mode: "native" | "fallback";
  channel: ShareChannel;
  cancelled?: boolean;
}

export function isWebShareSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function"
  );
}

export function canShareFiles(file: File): boolean {
  if (!isWebShareSupported() || typeof navigator.canShare !== "function") {
    return false;
  }
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export function openExternalUrl(url: string): boolean {
  if (typeof window === "undefined") return false;
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  return opened !== null;
}

async function shareNative(
  file: File,
  recordNumber: string,
  text: string,
  channel: ShareChannel,
): Promise<ShareResult> {
  await navigator.share({
    files: [file],
    title: buildShareTitle(recordNumber),
    text,
  });
  return { mode: "native", channel };
}

function downloadExcel(data: AnomalyReportFormData): File {
  const file = createAnomalyReportExcelFile(data);
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
  return file;
}

export async function shareAnomalyReportViaWhatsApp(
  data: AnomalyReportFormData,
): Promise<ShareResult> {
  const text = buildShareSummary(data);
  const file = createAnomalyReportExcelFile(data);

  if (canShareFiles(file)) {
    try {
      return await shareNative(file, data.recordNumber, text, "whatsapp");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return { mode: "native", channel: "whatsapp", cancelled: true };
      }
      throw error;
    }
  }

  downloadExcel(data);
  const opened = openExternalUrl(buildWhatsAppShareUrl(text));
  if (!opened) {
    throw new Error("POPUP_BLOCKED");
  }
  return { mode: "fallback", channel: "whatsapp" };
}

export async function shareAnomalyReportViaEmail(
  data: AnomalyReportFormData,
): Promise<ShareResult> {
  const summary = buildShareSummary(data);
  const file = createAnomalyReportExcelFile(data);

  if (canShareFiles(file)) {
    try {
      return await shareNative(file, data.recordNumber, summary, "email");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return { mode: "native", channel: "email", cancelled: true };
      }
      throw error;
    }
  }

  downloadExcel(data);
  const subject = buildEmailSubject(data.recordNumber);
  const body = buildEmailMailtoBody(data);
  const opened = openExternalUrl(buildEmailMailtoUrl(subject, body));
  if (!opened) {
    throw new Error("EMAIL_BLOCKED");
  }
  return { mode: "fallback", channel: "email" };
}

export function getWhatsAppFallbackUserMessage(recordNumber: string): string {
  return buildWhatsAppFallbackMessage(recordNumber);
}

export function getWhatsAppRetryUrl(data: AnomalyReportFormData): string {
  return buildWhatsAppShareUrl(buildShareSummary(data));
}

export function getEmailRetryUrl(data: AnomalyReportFormData): string {
  return buildEmailMailtoUrl(
    buildEmailSubject(data.recordNumber),
    buildEmailMailtoBody(data),
  );
}
