import { resolveTheme } from "./resolve-theme";

export type Theme = "light" | "dark" | "system";

export type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

export const THEME_STORAGE_KEY = "theme";

export const DEFAULT_THEME: Theme = "light";

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
}

export function setStoredTheme(theme: Theme) {
  if (typeof document === "undefined") return;

  localStorage.setItem(THEME_STORAGE_KEY, theme);

  document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Lax; Secure`;
}

export function getPreferredTheme(): Theme {
  const stored = getStoredTheme();
  if (stored) return stored;

  return resolveTheme("system");
}
