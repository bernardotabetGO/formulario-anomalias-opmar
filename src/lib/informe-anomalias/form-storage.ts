import type { AnomalyReportFormData } from "./types";
import { DRAFT_STORAGE_KEY } from "./types";
import { generateRecordNumber } from "./record-number";

export function createEmptyFormData(): AnomalyReportFormData {
  const now = new Date();
  return {
    recordNumber: generateRecordNumber(now),
    createdAt: now.toISOString(),
    communicationTime: now.toISOString(),
    primaryImpact: null,
    hasAdditionalImpacts: null,
    additionalImpacts: [],
    peopleAnswer: null,
    materialAnswer: null,
    environmentAnswer: null,
    classifications: [],
    occurrenceDate: "",
    occurrenceTime: "",
    informant: "",
    informantRole: "",
    location: "",
    latitude: "",
    longitude: "",
    company: "",
    management: "",
    occurrenceDescription: "",
    immediateActions: "",
    firstAid: false,
    externalMedicalCare: false,
    spillEndTime: "",
    uncontainedVolume: "",
    containedVolume: "",
    spilledProduct: "",
    fdsMetadata: null,
  };
}

/** Campos persistidos no rascunho (sem arquivo FDS). */
export type DraftPayload = Omit<AnomalyReportFormData, "fdsMetadata"> & {
  fdsMetadata: null;
  hadFdsAttachment?: boolean;
};

export function toDraftPayload(data: AnomalyReportFormData): DraftPayload {
  return {
    ...data,
    fdsMetadata: null,
    hadFdsAttachment: Boolean(data.fdsMetadata),
  };
}

export function saveDraft(data: AnomalyReportFormData): void {
  if (typeof window === "undefined") return;
  const payload = toDraftPayload(data);
  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
}

export function loadDraft(): DraftPayload | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DraftPayload;
    if (!parsed?.recordNumber || !parsed?.createdAt) return null;
    return {
      ...parsed,
      fdsMetadata: null,
    };
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_STORAGE_KEY);
}

export function draftToFormData(draft: DraftPayload): AnomalyReportFormData {
  return {
    ...createEmptyFormData(),
    recordNumber: draft.recordNumber,
    createdAt: draft.createdAt,
    communicationTime: draft.communicationTime,
    primaryImpact: draft.primaryImpact,
    hasAdditionalImpacts: draft.hasAdditionalImpacts,
    additionalImpacts: draft.additionalImpacts ?? [],
    peopleAnswer: draft.peopleAnswer,
    materialAnswer: draft.materialAnswer,
    environmentAnswer: draft.environmentAnswer,
    classifications: draft.classifications ?? [],
    occurrenceDate: draft.occurrenceDate ?? "",
    occurrenceTime: draft.occurrenceTime ?? "",
    informant: draft.informant ?? "",
    informantRole: draft.informantRole ?? "",
    location: draft.location ?? "",
    latitude: draft.latitude ?? "",
    longitude: draft.longitude ?? "",
    company: draft.company ?? "",
    management: draft.management ?? "",
    occurrenceDescription: draft.occurrenceDescription ?? "",
    immediateActions: draft.immediateActions ?? "",
    firstAid: Boolean(draft.firstAid),
    externalMedicalCare: Boolean(draft.externalMedicalCare),
    spillEndTime: draft.spillEndTime ?? "",
    uncontainedVolume: draft.uncontainedVolume ?? "",
    containedVolume: draft.containedVolume ?? "",
    spilledProduct: draft.spilledProduct ?? "",
    fdsMetadata: null,
  };
}
