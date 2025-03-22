import { auth } from "@acme/auth";

const handler = auth.handler;

export { handler as GET, handler as POST };
