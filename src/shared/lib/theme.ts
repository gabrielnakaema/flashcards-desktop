export type Theme = "light" | "dark";

const MEDIA_QUERY = "(prefers-color-scheme: dark)";

export const isTauri = (): boolean => {
  return "__TAURI_INTERNALS__" in window;
};

export const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
};

export const getMediaTheme = (): Theme => {
  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
};

export const watchMediaTheme = (
  onChange: (theme: Theme) => void
): (() => void) => {
  const media = window.matchMedia(MEDIA_QUERY);
  const handler = (e: MediaQueryListEvent) =>
    onChange(e.matches ? "dark" : "light");
  media.addEventListener("change", handler);
  return () => media.removeEventListener("change", handler);
};
