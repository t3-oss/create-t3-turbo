import { defineEntity, p } from "@mikro-orm/core";

export const Post = defineEntity({
  name: "Post",
  tableName: "post",
  properties: {
    id: p.uuid().primary(),
    title: p.string().length(256),
    content: p.text(),
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p
      .datetime()
      .onCreate(() => new Date())
      .onUpdate(() => new Date()),
  },
});
