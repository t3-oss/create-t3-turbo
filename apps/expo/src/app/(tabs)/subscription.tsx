import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { CustomerInfo, PurchasesOfferings, PurchasesPackage } from "@gmacko/purchases";
import {
  getCustomerInfo,
  getOfferings,
  hasActiveEntitlement,
  purchasePackage,
  restorePurchases,
} from "@gmacko/purchases";
import { integrations } from "@gmacko/config";

import { Badge } from "~/components/avatar";
import { Card } from "~/components/card";
import { LoadingSpinner } from "~/components/loading";

/**
 * Subscription / Paywall screen — in-app purchases via RevenueCat.
 *
 * Features:
 * - Fetches offerings from RevenueCat
 * - Shows current plan and entitlements
 * - Purchase flow with native IAP sheet
 * - Restore purchases button (Apple requirement)
 * - Graceful fallback when RevenueCat is disabled
 *
 * Apple App Store Review Guidelines:
 * - 3.1.1: All digital content must use IAP
 * - 3.1.2: Subscriptions must use StoreKit
 * - "Restore Purchases" button is REQUIRED
 */

const ENTITLEMENT_PRO = "pro";

interface Plan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  pkg: PurchasesPackage | null;
  isCurrent: boolean;
}

const FALLBACK_PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Get started with the basics",
    features: [
      "Up to 3 projects",
      "1 workspace",
      "Community support",
      "Basic analytics",
    ],
    pkg: null,
    isCurrent: true,
  },
  {
    id: "pro_monthly",
    name: "Pro",
    price: "$9.99/mo",
    description: "Everything you need to grow",
    features: [
      "Unlimited projects",
      "Unlimited workspaces",
      "Priority support",
      "Advanced analytics",
      "Custom domains",
      "Team collaboration",
    ],
    pkg: null,
    isCurrent: false,
  },
  {
    id: "pro_annual",
    name: "Pro (Annual)",
    price: "$79.99/yr",
    description: "Save 33% with annual billing",
    features: [
      "Everything in Pro",
      "2 months free",
      "Early access to features",
    ],
    pkg: null,
    isCurrent: false,
  },
];

export default function SubscriptionScreen() {
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const isPro = customerInfo
    ? hasActiveEntitlement(customerInfo, ENTITLEMENT_PRO)
    : false;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [offeringsResult, customerResult] = await Promise.all([
        getOfferings(),
        getCustomerInfo(),
      ]);
      setOfferings(offeringsResult);
      setCustomerInfo(customerResult);
    } catch {
      // RevenueCat might not be configured
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handlePurchase(pkg: PurchasesPackage) {
    setIsPurchasing(true);
    try {
      const info = await purchasePackage(pkg);
      if (info) {
        setCustomerInfo(info);
        Alert.alert("Success!", "Your subscription is now active.");
      }
    } catch (error: unknown) {
      const err = error as { userCancelled?: boolean };
      if (!err.userCancelled) {
        Alert.alert("Purchase Failed", "Please try again later.");
      }
    }
    setIsPurchasing(false);
  }

  async function handleRestore() {
    setIsLoading(true);
    try {
      const info = await restorePurchases();
      if (info) {
        setCustomerInfo(info);
        const restored = hasActiveEntitlement(info, ENTITLEMENT_PRO);
        Alert.alert(
          restored ? "Restored!" : "No Purchases Found",
          restored
            ? "Your Pro subscription has been restored."
            : "We couldn't find any previous purchases for this account.",
        );
      }
    } catch {
      Alert.alert("Error", "Failed to restore purchases. Please try again.");
    }
    setIsLoading(false);
  }

  // Build plans from RevenueCat offerings or use fallback
  const plans: Plan[] = [];

  if (offerings?.current) {
    const pkgs = offerings.current.availablePackages;
    // Add free plan
    plans.push({
      ...FALLBACK_PLANS[0]!,
      isCurrent: !isPro,
    });
    // Add RevenueCat packages
    for (const pkg of pkgs) {
      plans.push({
        id: pkg.identifier,
        name: pkg.product.title,
        price: pkg.product.priceString,
        description: pkg.product.description,
        features: FALLBACK_PLANS[1]?.features ?? [],
        pkg,
        isCurrent: isPro,
      });
    }
  } else {
    // Fallback when RevenueCat is not configured
    plans.push(...FALLBACK_PLANS);
  }

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top"]}>
      {/* Header */}
      <View className="items-center border-b border-zinc-200 px-6 py-6 dark:border-zinc-800">
        <Text className="text-foreground text-2xl font-bold">
          Choose your plan
        </Text>
        <Text className="text-muted-foreground mt-1 text-center text-sm">
          Upgrade to unlock all features
        </Text>
        {isPro && (
          <Badge label="PRO" variant="default" />
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <LoadingSpinner size="large" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 py-4 pb-8"
        >
          {/* Plan cards */}
          <View className="gap-4">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={
                  plan.isCurrent && isPro
                    ? "border-primary border-2"
                    : ""
                }
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-foreground text-lg font-bold">
                      {plan.name}
                    </Text>
                    <Text className="text-primary text-xl font-bold">
                      {plan.price}
                    </Text>
                  </View>
                  {plan.isCurrent && isPro && (
                    <Badge label="Current" variant="default" />
                  )}
                  {plan.id === "free" && !isPro && (
                    <Badge label="Current" variant="secondary" />
                  )}
                </View>

                <Text className="text-muted-foreground mt-1 text-sm">
                  {plan.description}
                </Text>

                {/* Features */}
                <View className="mt-3 gap-1.5">
                  {plan.features.map((feature) => (
                    <View key={feature} className="flex-row items-center gap-2">
                      <Text className="text-primary text-xs">&#10003;</Text>
                      <Text className="text-foreground text-sm">{feature}</Text>
                    </View>
                  ))}
                </View>

                {/* Purchase button */}
                {plan.pkg && !isPro && (
                  <Pressable
                    onPress={() => handlePurchase(plan.pkg!)}
                    disabled={isPurchasing}
                    className="bg-primary mt-4 items-center rounded-lg py-3"
                    style={{ opacity: isPurchasing ? 0.7 : 1 }}
                  >
                    <Text className="text-primary-foreground font-semibold">
                      {isPurchasing ? "Processing..." : `Subscribe — ${plan.price}`}
                    </Text>
                  </Pressable>
                )}
              </Card>
            ))}
          </View>

          {/* Restore purchases — REQUIRED by Apple */}
          <Pressable onPress={handleRestore} className="mt-6 items-center py-3">
            <Text className="text-primary text-sm font-medium">
              Restore Purchases
            </Text>
          </Pressable>

          {/* Legal */}
          <View className="mt-4 px-4">
            <Text className="text-muted-foreground text-center text-[10px] leading-4">
              Payment will be charged to your Apple ID or Google Play account at
              confirmation of purchase. Subscriptions automatically renew unless
              cancelled at least 24 hours before the end of the current period.
              You can manage and cancel subscriptions in your device settings.
            </Text>
            <View className="mt-2 flex-row justify-center gap-4">
              <Text className="text-muted-foreground text-[10px] underline">
                Terms of Service
              </Text>
              <Text className="text-muted-foreground text-[10px] underline">
                Privacy Policy
              </Text>
            </View>
          </View>

          {/* Debug info (dev only) */}
          {!integrations.revenuecat && (
            <Card className="mt-6">
              <Text className="text-muted-foreground text-center text-xs">
                RevenueCat is not configured. Enable it in
                packages/config/src/integrations.ts and set your API key.
              </Text>
            </Card>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
