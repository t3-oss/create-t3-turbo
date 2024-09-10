import type { CollectionConfig } from "payload";

export const Customers: CollectionConfig = {
  slug: "customers",
  admin: {
    useAsTitle: "email",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: false,
    },
    {
      name: "email",
      type: "email",
      unique: true,
      required: false,
      index: true,
    },
    {
      name: "emailVerified",
      type: "number",
      required: false,
    },
    {
      name: "image",
      type: "text",
      required: false,
    },
  ],
};
