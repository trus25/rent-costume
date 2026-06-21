import { useCallback } from 'react';
import { getVariantAvailability } from '../../../lib/availability';
import type { CartItem, DateRange, Product, Rental } from '../../../types/domain';
import type { StateSetter } from '../../../types/app';

export function useCatalogueCartDateSync({
  draftDates,
  onSynced,
  products,
  rentals,
  setCart,
}: {
  draftDates: DateRange;
  onSynced: () => void;
  products: Product[];
  rentals: Rental[];
  setCart: StateSetter<CartItem[]>;
}) {
  return useCallback(() => {
    setCart((current) =>
      current.map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        const available = product ? getVariantAvailability(product, item.variantId, draftDates, rentals) : 0;
        return available >= item.qty ? { ...item, start: draftDates.start, end: draftDates.end } : item;
      }),
    );
    onSynced();
  }, [draftDates, onSynced, products, rentals, setCart]);
}
