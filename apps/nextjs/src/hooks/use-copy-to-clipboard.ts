import { useCallback, useState } from "react";

/**
 * Copy text to clipboard with success state.
 *
 * Usage:
 *   const { copy, copied } = useCopyToClipboard();
 *   <Button onClick={() => copy(apiKey)}>
 *     {copied ? "Copied!" : "Copy"}
 *   </Button>
 */
export function useCopyToClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), resetDelay);
        return true;
      } catch {
        return false;
      }
    },
    [resetDelay],
  );

  return { copy, copied };
}
