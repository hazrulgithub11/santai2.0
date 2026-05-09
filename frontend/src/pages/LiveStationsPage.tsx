import { motion } from "framer-motion";
import { StationsDashboard } from "@/components/StationsDashboard";

export function LiveStationsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="flex w-full flex-col"
    >
      <StationsDashboard />
    </motion.div>
  );
}
