import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <SafeAreaView className="bg-background flex-1">
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" className="text-primary mb-4" />
        {message && (
          <Text className="text-muted-foreground text-sm">{message}</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

export function LoadingSpinner({ size = "small" }: { size?: "small" | "large" }) {
  return <ActivityIndicator size={size} className="text-primary" />;
}
