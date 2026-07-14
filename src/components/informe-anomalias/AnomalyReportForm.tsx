"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { AdditionalImpacts } from "./AdditionalImpacts";
import { ClassificationSummary } from "./ClassificationSummary";
import { EnvironmentalAccidentFields } from "./EnvironmentalAccidentFields";
import { EnvironmentImpactQuestion } from "./EnvironmentImpactQuestion";
import { FdsUpload } from "./FdsUpload";
import { FormProgress } from "./FormProgress";
import { GeneralInformation } from "./GeneralInformation";
import { ImpactSelection } from "./ImpactSelection";
import { MaterialImpactQuestion } from "./MaterialImpactQuestion";
import { OccurrenceInformation } from "./OccurrenceInformation";
import { PeopleImpactQuestion } from "./PeopleImpactQuestion";
import { PersonalAccidentFields } from "./PersonalAccidentFields";
import { ReportReview } from "./ReportReview";
import { ShareReportActions } from "./ShareReportActions";
import { PrimaryButton, SecondaryButton } from "./ui";
import {
  calculateClassifications,
  getSelectedImpacts,
  hasEnvironmentalAccident,
  hasEnvironmentalOccurrence,
  hasPersonalAccident,
} from "@/lib/informe-anomalias/classification";
import { exportAnomalyReportToExcel } from "@/lib/informe-anomalias/excel-file";
import {
  clearDraft,
  createEmptyFormData,
  draftToFormData,
  loadDraft,
  saveDraft,
  type DraftPayload,
} from "@/lib/informe-anomalias/form-storage";
import {
  anomalyReportSchema,
  getAvailableAdditionalImpacts,
} from "@/lib/informe-anomalias/schema";
import { IMPACT_LABELS } from "@/lib/informe-anomalias/types";
import type {
  AnomalyReportFormData,
  ImpactType,
} from "@/lib/informe-anomalias/types";

type Step = 0 | 1 | 2 | 3 | 4;

function fieldErrorMessage(
  errors: Record<string, { message?: string } | undefined>,
  field: string,
): string | undefined {
  return errors[field]?.message;
}

function scrollToField(field?: string) {
  if (!field) return;
  const el =
    document.getElementById(field) ||
    document.querySelector(`[name="${field}"]`) ||
    document.getElementById(
      field
        .replace(/([A-Z])/g, "-$1")
        .toLowerCase()
        .replace(/^-/, ""),
    );
  if (el && "scrollIntoView" in el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if ("focus" in el && typeof el.focus === "function") {
      try {
        (el as HTMLElement).focus({ preventScroll: true });
      } catch {
        // ignore
      }
    }
  }
}

