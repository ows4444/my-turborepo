export function truncate(text: string, length: number) {
  if (text.length <= length) return text;

  return text.slice(0, length).trimEnd() + "…";
}
