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
    .single();

  return (
    <div className="min-h-screen p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          {sangpoUser && (
            <p className="text-gray-600">
              {sangpoUser.Sangpo_Company?.name || "No company assigned"} • {sangpoUser.role}
            </p>
          )}
        </div>
        <LogoutButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <button className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">
        Logout
      </button>
    </form>
  );
}

function DashboardCard({ title, href }: { title: string; href: string }) {
  return (
    <a
      href={href}
      className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
    >
      <h2 className="text-xl font-semibold">{title}</h2>
    </a>
  );
}
