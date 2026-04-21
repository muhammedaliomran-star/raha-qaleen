import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import logo from "@/assets/logo.png";

function NotFoundComponent() {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="glass-strong rounded-3xl p-10 max-w-md text-center">
        <img src={logo} alt="RAHA Clinics" width={80} height={80} className="w-20 h-20 object-contain mx-auto mb-2" />
        <h1 className="text-7xl font-extrabold text-primary">404</h1>
        <h2 className="mt-3 text-xl font-bold">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">الرابط الذي طلبته غير متاح.</p>
        <Link to="/" className="btn-primary inline-flex mt-6 px-5 h-11 rounded-xl items-center font-bold text-sm">العودة للرئيسية</Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "RAHA — QALEEN | راحة قلبك في حجز طبيبك" },
      { name: "description", content: "منصة حجز الأطباء الأكثر تطوراً في الشرق الأوسط — احجز موعدك مع نخبة الأطباء بسهولة." },
      { property: "og:title", content: "RAHA — QALEEN" },
      { property: "og:description", content: "احجز طبيبك في ثوانٍ — تصميم فاخر، تجربة سلسة." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/logo.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/logo.png" },
      { rel: "apple-touch-icon", href: "/logo.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster position="top-center" richColors closeButton />
    </AuthProvider>
  );
}
