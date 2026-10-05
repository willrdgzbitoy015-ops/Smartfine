import {
  type Href,
  type ImperativeRouter,
  usePathname,
  useRouter,
} from "expo-router";
import { useMemo, useRef } from "react";

// A second tap during this window is ignored, so a quick double tap on a tab
// or sidebar item opens the screen once.
const NAVIGATION_COOLDOWN_MS = 700;

// The router from useRouter, with push, replace and navigate guarded:
//
// - a repeat call within the cool-down is ignored (no duplicate screens);
// - opening the screen that is already showing does nothing.
//
// Destinations, back and every other router method behave exactly as before.
export function useGuardedRouter(): ImperativeRouter {
  const router = useRouter();

  const pathname = usePathname();

  const lastNavigation = useRef(0);

  return useMemo(() => {
    const allow = (href: Href) => {
      if (typeof href === "string" && href === pathname) {
        return false;
      }

      const now = Date.now();

      if (now - lastNavigation.current < NAVIGATION_COOLDOWN_MS) {
        return false;
      }

      lastNavigation.current = now;

      return true;
    };

    return {
      ...router,

      push: (href, options) => {
        if (allow(href)) router.push(href, options);
      },

      replace: (href, options) => {
        if (allow(href)) router.replace(href, options);
      },

      navigate: (href, options) => {
        if (allow(href)) router.navigate(href, options);
      },
    };
  }, [router, pathname]);
}
