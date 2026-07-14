"use client";

const STEPS = [
  "Impacto principal",
  "Outros impactos",
  "Informações gerais",
  "Ocorrência",
  "Revisão",
];

export function FormProgress({
  currentStep,
  percent,
}: {
  currentStep: number;
  percent: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-800">
          Progresso do preenchimento
        </p>
        <p className="text-sm text-slate-600" aria-live="polite">
          {Math.round(percent)}%
        </p>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        aria-label="Progresso do formulário"
      >
        <div
          className="h-full rounded-full bg-teal-700 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <ol className="mt-3 grid gap-2 sm:grid-cols-5">
        {STEPS.map((step, index) => {
          const active = index === currentStep;
          const done = index < currentStep;
          return (
            <li
              key={step}
              className={`rounded-md px-2 py-1 text-center text-xs ${
                active
                  ? "bg-teal-800 font-semibold text-white"
                  : done
                    ? "bg-teal-50 font-medium text-teal-900"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {done ? "✓ " : `${index + 1}. `}
              {step}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
