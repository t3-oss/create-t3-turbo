import { Title } from "@solidjs/meta";
import { For } from "solid-js";
import users from "../../data/users.json";
import { paths } from "../../router";

// The layout's index page: what /users itself renders inside users.tsx.
// Without an index, /users would fall through to the [...404] catch-all.
export default function UsersIndex() {
  return (
    <section>
      <Title>Users - Solid App</Title>
      <ul>
        <For each={Object.entries(users)}>
          {([id, user]) => (
            <li>
              <a href={paths.users(Number(id))}>{user.name}</a>
            </li>
          )}
        </For>
      </ul>
    </section>
  );
}
