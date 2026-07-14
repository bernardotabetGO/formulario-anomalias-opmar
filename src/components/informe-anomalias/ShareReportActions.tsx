"use client";

import { useState } from "react";
import { PrimaryButton, SecondaryButton } from "./ui";
import type { AnomalyReportFormData } from "@/lib/informe-anomalias/types";
import {
  getEmailRetryUrl,
  getWhatsAppRetryUrl,
  openExternalUrl,
  shareAnomalyReportViaEmail,
  shareAnomalyReportViaWhatsApp,
} from "@/lib/informe-anomalias/share-export";

function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function EmailIcon() {
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
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

type LoadingChannel = "whatsapp" | "email" | null;

export function ShareReportActions({
  data,
  disabled = false,
}: {
  data: AnomalyReportFormData;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState<LoadingChannel>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<
    "whatsapp" | "email" | null
  >(null);

  function handleWhatsAppShare() {
    if (disabled || loading) return;
    setLoading("whatsapp");
    setStatusMessage(null);
    setSuccessMessage(null);
    setRetryAction(null);

    try {
      shareAnomalyReportViaWhatsApp(data);
      setSuccessMessage("WhatsApp aberto com o resumo do informe.");
    } catch (error) {
      if (error instanceof Error && error.message === "POPUP_BLOCKED") {
        setStatusMessage(
          "Não foi possível abrir o WhatsApp. Permita a abertura de novas abas e tente novamente.",
        );
        setRetryAction("whatsapp");
      } else {
        setStatusMessage("Não foi possível abrir o WhatsApp.");
      }
    } finally {
      setLoading(null);
    }
  }

  function handleEmailShare() {
    if (disabled || loading) return;
    setLoading("email");
    setStatusMessage(null);
    setSuccessMessage(null);
    setRetryAction(null);

    try {
      shareAnomalyReportViaEmail(data);
      setSuccessMessage("Aplicativo de e-mail aberto com o resumo do informe.");
    } catch (error) {
      if (error instanceof Error && error.message === "EMAIL_BLOCKED") {
        setStatusMessage(
          "Não foi possível abrir o aplicativo de e-mail deste dispositivo.",
        );
        setRetryAction("email");
      } else {
        setStatusMessage(
          "Não foi possível abrir o aplicativo de e-mail deste dispositivo.",
        );
      }
    } finally {
      setLoading(null);
    }
  }

  function handleRetry() {
    if (retryAction === "whatsapp") {
      const opened = openExternalUrl(getWhatsAppRetryUrl(data));
      if (opened) {
        setStatusMessage(null);
        setSuccessMessage("WhatsApp aberto com o resumo do informe.");
        setRetryAction(null);
      }
      return;
    }
    if (retryAction === "email") {
      const opened = openExternalUrl(getEmailRetryUrl(data));
      if (opened) {
        setStatusMessage(null);
        setSuccessMessage("Aplicativo de e-mail aberto com o resumo do informe.");
        setRetryAction(null);
      }
    }
  }

  const isBusy = loading !== null;

  return (
    <section
      id="compartilhar-informe"
      className="w-full space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-labelledby="compartilhar-informe-title"
    >
      <div>
        <h2
          id="compartilhar-informe-title"
          className="text-base font-semibold text-slate-900"
        >
          Compartilhar informe
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Confira os dados antes de compartilhar. O informe pode conter
          informações pessoais e operacionais.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Compartilhe um resumo textual completo do informe pelo WhatsApp ou
          e-mail.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SecondaryButton
          className="inline-flex w-full items-center justify-center gap-2"
          aria-label="Compartilhar no WhatsApp"
          disabled={disabled || isBusy}
          onClick={handleWhatsAppShare}
        >
          <WhatsAppIcon />
          {loading === "whatsapp"
            ? "Preparando compartilhamento…"
            : "Compartilhar no WhatsApp"}
        </SecondaryButton>
        <SecondaryButton
          className="inline-flex w-full items-center justify-center gap-2"
          aria-label="Enviar por e-mail"
          disabled={disabled || isBusy}
          onClick={handleEmailShare}
        >
          <EmailIcon />
          {loading === "email"
            ? "Preparando compartilhamento…"
            : "Enviar por e-mail"}
        </SecondaryButton>
      </div>

      {statusMessage ? (
        <p
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
          role="status"
        >
          {statusMessage}
          {retryAction ? (
            <span className="mt-2 block">
              <PrimaryButton
                className="mt-2"
                onClick={handleRetry}
                aria-label={
                  retryAction === "whatsapp"
                    ? "Abrir WhatsApp novamente"
                    : "Abrir e-mail novamente"
                }
              >
                {retryAction === "whatsapp"
                  ? "Abrir WhatsApp novamente"
                  : "Abrir e-mail novamente"}
              </PrimaryButton>
            </span>
          ) : null}
        </p>
      ) : null}

      {successMessage ? (
        <p
          className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-950"
          role="status"
        >
          {successMessage}
        </p>
      ) : null}
    </section>
  );
}
