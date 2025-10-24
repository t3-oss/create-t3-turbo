import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { render } from "@react-email/components";

import { initAuth } from "@acme/auth";

import { env } from "~/env";
import { reactInvitationEmail } from "./email/invitation";
import { transporter } from "./email/nodemailer";
import { reactResetPasswordEmail } from "./email/reset-password";

const baseUrl =
  env.VERCEL_ENV === "production"
    ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
    : env.VERCEL_ENV === "preview"
      ? `https://${env.VERCEL_URL}`
      : "http://localhost:3000";

export const auth = initAuth({
  baseUrl,
  productionUrl: `https://${env.VERCEL_PROJECT_PRODUCTION_URL ?? "turbo.t3.gg"}`,
  secret: env.AUTH_SECRET,
  async sendResetPassword({ url, user }) {
    await transporter.sendMail({
      from: env.EMAIL_USER,
      html: await render(
        reactResetPasswordEmail({
          resetLink: url,
          username: user.email,
        }),
      ),
      subject: "Reset your password",
      to: user.email,
    });

    console.log("sendResetPassword", user.email);
  },
  async sendVerificationEmail({ url, user }) {
    await transporter.sendMail({
      from: env.EMAIL_USER,
      html: `<a href="${url}">Verify your email address</a>`,
      subject: "Verify your email address",
      to: user.email,
    });
    console.log("sendVerificationEmail", user.email);
  },
  async sendInvitationEmail(data) {
    await transporter.sendMail({
      from: env.EMAIL_USER,
      html: await render(
        reactInvitationEmail({
          invitedByEmail: data.inviter.user.email,
          invitedByUsername: data.inviter.user.name,
          inviteLink:
            env.NODE_ENV === "development"
              ? `http://localhost:3000/accept-invitation/${data.id}`
              : `${baseUrl}/accept-invitation/${data.id}`,
          teamName: data.organization.name,
          username: data.email,
        }),
      ),
      subject: "You've been invited to join an organization",
      to: data.email,
    });

    console.log("sendInvitationEmail", data.email);
  },
  admins: env.ADMINS,
  // discordClientId: env.AUTH_DISCORD_ID,
  // discordClientSecret: env.AUTH_DISCORD_SECRET,
});

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
