import * as React from "react"
import { useLocalStorage } from "./use-local-storage"
import { AppSettings } from "@/lib/types";

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [settings] = useLocalStorage<AppSettings>('prompt-forge-settings', {
    apiKeys: [],
    activeApiKeyIndex: 0,
    mobileView: false,
    models: {
      analysis: 'gemini-1.5-flash-latest',
      metrics: 'gemini-1.5-flash-latest',
      recommendations: 'gemini-1.5-flash-latest',
      refine: 'gemini-1.5-flash-latest',
    }
  });
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    if (settings.mobileView) {
        setIsMobile(true);
        return;
    }
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [settings.mobileView])

  return !!isMobile
}
