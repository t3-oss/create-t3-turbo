import { Title } from "@solidjs/meta";
import { query, type RouteDefinition, type RouteProps } from "@solidjs/router";
import { createMemo, isPending } from "solid-js";
import users from "../../data/users.json";
import { paths } from "../../router";

// Async data loading: a query (cached per key) read through a memo — the
// surrounding <Loading> boundary (in App.tsx) shows its fallback until the
// promise settles. The data is a local JSON module here; swap the body for
// any API call — an absolute URL, or a server function (see the `fullstack`
// template). Avoid fetching your own origin during SSR: behind a proxy the
// incoming Host header rarely routes back to this server.
const getUser = query(async (id: string) => {
  return (
    users[id as keyof typeof users] ?? {
      name: "Unknown",
      title: "No such user",
    }
  );
}, "user");

// Starts the fetch as soon as navigation begins, before the page renders.
export const route = {
  preload: ({ params }) => void getUser(params.id!),
} satisfies RouteDefinition;

export default function User(props: RouteProps<"/users/:id">) {
  const user = createMemo(() => getUser(props.params.id));

  return (
    <section style={{ opacity: isPending(user) ? 0.5 : 1 }}>
      <Title>{`User ${props.params.id} - Solid App`}</Title>
      <h2>{user().name}</h2>
      <p>{user().title}</p>
      <p>
        <a href={paths.users(Number(props.params.id) + 1)}>Next user</a>
      </p>
    </section>
  );
}
