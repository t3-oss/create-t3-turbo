import type { ReactNode } from "react";
import { Text, View } from "react-native";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <View className={`border-border bg-card rounded-xl border p-4 ${className}`}>
      {children}
    </View>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  trend?: { value: string; positive: boolean };
  icon?: ReactNode;
}

export function StatCard({ label, value, trend, icon }: StatCardProps) {
  return (
    <Card className="flex-1">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-muted-foreground text-xs font-medium">
          {label}
        </Text>
        {icon && <View className="text-muted-foreground">{icon}</View>}
      </View>
      <Text className="text-foreground text-2xl font-bold">{value}</Text>
      {trend && (
        <Text
          className={`mt-1 text-xs font-medium ${
            trend.positive ? "text-green-500" : "text-red-500"
          }`}
        >
          {trend.positive ? "+" : ""}
          {trend.value}
        </Text>
      )}
    </Card>
  );
}
