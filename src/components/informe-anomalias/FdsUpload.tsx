"use client";

import { useRef, useState } from "react";
import { PrimaryButton, SecondaryButton, SectionCard } from "./ui";
import { formatFileSize } from "@/lib/informe-anomalias/number-normalization";
import type { FdsMetadata } from "@/lib/informe-anomalias/types";

const ACCEPTED = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];
const ACCEPTED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];
const MAX_BYTES = 10 * 1024 * 1024;

export function FdsUpload({
  metadata,
  onChange,
  needsReselectHint,
}: {
  metadata: FdsMetadata | null;
  onChange: (metadata: FdsMetadata | null, file: File | null) => void;
  needsReselectHint?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File | null) {
    setError(null);
    if (!file) {
      onChange(null, null);
      return;
    }

    const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
    const typeOk =
      ACCEPTED.includes(file.type) || ACCEPTED_EXTENSIONS.includes(extension);
    if (!typeOk) {
      setError("Formato inválido. Aceitos: PDF, JPG, JPEG ou PNG.");
      onChange(null, null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (file.size > MAX_BYTES) {
      setError("O arquivo excede o limite de 10 MB.");
      onChange(null, null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    onChange(
      {
        name: file.name,
        type: file.type || extension,
        size: file.size,
      },
      file,
    );
  }

  return (
    <SectionCard
      id="fds"
      title="Ficha de Dados de Segurança — FDS"
      description="Anexo opcional. A planilha exportada registra apenas nome, tipo e tamanho do arquivo."
    >
      {needsReselectHint ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950" role="status">
          O rascunho foi restaurado. Se havia um anexo FDS, selecione o arquivo novamente.
        </p>
      ) : null}

      <div className="space-y-3">
        <label htmlFor="fds-file" className="block text-sm font-medium text-slate-800">
          Anexar FDS
        </label>
        <input
          ref={inputRef}
          id="fds-file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-teal-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
        />
        {error ? (
          <p className="text-sm text-red-800" role="alert">
            <span className="font-medium">Erro:</span> {error}
          </p>
        ) : null}
        {metadata ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
            <p>
              <span className="font-medium">Nome:</span> {metadata.name}
            </p>
            <p>
              <span className="font-medium">Tipo:</span> {metadata.type}
            </p>
            <p>
              <span className="font-medium">Tamanho:</span>{" "}
              {formatFileSize(metadata.size)}
            </p>
            <div className="mt-3">
              <SecondaryButton
                onClick={() => {
                  handleFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                Remover arquivo
              </SecondaryButton>
            </div>
          </div>
        ) : (
          <PrimaryButton onClick={() => inputRef.current?.click()}>
            Selecionar arquivo
          </PrimaryButton>
        )}
        <p className="text-sm text-slate-600">
          Observação: o Excel incluirá os dados do anexo, mas não incorporará o
          arquivo binário.
        </p>
      </div>
    </SectionCard>
  );
}
