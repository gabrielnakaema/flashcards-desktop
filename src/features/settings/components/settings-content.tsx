import { useSettings } from "@/features/settings/hooks/use-settings";
import {
  useUpdater,
  type UpdaterStatus,
} from "@/features/settings/hooks/use-updater";
import {
  getLlmProvider,
  getLlmProviderOptions,
  useListLlmModels,
} from "@/features/llm";
import { AppSwitch } from "@/shared/components/app-switch";
import { AppSelect } from "@/shared/components/app-select";
import { AppInput } from "@/shared/components/app-input";
import { AppButton } from "@/shared/components/app-button";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  settingsFormSchema,
  SettingsFormValues,
} from "@/features/settings/schemas/settings-form-schema";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import { getErrorMessage } from "@/shared/utils/handle-error";
import { getVersion } from "@tauri-apps/api/app";
import { useEffect, useState } from "react";

const STATUS_TEXT: Record<UpdaterStatus["type"], string> = {
  idle: "Check if a new version is available",
  checking: "Checking…",
  "up-to-date": "You're on the latest version",
  available: "Update available",
  downloading: "Downloading…",
  installed: "Installed — restart to apply",
  error: "An error occurred",
};

const getUpdaterStatusText = (status: UpdaterStatus): string => {
  if (status.type === "available")
    return `v${status.update.version} is available`;
  if (status.type === "downloading") return `Downloading… ${status.progress}%`;
  if (status.type === "error") return status.message;
  return STATUS_TEXT[status.type];
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
    {children}
  </div>
);

export const SettingsContent = () => {
  const { data, setData } = useSettings();
  const { status, checkForUpdate, installUpdate } = useUpdater();
  const [appVersion, setAppVersion] = useState<string | null>(null);

  useEffect(() => {
    getVersion()
      .then(setAppVersion)
      .catch(() => null);
  }, []);

  const { handleSubmit, control, reset, setValue } =
    useForm<SettingsFormValues>({
      resolver: zodResolver(settingsFormSchema),
      defaultValues: {
        devMode: data.devMode,
        saveApiSettings: data.saveApiSettings,
        defaultProvider: data.defaultProvider,
        defaultModel: data.defaultModel ?? "",
        apiKey: data.apiKey ?? "",
      },
    });

  const defaultProvider = useWatch({ control, name: "defaultProvider" });
  const defaultModel = useWatch({ control, name: "defaultModel" });
  const apiKey = useWatch({ control, name: "apiKey" });

  const modelListQuery = useListLlmModels({
    provider: defaultProvider,
    apiKey,
    enabled: true,
  });
  const modelOptions = modelListQuery.data ?? [
    { label: defaultModel, value: defaultModel },
  ];
  const modelListErrorMessage = getErrorMessage(modelListQuery.error);

  const onSubmit: SubmitHandler<SettingsFormValues> = (values) => {
    setData({
      devMode: values.devMode,
      saveApiSettings: !!values.saveApiSettings,
      defaultProvider: values.defaultProvider,
      defaultModel: values.defaultModel ?? "",
      apiKey: values.apiKey ?? "",
    });
  };

  return (
    <div className="w-full max-w-[620px] px-9 py-8">
      <div className="mb-7">
        <h1 className="text-[22px] font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          flashcards{appVersion ? ` · v${appVersion}` : ""}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {import.meta.env.DEV && (
          <div className="mb-5">
            <SectionLabel>General</SectionLabel>
            <div className="rounded-sm border border-border bg-muted">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="text-[13px] font-medium">Dev Mode</div>
                  <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    Enables the dev clock and other development tools
                  </div>
                </div>
                <Controller
                  control={control}
                  name="devMode"
                  render={({ field }) => (
                    <AppSwitch
                      id="dev-mode"
                      checked={field.value === "on"}
                      onCheckedChange={(checked) =>
                        field.onChange(checked ? "on" : "off")
                      }
                      className="ml-5"
                    />
                  )}
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <SectionLabel>LLM Provider</SectionLabel>
          <div className="rounded-sm border border-border bg-muted">
            <div className="flex flex-col gap-5 p-5">
              <Controller
                control={control}
                name="defaultProvider"
                render={({ field }) => (
                  <AppSelect
                    id="provider"
                    label="Default provider"
                    value={field.value ?? ""}
                    onChange={(value) => {
                      const provider =
                        value as SettingsFormValues["defaultProvider"];
                      field.onChange(provider);
                      setValue(
                        "defaultModel",
                        getLlmProvider(provider).defaultModel
                      );
                    }}
                    options={getLlmProviderOptions()}
                  />
                )}
              />

              <div className="flex flex-col gap-2">
                <Controller
                  control={control}
                  name="defaultModel"
                  render={({ field }) => (
                    <AppSelect
                      id="model"
                      label="Default model"
                      value={field.value ?? ""}
                      onChange={(value) =>
                        field.onChange(
                          value || getLlmProvider(defaultProvider).defaultModel
                        )
                      }
                      options={modelOptions}
                      disabled={modelListQuery.isFetching}
                    />
                  )}
                />
                <div className="flex items-center gap-2">
                  <AppButton
                    type="button"
                    variant="secondary"
                    disabled={modelListQuery.isFetching}
                    onClick={() => void modelListQuery.refetch()}
                  >
                    {modelListQuery.isFetching ? "Loading..." : "Load models"}
                  </AppButton>
                  {modelListErrorMessage && (
                    <p className="text-xs text-destructive" role="alert">
                      {modelListErrorMessage}
                    </p>
                  )}
                </div>
              </div>

              <Controller
                control={control}
                name="apiKey"
                render={({ field }) => (
                  <AppInput
                    id="api-key"
                    label="API Key"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    type="password"
                    placeholder="Enter API key"
                  />
                )}
              />

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium">
                    Save settings to local storage
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    Persist API key and preferences between sessions
                  </div>
                </div>
                <Controller
                  control={control}
                  name="saveApiSettings"
                  render={({ field }) => (
                    <AppSwitch
                      id="save-api-settings"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      className="ml-5"
                    />
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-1 border-t border-border">
                <AppButton
                  type="button"
                  variant="secondary"
                  onClick={() => reset()}
                >
                  Reset
                </AppButton>
                <AppButton type="submit">Save</AppButton>
              </div>
            </div>
          </div>
        </div>
      </form>

      <div className="mt-5">
        <SectionLabel>Updates</SectionLabel>
        <div className="rounded-sm border border-border bg-muted">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <div className="text-[13px] font-medium">Check for updates</div>
              <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                {getUpdaterStatusText(status)}
              </div>
            </div>
            <div className="ml-5 shrink-0">
              {status.type === "available" ? (
                <AppButton type="button" onClick={() => void installUpdate()}>
                  Install
                </AppButton>
              ) : (
                <AppButton
                  type="button"
                  variant="secondary"
                  disabled={
                    status.type === "checking" ||
                    status.type === "downloading" ||
                    status.type === "installed"
                  }
                  onClick={() => void checkForUpdate()}
                >
                  {status.type === "checking" ? "Checking…" : "Check now"}
                </AppButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
