import { motion } from "framer-motion";
import { AdminDashboard } from "@/components/AdminDashboard";
import { PlugControl } from "@/components/PlugControl";

export function AdminPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex w-full max-w-5xl flex-col items-stretch gap-10"
    >
      <div className="text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Admin
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Control the plug and start station sessions from one place.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div className="flex justify-center lg:justify-start">
          <PlugControl />
        </div>
        <div className="min-w-0 lg:col-span-1">
          <AdminDashboard />
        </div>
      </div>
    </motion.div>
  );
}
