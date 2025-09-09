export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};
export type CartLine = {
  itemId: string;
  title: string;
  price: number;
  quantity: number;
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
    measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA' | 'TIME';
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
    measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA' | 'TIME';
  }>;
};
