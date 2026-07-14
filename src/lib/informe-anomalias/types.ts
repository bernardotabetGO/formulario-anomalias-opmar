export type ImpactType = "pessoas" | "material" | "meio_ambiente";

export type PeopleAnswer =
  | "houve_lesao"
  | "nao_houve_lesao"
  | "ocorrencia_saude";

export type MaterialAnswer = "sim" | "nao";

export type EnvironmentAnswer = "sim" | "nao";

export type OccurrenceClassification =
  | "Acidente pessoal"
  | "Incidente"
  | "Ocorrência de Saúde"
  | "Acidente com dano ao patrimônio"
  | "Acidente ambiental"
  | "Incidente ambiental";

export interface FdsMetadata {
  name: string;
  type: string;
  size: number;
}

export interface AnomalyReportFormData {
  recordNumber: string;
  createdAt: string;
  communicationTime: string;
  primaryImpact: ImpactType | null;
  hasAdditionalImpacts: "sim" | "nao" | null;
  additionalImpacts: ImpactType[];
  peopleAnswer: PeopleAnswer | null;
  materialAnswer: MaterialAnswer | null;
  environmentAnswer: EnvironmentAnswer | null;
  classifications: OccurrenceClassification[];
  occurrenceDate: string;
  occurrenceTime: string;
  informant: string;
  informantRole: string;
  location: string;
  latitude: string;
  longitude: string;
  company: string;
  management: string;
  occurrenceDescription: string;
  immediateActions: string;
  firstAid: boolean;
  externalMedicalCare: boolean;
  spillEndTime: string;
  uncontainedVolume: string;
  containedVolume: string;
  spilledProduct: string;
  fdsMetadata: FdsMetadata | null;
}

export const IMPACT_LABELS: Record<ImpactType, string> = {
  pessoas: "Pessoas",
  material: "Material",
  meio_ambiente: "Meio Ambiente",
};

export const PEOPLE_ANSWER_LABELS: Record<PeopleAnswer, string> = {
  houve_lesao: "Houve lesão",
  nao_houve_lesao: "Não houve lesão; foi um incidente",
  ocorrencia_saude: "Trata-se de uma ocorrência de saúde",
};

export const MATERIAL_ANSWER_LABELS: Record<MaterialAnswer, string> = {
  sim: "Sim",
  nao: "Não",
};

export const ENVIRONMENT_ANSWER_LABELS: Record<EnvironmentAnswer, string> = {
  sim: "Sim",
  nao: "Não",
};

export const IMPACT_QUESTIONS: Record<ImpactType, string> = {
  pessoas: "Qual foi a consequência para a pessoa?",
  material: "Houve danos ou prejuízos à estrutura ou aos equipamentos?",
  meio_ambiente: "Houve vazamento na água?",
};

export const DRAFT_STORAGE_KEY = "opmar-informe-anomalias-draft-v1";
