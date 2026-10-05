import { useCallback, useRef } from "react";

// Runs one async action at a time. A second tap while the first request is
// still running is ignored, even when it lands before the button re-renders
// as disabled. Use it for actions that save, pay or change records.
export function useActionLock() {
  const running = useRef(false);

  return useCallback(
    async <T>(action: () => Promise<T>): Promise<T | undefined> => {
      if (running.current) {
        return undefined;
      }

      running.current = true;

      try {
        return await action();
      } finally {
        running.current = false;
      }
    },
    [],
  );
}
