import { useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 768
const mediaQuery = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

export function useIsMobile() {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(mediaQuery)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(mediaQuery).matches,
    () => false,
  )
}
