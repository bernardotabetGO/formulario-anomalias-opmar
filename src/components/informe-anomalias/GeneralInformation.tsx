"use client";

import { useState } from "react";
import { FormInput, PrimaryButton, SecondaryButton, SectionCard } from "./ui";
import { formatCommunicationTime } from "@/lib/informe-anomalias/record-number";
import { normalizeDecimalInput } from "@/lib/informe-anomalias/number-normalization";

export function GeneralInformation({
  recordNumber,
  communicationTime,
  occurrenceDate,
  occurrenceTime,
  informant,
  informantRole,
  location,
  latitude,
  longitude,
  company,
  management,
  errors,
  onChange,
}: {
  recordNumber: string;
  communicationTime: string;
  occurrenceDate: string;
  occurrenceTime: string;
  informant: string;
  informantRole: string;
  location: string;
  latitude: string;
  longitude: string;
  company: string;
  management: string;
  errors: Partial<Record<string, string>>;
  onChange: (field: string, value: string) => void;
}) {
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  function captureLocation() {
    setGeoMessage(null);
    if (!navigator.geolocation) {
      setGeoMessage(
        "A geolocalização não está disponível neste navegador. Informe as coordenadas manualmente.",
      );
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange("latitude", String(position.coords.latitude));
        onChange("longitude", String(position.coords.longitude));
        setGeoMessage("Localização capturada. Você pode editar os valores se necessário.");
        setGeoLoading(false);
      },
      () => {
        setGeoMessage(
          "Não foi possível obter a localização. Verifique a permissão do navegador ou preencha manualmente.",
        );
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <SectionCard
      id="informacoes-gerais"
      title="Informações gerais"
      description="Dados de identificação e localização da ocorrência."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          id="recordNumber"
          label="Número de registro"
          value={recordNumber}
          readOnly
          required
        />
        <FormInput
          id="communicationTime"
          label="Hora da comunicação"
          value={formatCommunicationTime(communicationTime)}
          readOnly
          required
          hint="Registrada automaticamente no início do preenchimento."
        />
        <FormInput
          id="occurrenceDate"
          label="Data da ocorrência"
          type="date"
          value={occurrenceDate}
          required
          max={new Date().toISOString().slice(0, 10)}
          error={errors.occurrenceDate}
          onChange={(event) => onChange("occurrenceDate", event.target.value)}
        />
        <FormInput
          id="occurrenceTime"
          label="Hora da ocorrência"
          type="time"
          step={1}
          value={occurrenceTime}
          required
          error={errors.occurrenceTime}
          onChange={(event) => onChange("occurrenceTime", event.target.value)}
        />
        <FormInput
          id="informant"
          label="Informante"
          value={informant}
          required
          error={errors.informant}
          onChange={(event) => onChange("informant", event.target.value)}
        />
        <FormInput
          id="informantRole"
          label="Função do informante"
          value={informantRole}
          required
          error={errors.informantRole}
          onChange={(event) => onChange("informantRole", event.target.value)}
        />
        <div className="md:col-span-2">
          <FormInput
            id="location"
            label="Local"
            value={location}
            required
            error={errors.location}
            onChange={(event) => onChange("location", event.target.value)}
          />
        </div>
        <FormInput
          id="latitude"
          label="Latitude"
          value={latitude}
          error={errors.latitude}
          hint="Entre -90 e 90. Aceita vírgula ou ponto."
          onChange={(event) =>
            onChange("latitude", normalizeDecimalInput(event.target.value))
          }
        />
        <FormInput
          id="longitude"
          label="Longitude"
          value={longitude}
          error={errors.longitude}
          hint="Entre -180 e 180. Aceita vírgula ou ponto."
          onChange={(event) =>
            onChange("longitude", normalizeDecimalInput(event.target.value))
          }
        />
        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <PrimaryButton onClick={captureLocation} disabled={geoLoading}>
            {geoLoading ? "Capturando..." : "Capturar localização atual"}
          </PrimaryButton>
          <SecondaryButton
            onClick={() => {
              onChange("latitude", "");
              onChange("longitude", "");
              setGeoMessage(null);
            }}
          >
            Limpar coordenadas
          </SecondaryButton>
        </div>
        {geoMessage ? (
          <p className="md:col-span-2 text-sm text-slate-700" role="status">
            {geoMessage}
          </p>
        ) : null}
        <FormInput
          id="company"
          label="Empresa"
          value={company}
          required
          error={errors.company}
          onChange={(event) => onChange("company", event.target.value)}
        />
        <FormInput
          id="management"
          label="Gerência envolvida"
          value={management}
          required
          error={errors.management}
          onChange={(event) => onChange("management", event.target.value)}
        />
      </div>
    </SectionCard>
  );
}
