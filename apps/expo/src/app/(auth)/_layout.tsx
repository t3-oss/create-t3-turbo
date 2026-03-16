import { useColorScheme } from "react-native";
import { Stack } from "expo-router";

/**
 * Auth layout — headerless stack for sign-in, sign-up, forgot-password.
 */
export default function AuthLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? "#09090B" : "#FFFFFF",
        },
      }}
    />
  );
}
