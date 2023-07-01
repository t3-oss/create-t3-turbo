import type { Session } from "next-auth";

type SessionOptions = {
  ctx: {
    session: Omit<Session, "expires"> | null;
  };
};

export const sessionHandler = async ({ ctx }: SessionOptions) => {
  return ctx.session;
};
