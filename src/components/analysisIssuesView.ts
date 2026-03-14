export function issueLabel(source: "old" | "new" | "validation"): string {
  if (source === "old") return "Old tree";
  if (source === "new") return "Current tree";
  return "Validation";
}

export function analysisMessageClass(status: string | null): string {
  if (status === "error") return "is-danger";
  if (status === "success-with-warnings") return "is-warning";
  return "is-info";
}
