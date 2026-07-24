'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/ssr';

type Supplier = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    async function init() {
      await fetchUserRole();
      await fetchSuppliers();
    }
    init();
  }, []);

  async function fetchUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('Sangpo_User')
      .select('role')
      .eq('id', user.id)
      .single();

    setUserRole(data?.role || null);
  }

  async function fetchSuppliers() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's company
      const { data: sangpoUser } = await supabase
        .from('Sangpo_User')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!sangpoUser?.company_id) return;

      const { data } = await supabase
        .from('Sangpo_Supplier')
        .select('*')
        .eq('company_id', sangpoUser.company_id);

      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sangpoUser } = await supabase
        .from('Sangpo_User')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!sangpoUser?.company_id) return;

      if (editingSupplier) {
        // Update existing supplier
        await supabase
          .from('Sangpo_Supplier')
          .update({
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone || null,
            address: formData.address || null
          })
          .eq('id', editingSupplier.id);
      } else {
        // Create new supplier
        await supabase
          .from('Sangpo_Supplier')
          .insert({
            company_id: sangpoUser.company_id,
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone || null,
            address: formData.address || null
          });
      }

      setShowModal(false);
      setEditingSupplier(null);
      setFormData({ name: '', email: '', phone: '', address: '' });
      await fetchSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    try {
      await supabase.from('Sangpo_Supplier').delete().eq('id', id);
      await fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
    }
  };

  const isAdmin = userRole === 'admin';

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh'
      }}>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Loading suppliers...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '800',
            color: '#111827',
            marginBottom: '0.35rem'
          }}>
            Suppliers
          </h1>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Manage your supplier list
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              backgroundColor: '#780000',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 6px -1px rgb(120 0 0 / 0.3)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a0000'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#780000'}
          >
            Add Supplier
          </button>
        )}
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
              <th style={{
                padding: '1rem 1.5rem',
                textAlign: 'left',
                borderBottom: '1px solid #e5e7eb',
                color: '#374151',
                fontWeight: '700',
                fontSize: '0.9rem'
              }}>
                Name
              </th>
              <th style={{
                padding: '1rem 1.5rem',
                textAlign: 'left',
                borderBottom: '1px solid #e5e7eb',
                color: '#374151',
                fontWeight: '700',
                fontSize: '0.9rem'
              }}>
                Email
              </th>
              <th style={{
                padding: '1rem 1.5rem',
                textAlign: 'left',
                borderBottom: '1px solid #e5e7eb',
                color: '#374151',
                fontWeight: '700',
                fontSize: '0.9rem'
              }}>
                Phone
              </th>
              <th style={{
                padding: '1rem 1.5rem',
                textAlign: 'left',
                borderBottom: '1px solid #e5e7eb',
                color: '#374151',
                fontWeight: '700',
                fontSize: '0.9rem'
              }}>
                Address
              </th>
              {isAdmin && (
                <th style={{
                  padding: '1rem 1.5rem',
                  textAlign: 'left',
                  borderBottom: '1px solid #e5e7eb',
                  color: '#374151',
                  fontWeight: '700',
                  fontSize: '0.9rem'
                }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} style={{
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  No suppliers yet. Add your first one!
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: '500', color: '#111827' }}>
                    {supplier.name}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color: '#4b5563' }}>
                    {supplier.email || '-'}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color: '#4b5563' }}>
                    {supplier.phone || '-'}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color: '#4b5563' }}>
                    {supplier.address || '-'}
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <button
                        onClick={() => handleEdit(supplier)}
                        style={{
                          backgroundColor: '#f3f4f6',
                          color: '#111827',
                          padding: '0.4rem 0.85rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          marginRight: '0.5rem',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          padding: '0.4rem 0.85rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.75rem',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '800',
              color: '#111827',
              marginBottom: '1.5rem'
            }}>
              {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#780000'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#780000'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#780000'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#780000'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSupplier(null);
                    setFormData({ name: '', email: '', phone: '', address: '' });
                  }}
                  style={{
                    padding: '0.7rem 1.4rem',
                    borderRadius: '0.5rem',
                    border: '2px solid #e5e7eb',
                    backgroundColor: 'white',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#780000',
                    color: 'white',
                    padding: '0.7rem 1.4rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 6px -1px rgb(120 0 0 / 0.3)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a0000'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#780000'}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
