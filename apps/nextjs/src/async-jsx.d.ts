/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ReactNode } from "react";

declare global {
  namespace JSX {
    type ElementType =
      | keyof JSX.IntrinsicElements
      | ((props: any) => Promise<ReactNode> | ReactNode);
  }
}
