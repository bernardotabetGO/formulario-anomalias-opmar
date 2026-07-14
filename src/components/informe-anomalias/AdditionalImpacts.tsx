"use client";

import { ChoiceCard, FieldError, SectionCard } from "./ui";
import type { ImpactType } from "@/lib/informe-anomalias/types";
import { IMPACT_LABELS } from "@/lib/informe-anomalias/types";

export function AdditionalImpacts({
  hasAdditional,
  onHasAdditionalChange,
  availableImpacts,
  selectedImpacts,
  onToggleImpact,
  hasAdditionalError,
  additionalError,
}: {
  hasAdditional: "sim" | "nao" | null;
  onHasAdditionalChange: (value: "sim" | "nao") => void;
  availableImpacts: ImpactType[];
  selectedImpacts: ImpactType[];
  onToggleImpact: (impact: ImpactType) => void;
  hasAdditionalError?: string;
  additionalError?: string;
}) {
  return (
    <SectionCard
      id="outros-impactos"
      title="Outros impactos"
      description="A anomalia causou outro tipo de impacto?"
    >
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Outro tipo de impacto">
        <ChoiceCard
          name="hasAdditionalImpacts"
          value="sim"
          label="Sim"
          selected={hasAdditional === "sim"}
          onSelect={() => onHasAdditionalChange("sim")}
        />
        <ChoiceCard
          name="hasAdditionalImpacts"
          value="nao"
          label="Não"
          selected={hasAdditional === "nao"}
          onSelect={() => onHasAdditionalChange("nao")}
        />
      </div>
      <FieldError message={hasAdditionalError} />

      {hasAdditional === "sim" ? (
        <div className="space-y-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-800">
            Selecione os impactos adicionais (um ou mais):
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {availableImpacts.map((impact) => {
              const checked = selectedImpacts.includes(impact);
              return (
                <label
                  key={impact}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-teal-700 ${
                    checked
                      ? "border-teal-700 bg-teal-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-teal-700"
                    checked={checked}
                    onChange={() => onToggleImpact(impact)}
                  />
                  <span className="font-medium text-slate-900">
                    {checked ? "✓ " : ""}
                    {IMPACT_LABELS[impact]}
                  </span>
                </label>
              );
            })}
          </div>
          <FieldError message={additionalError} />
        </div>
      ) : null}
    </SectionCard>
  );
}
