"use client";

import { useState } from "react";

import { cn } from "@gmacko/ui";
import { Button } from "@gmacko/ui/button";

/**
 * AlertDialog — Modal confirmation dialog for destructive actions.
 *
 * Usage:
 *   <AlertDialog
 *     trigger={<Button variant="destructive">Delete</Button>}
 *     title="Delete project?"
 *     description="This action cannot be undone. All data will be permanently deleted."
 *     confirmLabel="Delete"
 *     variant="destructive"
 *     onConfirm={async () => { await deleteProject(id); }}
 *   />
 *
 * For non-destructive confirmations:
 *   <AlertDialog
 *     trigger={<Button>Publish</Button>}
 *     title="Publish article?"
 *     description="This will make the article visible to all users."
 *     confirmLabel="Publish"
 *     onConfirm={handlePublish}
 *   />
 */

interface AlertDialogProps {
  trigger: React.ReactElement;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  className?: string;
}

export function AlertDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  className,
}: AlertDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Trigger — clone to attach onClick */}
      <span onClick={() => setOpen(true)} className="inline-flex">
        {trigger}
      </span>

      {/* Backdrop + Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => !loading && setOpen(false)}
          />

          {/* Dialog */}
          <div
            className={cn(
              "bg-background relative z-10 w-full max-w-md rounded-lg border p-6 shadow-lg",
              className,
            )}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="alert-dialog-title"
            aria-describedby={description ? "alert-dialog-description" : undefined}
          >
            <h2 id="alert-dialog-title" className="text-lg font-semibold">
              {title}
            </h2>
            {description && (
              <p
                id="alert-dialog-description"
                className="text-muted-foreground mt-2 text-sm"
              >
                {description}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                {cancelLabel}
              </Button>
              <Button
                variant={variant === "destructive" ? "destructive" : "default"}
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? "..." : confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
