import { motion } from "framer-motion";
import { AdminDashboard } from "@/components/AdminDashboard";
import { PlugControl } from "@/components/PlugControl";
import { AdminTopNav } from "@/components/AdminTopNav";

export function AdminPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex w-full max-w-5xl flex-col items-stretch gap-8"
    >
      <AdminTopNav />

      <div className="text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-white">
          Admin
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Control the plug and start station sessions from one place.
        </p>
      </div>

      <div className="min-w-0">
        <AdminDashboard />
      </div>

      <div className="pt-2">
        <p className="mb-3 text-xs uppercase tracking-widest text-white/45">
          Test tools
        </p>
        <div className="max-w-md">
          <PlugControl />
        </div>
      </div>
    </motion.div>
  );
}
