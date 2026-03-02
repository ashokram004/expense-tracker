import { Stack } from "expo-router";
import { useEffect } from "react";
import { initDB } from "../src/db/database";
import { usePlanStore } from "../src/store/planStore";

export default function Layout() {
  const hydrate = usePlanStore((s) => s.hydrate);

  useEffect(() => {
    initDB();
    hydrate();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTitle: "Budget Buckets",
        headerTitleStyle: {
          color: "#E94560",
          fontSize: 20,
          fontWeight: "700",
        },
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },
        headerLargeTitle: false,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: "#F8F9FA",
        },
      }}
    />
  );
}
