import {
  buildAnomalyReportWorkbook,
  workbookToArrayBuffer,
} from "./excel-export";
import { sanitizeFileName } from "./record-number";
import type { AnomalyReportFormData } from "./types";

export const ANOMALY_REPORT_EXCEL_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function getAnomalyReportFileName(recordNumber: string): string {
  return sanitizeFileName(`Informe_Anomalia_${recordNumber}.xlsx`);
}

export function createAnomalyReportExcelFile(
  data: AnomalyReportFormData,
): File {
  const workbook = buildAnomalyReportWorkbook(data);
  const buffer = workbookToArrayBuffer(workbook);
  const fileName = getAnomalyReportFileName(data.recordNumber);
  return new File([buffer], fileName, {
    type: ANOMALY_REPORT_EXCEL_MIME_TYPE,
  });
}

export function downloadAnomalyReportExcelFile(
  data: AnomalyReportFormData,
): void {
  if (typeof document === "undefined") {
    throw new Error("Download indisponível fora do navegador.");
  }
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
}

export function exportAnomalyReportToExcel(data: AnomalyReportFormData): void {
  downloadAnomalyReportExcelFile(data);
}
