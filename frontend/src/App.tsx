import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/api-base";

function App() {
  const apiBase = getApiBaseUrl();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex max-w-md flex-col items-center gap-4 text-center"
      >
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Santai frontend
        </h1>
        <p className="text-muted-foreground text-sm">
          Vite, React, Tailwind, shadcn/ui, and Framer Motion are wired up. Use{" "}
          <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
            pnpm dlx shadcn@latest add …
          </code>{" "}
          to add more components.
        </p>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex"
        >
          <Button type="button">Motion + Button</Button>
        </motion.div>
        <p className="text-muted-foreground text-xs">
          API base:{" "}
          {apiBase !== undefined ? (
            <code className="text-foreground">{apiBase}</code>
          ) : (
            <span>
              not set — copy{" "}
              <code className="bg-muted rounded px-1 py-0.5">.env.example</code>{" "}
              to <code className="bg-muted rounded px-1 py-0.5">.env</code> and
              set <code className="bg-muted rounded px-1 py-0.5">VITE_API_URL</code>
            </span>
          )}
        </p>
      </motion.div>
    </div>
  );
}

export default App;
