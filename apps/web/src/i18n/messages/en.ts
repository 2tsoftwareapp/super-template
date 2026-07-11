// Landing copy is intentionally still hardcoded English in the views — full
// translation is backlog (see the re-architecture roadmap, §7). This file is
// the seam where those strings land as they get extracted.
export const en = {
  common: {
    openAdmin: "Open admin",
    getStarted: "Get started",
  },
};

export type WebMessages = typeof en;
