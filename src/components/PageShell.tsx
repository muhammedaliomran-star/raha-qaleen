import type { ReactNode } from "react";
import { Navbar } from "./Navbar";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="px-3 sm:px-6 max-w-7xl mx-auto py-6 sm:py-10">{children}</main>
      <footer className="mt-16 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} RAHA — QALEEN. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
}
