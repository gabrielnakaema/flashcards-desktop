import { useEffect } from "react";
import {
  applyTheme,
  getMediaTheme,
  isTauri,
  watchMediaTheme,
} from "@/shared/lib/theme";

export function useTheme() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    async function init() {
      if (isTauri()) {
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          const { getCurrentWindow } = await import("@tauri-apps/api/window");
          const theme = await invoke<"light" | "dark">("system_theme");
          if (cancelled) return;
          applyTheme(theme);
          const unlisten = await getCurrentWindow().onThemeChanged(
            ({ payload }) => applyTheme(payload)
          );
          if (cancelled) {
            unlisten();
            return;
          }
          cleanup = unlisten;
        } catch {
          if (cancelled) return;
          applyTheme(getMediaTheme());
          cleanup = watchMediaTheme(applyTheme);
        }
      } else {
        applyTheme(getMediaTheme());
        cleanup = watchMediaTheme(applyTheme);
      }
    }

    void init();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);
}
