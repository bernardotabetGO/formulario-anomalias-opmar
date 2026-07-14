"use client";

import { ChoiceCard, FieldError, SectionCard } from "./ui";
import type { ImpactType } from "@/lib/informe-anomalias/types";
import { IMPACT_LABELS } from "@/lib/informe-anomalias/types";

const OPTIONS: ImpactType[] = ["pessoas", "material", "meio_ambiente"];

export function ImpactSelection({
  value,
  onChange,
  error,
}: {
  value: ImpactType | null;
  onChange: (value: ImpactType) => void;
  error?: string;
}) {
  return (
    <SectionCard
      id="impacto-principal"
      title="Impacto principal"
      description="A anomalia trouxe impacto a quê?"
    >
      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Impacto principal">
        {OPTIONS.map((option) => (
          <ChoiceCard
            key={option}
            name="primaryImpact"
            value={option}
            label={IMPACT_LABELS[option]}
            selected={value === option}
            onSelect={() => onChange(option)}
          />
        ))}
      </div>
      <FieldError message={error} />
    </SectionCard>
  );
}
