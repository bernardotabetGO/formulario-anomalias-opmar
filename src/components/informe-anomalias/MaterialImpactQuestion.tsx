"use client";

import { ChoiceCard, FieldError, SectionCard } from "./ui";
import type { MaterialAnswer } from "@/lib/informe-anomalias/types";
import { MATERIAL_ANSWER_LABELS } from "@/lib/informe-anomalias/types";

const OPTIONS: MaterialAnswer[] = ["sim", "nao"];

export function MaterialImpactQuestion({
  value,
  onChange,
  error,
}: {
  value: MaterialAnswer | null;
  onChange: (value: MaterialAnswer) => void;
  error?: string;
}) {
  return (
    <SectionCard
      id="material-impacto"
      title="Impacto material"
      description="Houve danos ou prejuízos à estrutura ou aos equipamentos?"
    >
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Danos materiais">
        {OPTIONS.map((option) => (
          <ChoiceCard
            key={option}
            name="materialAnswer"
            value={option}
            label={MATERIAL_ANSWER_LABELS[option]}
            selected={value === option}
            onSelect={() => onChange(option)}
          />
        ))}
      </div>
      <FieldError message={error} />
    </SectionCard>
  );
}
