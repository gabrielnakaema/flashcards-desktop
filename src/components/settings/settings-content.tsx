import { useSettings } from "@/hooks/settings/use-settings";
import { useListLlmModels } from "@/hooks/llm/use-list-llm-models";
import { getLlmProviderOptions } from "@/providers/llm-provider";
import { Switch } from "@/components/ui/switch";
import { Field } from "../shared/field";
import { Select } from "../shared/select";
import { Input } from "../ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  settingsFormSchema,
  SettingsFormValues,
} from "@/schemas/settings-form-schema";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import { Button } from "../ui/button";
import { getErrorMessage } from "@/utils/handle-error";

export const SettingsContent = () => {
  const { data, setData } = useSettings();

  const {
    handleSubmit,
    control,
    reset,
  } = useForm<SettingsFormValues>({
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

  const onSubmit: SubmitHandler<SettingsFormValues> = (data) => {
    setData({
      devMode: data.devMode,
      saveApiSettings: !!data.saveApiSettings,
      defaultProvider: data.defaultProvider,
      defaultModel: data.defaultModel ?? "",
      apiKey: data.apiKey ?? "",
    });
  };

  return (
    <div className="w-full flex flex-col gap-4 py-8 px-16">
      <h1 className="text-3xl font-medium text-foreground">Settings</h1>

      {import.meta.env.DEV && (
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">
              Dev Mode
            </span>
            <span className="text-xs text-muted-foreground">
              Enables the dev clock and other development tools.
            </span>
          </div>
          <Controller
            control={control}
            name="devMode"
            render={({ field }) => (
              <Switch
                id="dev-mode"
                checked={field.value === "on"}
                onCheckedChange={(checked) =>
                  field.onChange(checked ? "on" : "off")
                }
              />
            )}
          />
        </div>
      )}

      <form
        className="flex items-center justify-between rounded-lg border p-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-4 w-full">
          <p className="text-lg font-medium text-foreground">
            LLM Provider Settings
          </p>

          <Field label="Default provider" htmlFor="provider">
            <Controller
              control={control}
              name="defaultProvider"
              render={({ field }) => (
                <Select
                  className="w-full"
                  id="provider"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={getLlmProviderOptions()}
                />
              )}
            />
          </Field>

          <Field label="Default model" htmlFor="model">
            <div className="flex gap-2">
              <Controller
                control={control}
                name="defaultModel"
                render={({ field }) => (
                  <Select
                    className="w-full"
                    id="model"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    options={modelOptions}
                    disabled={modelListQuery.isFetching}
                  />
                )}
              />
              <Button
                type="button"
                variant="outline"
                disabled={modelListQuery.isFetching}
                onClick={() => void modelListQuery.refetch()}
              >
                {modelListQuery.isFetching ? "Loading..." : "Load models"}
              </Button>
            </div>
            {modelListErrorMessage && (
              <p className="text-sm text-red-500" role="alert">
                {modelListErrorMessage}
              </p>
            )}
          </Field>

          <Field label="API Key" htmlFor="api-key">
            <Controller
              control={control}
              name="apiKey"
              render={({ field }) => (
                <Input
                  className="w-full"
                  id="api-key"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  type="password"
                  placeholder="Enter API key"
                />
              )}
            />
          </Field>

          <Field label="Save settings to Local Storage?" htmlFor="save-api-key">
            <Controller
              control={control}
              name="saveApiSettings"
              render={({ field }) => (
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Switch
                    id="save-api-key"
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  {field.value ? "Yes" : "No"}
                </div>
              )}
            />
          </Field>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={() => reset()}
            >
              Reset
            </Button>
            <Button type="submit" size="lg">
              Save
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
