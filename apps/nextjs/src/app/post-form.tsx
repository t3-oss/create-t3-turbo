"use client";

import * as React from "react";

import { SubmitButton } from "./submit-button";

export function CreatePostForm(props: {
  action: (fd: FormData) => Promise<void>;
}) {
  const ref = React.useRef<HTMLFormElement>(null);

  return (
    <form ref={ref} className="flex w-full max-w-2xl flex-col">
      <input
        name="title"
        className="mb-2 rounded bg-white/10 p-2 text-white"
        placeholder="Title"
      />
      <input
        className="mb-2 rounded bg-white/10 p-2 text-white"
        name="content"
        placeholder="Content"
      />
      <SubmitButton
        type="submit"
        formAction={async (fd) => {
          await props.action(fd);
          ref.current?.reset();
        }}
      >
        Create
      </SubmitButton>
    </form>
  );
}
