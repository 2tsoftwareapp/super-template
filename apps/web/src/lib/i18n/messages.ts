export const messages = {
  en: {
    settings: {
      profile: "Profile",
      security: "Security",
      sessions: "Sessions",
      preferences: "Preferences",
    },
    preferences: {
      badge: "Preferences",
      title: "Preferences",
      description: "Theme, language, timezone, and notification preferences.",
      theme: "Theme",
      themeSystem: "System",
      themeLight: "Light",
      themeDark: "Dark",
      language: "Language",
      languageEn: "English",
      languageVi: "Vietnamese",
      timezone: "Timezone",
      emailNotifications: "Email notifications",
      pushNotifications: "Push notifications",
      save: "Save preferences",
      reset: "Reset to default",
      saved: "Preferences updated",
      resetDone: "Preferences reset",
    },
  },
  vi: {
    settings: {
      profile: "Hồ sơ",
      security: "Bảo mật",
      sessions: "Phiên đăng nhập",
      preferences: "Tùy chọn",
    },
    preferences: {
      badge: "Tùy chọn",
      title: "Tùy chọn",
      description: "Giao diện, ngôn ngữ, múi giờ và thông báo.",
      theme: "Giao diện",
      themeSystem: "Theo hệ thống",
      themeLight: "Sáng",
      themeDark: "Tối",
      language: "Ngôn ngữ",
      languageEn: "Tiếng Anh",
      languageVi: "Tiếng Việt",
      timezone: "Múi giờ",
      emailNotifications: "Thông báo email",
      pushNotifications: "Thông báo đẩy",
      save: "Lưu tùy chọn",
      reset: "Đặt lại mặc định",
      saved: "Đã cập nhật tùy chọn",
      resetDone: "Đã đặt lại tùy chọn",
    },
  },
} as const;

export type AppLocale = keyof typeof messages;
export type MessageKey = keyof (typeof messages)["en"];
