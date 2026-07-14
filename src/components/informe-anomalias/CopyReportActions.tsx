"use client";

import { useEffect, useRef, useState } from "react";
import { SecondaryButton } from "./ui";
import { copyReportText } from "@/lib/informe-anomalias/copy-report";
import { buildWhatsAppReportText } from "@/lib/informe-anomalias/report-text";
import type { AnomalyReportFormData } from "@/lib/informe-anomalias/types";

type CopyState = "normal" | "copying" | "copied" | "error";

function CopyIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

const COPIED_RESET_MS = 3000;
const SUCCESS_MESSAGE = "Informe copiado. Agora é só colar no WhatsApp.";
const MANUAL_COPY_MESSAGE =
  "Não foi possível copiar automaticamente. Selecione o texto abaixo e copie manualmente.";

export function CopyReportActions({
  data,
  disabled = false,
}: {
  data: AnomalyReportFormData;
  disabled?: boolean;
}) {
  const reportText = buildWhatsAppReportText(data);
  const [copyState, setCopyState] = useState<CopyState>("normal");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showManualFallback, setShowManualFallback] = useState(false);
  const manualTextRef = useRef<HTMLTextAreaElement>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  function scheduleReset() {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = setTimeout(() => {
      setCopyState("normal");
    }, COPIED_RESET_MS);
  }

  async function handleCopy() {
    if (disabled || copyState === "copying") return;

    setCopyState("copying");
    setStatusMessage(null);
    setShowManualFallback(false);

    const result = await copyReportText(reportText);

    if (result.success) {
      setCopyState("copied");
      setStatusMessage(SUCCESS_MESSAGE);
      scheduleReset();
      return;
    }

    setCopyState("error");
    setStatusMessage(MANUAL_COPY_MESSAGE);
    setShowManualFallback(true);
  }

  function handleSelectText() {
    const element = manualTextRef.current;
    if (!element) return;
    element.focus();
    element.select();
    element.setSelectionRange(0, element.value.length);
  }

  const buttonLabel =
    copyState === "copying"
      ? "Copiando…"
      : copyState === "copied"
        ? "Texto copiado"
        : "Copiar texto do informe";

  const isBusy = copyState === "copying";

  return (
    <section
      id="copiar-informe"
      className="w-full space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-labelledby="copiar-informe-title"
    >
      <div>
        <h2
          id="copiar-informe-title"
          className="text-base font-semibold text-slate-900"
        >
          Copiar informe
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Copie o informe completo e cole diretamente no WhatsApp, e-mail ou
          outro aplicativo.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Confira os dados antes de copiar. O informe pode conter informações
          pessoais e operacionais.
        </p>
      </div>

      <SecondaryButton
        className="inline-flex w-full items-center justify-center gap-2 sm:w-auto"
        aria-label="Copiar texto do informe"
        disabled={disabled || isBusy}
        onClick={handleCopy}
      >
        <CopyIcon />
        {buttonLabel}
      </SecondaryButton>

      <div>
        <button
          type="button"
          className="text-sm font-medium text-teal-800 underline-offset-2 hover:underline"
          aria-expanded={showPreview}
          aria-controls="visualizar-texto-painel"
          onClick={() => setShowPreview((current) => !current)}
        >
          {showPreview ? "Ocultar texto" : "Visualizar texto"}
        </button>
      </div>

      {showPreview ? (
        <div
          id="visualizar-texto-painel"
          className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
        >
          <pre className="max-h-80 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-slate-800">
            {reportText}
          </pre>
          <SecondaryButton
            className="w-full sm:w-auto"
            aria-label="Copiar novamente"
            disabled={disabled || isBusy}
            onClick={handleCopy}
          >
            Copiar novamente
          </SecondaryButton>
        </div>
      ) : null}

      {statusMessage ? (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            copyState === "error"
              ? "border-amber-200 bg-amber-50 text-amber-950"
              : "border-teal-200 bg-teal-50 text-teal-950"
          }`}
          role="status"
        >
          {statusMessage}
        </p>
      ) : null}

      {showManualFallback ? (
        <div className="space-y-2">
          <textarea
            ref={manualTextRef}
            readOnly
            aria-label="Texto do informe para cópia manual"
            className="min-h-48 w-full resize-none rounded-lg border border-slate-300 bg-white p-3 font-sans text-sm leading-relaxed text-slate-800"
            value={reportText}
          />
          <SecondaryButton
            className="w-full sm:w-auto"
            aria-label="Selecionar texto"
            onClick={handleSelectText}
          >
            Selecionar texto
          </SecondaryButton>
        </div>
      ) : null}
    </section>
  );
}
