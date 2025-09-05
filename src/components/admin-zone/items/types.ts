export type ItemRow = {
  id: string;
  teamId: string;
  name: string;
  sku?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  price: number;
  pricePaid?: number;
  taxRateBps: number;
  isActive: boolean;
  unit?: string;
  measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA' | 'TIME';
  stockQuantity?: number;
  createdAt: string;
  currency: string;
  description?: string | null;
  color?: string | null;
  size?: string | null;
  brand?: string | null;
  tags?: string[] | null;
  imageUrl?: string | null;
};

export type Group = {
  key: string;
  label: string;
  color?: string | null;
  imageUrl?: string | null;
  categoryName?: string | null;
  price: number;
  pricePaid?: number;
  taxRateBps: number;
  unit?: string | null;
  brand?: string | null;
  items: ItemRow[];
  totalStock: number;
};
