import NextAuth from "next-auth";

import { authOptions } from "@acme/auth";

// export const runtime = "edge";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
