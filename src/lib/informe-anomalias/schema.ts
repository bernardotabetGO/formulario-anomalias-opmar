import { z } from "zod";
import {
  calculateClassifications,
  getSelectedImpacts,
  hasEnvironmentalAccident,
} from "./classification";
import { parseOptionalNumber } from "./number-normalization";
import type { ImpactType } from "./types";

const impactTypeSchema = z.enum(["pessoas", "material", "meio_ambiente"]);
const peopleAnswerSchema = z.enum([
  "houve_lesao",
  "nao_houve_lesao",
  "ocorrencia_saude",
]);
const yesNoSchema = z.enum(["sim", "nao"]);
const occurrenceClassificationSchema = z.enum([
  "Acidente pessoal",
  "Incidente",
  "Ocorrência de Saúde",
  "Acidente com dano ao patrimônio",
  "Acidente ambiental",
  "Incidente ambiental",
]);

const fdsMetadataSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number().nonnegative(),
});

function todayLocalIsoDate(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const anomalyReportSchema = z
  .object({
    recordNumber: z.string().min(1, "Número de registro é obrigatório."),
    createdAt: z.string().min(1),
    communicationTime: z.string().min(1),
    primaryImpact: impactTypeSchema.nullable(),
    hasAdditionalImpacts: yesNoSchema.nullable(),
    additionalImpacts: z.array(impactTypeSchema),
    peopleAnswer: peopleAnswerSchema.nullable(),
    materialAnswer: yesNoSchema.nullable(),
    environmentAnswer: yesNoSchema.nullable(),
    classifications: z.array(occurrenceClassificationSchema),
    occurrenceDate: z.string(),
    occurrenceTime: z.string(),
    informant: z.string(),
    informantRole: z.string(),
    location: z.string(),
    latitude: z.string(),
    longitude: z.string(),
    company: z.string(),
    management: z.string(),
    occurrenceDescription: z.string(),
    immediateActions: z.string(),
    firstAid: z.boolean(),
    externalMedicalCare: z.boolean(),
    spillEndTime: z.string(),
    uncontainedVolume: z.string(),
    containedVolume: z.string(),
    spilledProduct: z.string(),
    fdsMetadata: fdsMetadataSchema.nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.primaryImpact) {
      ctx.addIssue({
        code: "custom",
        path: ["primaryImpact"],
        message: "Selecione o impacto principal.",
      });
      return;
    }

    const selected = getSelectedImpacts(
      data.primaryImpact,
      data.additionalImpacts,
    );

    if (selected.includes("pessoas") && !data.peopleAnswer) {
      ctx.addIssue({
        code: "custom",
        path: ["peopleAnswer"],
        message: "Informe a consequência para a pessoa.",
      });
    }

    if (selected.includes("material") && !data.materialAnswer) {
      ctx.addIssue({
        code: "custom",
        path: ["materialAnswer"],
        message: "Informe se houve danos ou prejuízos ao material.",
      });
    }

    if (selected.includes("meio_ambiente") && !data.environmentAnswer) {
      ctx.addIssue({
        code: "custom",
        path: ["environmentAnswer"],
        message: "Informe se houve vazamento na água.",
      });
    }

    if (data.hasAdditionalImpacts === null) {
      ctx.addIssue({
        code: "custom",
        path: ["hasAdditionalImpacts"],
        message: "Informe se houve outro tipo de impacto.",
      });
    }

    if (
      data.hasAdditionalImpacts === "sim" &&
      data.additionalImpacts.filter((i) => i !== data.primaryImpact).length === 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["additionalImpacts"],
        message: "Selecione ao menos um impacto adicional.",
      });
    }

    const classifications = calculateClassifications(data);

    if (!data.occurrenceDate.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["occurrenceDate"],
        message: "A data da ocorrência é obrigatória.",
      });
    } else if (data.occurrenceDate > todayLocalIsoDate()) {
      ctx.addIssue({
        code: "custom",
        path: ["occurrenceDate"],
        message: "A data da ocorrência não pode estar no futuro.",
      });
    }

    if (!data.occurrenceTime.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["occurrenceTime"],
        message: "A hora da ocorrência é obrigatória.",
      });
    }

    if (!data.informant.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["informant"],
        message: "O informante é obrigatório.",
      });
    }

    if (!data.informantRole.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["informantRole"],
        message: "A função do informante é obrigatória.",
      });
    }

    if (!data.location.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["location"],
        message: "O local é obrigatório.",
      });
    }

    if (!data.company.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["company"],
        message: "A empresa é obrigatória.",
      });
    }

    if (!data.management.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["management"],
        message: "A gerência envolvida é obrigatória.",
      });
    }

    const latRaw = data.latitude.trim();
    const lngRaw = data.longitude.trim();
    const lat = parseOptionalNumber(latRaw);
    const lng = parseOptionalNumber(lngRaw);

    if ((latRaw && !lngRaw) || (!latRaw && lngRaw)) {
      ctx.addIssue({
        code: "custom",
        path: latRaw ? ["longitude"] : ["latitude"],
        message: "Informe latitude e longitude em conjunto.",
      });
    }

    if (latRaw) {
      if (lat === null) {
        ctx.addIssue({
          code: "custom",
          path: ["latitude"],
          message: "Latitude inválida.",
        });
      } else if (lat < -90 || lat > 90) {
        ctx.addIssue({
          code: "custom",
          path: ["latitude"],
          message: "Latitude deve estar entre -90 e 90.",
        });
      }
    }

    if (lngRaw) {
      if (lng === null) {
        ctx.addIssue({
          code: "custom",
          path: ["longitude"],
          message: "Longitude inválida.",
        });
      } else if (lng < -180 || lng > 180) {
        ctx.addIssue({
          code: "custom",
          path: ["longitude"],
          message: "Longitude deve estar entre -180 e 180.",
        });
      }
    }

    if (!data.occurrenceDescription.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["occurrenceDescription"],
        message: "A descrição da ocorrência é obrigatória.",
      });
    }

    if (!data.immediateActions.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["immediateActions"],
        message: "As ações imediatas são obrigatórias.",
      });
    }

    if (hasEnvironmentalAccident(classifications)) {
      if (!data.spillEndTime.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["spillEndTime"],
          message: "A hora do fim do vazamento é obrigatória.",
        });
      }

      const uncontained = parseOptionalNumber(data.uncontainedVolume);
      if (!data.uncontainedVolume.trim() || uncontained === null) {
        ctx.addIssue({
          code: "custom",
          path: ["uncontainedVolume"],
          message: "Informe o volume estimado não contido.",
        });
      } else if (uncontained < 0) {
        ctx.addIssue({
          code: "custom",
          path: ["uncontainedVolume"],
          message: "O volume não contido deve ser maior ou igual a zero.",
        });
      }

      const contained = parseOptionalNumber(data.containedVolume);
      if (!data.containedVolume.trim() || contained === null) {
        ctx.addIssue({
          code: "custom",
          path: ["containedVolume"],
          message: "Informe o volume estimado contido.",
        });
      } else if (contained < 0) {
        ctx.addIssue({
          code: "custom",
          path: ["containedVolume"],
          message: "O volume contido deve ser maior ou igual a zero.",
        });
      }

      if (!data.spilledProduct.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["spilledProduct"],
          message: "O produto vazado é obrigatório.",
        });
      }
    }

    // Campos de atendimento pessoal são opcionais quando aplicáveis.
  });

export type AnomalyReportSchema = z.infer<typeof anomalyReportSchema>;

export function getAvailableAdditionalImpacts(
  primaryImpact: ImpactType | null,
): ImpactType[] {
  if (!primaryImpact) return [];
  return (["pessoas", "material", "meio_ambiente"] as ImpactType[]).filter(
    (impact) => impact !== primaryImpact,
  );
}
