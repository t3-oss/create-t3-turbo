import type { CollectionConfig } from "payload";

export const Accounts: CollectionConfig = {
  slug: "accounts",
  fields: [
    // {
    //   name: "id",
    //   type: "text",
    //   defaultValue: ({siblingData}) => {
    //     return siblingData.provider + siblingData.providerAccountId;
    //   },
    // },
    {
      name: "user",
      type: "relationship",
      relationTo: "customers",
      required: true,
      index: true,
    },
    {
      name: "type",
      type: "select",
      required: true,
      options: ["oauth", "oidc", "email", "webauthn"],
      hasMany: false,
    },
    {
      name: "provider",
      type: "text",
      required: true,
    },
    {
      name: "providerAccountId",
      type: "text",
      required: true,
    },
    {
      name: "refreshToken",
      type: "text",
      required: false,
    },
    {
      name: "accessToken",
      type: "text",
      required: false,
    },
    {
      name: "accessTokenExpires",
      type: "number",
      required: false,
    },
    {
      name: "expires_at",
      type: "number",
      required: false,
    },
    {
      name: "token_type",
      type: "text",
      required: false,
    },
    {
      name: "scope",
      type: "text",
      required: false,
    },
    {
      name: "id_token",
      type: "text",
      required: false,
    },
    {
      name: "session_state",
      type: "text",
      required: false,
    },
  ],
} as const;
