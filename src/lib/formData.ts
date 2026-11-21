/** Converts browser form data into the JSON payload the API expects. The server validates it again. */
export function profileFromForm(form: FormData): Record<string, unknown> {
  return {
    city: form.get("city"),
    groups: form.getAll("groups"),
    commute: form.get("commute"),
    cooking: form.get("cooking"),
    heating: form.get("heating"),
    hasPurifier: form.get("hasPurifier") === "yes",
  };
}
