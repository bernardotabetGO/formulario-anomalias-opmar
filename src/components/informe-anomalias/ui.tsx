"use client";

import type {
  ButtonHTMLAttributes,
  ChangeEvent,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-sm text-red-800" role="alert">
      <span className="font-medium">Erro:</span> {message}
    </p>
  );
}

export function HelpText({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm text-slate-600">{children}</p>;
}

export function SectionCard({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm duration-300"
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <h2
        id={id ? `${id}-title` : undefined}
        className="text-lg font-semibold text-slate-900"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      ) : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function ChoiceCard({
  label,
  selected,
  onSelect,
  description,
  name,
  value,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  description?: string;
  name: string;
  value: string;
}) {
  return (
    <label
      className={`flex cursor-pointer flex-col rounded-xl border-2 p-4 transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-teal-700 ${
        selected
          ? "border-teal-700 bg-teal-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <input
        type="radio"
        className="sr-only"
        name={name}
        value={value}
        checked={selected}
        onChange={onSelect}
      />
      <span className="font-medium text-slate-900">
        {selected ? "✓ " : ""}
        {label}
      </span>
      {description ? (
        <span className="mt-1 text-sm text-slate-600">{description}</span>
      ) : null}
    </label>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
  name,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  name: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-teal-700">
      <input
        type="checkbox"
        name={name}
        className="mt-1 h-4 w-4 accent-teal-700"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="text-sm font-medium text-slate-800">{label}</span>
    </label>
  );
}

type FormInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
};

export function FormInput({
  id,
  label,
  error,
  hint,
  required,
  ...props
}: FormInputProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-800">
        {label}
        {required ? <span className="text-red-800"> *</span> : null}
      </label>
      <input
        id={id}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/30 disabled:bg-slate-100"
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
        required={required}
        {...props}
      />
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-slate-600">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-800" role="alert">
          <span className="font-medium">Erro:</span> {error}
        </p>
      ) : null}
    </div>
  );
}

type FormTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "id" | "value"
> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  value: string;
  maxHint?: number;
};

export function FormTextarea({
  id,
  label,
  error,
  hint,
  required,
  value,
  maxHint,
  ...props
}: FormTextareaProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-800">
        {label}
        {required ? <span className="text-red-800"> *</span> : null}
      </label>
      <textarea
        id={id}
        value={value}
        className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/30"
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
        required={required}
        {...props}
      />
      <div className="mt-1 flex flex-wrap items-start justify-between gap-2">
        {hint ? (
          <p id={`${id}-hint`} className="text-sm text-slate-600">
            {hint}
          </p>
        ) : (
          <span />
        )}
        <p className="text-xs text-slate-500" aria-live="polite">
          {value.length}
          {maxHint ? ` / ${maxHint}` : ""} caracteres
        </p>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-800" role="alert">
          <span className="font-medium">Erro:</span> {error}
        </p>
      ) : null}
    </div>
  );
}

export function PrimaryButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    >
      {children}
    </button>
  );
}

export type { ChangeEvent };
