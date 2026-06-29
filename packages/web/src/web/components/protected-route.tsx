import { Redirect } from "wouter";
import { authClient } from "../lib/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="text-center">
        <div className="text-4xl font-display font-black mb-2" style={{ color: "var(--primary)" }}>⚡</div>
        <div style={{ color: "var(--text-secondary)" }}>Loading...</div>
      </div>
    </div>
  );
  if (!session) return <Redirect to="/sign-in" />;
  return <>{children}</>;
}
