import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.dispatchEvent(new MediaQueryListEvent("change"));
    mql.addEventListener("change", () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    });
    return () =>
      mql.removeEventListener("change", () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      });
  }, []);

  return isMobile;
}
