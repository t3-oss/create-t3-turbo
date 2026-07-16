import { PAIRING_CLIENT_ID } from "@gmacko/config";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Linking from "expo-linking";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { authClient } from "~/utils/auth";
import { parsePairingQR } from "~/utils/pairing";
import { setToken } from "~/utils/session-store";

type PairMode = "choose" | "qr" | "code";

interface PendingAuth {
  token: string;
  email: string;
}

export default function PairDeviceScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const [mode, setMode] = useState<PairMode>("choose");
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A redeemed-but-not-yet-committed session. Scanning a QR authenticates as
  // whoever generated it, so we surface the identity and require an explicit
  // confirmation before persisting the token (guards against pairing into an
  // attacker's account via a planted QR).
  const [pendingAuth, setPendingAuth] = useState<PendingAuth | null>(null);

  const [userCode, setUserCode] = useState<string | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [polling, setPolling] = useState(false);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Polling re-arms itself after an awaited network call, so clearing the
  // armed timer alone can't stop an in-flight tick — the flag covers that.
  const pollCancelledRef = useRef(false);
  const scanningRef = useRef(false);

  const clearPollTimer = useCallback(() => {
    pollCancelledRef.current = true;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    pollTimerRef.current = null;
  }, []);

  useEffect(() => clearPollTimer, [clearPollTimer]);

  /**
   * Exchange a device code for a session token WITHOUT committing it. On
   * success we peek at the session (bearer sent only on this call) to learn
   * which account the code belongs to, and stage it for confirmation.
   */
  const redeemDeviceCode = useCallback(
    async (
      deviceCode: string,
    ): Promise<"ok" | "pending" | "slow_down" | "failed"> => {
      const { data, error: tokenError } = await authClient.device.token({
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        device_code: deviceCode,
        client_id: PAIRING_CLIENT_ID,
      });

      if (data?.access_token) {
        const token = data.access_token;
        const { data: sessionData } = await authClient.getSession({
          fetchOptions: { headers: { Authorization: `Bearer ${token}` } },
        });
        setPendingAuth({
          token,
          email: sessionData?.user.email ?? "this account",
        });
        return "ok";
      }

      if (tokenError?.error === "authorization_pending") return "pending";
      if (tokenError?.error === "slow_down") return "slow_down";
      return "failed";
    },
    [],
  );

  /** Commit the confirmed session: persist the token and enter the app. */
  const confirmPairing = useCallback(async () => {
    if (!pendingAuth) return;
    setToken(pendingAuth.token);
    // getSession now reads the stored bearer (fetchOptions.auth.token) and
    // updates the session atom useSession() subscribes to.
    await authClient.getSession();
    router.replace("/");
  }, [pendingAuth, router]);

  const cancelPairing = useCallback(() => {
    setPendingAuth(null);
    setRedeeming(false);
    scanningRef.current = false;
    setMode("choose");
  }, []);

  // --- QR scan ---
  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanningRef.current || redeeming) return;
      const payload = parsePairingQR(data);
      if (!payload) {
        setError("That isn't a pairing QR from this app's web settings.");
        return;
      }
      scanningRef.current = true;
      setRedeeming(true);
      setError(null);
      void redeemDeviceCode(payload.code).then((result) => {
        if (result !== "ok") {
          setError(
            "That pairing code is invalid or expired. Generate a new one in the web app's Settings.",
          );
          setRedeeming(false);
          scanningRef.current = false;
        }
      });
    },
    [redeemDeviceCode, redeeming],
  );

  // --- Device-authorization grant (user code) ---
  const pollForApproval = useCallback(
    (deviceCode: string, intervalSeconds: number) => {
      pollCancelledRef.current = false;
      let interval = Math.max(1, intervalSeconds);
      const scheduleTick = () => {
        pollTimerRef.current = setTimeout(() => void tick(), interval * 1000);
      };
      const tick = async () => {
        const result = await redeemDeviceCode(deviceCode);
        if (pollCancelledRef.current) return;
        if (result === "pending") {
          scheduleTick();
        } else if (result === "slow_down") {
          // RFC 8628: back off by 5 seconds when the server says slow_down.
          interval += 5;
          scheduleTick();
        } else if (result === "ok") {
          // Staged for confirmation; stop polling.
          setPolling(false);
        } else {
          setPolling(false);
          setError("That code expired. Request a new one.");
          setUserCode(null);
          setVerificationUrl(null);
        }
      };
      scheduleTick();
    },
    [redeemDeviceCode],
  );

  const startDeviceFlow = useCallback(async () => {
    setError(null);
    setRequesting(true);
    const { data, error: codeError } = await authClient.device.code({
      client_id: PAIRING_CLIENT_ID,
    });
    setRequesting(false);

    if (codeError || !data) {
      setError("Couldn't reach the server right now. Try again.");
      return;
    }
    setUserCode(data.user_code);
    setVerificationUrl(data.verification_uri_complete);
    setPolling(true);
    pollForApproval(data.device_code, data.interval);
  }, [pollForApproval]);

  const goChoose = useCallback(() => {
    clearPollTimer();
    setPolling(false);
    setUserCode(null);
    setVerificationUrl(null);
    setError(null);
    setRedeeming(false);
    setPendingAuth(null);
    scanningRef.current = false;
    setMode("choose");
  }, [clearPollTimer]);

  // --- Confirm identity (redeemed, awaiting explicit sign-in) ---
  if (pendingAuth) {
    return (
      <SafeAreaView className="bg-background h-full">
        <Stack.Screen options={{ title: "Confirm" }} />
        <View className="flex h-full justify-center gap-3 p-8">
          <Text className="text-foreground text-center text-2xl font-bold">
            Sign in to this account?
          </Text>
          <Text className="text-muted-foreground pb-4 text-center">
            This will sign this device in as{"\n"}
            <Text className="text-foreground font-semibold">
              {pendingAuth.email}
            </Text>
          </Text>
          <Pressable
            testID="pair-confirm"
            className="bg-primary items-center rounded-md p-4"
            onPress={() => void confirmPairing()}
          >
            <Text className="font-semibold">Continue</Text>
          </Pressable>
          <Pressable className="items-center p-3" onPress={cancelPairing}>
            <Text className="text-muted-foreground">Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // --- Choose ---
  if (mode === "choose") {
    return (
      <SafeAreaView className="bg-background h-full">
        <Stack.Screen options={{ title: "Pair Device" }} />
        <View className="flex h-full justify-center gap-3 p-8">
          <Text className="text-foreground text-center text-2xl font-bold">
            Sign in with another device
          </Text>
          <Text className="text-muted-foreground pb-4 text-center">
            Use a browser where you're already signed in.
          </Text>

          <Pressable
            testID="pair-scan-qr"
            className="bg-primary items-center rounded-md p-4"
            onPress={async () => {
              setError(null);
              if (permission?.granted) {
                setMode("qr");
                return;
              }
              const result = await requestPermission();
              if (result.granted) {
                setMode("qr");
              } else {
                setMode("code");
                void startDeviceFlow();
              }
            }}
          >
            <Text className="font-semibold">Scan QR Code</Text>
          </Pressable>
          <Text className="text-muted-foreground text-center text-xs">
            Web app → Settings → Pair Mobile Device
          </Text>

          <Pressable
            testID="pair-device-code"
            className="border-input items-center rounded-md border p-4"
            onPress={() => {
              setMode("code");
              void startDeviceFlow();
            }}
          >
            <Text className="text-foreground font-semibold">Enter a Code</Text>
          </Pressable>

          {error && (
            <Text className="text-destructive text-center">{error}</Text>
          )}

          <Pressable className="items-center p-3" onPress={() => router.back()}>
            <Text className="text-muted-foreground">Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // --- Device code ---
  if (mode === "code") {
    return (
      <SafeAreaView className="bg-background h-full">
        <Stack.Screen options={{ title: "Enter Code" }} />
        <View className="flex h-full justify-center gap-3 p-8">
          {userCode ? (
            <>
              <Text className="text-muted-foreground text-center">
                Approve this code in a browser where you're signed in:
              </Text>
              <View className="border-input items-center rounded-lg border px-6 py-4">
                <Text className="text-foreground text-3xl font-bold tracking-[6px]">
                  {userCode}
                </Text>
              </View>
              {verificationUrl && (
                <Pressable
                  className="bg-primary items-center rounded-md p-4"
                  onPress={() => void Linking.openURL(verificationUrl)}
                >
                  <Text className="font-semibold">Open in Browser</Text>
                </Pressable>
              )}
              {polling && (
                <View className="flex-row items-center justify-center gap-2">
                  <ActivityIndicator size="small" />
                  <Text className="text-muted-foreground">
                    Waiting for approval…
                  </Text>
                </View>
              )}
            </>
          ) : (
            <Pressable
              className="bg-primary items-center rounded-md p-4"
              onPress={() => void startDeviceFlow()}
              disabled={requesting}
            >
              {requesting ? (
                <ActivityIndicator />
              ) : (
                <Text className="font-semibold">Get Code</Text>
              )}
            </Pressable>
          )}

          {error && (
            <Text className="text-destructive text-center">{error}</Text>
          )}

          <Pressable className="items-center p-3" onPress={goChoose}>
            <Text className="text-muted-foreground">Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // --- QR scan ---
  return (
    <View className="h-full">
      <Stack.Screen options={{ title: "Scan QR Code" }} />
      <CameraView
        testID="pair-camera"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarcodeScanned}
      />
      <View className="h-full items-center justify-center">
        {redeeming ? (
          <View className="bg-background items-center gap-2 rounded-lg p-6">
            <ActivityIndicator />
            <Text className="text-muted-foreground">Signing in…</Text>
          </View>
        ) : (
          <View className="h-56 w-56 rounded-2xl border-4 border-white" />
        )}
      </View>
      {error && (
        <View className="bg-background absolute right-4 bottom-24 left-4 items-center rounded-lg p-3">
          <Text className="text-destructive text-center">{error}</Text>
        </View>
      )}
      <Pressable
        className="absolute right-4 bottom-6 left-4 items-center rounded-md border border-white p-4"
        onPress={goChoose}
      >
        <Text className="font-semibold text-white">Cancel</Text>
      </Pressable>
    </View>
  );
}
