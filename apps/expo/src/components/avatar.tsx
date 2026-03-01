import { Text, View } from "react-native";

interface AvatarProps {
  name?: string | null;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
} as const;

const textSizeMap = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
} as const;

export function Avatar({ name, size = "md" }: AvatarProps) {
  const initial = (name ?? "U").charAt(0).toUpperCase();

  return (
    <View
      className={`bg-primary items-center justify-center rounded-full ${sizeMap[size]}`}
    >
      <Text className={`text-primary-foreground font-bold ${textSizeMap[size]}`}>
        {initial}
      </Text>
    </View>
  );
}

interface BadgeProps {
  label: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

const variantMap = {
  default: "bg-primary",
  secondary: "bg-secondary",
  destructive: "bg-destructive",
  outline: "border-border border bg-transparent",
} as const;

const textVariantMap = {
  default: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  destructive: "text-destructive-foreground",
  outline: "text-foreground",
} as const;

export function Badge({ label, variant = "default" }: BadgeProps) {
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${variantMap[variant]}`}>
      <Text className={`text-xs font-semibold ${textVariantMap[variant]}`}>
        {label}
      </Text>
    </View>
  );
}
