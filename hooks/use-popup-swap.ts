import { useCallback, useEffect, useRef } from "react";

// Long enough for a closing pop-up's fade to finish.
const SWAP_DELAY_MS = 300;

// Closing one pop-up and opening another in the same moment can leave iOS
// without the second one. Close the first, then pass the opening of the next
// to this; it runs once the first has faded out. A newer call replaces an
// older one, and nothing runs after the screen unmounts.
export function usePopupSwap() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return useCallback((openNext: () => void) => {
    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(() => {
      timer.current = null;
      openNext();
    }, SWAP_DELAY_MS);
  }, []);
}
