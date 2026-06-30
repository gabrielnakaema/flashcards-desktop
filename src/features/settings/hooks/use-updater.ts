import { check, Update } from "@tauri-apps/plugin-updater";
import { useCallback, useState } from "react";

export type UpdaterStatus =
  | { type: "idle" }
  | { type: "checking" }
  | { type: "up-to-date" }
  | { type: "available"; update: Update }
  | { type: "downloading"; progress: number }
  | { type: "installed" }
  | { type: "error"; message: string };

export function useUpdater() {
  const [status, setStatus] = useState<UpdaterStatus>({ type: "idle" });

  const checkForUpdate = useCallback(async () => {
    setStatus({ type: "checking" });
    try {
      const update = await check();
      setStatus(update ? { type: "available", update } : { type: "up-to-date" });
    } catch (e) {
      setStatus({ type: "error", message: String(e) });
    }
  }, []);

  const installUpdate = useCallback(async () => {
    if (status.type !== "available") return;
    const { update } = status;

    let downloaded = 0;
    let total = 0;

    try {
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            total = event.data.contentLength ?? 0;
            setStatus({ type: "downloading", progress: 0 });
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            setStatus({
              type: "downloading",
              progress: total > 0 ? Math.round((downloaded / total) * 100) : 0,
            });
            break;
          case "Finished":
            setStatus({ type: "installed" });
            break;
        }
      });
    } catch (e) {
      setStatus({ type: "error", message: String(e) });
    }
  }, [status]);

  return { status, checkForUpdate, installUpdate };
}
