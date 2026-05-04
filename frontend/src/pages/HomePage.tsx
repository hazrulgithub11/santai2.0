import { motion } from "framer-motion";
import { StationsDashboard } from "@/components/StationsDashboard";

export function HomePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex w-full max-w-5xl flex-col items-stretch gap-10"
    >
      <div className="text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Santai
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Live station availability and session countdown.
        </p>
      </div>
      <StationsDashboard />
    </motion.div>
  );
}
