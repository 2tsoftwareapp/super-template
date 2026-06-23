"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { PreferenceLanguage } from "@/lib/preferences";

interface UserPreferencesContextValue {
  language: PreferenceLanguage;
  timezone: string;
}

const defaultValue: UserPreferencesContextValue = {
  language: "en",
  timezone: "UTC",
};

const UserPreferencesContext =
  createContext<UserPreferencesContextValue>(defaultValue);

export function UserPreferencesProvider({
  language,
  timezone,
  children,
}: {
  language: PreferenceLanguage;
  timezone: string;
  children: ReactNode;
}) {
  return (
    <UserPreferencesContext.Provider value={{ language, timezone }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  return useContext(UserPreferencesContext);
}