export function AnomalyReportForm() {
  const [ready, setReady] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<DraftPayload | null>(null);
  const [step, setStep] = useState<Step>(0);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [fdsNeedsReselect, setFdsNeedsReselect] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<AnomalyReportFormData>({
    resolver: zodResolver(anomalyReportSchema) as never,
    defaultValues: createEmptyFormData(),
    mode: "onChange",
  });

  const {
    control,
    setValue,
    getValues,
    reset,
    trigger,
    formState: { errors },
  } = form;

  const values = (useWatch({ control }) ?? getValues()) as AnomalyReportFormData;

  useEffect(() => {
    // Hidratação a partir do localStorage (somente no cliente).
    const draft = loadDraft();
    if (draft) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- bootstrap do rascunho no mount
      setPendingDraft(draft);
    } else {
      reset(createEmptyFormData());
      setReady(true);
    }
  }, [reset]);

  const classifications = useMemo(
    () =>
      calculateClassifications({
        primaryImpact: values.primaryImpact,
        additionalImpacts: values.additionalImpacts ?? [],
        peopleAnswer: values.peopleAnswer,
        materialAnswer: values.materialAnswer,
        environmentAnswer: values.environmentAnswer,
      }),
    [
      values.primaryImpact,
      values.additionalImpacts,
      values.peopleAnswer,
      values.materialAnswer,
      values.environmentAnswer,
    ],
  );

  useEffect(() => {
    const current = getValues("classifications");
    const same =
      current.length === classifications.length &&
      current.every((item, index) => item === classifications[index]);
    if (!same) {
      setValue("classifications", classifications, { shouldValidate: false });
    }
  }, [classifications, getValues, setValue]);

  const selectedImpacts = useMemo(
    () =>
      getSelectedImpacts(
        values.primaryImpact,
        values.additionalImpacts ?? [],
      ),
    [values.primaryImpact, values.additionalImpacts],
  );

  const showPersonal = hasPersonalAccident(classifications);
  const showEnvAccident = hasEnvironmentalAccident(classifications);
  const showFds = hasEnvironmentalOccurrence(classifications);

  useEffect(() => {
    if (!showPersonal) {
      if (getValues("firstAid")) setValue("firstAid", false);
      if (getValues("externalMedicalCare"))
        setValue("externalMedicalCare", false);
    }
  }, [showPersonal, getValues, setValue]);

  useEffect(() => {
    if (!showEnvAccident) {
      if (getValues("spillEndTime")) setValue("spillEndTime", "");
      if (getValues("uncontainedVolume")) setValue("uncontainedVolume", "");
      if (getValues("containedVolume")) setValue("containedVolume", "");
      if (getValues("spilledProduct")) setValue("spilledProduct", "");
    }
  }, [showEnvAccident, getValues, setValue]);

  useEffect(() => {
    if (!showFds) {
      if (getValues("fdsMetadata")) setValue("fdsMetadata", null);
    }
  }, [showFds, getValues, setValue]);

  // Clear answers for impacts no longer selected
  useEffect(() => {
    if (!selectedImpacts.includes("pessoas") && getValues("peopleAnswer")) {
      setValue("peopleAnswer", null);
    }
    if (!selectedImpacts.includes("material") && getValues("materialAnswer")) {
      setValue("materialAnswer", null);
    }
    if (
      !selectedImpacts.includes("meio_ambiente") &&
      getValues("environmentAnswer")
    ) {
      setValue("environmentAnswer", null);
    }
  }, [selectedImpacts, getValues, setValue]);

  const persistDraft = useCallback(() => {
    if (!ready) return;
    saveDraft(getValues());
    setDraftSavedAt(new Date().toLocaleTimeString("pt-BR"));
  }, [getValues, ready]);

  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      persistDraft();
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [values, ready, persistDraft]);

  const primaryClassified = Boolean(
    values.primaryImpact &&
      ((values.primaryImpact === "pessoas" && values.peopleAnswer) ||
        (values.primaryImpact === "material" && values.materialAnswer) ||
        (values.primaryImpact === "meio_ambiente" && values.environmentAnswer)),
  );

  const additionalResolved =
    values.hasAdditionalImpacts === "nao" ||
    (values.hasAdditionalImpacts === "sim" &&
      (values.additionalImpacts?.length ?? 0) > 0 &&
      (values.additionalImpacts ?? []).every((impact) => {
        if (impact === "pessoas") return Boolean(values.peopleAnswer);
        if (impact === "material") return Boolean(values.materialAnswer);
        return Boolean(values.environmentAnswer);
      }));

  const canShowAdditional = primaryClassified;
  const canShowGeneral = canShowAdditional && additionalResolved;
  const canShowOccurrence = canShowGeneral;

  const progressPercent = useMemo(() => {
    let score = 0;
    if (values.primaryImpact) score += 15;
    if (primaryClassified) score += 15;
    if (values.hasAdditionalImpacts !== null) score += 10;
    if (additionalResolved) score += 10;
    if (values.occurrenceDate && values.occurrenceTime) score += 10;
    if (values.informant && values.informantRole) score += 10;
    if (values.location && values.company && values.management) score += 10;
    if (values.occurrenceDescription && values.immediateActions) score += 15;
    if (step === 4) score += 5;
    return Math.min(100, score);
  }, [
    values.primaryImpact,
    primaryClassified,
    values.hasAdditionalImpacts,
    additionalResolved,
    values.occurrenceDate,
    values.occurrenceTime,
    values.informant,
    values.informantRole,
    values.location,
    values.company,
    values.management,
    values.occurrenceDescription,
    values.immediateActions,
    step,
  ]);

  function continueDraft() {
    if (!pendingDraft) return;
    const restored = draftToFormData(pendingDraft);
    reset(restored);
    setFdsNeedsReselect(Boolean(pendingDraft.hadFdsAttachment));
    setPendingDraft(null);
    setReady(true);
    setStatusMessage("Rascunho restaurado.");
  }

  function discardDraft() {
    clearDraft();
    reset(createEmptyFormData());
    setPendingDraft(null);
    setFdsNeedsReselect(false);
    setReady(true);
    setStep(0);
    setStatusMessage("Novo informe iniciado.");
  }

  function handlePrimaryImpact(impact: ImpactType) {
    const previous = getValues("primaryImpact");
    setValue("primaryImpact", impact, { shouldValidate: true });
    if (previous && previous !== impact) {
      // clear previous primary answer if no longer selected as additional
      const additional = getValues("additionalImpacts").filter(
        (item) => item !== impact,
      );
      setValue("additionalImpacts", additional);
      if (previous === "pessoas" && !additional.includes("pessoas")) {
        setValue("peopleAnswer", null);
      }
      if (previous === "material" && !additional.includes("material")) {
        setValue("materialAnswer", null);
      }
      if (
        previous === "meio_ambiente" &&
        !additional.includes("meio_ambiente")
      ) {
        setValue("environmentAnswer", null);
      }
    }
    // Remove new primary from additional impacts
    setValue(
      "additionalImpacts",
      getValues("additionalImpacts").filter((item) => item !== impact),
    );
  }

  function handleHasAdditional(value: "sim" | "nao") {
    setValue("hasAdditionalImpacts", value, { shouldValidate: true });
    if (value === "nao") {
      const primary = getValues("primaryImpact");
      const previous = getValues("additionalImpacts");
      setValue("additionalImpacts", []);
      for (const impact of previous) {
        if (impact === primary) continue;
        if (impact === "pessoas") setValue("peopleAnswer", null);
        if (impact === "material") setValue("materialAnswer", null);
        if (impact === "meio_ambiente") setValue("environmentAnswer", null);
      }
    }
  }

  function toggleAdditionalImpact(impact: ImpactType) {
    const current = getValues("additionalImpacts") ?? [];
    const exists = current.includes(impact);
    const next = exists
      ? current.filter((item) => item !== impact)
      : [...current, impact];
    setValue("additionalImpacts", next, { shouldValidate: true });
    if (exists) {
      if (impact === "pessoas") setValue("peopleAnswer", null);
      if (impact === "material") setValue("materialAnswer", null);
      if (impact === "meio_ambiente") setValue("environmentAnswer", null);
    }
  }

  async function goContinue() {
    setExportSuccess(false);
    setStatusMessage(null);

    if (step === 0) {
      await trigger([
        "primaryImpact",
        "peopleAnswer",
        "materialAnswer",
        "environmentAnswer",
      ]);
      if (!values.primaryImpact) {
        scrollToField("impacto-principal");
        return;
      }
      if (!primaryClassified) {
        if (values.primaryImpact === "pessoas") scrollToField("pessoas-impacto");
        if (values.primaryImpact === "material") scrollToField("material-impacto");
        if (values.primaryImpact === "meio_ambiente") {
          scrollToField("meio-ambiente-impacto");
        }
        return;
      }
      setStep(1);
      return;
    }

    if (step === 1) {
      if (!values.hasAdditionalImpacts) {
        scrollToField("outros-impactos");
        await trigger(["hasAdditionalImpacts"]);
        return;
      }
      if (!additionalResolved) {
        scrollToField("outros-impactos");
        await trigger([
          "additionalImpacts",
          "peopleAnswer",
          "materialAnswer",
          "environmentAnswer",
        ]);
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      const fields = [
        "occurrenceDate",
        "occurrenceTime",
        "informant",
        "informantRole",
        "location",
        "company",
        "management",
        "latitude",
        "longitude",
      ] as const;
      const ok = await trigger([...fields]);
      const latestErrors = form.formState.errors as Record<
        string,
        { message?: string } | undefined
      >;
      if (!ok) {
        const first =
          fields.find((field) => fieldErrorMessage(latestErrors, field)) ??
          fields.find((field) => {
            if (field === "latitude" || field === "longitude") return false;
            const value = getValues(field);
            return !String(value ?? "").trim();
          });
        scrollToField(first ?? "informacoes-gerais");
        return;
      }
      const data = getValues();
      if (
        !data.occurrenceDate ||
        !data.occurrenceTime ||
        !data.informant.trim() ||
        !data.informantRole.trim() ||
        !data.location.trim() ||
        !data.company.trim() ||
        !data.management.trim()
      ) {
        scrollToField("informacoes-gerais");
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      const ok = await trigger();
      if (!ok) {
        const firstError = Object.keys(form.formState.errors)[0];
        scrollToField(firstError);
        setStatusMessage("Há campos inválidos. Corrija antes de revisar.");
        return;
      }
      setStep(4);
    }
  }

  function goBack() {
    setExportSuccess(false);
    setStep((current) => Math.max(0, current - 1) as Step);
  }

  async function handleReview() {
    const ok = await trigger();
    if (!ok) {
      const firstError = Object.keys(form.formState.errors)[0];
      // Determine step for first error
      const impactFields = [
        "primaryImpact",
        "peopleAnswer",
        "materialAnswer",
        "environmentAnswer",
        "hasAdditionalImpacts",
        "additionalImpacts",
      ];
      const generalFields = [
        "occurrenceDate",
        "occurrenceTime",
        "informant",
        "informantRole",
        "location",
        "latitude",
        "longitude",
        "company",
        "management",
      ];
      if (firstError && impactFields.includes(firstError)) {
        setStep(firstError === "hasAdditionalImpacts" || firstError === "additionalImpacts" ? 1 : 0);
      } else if (firstError && generalFields.includes(firstError)) {
        setStep(2);
      } else {
        setStep(3);
      }
      setTimeout(() => scrollToField(firstError), 50);
      setStatusMessage("Há campos inválidos. Corrija antes de revisar o informe.");
      return;
    }
    setStep(4);
  }

  async function handleExport() {
    const ok = await trigger();
    if (!ok) {
      setStatusMessage("Não é possível exportar enquanto houver erros de validação.");
      const firstError = Object.keys(form.formState.errors)[0];
      scrollToField(firstError);
      return;
    }
    try {
      exportAnomalyReportToExcel(getValues());
      setExportSuccess(true);
      setStatusMessage("Exportação concluída com sucesso.");
      persistDraft();
    } catch {
      setStatusMessage("Não foi possível gerar o arquivo Excel. Tente novamente.");
    }
  }

  function clearForm() {
    const confirmed = window.confirm(
      "Tem certeza de que deseja limpar o formulário? Esta ação apagará o rascunho salvo neste navegador.",
    );
    if (!confirmed) return;
    clearDraft();
    reset(createEmptyFormData());
    setFdsNeedsReselect(false);
    setStep(0);
    setExportSuccess(false);
    setStatusMessage("Formulário limpo. Novo número de registro gerado.");
  }

  function startNewAfterExport() {
    const confirmed = window.confirm(
      "Finalizar este informe e iniciar um novo? O rascunho atual será descartado.",
    );
    if (!confirmed) return;
    clearDraft();
    reset(createEmptyFormData());
    setFdsNeedsReselect(false);
    setStep(0);
    setExportSuccess(false);
    setStatusMessage("Novo informe iniciado.");
  }

  if (pendingDraft) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">
          Rascunho encontrado
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          Existe um preenchimento salvo neste navegador (
          <span className="font-medium">{pendingDraft.recordNumber}</span>
          ). Deseja continuar ou iniciar um novo informe?
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <PrimaryButton onClick={continueDraft}>
            Continuar preenchimento
          </PrimaryButton>
          <SecondaryButton onClick={discardDraft}>
            Descartar e iniciar novo
          </SecondaryButton>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <p className="text-sm text-slate-600" role="status">
        Carregando formulário...
      </p>
    );
  }

  const availableAdditional = getAvailableAdditionalImpacts(
    values.primaryImpact,
  );
  const errorMap = errors as Record<string, { message?: string } | undefined>;

  return (
    <div className="space-y-6">
      <FormProgress currentStep={step} percent={progressPercent} />

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <p aria-live="polite">
          {draftSavedAt ? `Rascunho salvo às ${draftSavedAt}` : "Rascunho automático ativo"}
        </p>
        <SecondaryButton onClick={clearForm}>Limpar formulário</SecondaryButton>
      </div>

      {statusMessage ? (
        <p
          className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800"
          role="status"
        >
          {statusMessage}
        </p>
      ) : null}

      {exportSuccess ? (
        <p
          className="rounded-lg border border-teal-300 bg-teal-50 px-3 py-2 text-sm text-teal-950"
          role="status"
        >
          Arquivo Excel gerado com sucesso. O rascunho foi mantido. Você pode
          continuar editando ou iniciar um novo informe.
        </p>
      ) : null}

      {step <= 3 ? (
        <>
          {step === 0 ? (
            <ImpactSelection
              value={values.primaryImpact}
              onChange={handlePrimaryImpact}
              error={fieldErrorMessage(errorMap, "primaryImpact")}
            />
          ) : values.primaryImpact ? (
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
              <p>
                <span className="font-medium">Impacto principal:</span>{" "}
                {IMPACT_LABELS[values.primaryImpact]}
              </p>
              <p className="mt-1 text-slate-600">
                Para alterar o impacto principal, use Voltar até a primeira
                etapa.
              </p>
            </section>
          ) : null}

          {step === 0 && values.primaryImpact === "pessoas" ? (
            <PeopleImpactQuestion
              value={values.peopleAnswer}
              onChange={(value) =>
                setValue("peopleAnswer", value, { shouldValidate: true })
              }
              error={fieldErrorMessage(errorMap, "peopleAnswer")}
            />
          ) : null}
          {step === 0 && values.primaryImpact === "material" ? (
            <MaterialImpactQuestion
              value={values.materialAnswer}
              onChange={(value) =>
                setValue("materialAnswer", value, { shouldValidate: true })
              }
              error={fieldErrorMessage(errorMap, "materialAnswer")}
            />
          ) : null}
          {step === 0 && values.primaryImpact === "meio_ambiente" ? (
            <EnvironmentImpactQuestion
              value={values.environmentAnswer}
              onChange={(value) =>
                setValue("environmentAnswer", value, { shouldValidate: true })
              }
              error={fieldErrorMessage(errorMap, "environmentAnswer")}
            />
          ) : null}

          {classifications.length > 0 ? (
            <ClassificationSummary classifications={classifications} />
          ) : null}

          {step >= 1 && canShowAdditional ? (
            <>
              <AdditionalImpacts
                hasAdditional={values.hasAdditionalImpacts}
                onHasAdditionalChange={handleHasAdditional}
                availableImpacts={availableAdditional}
                selectedImpacts={values.additionalImpacts ?? []}
                onToggleImpact={toggleAdditionalImpact}
                hasAdditionalError={fieldErrorMessage(
                  errorMap,
                  "hasAdditionalImpacts",
                )}
                additionalError={fieldErrorMessage(
                  errorMap,
                  "additionalImpacts",
                )}
              />
              {values.hasAdditionalImpacts === "sim" &&
              (values.additionalImpacts ?? []).includes("pessoas") ? (
                <PeopleImpactQuestion
                  value={values.peopleAnswer}
                  onChange={(value) =>
                    setValue("peopleAnswer", value, { shouldValidate: true })
                  }
                  error={fieldErrorMessage(errorMap, "peopleAnswer")}
                />
              ) : null}
              {values.hasAdditionalImpacts === "sim" &&
              (values.additionalImpacts ?? []).includes("material") ? (
                <MaterialImpactQuestion
                  value={values.materialAnswer}
                  onChange={(value) =>
                    setValue("materialAnswer", value, { shouldValidate: true })
                  }
                  error={fieldErrorMessage(errorMap, "materialAnswer")}
                />
              ) : null}
              {values.hasAdditionalImpacts === "sim" &&
              (values.additionalImpacts ?? []).includes("meio_ambiente") ? (
                <EnvironmentImpactQuestion
                  value={values.environmentAnswer}
                  onChange={(value) =>
                    setValue("environmentAnswer", value, {
                      shouldValidate: true,
                    })
                  }
                  error={fieldErrorMessage(errorMap, "environmentAnswer")}
                />
              ) : null}
            </>
          ) : null}

          {step >= 2 && canShowGeneral ? (
            <GeneralInformation
              recordNumber={values.recordNumber}
              communicationTime={values.communicationTime}
              occurrenceDate={values.occurrenceDate}
              occurrenceTime={values.occurrenceTime}
              informant={values.informant}
              informantRole={values.informantRole}
              location={values.location}
              latitude={values.latitude}
              longitude={values.longitude}
              company={values.company}
              management={values.management}
              errors={{
                occurrenceDate: fieldErrorMessage(errorMap, "occurrenceDate"),
                occurrenceTime: fieldErrorMessage(errorMap, "occurrenceTime"),
                informant: fieldErrorMessage(errorMap, "informant"),
                informantRole: fieldErrorMessage(errorMap, "informantRole"),
                location: fieldErrorMessage(errorMap, "location"),
                latitude: fieldErrorMessage(errorMap, "latitude"),
                longitude: fieldErrorMessage(errorMap, "longitude"),
                company: fieldErrorMessage(errorMap, "company"),
                management: fieldErrorMessage(errorMap, "management"),
              }}
              onChange={(field, value) =>
                setValue(
                  field as keyof AnomalyReportFormData,
                  value as never,
                  { shouldValidate: true },
                )
              }
            />
          ) : null}

          {step >= 3 && canShowOccurrence ? (
            <>
              <OccurrenceInformation
                occurrenceDescription={values.occurrenceDescription}
                immediateActions={values.immediateActions}
                errors={{
                  occurrenceDescription: fieldErrorMessage(
                    errorMap,
                    "occurrenceDescription",
                  ),
                  immediateActions: fieldErrorMessage(
                    errorMap,
                    "immediateActions",
                  ),
                }}
                onChange={(field, value) =>
                  setValue(
                    field as keyof AnomalyReportFormData,
                    value as never,
                    { shouldValidate: true },
                  )
                }
              />
              {showPersonal ? (
                <PersonalAccidentFields
                  firstAid={values.firstAid}
                  externalMedicalCare={values.externalMedicalCare}
                  onChange={(field, value) =>
                    setValue(field, value, { shouldValidate: true })
                  }
                />
              ) : null}
              {showEnvAccident ? (
                <EnvironmentalAccidentFields
                  spillEndTime={values.spillEndTime}
                  uncontainedVolume={values.uncontainedVolume}
                  containedVolume={values.containedVolume}
                  spilledProduct={values.spilledProduct}
                  errors={{
                    spillEndTime: fieldErrorMessage(errorMap, "spillEndTime"),
                    uncontainedVolume: fieldErrorMessage(
                      errorMap,
                      "uncontainedVolume",
                    ),
                    containedVolume: fieldErrorMessage(
                      errorMap,
                      "containedVolume",
                    ),
                    spilledProduct: fieldErrorMessage(
                      errorMap,
                      "spilledProduct",
                    ),
                  }}
                  onChange={(field, value) =>
                    setValue(
                      field as keyof AnomalyReportFormData,
                      value as never,
                      { shouldValidate: true },
                    )
                  }
                />
              ) : null}
              {showFds ? (
                <FdsUpload
                  metadata={values.fdsMetadata}
                  needsReselectHint={fdsNeedsReselect}
                  onChange={(metadata) => {
                    setValue("fdsMetadata", metadata, { shouldValidate: true });
                    if (metadata) setFdsNeedsReselect(false);
                  }}
                />
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <div className="space-y-6">
          <ReportReview data={getValues()} />
          <ShareReportActions data={getValues()} />
        </div>
      )}

      <div className="sticky bottom-0 z-10 space-y-4 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        {step === 4 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-800">Ações principais</p>
            <div className="flex flex-wrap gap-3">
              <PrimaryButton onClick={handleExport}>
                Exportar para Excel
              </PrimaryButton>
              <SecondaryButton onClick={startNewAfterExport}>
                Finalizar e iniciar novo informe
              </SecondaryButton>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <SecondaryButton onClick={goBack} disabled={step === 0}>
              Voltar
            </SecondaryButton>
            {step < 4 ? (
              <PrimaryButton onClick={goContinue}>Continuar</PrimaryButton>
            ) : null}
            {step === 3 ? (
              <PrimaryButton onClick={handleReview}>Revisar informe</PrimaryButton>
            ) : null}
            {step < 3 ? (
              <SecondaryButton onClick={handleReview}>
                Revisar informe
              </SecondaryButton>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
