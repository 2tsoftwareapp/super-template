"use client";

import { safeLocalStorage } from "@repo/web-core";
import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

export type Locale = "en" | "vi";

export const messages = {
  en: {
    nav: {
      dashboard: "Dashboard",
      users: "Users",
      nav: {
        dashboard: "Dashboard",
        users: "Users",
      },
      roles: "Roles",
      "audit-logs": "Audit logs",
      notifications: "Notifications",
      jobs: "Jobs",
      mail: "Mail",
      files: "Files",
      imports: "Imports",
      settings: "Settings",
      groups: {
        Overview: "Overview",
        People: "People",
        Operations: "Operations",
        System: "System",
      },
    },
    preferences: {
      title: "Preferences",
      description: "Manage your theme and language settings.",
      theme: "Theme (Giao diện)",
      themeLight: "Light",
      themeDark: "Dark",
      language: "Language (Ngôn ngữ)",
      languageEn: "English",
      languageVi: "Vietnamese",
    },
    shell: {
      settings: "Settings",
      security: "Account security",
      signOut: "Sign out",
      welcome: "Welcome back",
      checking: "Checking",
      healthy: "Healthy",
      degraded: "Degraded",
      refresh: "Refresh",
      refreshing: "Refreshing",
    },
  },
  vi: {
    nav: {
      dashboard: "Bảng điều khiển",
      users: "Người dùng",
      roles: "Vai trò",
      "audit-logs": "Nhật ký hệ thống",
      notifications: "Thông báo",
      jobs: "Hàng đợi tác vụ",
      mail: "Thư đã gửi",
      files: "Tệp tin",
      imports: "Nhập dữ liệu",
      settings: "Cài đặt hệ thống",
      groups: {
        Overview: "Tổng quan",
        People: "Thành viên",
        Operations: "Vận hành",
        System: "Hệ thống",
      },
    },
    preferences: {
      title: "Tùy chọn",
      description: "Quản lý cài đặt giao diện và ngôn ngữ của bạn.",
      theme: "Theme (Giao diện)",
      themeLight: "Sáng",
      themeDark: "Tối",
      language: "Language (Ngôn ngữ)",
      languageEn: "Tiếng Anh (English)",
      languageVi: "Tiếng Việt (Vietnamese)",
    },
    shell: {
      settings: "Cài đặt",
      security: "Bảo mật tài khoản",
      signOut: "Đăng xuất",
      welcome: "Chào mừng trở lại",
      checking: "Đang kiểm tra",
      healthy: "Hoạt động tốt",
      degraded: "Bị suy giảm",
      refresh: "Làm mới",
      refreshing: "Đang làm mới",
    },
  },
} as const;

type MessageTree = typeof messages.en;

function getNestedValue(tree: MessageTree, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = tree;

  for (const part of parts) {
    if (typeof current !== "object" || current === null || !(part in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: (newLocale) => {
    safeLocalStorage.setItem("admin-locale", newLocale);
  },
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = safeLocalStorage.getItem<Locale>("admin-locale");
    if (saved === "en" || saved === "vi") {
      return saved;
    }
    return "en";
  });

  const setLocale = (newLocale: Locale) => {
    safeLocalStorage.setItem("admin-locale", newLocale);
    setLocaleState(newLocale);
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => {
        const tree = messages[locale] as unknown as MessageTree;
        return getNestedValue(tree, key) ?? key;
      },
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
