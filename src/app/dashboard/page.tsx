import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Dashboard() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch user's role and company
  const { data: sangpoUser } = await supabase
    .from("Sangpo_User")
    .select("role, company_id, Sangpo_Company(name)")
    .eq("id", user.id)
    .single() as { data: any };

  return (
    <div style={{ minHeight: "100vh", padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "bold" }}>Dashboard</h1>
          {sangpoUser && (
            <p style={{ color: "#4b5563" }}>
              {sangpoUser.Sangpo_Company?.[0]?.name || "No company assigned"} • {sangpoUser.role}
            </p>
          )}
        </div>
        <LogoutButton />
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1.5rem"
      }}>
        <DashboardCard title="Suppliers" href="/dashboard/suppliers" />
        <DashboardCard title="Documents" href="/dashboard/documents" />
        <DashboardCard title="Payments" href="/dashboard/payments" />
        <DashboardCard title="Certificates" href="/dashboard/certificates" />
      </div>
    </div>
  );
}

function LogoutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button style={{
        backgroundColor: "#e5e7eb",
        padding: "0.5rem 1rem",
        borderRadius: "0.375rem",
        border: "none",
        cursor: "pointer"
      }}>
        Logout
      </button>
    </form>
  );
}

function DashboardCard({ title, href }: { title: string; href: string }) {
  return (
    <a
      href={href}
      style={{
        backgroundColor: "white",
        padding: "1.5rem",
        borderRadius: "0.5rem",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        textDecoration: "none",
        color: "inherit"
      }}
    >
      <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>{title}</h2>
    </a>
  );
}
