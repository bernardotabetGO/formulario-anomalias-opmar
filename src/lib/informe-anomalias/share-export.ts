import {
  buildEmailMailtoUrl,
  buildEmailSubject,
  buildShareSummary,
  buildWhatsAppShareUrl,
} from "./share-summary";
import type { AnomalyReportFormData } from "./types";

export function openExternalUrl(url: string): boolean {
  if (typeof window === "undefined") return false;
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  return opened !== null;
}

export function shareAnomalyReportViaWhatsApp(
  data: AnomalyReportFormData,
): void {
  const text = buildShareSummary(data);
  const opened = openExternalUrl(buildWhatsAppShareUrl(text));
  if (!opened) {
    throw new Error("POPUP_BLOCKED");
  }
}

export function shareAnomalyReportViaEmail(data: AnomalyReportFormData): void {
  const subject = buildEmailSubject(data.recordNumber);
  const body = buildShareSummary(data);
  const opened = openExternalUrl(buildEmailMailtoUrl(subject, body));
  if (!opened) {
    throw new Error("EMAIL_BLOCKED");
  }
}

export function getWhatsAppRetryUrl(data: AnomalyReportFormData): string {
  return buildWhatsAppShareUrl(buildShareSummary(data));
}

export function getEmailRetryUrl(data: AnomalyReportFormData): string {
  return buildEmailMailtoUrl(
    buildEmailSubject(data.recordNumber),
    buildShareSummary(data),
  );
}
