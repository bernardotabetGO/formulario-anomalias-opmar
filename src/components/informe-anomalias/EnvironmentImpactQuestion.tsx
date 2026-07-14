"use client";

import { ChoiceCard, FieldError, SectionCard } from "./ui";
import type { EnvironmentAnswer } from "@/lib/informe-anomalias/types";
import { ENVIRONMENT_ANSWER_LABELS } from "@/lib/informe-anomalias/types";

const OPTIONS: EnvironmentAnswer[] = ["sim", "nao"];

export function EnvironmentImpactQuestion({
  value,
  onChange,
  error,
}: {
  value: EnvironmentAnswer | null;
  onChange: (value: EnvironmentAnswer) => void;
  error?: string;
}) {
  return (
    <SectionCard
      id="meio-ambiente-impacto"
      title="Impacto ao meio ambiente"
      description="Houve vazamento na água?"
    >
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Vazamento na água">
        {OPTIONS.map((option) => (
          <ChoiceCard
            key={option}
            name="environmentAnswer"
            value={option}
            label={ENVIRONMENT_ANSWER_LABELS[option]}
            selected={value === option}
            onSelect={() => onChange(option)}
          />
        ))}
      </div>
      <FieldError message={error} />
    </SectionCard>
  );
}
