"use client";

import { ChoiceCard, FieldError, SectionCard } from "./ui";
import type { PeopleAnswer } from "@/lib/informe-anomalias/types";
import { PEOPLE_ANSWER_LABELS } from "@/lib/informe-anomalias/types";

const OPTIONS: PeopleAnswer[] = [
  "houve_lesao",
  "nao_houve_lesao",
  "ocorrencia_saude",
];

export function PeopleImpactQuestion({
  value,
  onChange,
  error,
  title = "Consequência para a pessoa",
}: {
  value: PeopleAnswer | null;
  onChange: (value: PeopleAnswer) => void;
  error?: string;
  title?: string;
}) {
  return (
    <SectionCard
      id="pessoas-impacto"
      title={title}
      description="Qual foi a consequência para a pessoa?"
    >
      <div className="grid gap-3" role="radiogroup" aria-label="Consequência para a pessoa">
        {OPTIONS.map((option) => (
          <ChoiceCard
            key={option}
            name="peopleAnswer"
            value={option}
            label={PEOPLE_ANSWER_LABELS[option]}
            selected={value === option}
            onSelect={() => onChange(option)}
          />
        ))}
      </div>
      <FieldError message={error} />
    </SectionCard>
  );
}
