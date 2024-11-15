import type { LabelProps } from "@radix-ui/react-label";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@acme/ui";

function Label({ className, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
