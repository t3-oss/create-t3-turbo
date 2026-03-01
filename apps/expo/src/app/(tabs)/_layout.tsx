import { useColorScheme } from "react-native";
import { Tabs } from "expo-router";

/**
 * Tab layout — bottom tab navigator for the main app screens.
 *
 * Tabs:
 * - Home (Dashboard overview)
 * - Projects (List & manage projects)
 * - Notifications (In-app notifications)
 * - Profile (Account, settings, sign out)
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const tintColor = isDark ? "#C084FC" : "#9333EA";
  const inactiveColor = isDark ? "#71717A" : "#A1A1AA";
  const backgroundColor = isDark ? "#09090B" : "#FFFFFF";
  const borderColor = isDark ? "#27272A" : "#E4E4E7";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tintColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor,
          borderTopColor: borderColor,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: "Projects",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="projects" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="notifications" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="profile" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

/**
 * Simple SVG-free tab bar icon using Unicode characters.
 * Replace with @expo/vector-icons or a custom icon set in production.
 */
import { Text } from "react-native";

const ICONS: Record<string, string> = {
  home: "\u2302",        // ⌂
  projects: "\u25A3",    // ▣
  notifications: "\u266A", // ♪ (bell-like)
  profile: "\u2603",     // ☃ (placeholder)
};

// Using simple text-based icons to avoid adding a dependency.
// Swap these for proper vector icons (lucide-react-native, @expo/vector-icons, etc.)
function TabBarIcon({
  name,
  color,
  size,
}: {
  name: string;
  color: string;
  size: number;
}) {
  return (
    <Text style={{ color, fontSize: size, lineHeight: size + 4 }}>
      {ICONS[name] ?? "?"}
    </Text>
  );
}
