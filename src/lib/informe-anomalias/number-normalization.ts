/**
 * Normaliza números aceitando vírgula ou ponto como separador decimal.
 */
export function normalizeDecimalInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.replace(",", ".");
}

export function parseOptionalNumber(value: string): number | null {
  const normalized = normalizeDecimalInput(value);
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
