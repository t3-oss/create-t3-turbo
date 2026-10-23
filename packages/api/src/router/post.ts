import { Elysia } from "elysia";

import type { Auth } from "@acme/auth";
import type { Orm } from "@acme/db";
import { Post } from "@acme/db";
import { CreatePostSchema } from "@acme/validators";

import { authed } from "../middleware";

export const postRoutes = (auth: Auth, orm: Orm) =>
  new Elysia()
    .use(authed(auth))
    .get("/api/posts", async () => {
      const kysely = orm.em.getKysely();
      return kysely
        .selectFrom("post")
        .selectAll()
        .orderBy("created_at", "desc")
        .limit(10)
        .execute();
    })
    .get("/api/posts/:id", ({ params: { id } }) =>
      orm.em.fork().findOne(Post, { id }),
    )
    .post(
      "/api/posts",
      async ({ body }) => {
        // mikro-orm 7 forbids context actions on the global EntityManager — fork per request.
        // p.uuid() has no generator and the DDL has no default, so the route supplies the id.
        const em = orm.em.fork();
        const post = em.create(Post, { ...body, id: crypto.randomUUID() });
        await em.flush();
        return post;
      },
      { body: CreatePostSchema, auth: true },
    )
    .delete(
      "/api/posts/:id",
      async ({ params: { id } }) => {
        const em = orm.em.fork();
        const post = await em.findOne(Post, { id });
        if (post) {
          em.remove(post);
          await em.flush();
        }
        return post;
      },
      { auth: true },
    );
