"use client";

import { FormInput, SectionCard } from "./ui";
import { normalizeDecimalInput } from "@/lib/informe-anomalias/number-normalization";

export function EnvironmentalAccidentFields({
  spillEndTime,
  uncontainedVolume,
  containedVolume,
  spilledProduct,
  errors,
  onChange,
}: {
  spillEndTime: string;
  uncontainedVolume: string;
  containedVolume: string;
  spilledProduct: string;
  errors: Partial<Record<string, string>>;
  onChange: (field: string, value: string) => void;
}) {
  return (
    <SectionCard id="dados-vazamento" title="Dados do vazamento">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          id="spillEndTime"
          label="Hora do fim do vazamento"
          type="time"
          step={1}
          required
          value={spillEndTime}
          error={errors.spillEndTime}
          onChange={(event) => onChange("spillEndTime", event.target.value)}
        />
        <FormInput
          id="spilledProduct"
          label="Produto vazado"
          required
          value={spilledProduct}
          error={errors.spilledProduct}
          onChange={(event) => onChange("spilledProduct", event.target.value)}
        />
        <FormInput
          id="uncontainedVolume"
          label="Volume estimado não contido (m³)"
          required
          value={uncontainedVolume}
          error={errors.uncontainedVolume}
          hint="Unidade: m³. Aceita vírgula ou ponto."
          onChange={(event) =>
            onChange(
              "uncontainedVolume",
              normalizeDecimalInput(event.target.value),
            )
          }
        />
        <FormInput
          id="containedVolume"
          label="Volume estimado contido (m³)"
          required
          value={containedVolume}
          error={errors.containedVolume}
          hint="Unidade: m³. Aceita vírgula ou ponto."
          onChange={(event) =>
            onChange("containedVolume", normalizeDecimalInput(event.target.value))
          }
        />
      </div>
    </SectionCard>
  );
}
