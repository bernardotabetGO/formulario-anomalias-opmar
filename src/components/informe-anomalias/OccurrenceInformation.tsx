"use client";

import { FormTextarea, SectionCard } from "./ui";

export function OccurrenceInformation({
  occurrenceDescription,
  immediateActions,
  errors,
  onChange,
}: {
  occurrenceDescription: string;
  immediateActions: string;
  errors: Partial<Record<string, string>>;
  onChange: (field: string, value: string) => void;
}) {
  return (
    <SectionCard
      id="informacoes-ocorrencia"
      title="Informações sobre a ocorrência"
    >
      <FormTextarea
        id="occurrenceDescription"
        label="Descrição da ocorrência"
        required
        value={occurrenceDescription}
        error={errors.occurrenceDescription}
        hint="Descreva objetivamente o que aconteceu, onde aconteceu e quais foram as consequências observadas."
        maxHint={4000}
        onChange={(event) =>
          onChange("occurrenceDescription", event.target.value)
        }
      />
      <FormTextarea
        id="immediateActions"
        label="Ações imediatas"
        required
        value={immediateActions}
        error={errors.immediateActions}
        hint="Informe as medidas tomadas imediatamente após a identificação da ocorrência."
        maxHint={4000}
        onChange={(event) => onChange("immediateActions", event.target.value)}
      />
    </SectionCard>
  );
}
