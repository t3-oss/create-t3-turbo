"use client";

import { Button } from "@gmacko/ui/button";
import { Input } from "@gmacko/ui/input";
import { useState } from "react";

import { authClient } from "~/auth/client";

export function DeviceApprovalForm({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [status, setStatus] = useState<
    "idle" | "working" | "approved" | "denied" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (action: "approve" | "deny") => {
    const userCode = code.trim().toUpperCase();
    if (!userCode) {
      setStatus("error");
      setMessage("Enter the code shown on your device.");
      return;
    }
    setStatus("working");
    setMessage(null);

    const { error } =
      action === "approve"
        ? await authClient.device.approve({ userCode })
        : await authClient.device.deny({ userCode });

    if (error) {
      setStatus("error");
      setMessage(error.error_description || "Could not process this code.");
      return;
    }
    setStatus(action === "approve" ? "approved" : "denied");
  };

  if (status === "approved") {
    return (
      <div className="rounded-lg border border-green-500 bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
        Device approved. You can return to it — it will sign in automatically.
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="rounded-lg border p-4 text-sm">
        Device denied. The code can no longer be used.
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-6">
      {message && (
        <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {message}
        </p>
      )}
      <label htmlFor="device-code" className="mb-2 block text-sm font-medium">
        Device code
      </label>
      <Input
        id="device-code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="ABCD-EFGH"
        autoCapitalize="characters"
        autoCorrect="off"
        className="text-center text-lg tracking-[0.3em] placeholder:tracking-normal"
      />
      <div className="mt-4 flex gap-2">
        <Button
          className="flex-1"
          onClick={() => void submit("approve")}
          disabled={status === "working"}
        >
          {status === "working" ? "Working…" : "Approve device"}
        </Button>
        <Button
          variant="outline"
          onClick={() => void submit("deny")}
          disabled={status === "working"}
        >
          Deny
        </Button>
      </div>
    </div>
  );
}
