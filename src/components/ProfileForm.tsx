"use client";
import { useEffect, useRef, type FormEvent } from "react";
import { profileFromForm } from "@/lib/formData";
import { COMMUTES, COOKING, GROUPS, HEATING } from "@/lib/validate";

interface Props {
  busy: boolean;
  error: string | null;
  onSubmit: (payload: Record<string, unknown>) => void;
}

const toLabel = (value: string) => value.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

function SelectField({ name, label, options }: { name: string; label: string; options: readonly string[] }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} required defaultValue="">
        <option value="" disabled>
          Choose one
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {toLabel(o)}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ProfileForm({ busy, error, onSubmit }: Props) {
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(profileFromForm(new FormData(event.currentTarget)));
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={busy}>
      {error && (
        <p ref={errorRef} tabIndex={-1} role="alert" className="error">
          {error}
        </p>
      )}
      <div className="field">
        <label htmlFor="city">City</label>
        <input
          id="city"
          name="city"
          type="text"
          required
          minLength={2}
          maxLength={80}
          autoComplete="address-level2"
          aria-describedby="city-hint"
        />
        <small id="city-hint">For example, Delhi or Lahore.</small>
      </div>
      <fieldset>
        <legend>Who lives with you? (optional)</legend>
        {GROUPS.map((g) => (
          <label key={g} className="check">
            <input type="checkbox" name="groups" value={g} /> {toLabel(g)}
          </label>
        ))}
      </fieldset>
      <SelectField name="commute" label="How do you get around?" options={COMMUTES} />
      <SelectField name="cooking" label="What do you cook on?" options={COOKING} />
      <SelectField name="heating" label="How do you heat your home?" options={HEATING} />
      <fieldset>
        <legend>Do you have an air purifier?</legend>
        <label className="check">
          <input type="radio" name="hasPurifier" value="yes" /> Yes
        </label>
        <label className="check">
          <input type="radio" name="hasPurifier" value="no" defaultChecked /> No
        </label>
      </fieldset>
      <button type="submit" disabled={busy}>
        {busy ? "Checking the air…" : "Get today's plan"}
      </button>
    </form>
  );
}
