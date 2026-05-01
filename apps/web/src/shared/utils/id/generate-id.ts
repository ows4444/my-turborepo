export function generateId(prefix = ""): string {
  const id = crypto.randomUUID?.();

  return prefix ? `${prefix}_${id}` : id;
}
