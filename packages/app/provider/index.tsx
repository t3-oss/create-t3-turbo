import { SafeArea } from "./safe-area";

export function Provider({ children }: { children: React.ReactNode }) {
  return <SafeArea>{children}</SafeArea>;
}
