import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { LogOut, LayoutDashboard, Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";

export function Navbar() {
  const { user, profile, primaryRole, logout } = useAuth();
  const navigate = useNavigate();

  const dashPath =
    primaryRole === "admin" ? "/dashboard/admin"
    : primaryRole === "doctor" ? "/dashboard/doctor"
    : primaryRole === "receptionist" ? "/dashboard/receptionist"
    : "/dashboard/patient";

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-6 pt-3">
      <nav className="glass max-w-7xl mx-auto rounded-2xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="RAHA Clinics" width={40} height={40} className="w-10 h-10 object-contain" />
          <div className="leading-tight">
            <div className="font-extrabold text-foreground">RAHA</div>
            <div className="text-[10px] text-muted-foreground -mt-0.5">QALEEN</div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/" className="text-foreground/80 hover:text-primary transition">الرئيسية</Link>
          <Link to="/doctors" className="text-foreground/80 hover:text-primary transition">الأطباء</Link>
          <Link to="/symptom-checker" className="text-foreground/80 hover:text-primary transition inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> محلل الأعراض
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <button
                onClick={() => navigate({ to: dashPath })}
                className="hidden sm:inline-flex items-center gap-2 px-3 h-10 rounded-xl glass text-sm hover:bg-white/80 transition"
                title={profile?.fullName ?? ""}
              >
                <LayoutDashboard className="w-4 h-4" /> لوحة التحكم
              </button>
              <button
                onClick={async () => { await logout(); navigate({ to: "/" }); }}
                className="inline-flex items-center gap-2 px-3 h-10 rounded-xl btn-primary text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" /> خروج
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 h-10 inline-flex items-center rounded-xl glass text-sm hover:bg-white/80 transition">دخول</Link>
              <Link to="/signup" className="px-4 h-10 inline-flex items-center rounded-xl btn-primary text-sm font-semibold">حساب</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
