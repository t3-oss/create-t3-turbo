import { Redirect } from "expo-router";

/**
 * Legacy settings route — redirects to the profile tab
 * which now contains all settings functionality.
 */
export default function SettingsRedirect() {
  return <Redirect href="/(tabs)/profile" />;
}
