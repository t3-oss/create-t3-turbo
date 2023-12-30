import type { CxOptions } from "class-variance-authority";
import { cx } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

function cn(...inputs: CxOptions) {
  return twMerge(cx(inputs));
}

export { cn };
