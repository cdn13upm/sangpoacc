'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { inputStyle } from '../ui';

type SupplierOption = {
  id: string;
  name: string;
};

export default function PaymentSupplierFilter({
  suppliers,
  selectedSupplierId,
}: {
  suppliers: SupplierOption[];
  selectedSupplierId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('supplier', value);
    } else {
      params.delete('supplier');
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={selectedSupplierId}
      onChange={(e) => handleChange(e.target.value)}
      style={inputStyle}
    >
      {suppliers.map((supplier) => (
        <option key={supplier.id} value={supplier.id}>
          {supplier.name}
        </option>
      ))}
    </select>
  );
}
