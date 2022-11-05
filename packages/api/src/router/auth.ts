import { protectedProcedure, publicProcedure, router } from "../trpc";

export const authRouter = router({
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
  getSecretMessage: protectedProcedure.query(({ ctx }) => {
    // testing type validation of overridden next-auth Session in @acme/auth package
    return `
        Hello ${ctx.session.user.id}
        You are logged in and can see this secret message!
    `;
  }),
});
