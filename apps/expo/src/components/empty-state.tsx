import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      {icon && (
        <View className="bg-muted mb-4 h-16 w-16 items-center justify-center rounded-full">
          {icon}
        </View>
      )}
      <Text className="text-foreground mb-1 text-center text-lg font-semibold">
        {title}
      </Text>
      {description && (
        <Text className="text-muted-foreground mb-4 text-center text-sm">
          {description}
        </Text>
      )}
      {action && (
        <Pressable
          onPress={action.onPress}
          className="bg-primary mt-2 rounded-lg px-6 py-3"
        >
          <Text className="text-primary-foreground font-medium">
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
