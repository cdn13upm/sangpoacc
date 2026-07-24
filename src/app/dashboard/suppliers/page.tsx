"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Supplier = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  tax_id: string | null;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    tax_id: "",
  });
  const supabase = createClient();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    const { data } = await supabase.from("Sangpo_Supplier").select("*");
    setSuppliers(data || []);
    setLoading(false);
  }

  async function handleAddSupplier(e: React.FormEvent) {
    e.preventDefault();
    // For now, we'll use a dummy company_id (you should get this from the user's company)
    const { error } = await supabase.from("Sangpo_Supplier").insert([
      {
        ...newSupplier,
        company_id: "00000000-0000-0000-0000-000000000000", // Replace with actual company_id
      },
    ]);
    if (!error) {
      setShowAddModal(false);
      setNewSupplier({ name: "", address: "", phone: "", email: "", tax_id: "" });
      fetchSuppliers();
    }
  }

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading...</div>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Suppliers</h1>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            backgroundColor: "#2563eb",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "0.375rem",
            border: "none",
            cursor: "pointer"
          }}
        >
          Add Supplier
        </button>
      </div>
      <div style={{
        backgroundColor: "white",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        borderRadius: "0.5rem",
        overflow: "hidden"
      }}>
        <table style={{ width: "100%" }}>
          <thead style={{ backgroundColor: "#f9fafb" }}>
            <tr>
              <th style={{
                padding: "0.75rem 1.5rem",
                textAlign: "left",
                fontSize: "0.75rem",
                fontWeight: "500",
                color: "#6b7280",
                textTransform: "uppercase"
              }}>Name</th>
              <th style={{
                padding: "0.75rem 1.5rem",
                textAlign: "left",
                fontSize: "0.75rem",
                fontWeight: "500",
                color: "#6b7280",
                textTransform: "uppercase"
              }}>Email</th>
              <th style={{
                padding: "0.75rem 1.5rem",
                textAlign: "left",
                fontSize: "0.75rem",
                fontWeight: "500",
                color: "#6b7280",
                textTransform: "uppercase"
              }}>Phone</th>
              <th style={{
                padding: "0.75rem 1.5rem",
                textAlign: "left",
                fontSize: "0.75rem",
                fontWeight: "500",
                color: "#6b7280",
                textTransform: "uppercase"
              }}>Tax ID</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "1rem 1.5rem", whiteSpace: "nowrap" }}>{supplier.name}</td>
                <td style={{ padding: "1rem 1.5rem", whiteSpace: "nowrap" }}>{supplier.email}</td>
                <td style={{ padding: "1rem 1.5rem", whiteSpace: "nowrap" }}>{supplier.phone}</td>
                <td style={{ padding: "1rem 1.5rem", whiteSpace: "nowrap" }}>{supplier.tax_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showAddModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "1.5rem",
            borderRadius: "0.5rem",
            width: "100%",
            maxWidth: "28rem"
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>Add Supplier</h2>
            <form onSubmit={handleAddSupplier} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151" }}>Name</label>
                <input
                  type="text"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  required
                  style={{
                    marginTop: "0.25rem",
                    display: "block",
                    width: "100%",
                    borderRadius: "0.375rem",
                    border: "1px solid #d1d5db",
                    padding: "0.5rem 0.75rem"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151" }}>Email</label>
                <input
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                  style={{
                    marginTop: "0.25rem",
                    display: "block",
                    width: "100%",
                    borderRadius: "0.375rem",
                    border: "1px solid #d1d5db",
                    padding: "0.5rem 0.75rem"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151" }}>Phone</label>
                <input
                  type="text"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  style={{
                    marginTop: "0.25rem",
                    display: "block",
                    width: "100%",
                    borderRadius: "0.375rem",
                    border: "1px solid #d1d5db",
                    padding: "0.5rem 0.75rem"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151" }}>Tax ID</label>
                <input
                  type="text"
                  value={newSupplier.tax_id}
                  onChange={(e) => setNewSupplier({ ...newSupplier, tax_id: e.target.value })}
                  style={{
                    marginTop: "0.25rem",
                    display: "block",
                    width: "100%",
                    borderRadius: "0.375rem",
                    border: "1px solid #d1d5db",
                    padding: "0.5rem 0.75rem"
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    backgroundColor: "#e5e7eb",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    backgroundColor: "#2563eb",
                    color: "white",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
