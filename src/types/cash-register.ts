export type CartItem = {
  id: string;
  name: string;
  price: number;
  // For LENGTH items, quantity can be decimal meters; otherwise integer
  quantity: number;
  // Optional precomputed subtotal for display (e.g., weight uses kg pricing)
  subtotal?: number;
  measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA';
};
export type CartLine = {
  itemId: string;
  title: string;
  price: number;
  quantity: number;
  // For LENGTH items, quantity can be decimal meters; otherwise integer
  measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA';
};

export type FooterProps = {
  totals: {
    qty: number;
    sum: number;
  };
  currency: string;
  cart: Map<string, CartLine>;
  checkingOut: boolean;
  clearCart(): void;
  setOpenChoosePayment: (value: React.SetStateAction<boolean>) => void;
  checkoutBtnRef: React.RefObject<HTMLButtonElement | null>;
};

export type Place = {
  id: string;
  teamId: string;
  name: string;
  currency: string | null;
};

export type PlaceItem = {
  id: string; // placeItem id
  placeId: string;
  itemId: string;
  quantity: number;
  item: {
    id: string;
    name: string;
    price: number;
    sku: string | null;
    imageUrl?: string | null;
    image?: string | null;
    color?: string | null;
    size?: string | null;
    unit?: string | null;
  measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA';
  };
};

export type GroupedPlaceItem = {
  key: string; // group key by name+color
  name: string;
  color: string | null;
  image?: string | null;
  price: number;
  quantity: number; // total stock across variants in the group
  items: Array<{
    placeItemId: string;
    itemId: string;
    quantity: number;
    price: number;
    sku: string | null;
    imageUrl?: string | null;
    image?: string | null;
    size?: string | null;
    unit?: string | null;
  measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA';
  }>;
};
