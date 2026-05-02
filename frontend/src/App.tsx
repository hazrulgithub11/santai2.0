import { motion } from "framer-motion";
import { PlugControl } from "@/components/PlugControl";

function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex w-full max-w-lg flex-col items-center gap-6"
      >
        <div className="text-center">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Santai
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Local Tuya smart plug control via the API (no cloud commands).
          </p>
        </div>
        <PlugControl />
      </motion.div>
    </div>
  );
}

export default App;
