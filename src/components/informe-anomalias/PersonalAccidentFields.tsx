"use client";

import { CheckboxField, SectionCard } from "./ui";

export function PersonalAccidentFields({
  firstAid,
  externalMedicalCare,
  onChange,
}: {
  firstAid: boolean;
  externalMedicalCare: boolean;
  onChange: (field: "firstAid" | "externalMedicalCare", value: boolean) => void;
}) {
  return (
    <SectionCard id="atendimento-pessoa" title="Atendimento à pessoa">
      <div className="space-y-3">
        <CheckboxField
          name="firstAid"
          label="Primeiros socorros"
          checked={firstAid}
          onChange={(checked) => onChange("firstAid", checked)}
        />
        <CheckboxField
          name="externalMedicalCare"
          label="Deslocamento para atendimento médico externo"
          checked={externalMedicalCare}
          onChange={(checked) => onChange("externalMedicalCare", checked)}
        />
      </div>
    </SectionCard>
  );
}
