import { CreatePostSchema } from "@acme/validators";
import { Title } from "@solidjs/meta";
import {
  type SourceAccessor,
  For,
  Show,
  affects,
  createMemo,
  createSignal,
  refresh,
} from "solid-js";

import { api } from "../lib/api";
import { authClient } from "../lib/auth";

type SessionResult = Awaited<ReturnType<typeof authClient.getSession>>;
type PostsResult = Awaited<ReturnType<typeof api.api.posts.get>>;

function AuthShowcase(props: { session: SourceAccessor<SessionResult> }) {
  const signIn = () => {
    void authClient.signIn.social({ provider: "discord", callbackURL: "/" });
  };

  const signOut = () => {
    void authClient.signOut().then(() => {
      affects(props.session);
      void refresh(props.session);
    });
  };

  return (
    <section class="auth">
      <Show
        when={props.session().data?.user}
        fallback={
          <button type="button" onClick={signIn}>
            Sign in with Discord
          </button>
        }
      >
        {(user) => (
          <div class="signed-in">
            <span>Signed in as {user().name ?? user().email}</span>
            <button type="button" onClick={signOut}>
              Sign out
            </button>
          </div>
        )}
      </Show>
    </section>
  );
}

function CreatePostForm(props: { onCreated: () => void }) {
  const [title, setTitle] = createSignal("");
  const [content, setContent] = createSignal("");
  const [formError, setFormError] = createSignal<string | null>(null);

  const submit = (event: Event) => {
    event.preventDefault();
    const parsed = CreatePostSchema.safeParse({
      title: title(),
      content: content(),
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid post");
      return;
    }
    setFormError(null);
    void api.api.posts.post(parsed.data).then((res) => {
      if (res.error) {
        setFormError(`Creating the post failed (${res.error.status})`);
        return;
      }
      setTitle("");
      setContent("");
      props.onCreated();
    });
  };

  return (
    <form class="post-form" onSubmit={submit}>
      <h2>Create a post</h2>
      <label>
        Title
        <input
          type="text"
          maxlength={256}
          required
          value={title()}
          onInput={(e) => setTitle(e.currentTarget.value)}
        />
      </label>
      <label>
        Content
        <textarea required value={content()} onInput={(e) => setContent(e.currentTarget.value)} />
      </label>
      <Show when={formError()}>{(message) => <p class="form-error">{message()}</p>}</Show>
      <button type="submit">Create</button>
    </form>
  );
}

function PostList(props: { posts: SourceAccessor<PostsResult> }) {
  return (
    <section class="post-list">
      <h2>Posts</h2>
      <Show when={props.posts().data} fallback={<p class="empty">No posts yet.</p>}>
        {(items) => (
          <ul>
            <For each={items()} fallback={<p class="empty">No posts yet.</p>}>
              {(post) => (
                <li>
                  <h3>{post.title}</h3>
                  <p>{post.content}</p>
                </li>
              )}
            </For>
          </ul>
        )}
      </Show>
    </section>
  );
}

export default function Home() {
  const session = createMemo(() => authClient.getSession());
  const posts = createMemo(() => api.api.posts.get());

  const reloadPosts = () => {
    affects(posts);
    void refresh(posts);
  };

  return (
    <main>
      <Title>Acme Posts</Title>
      <AuthShowcase session={session} />
      <Show when={session().data?.user}>
        <CreatePostForm onCreated={reloadPosts} />
      </Show>
      <PostList posts={posts} />
    </main>
  );
}
