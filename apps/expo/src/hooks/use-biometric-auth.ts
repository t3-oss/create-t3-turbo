import { useCallback, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

/**
 * Biometric authentication hook — Face ID (iOS) / Fingerprint (Android).
 *
 * Features:
 * - Detects hardware support and enrolled biometrics
 * - Stores user preference in SecureStore
 * - Provides `authenticate()` for on-demand checks (e.g. app resume, sensitive actions)
 * - Provides `enableBiometric()` / `disableBiometric()` for settings toggle
 *
 * Usage:
 *   const { isAvailable, isEnabled, authenticate, enableBiometric, disableBiometric } = useBiometricAuth();
 *
 *   // Gate a sensitive action
 *   const success = await authenticate("Confirm your identity");
 *   if (success) { /* proceed * / }
 *
 *   // Toggle in settings
 *   await enableBiometric();
 */

const BIOMETRIC_ENABLED_KEY = "gmacko:biometric-enabled";

interface BiometricState {
  /** Whether the device has biometric hardware */
  isAvailable: boolean;
  /** Whether the user has enabled biometric auth for this app */
  isEnabled: boolean;
  /** The type of biometric (Face ID, Fingerprint, etc.) */
  biometricType: string | null;
  /** Whether we're still checking hardware/settings */
  isLoading: boolean;
}

interface UseBiometricAuthReturn extends BiometricState {
  /** Prompt for biometric authentication. Returns true on success. */
  authenticate: (reason?: string) => Promise<boolean>;
  /** Enable biometric auth for this app */
  enableBiometric: () => Promise<boolean>;
  /** Disable biometric auth */
  disableBiometric: () => Promise<void>;
}

function getBiometricLabel(types: LocalAuthentication.AuthenticationType[]): string | null {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return Platform.OS === "ios" ? "Face ID" : "Face Unlock";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return Platform.OS === "ios" ? "Touch ID" : "Fingerprint";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return "Iris";
  }
  return null;
}

export function useBiometricAuth(): UseBiometricAuthReturn {
  const [state, setState] = useState<BiometricState>({
    isAvailable: false,
    isEnabled: false,
    biometricType: null,
    isLoading: true,
  });

  useEffect(() => {
    void checkBiometrics();
  }, []);

  async function checkBiometrics() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      const isAvailable = hasHardware && isEnrolled;
      const biometricType = getBiometricLabel(supportedTypes);

      // Check if user has previously enabled biometric auth
      const storedPref = SecureStore.getItem(BIOMETRIC_ENABLED_KEY);
      const isEnabled = isAvailable && storedPref === "true";

      setState({
        isAvailable,
        isEnabled,
        biometricType,
        isLoading: false,
      });
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }

  const authenticate = useCallback(
    async (reason?: string): Promise<boolean> => {
      if (!state.isAvailable) return false;

      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: reason ?? "Authenticate to continue",
          fallbackLabel: "Use passcode",
          cancelLabel: "Cancel",
          disableDeviceFallback: false,
        });

        return result.success;
      } catch {
        return false;
      }
    },
    [state.isAvailable],
  );

  const enableBiometric = useCallback(async (): Promise<boolean> => {
    if (!state.isAvailable) {
      Alert.alert(
        "Not Available",
        `${state.biometricType ?? "Biometric authentication"} is not available on this device. Make sure it's set up in your device settings.`,
      );
      return false;
    }

    // Verify the user can authenticate before enabling
    const success = await authenticate(
      `Enable ${state.biometricType ?? "biometric"} login`,
    );

    if (success) {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
      setState((prev) => ({ ...prev, isEnabled: true }));
      return true;
    }

    return false;
  }, [state.isAvailable, state.biometricType, authenticate]);

  const disableBiometric = useCallback(async (): Promise<void> => {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    setState((prev) => ({ ...prev, isEnabled: false }));
  }, []);

  return {
    ...state,
    authenticate,
    enableBiometric,
    disableBiometric,
  };
}
