import type { ValidationOptions } from "class-validator";

import { registerDecorator } from "class-validator";

import {
  isSupportedPreferenceLanguage,
  isSupportedPreferenceTheme,
  isSupportedPreferenceTimezone,
} from "../application/preferences.validation";

type DecoratorFactory = (validationOptions?: ValidationOptions) => PropertyDecorator;

/**
 * Thin class-validator wrappers around the single-source preference rules in
 * application/preferences.validation.ts. They only translate the pure
 * predicates into HTTP-parse errors; the rules themselves live in one place
 * and are enforced again by the use-case (defense in depth, same source).
 */
function buildPreferenceValidator(
  name: string,
  validate: (value: unknown) => boolean,
  defaultMessage: () => string,
): DecoratorFactory {
  return (validationOptions?: ValidationOptions) => (target, propertyName) => {
    registerDecorator({
      name,
      target: target.constructor,
      // PropertyDecorator hands over string | symbol; class-validator only accepts string.
      propertyName: String(propertyName),
      constraints: [],
      // exactOptionalPropertyTypes: only pass `options` when one was given.
      ...(validationOptions !== undefined ? { options: validationOptions } : {}),
      validator: {
        validate: (value: unknown) => validate(value),
        defaultMessage,
      },
    });
  };
}

export const IsPreferenceTheme = buildPreferenceValidator(
  "isPreferenceTheme",
  isSupportedPreferenceTheme,
  () => "theme must be one of: system, light, dark",
);

export const IsPreferenceLanguage = buildPreferenceValidator(
  "isPreferenceLanguage",
  isSupportedPreferenceLanguage,
  () => "language must be one of: en, vi",
);

export const IsPreferenceTimezone = buildPreferenceValidator(
  "isPreferenceTimezone",
  isSupportedPreferenceTimezone,
  () => "timezone must be a supported IANA time zone",
);
