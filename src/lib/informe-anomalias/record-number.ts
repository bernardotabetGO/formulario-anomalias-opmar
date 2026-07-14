/**
 * Gera número de registro no formato OPMAR-AAAAMMDD-HHMMSS-XXXXXXXX
 */
export function generateRecordNumber(date = new Date()): string {
  const pad = (value: number, size = 2) => String(value).padStart(size, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const uuid = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `OPMAR-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${uuid}`;
}

export function formatCommunicationTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatBrazilianDate(isoOrDate: string): string {
  if (!isoOrDate) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDate)) {
    const [year, month, day] = isoOrDate.split("-");
    return `${day}/${month}/${year}`;
  }
  const date = new Date(isoOrDate);
  if (Number.isNaN(date.getTime())) return isoOrDate;
  return date.toLocaleDateString("pt-BR");
}

export function formatBrazilianDateTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-BR", { hour12: false });
}

export function sanitizeFileName(value: string): string {
  return value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_");
}
