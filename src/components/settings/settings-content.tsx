import { useSettings } from "@/hooks/settings/use-settings";
import { Switch } from "@/components/ui/switch";
import { Field } from "../shared/field";
import { Select } from "../shared/select";
import { Input } from "../ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  settingsFormSchema,
  SettingsFormValues,
} from "@/schemas/settings-form-schema";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Button } from "../ui/button";

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
                  options={[{ label: "OpenAI", value: "openai" }]}
                />
              )}
            />
          </Field>

          <Field label="Default model" htmlFor="model">
            <Controller
              control={control}
              name="defaultModel"
              render={({ field }) => (
                <Select
                  className="w-full"
                  id="model"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={[{ label: "GPT-4.1-mini", value: "gpt-4.1-mini" }]}
                />
              )}
            />
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
