import { useUserSettings, useUpdateUserSettings } from './use-sport-data';

// All modules are permanently active — returns empty array so nothing is hidden
export function useHiddenModules(): string[] {
  return [];
}

export { useUserSettings, useUpdateUserSettings };
