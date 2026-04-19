import { useUserSettings, useUpdateUserSettings } from './use-sport-data';

export function useHiddenModules(): string[] {
  const { data: settings } = useUserSettings();
  return (settings?.hidden_modules as string[]) ?? [];
}

export { useUserSettings, useUpdateUserSettings };
