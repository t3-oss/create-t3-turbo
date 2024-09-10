import type { CollectionConfig } from "payload";

export const Sessions: CollectionConfig = {
  slug: "sessions",
  fields: [
    {
      name: "sessionToken",
      type: "text",
      required: false,
      index: true,
    },
    {
      name: "userId",
      type: "relationship",
      relationTo: "customers",
      required: true,
    },
    {
      name: "expires",
      type: "number",
      required: false,
    },
  ],
} as const;
