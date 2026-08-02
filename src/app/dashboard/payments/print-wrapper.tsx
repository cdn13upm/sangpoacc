'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';

const printStyles = `
@media print {
  body * {
    visibility: hidden;
  }
  .payment-print-area {
    display: block !important;
  }
  .payment-print-area,
  .payment-print-area * {
    visibility: visible;
  }
  .payment-print-area {
    position: absolute;
    inset: 0;
    width: 100%;
    background: #fff;
    padding: 24px 20px;
    color: #111827;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    font-size: 14px;
  }
  .payment-no-print {
    display: none !important;
  }
  @page {
    size: A4;
    margin: 12mm 10mm;
  }
  table {
    page-break-inside: auto;
  }
  tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }
  thead {
    display: table-header-group;
  }
}
`;

export default function PaymentPrintWrapper({
  companyName,
  supplierName,
  generatedAt,
  summary,
  milestoneRecords,
  voRecords,
  unpaidInvoiceRecords,
  children,
}: {
  companyName: string | null;
  supplierName: string | null;
  generatedAt: string;
  summary: Array<{ label: string; value: string }>;
  milestoneRecords: Array<{
    title: string;
    approved: string;
    date: string;
    reference: string;
    balance: string;
    description: string;
  }>;
  voRecords: Array<{
    voNumber: string;
    amount: string;
    date: string;
    reference: string;
    status: string;
    description: string;
  }>;
  unpaidInvoiceRecords: Array<{
    supplier: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    amount: string;
    status: string;
    description: string;
    remark: string;
  }>;
  children: ReactNode;
}) {
  useEffect(() => {
    const existing = document.getElementById('payment-print-styles');
    if (!existing) {
      const style = document.createElement('style');
      style.id = 'payment-print-styles';
      style.innerHTML = printStyles;
      document.head.appendChild(style);
    }
    return undefined;
  }, []);

  function handlePrint() {
    const existing = document.getElementById('payment-print-styles');
    if (!existing) {
      const style = document.createElement('style');
      style.id = 'payment-print-styles';
      style.innerHTML = printStyles;
      document.head.appendChild(style);
    }
    window.print();
  }

  return (
    <div>
      <div
        className="payment-no-print"
        style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}
      >
        <button
          onClick={handlePrint}
          style={{
            padding: '0.65rem 1.15rem',
            borderRadius: '0.7rem',
            border: '1px solid rgba(127, 29, 29, 0.2)',
            backgroundColor: '#fff',
            color: '#7f1d1d',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
          }}
        >
          Print Payment Claim
        </button>
      </div>

      <div
        className="payment-print-area"
        style={{
          display: 'none',
        }}
      >
        <div style={{ marginBottom: '18px', borderBottom: '2px solid #7f1d1d', paddingBottom: '14px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#7f1d1d' }}>
            {companyName || 'SangpoAcc'}
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '14px', fontWeight: 600 }}>Payment Claim Report</p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '10px',
              fontSize: '13px',
              color: '#4b5563',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <strong>Supplier:</strong> {supplierName || '-'}
            </div>
            <div>
              <strong>Generated:</strong> {generatedAt}
            </div>
          </div>
        </div>

        {summary.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 10px' }}>Summary</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '10px 14px',
                padding: '12px 14px',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                backgroundColor: '#f9fafb',
              }}
            >
              {summary.map((item) => (
                <div key={item.label} style={{ minWidth: 0 }}>
                  <div
                    style={{
                      color: '#6b7280',
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontWeight: 700, marginTop: '4px' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 10px' }}>Milestone Payment Records</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={thStyle}>Milestone</th>
                  <th style={thAlignRightStyle}>Approved Payment</th>
                  <th style={thStyle}>Payment Date</th>
                  <th style={thStyle}>Reference</th>
                  <th style={thAlignRightStyle}>Balance</th>
                  <th style={thStyle}>Description</th>
                </tr>
              </thead>
              <tbody>
                {milestoneRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={tdEmptyStyle}>
                      No milestone payment records
                    </td>
                  </tr>
                ) : (
                  milestoneRecords.map((row, idx) => (
                    <tr key={`m-${idx}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={tdStyle}>{row.title}</td>
                      <td style={tdNumStyle}>{row.approved}</td>
                      <td style={tdStyle}>{row.date}</td>
                      <td style={tdStyle}>{row.reference}</td>
                      <td style={tdNumStyle}>{row.balance}</td>
                      <td style={tdStyle}>{row.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 10px' }}>VO Payment Records</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={thStyle}>VO Number</th>
                  <th style={thAlignRightStyle}>Amount</th>
                  <th style={thStyle}>Payment Date</th>
                  <th style={thStyle}>Reference</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Description</th>
                </tr>
              </thead>
              <tbody>
                {voRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={tdEmptyStyle}>
                      No VO payment records
                    </td>
                  </tr>
                ) : (
                  voRecords.map((row, idx) => (
                    <tr key={`v-${idx}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={tdStyle}>{row.voNumber}</td>
                      <td style={tdNumStyle}>{row.amount}</td>
                      <td style={tdStyle}>{row.date}</td>
                      <td style={tdStyle}>{row.reference}</td>
                      <td style={tdStyle}>{row.status}</td>
                      <td style={tdStyle}>{row.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 10px' }}>Unpaid Invoices</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={thStyle}>Supplier</th>
                  <th style={thStyle}>Invoice #</th>
                  <th style={thStyle}>Invoice Date</th>
                  <th style={thStyle}>Due Date</th>
                  <th style={thAlignRightStyle}>Amount</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Remark</th>
                </tr>
              </thead>
              <tbody>
                {unpaidInvoiceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={tdEmptyStyle}>
                      No unpaid invoices
                    </td>
                  </tr>
                ) : (
                  unpaidInvoiceRecords.map((row, idx) => (
                    <tr key={`u-${idx}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={tdStyle}>{row.supplier}</td>
                      <td style={tdStyle}>{row.invoiceNumber}</td>
                      <td style={tdStyle}>{row.invoiceDate}</td>
                      <td style={tdStyle}>{row.dueDate}</td>
                      <td style={tdNumStyle}>{row.amount}</td>
                      <td style={tdStyle}>{row.status}</td>
                      <td style={tdStyle}>{row.description}</td>
                      <td style={tdStyle}>{row.remark}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  textAlign: 'left',
  borderBottom: '2px solid #d1d5db',
  fontWeight: 700,
};

const thAlignRightStyle: React.CSSProperties = {
  ...thStyle,
  textAlign: 'right',
};

const tdStyle: React.CSSProperties = {
  padding: '7px 10px',
  verticalAlign: 'top',
};

const tdNumStyle: React.CSSProperties = {
  ...tdStyle,
  textAlign: 'right',
};

const tdEmptyStyle: React.CSSProperties = {
  padding: '18px 10px',
  textAlign: 'center',
  color: '#6b7280',
};
