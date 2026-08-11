import { type TFunction } from 'i18next';

/** Pass-through `t` for call sites that only need the English key string (no i18n context). */
export const identityT = ((key: string) => key) as TFunction;
