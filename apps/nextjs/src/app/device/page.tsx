import Link from "next/link";

import { getSession } from "~/auth/server";
import { DeviceApprovalForm } from "./_components/device-approval-form";

/**
 * RFC 8628 verification page. A device (mobile app, CLI) shows the user a
 * short code and points them here; approving it signs that device in as the
 * current user. The better-auth deviceAuthorization plugin issues
 * `verification_uri_complete` links of the form /device?user_code=XXXX-XXXX.
 */
export default async function DevicePage({
  searchParams,
}: {
  searchParams: Promise<{ user_code?: string }>;
}) {
  const session = await getSession();
  const { user_code: userCode } = await searchParams;

  return (
    <main className="container mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">Pair a device</h1>
        <p className="text-muted-foreground">
          Approve the code shown on your device to sign it in.
        </p>
      </div>

      {session ? (
        <DeviceApprovalForm initialCode={userCode ?? ""} />
      ) : (
        <div className="rounded-lg border p-6 text-center">
          <p className="text-muted-foreground mb-4 text-sm">
            You need to be signed in to approve a device.
          </p>
          <Link href="/" className="text-sm font-medium underline">
            Sign in, then come back to this page
          </Link>
        </div>
      )}
    </main>
  );
}
