import type {
  EnvironmentAnswer,
  ImpactType,
  MaterialAnswer,
  OccurrenceClassification,
  PeopleAnswer,
} from "./types";

export interface ClassificationInput {
  primaryImpact: ImpactType | null;
  additionalImpacts: ImpactType[];
  peopleAnswer: PeopleAnswer | null;
  materialAnswer: MaterialAnswer | null;
  environmentAnswer: EnvironmentAnswer | null;
}

function classifyPeople(
  answer: PeopleAnswer | null,
): OccurrenceClassification | null {
  if (answer === "houve_lesao") return "Acidente pessoal";
  if (answer === "nao_houve_lesao") return "Incidente";
  if (answer === "ocorrencia_saude") return "Ocorrência de Saúde";
  return null;
}

function classifyMaterial(
  answer: MaterialAnswer | null,
): OccurrenceClassification | null {
  if (answer === "sim") return "Acidente com dano ao patrimônio";
  if (answer === "nao") return "Incidente";
  return null;
}

function classifyEnvironment(
  answer: EnvironmentAnswer | null,
): OccurrenceClassification | null {
  if (answer === "sim") return "Acidente ambiental";
  if (answer === "nao") return "Incidente ambiental";
  return null;
}

function classificationForImpact(
  impact: ImpactType,
  input: ClassificationInput,
): OccurrenceClassification | null {
  if (impact === "pessoas") return classifyPeople(input.peopleAnswer);
  if (impact === "material") return classifyMaterial(input.materialAnswer);
  return classifyEnvironment(input.environmentAnswer);
}

export function getSelectedImpacts(
  primaryImpact: ImpactType | null,
  additionalImpacts: ImpactType[],
): ImpactType[] {
  if (!primaryImpact) return [];
  const extras = additionalImpacts.filter((impact) => impact !== primaryImpact);
  return [primaryImpact, ...extras];
}

/**
 * Calcula as classificações da ocorrência preservando a ordem do impacto
 * principal e removendo duplicatas.
 */
export function calculateClassifications(
  input: ClassificationInput,
): OccurrenceClassification[] {
  const selected = getSelectedImpacts(
    input.primaryImpact,
    input.additionalImpacts,
  );
  const result: OccurrenceClassification[] = [];

  for (const impact of selected) {
    const classification = classificationForImpact(impact, input);
    if (classification && !result.includes(classification)) {
      result.push(classification);
    }
  }

  return result;
}

export function formatClassifications(
  classifications: OccurrenceClassification[],
): string {
  return classifications.join("; ");
}

export function hasPersonalAccident(
  classifications: OccurrenceClassification[],
): boolean {
  return classifications.includes("Acidente pessoal");
}

export function hasEnvironmentalAccident(
  classifications: OccurrenceClassification[],
): boolean {
  return classifications.includes("Acidente ambiental");
}

export function hasEnvironmentalOccurrence(
  classifications: OccurrenceClassification[],
): boolean {
  return (
    classifications.includes("Acidente ambiental") ||
    classifications.includes("Incidente ambiental")
  );
}
