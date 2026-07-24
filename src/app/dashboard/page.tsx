import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

// Define a type for the user data
type SangpoUser = {
  role: string;
  company_id: string | null;
  Sangpo_Company?: { name: string }[];
};

export default async function Dashboard() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch user's role and company with type assertion
  const { data: sangpoUser } = await supabase
    .from("Sangpo_User")
    .select("role, company_id, Sangpo_Company(name)")
    .eq("id", user.id)
    .single() as { data: SangpoUser | null };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
          Dashboard
        </h1>
        {sangpoUser && (
          <p style={{ color: "#4b5563" }}>
            {sangpoUser.Sangpo_Company?.[0]?.name || "No company assigned"} • {sangpoUser.role}
          </p>
        )}
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

function DashboardCard({ title, href }: { title: string; href: string }) {
  return (
    <Link
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
    </Link>
  );
}
