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

  return <Stack />;
}