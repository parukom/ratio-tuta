import { useEffect, useMemo, useState } from 'react';
import type {
  CartItem,
  CartLine,
  GroupedPlaceItem,
  Place,
  PlaceItem,
} from '@/types/cash-register';
import type { VariantChild } from './SelectVariantModal';

// Fetch list of places and manage the activePlaceId
export function usePlaces(queryPlaceId: string | null) {
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadPlaces() {
      setError(null);
      try {
        const res = await fetch('/api/places');
        if (!res.ok) throw new Error('Failed to load places');
        const data: unknown = await res.json();
        if (!Array.isArray(data)) throw new Error('Invalid response');
        if (cancelled) return;
        const shaped: Place[] = data
          .filter(
            (
              p: unknown,
            ): p is {
              id: string;
              teamId: string;
              name: string;
              currency: string | null;
            } => {
              if (!p || typeof p !== 'object') return false;
              const obj = p as Record<string, unknown>;
              return (
                typeof obj.id === 'string' &&
                typeof obj.teamId === 'string' &&
                typeof obj.name === 'string' &&
                (obj.currency === null || typeof obj.currency === 'string')
              );
            },
          )
          .map((p) => ({
            id: p.id,
            teamId: p.teamId,
            name: p.name,
            currency: p.currency,
          }));
        setPlaces(shaped);
        if (shaped.length > 0) {
          const preferred =
            queryPlaceId && shaped.some((p) => p.id === queryPlaceId)
              ? queryPlaceId
              : shaped[0].id;
          setActivePlaceId((id) => id ?? preferred);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error';
        if (!cancelled) setError(msg);
      }
    }
    loadPlaces();
    return () => {
      cancelled = true;
    };
  }, [queryPlaceId]);

  const activePlace = useMemo(
    () => places?.find((p) => p.id === activePlaceId) || null,
    [places, activePlaceId],
  );
  const currency = activePlace?.currency || 'EUR';

  return {
    places,
    activePlaceId,
    setActivePlaceId,
    activePlace,
    currency,
    error,
  } as const;
}

// Fetch items for a given place
export function usePlaceItems(activePlaceId: string | null) {
  const [placeItems, setPlaceItems] = useState<PlaceItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activePlaceId) return;
    let cancelled = false;
    async function loadItems() {
      setError(null);
      try {
        const res = await fetch(`/api/places/${activePlaceId}/items`);
        if (!res.ok) throw new Error('Failed to load items');
        const data: PlaceItem[] = await res.json();
        if (!cancelled) setPlaceItems(data);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error';
        if (!cancelled) setError(msg);
      }
    }
    loadItems();
    return () => {
      cancelled = true;
    };
  }, [activePlaceId]);

  const reload = async () => {
    if (!activePlaceId) return;
    try {
      const res = await fetch(`/api/places/${activePlaceId}/items`);
      if (res.ok) setPlaceItems(await res.json());
    } catch {
      // ignore reload errors
    }
  };

  return { placeItems, setPlaceItems, error, reload } as const;
}

// Cart state and helpers
export function useCart() {
  const [cart, setCart] = useState<Map<string, CartLine>>(new Map());

  const addVariantToCart = (
    child: VariantChild,
    requestedQty: number,
    displayName: string,
    displayPrice: number,
  ) => {
    setCart((prev) => {
      const next = new Map(prev);
      const current = next.get(child.itemId);
      const have = current?.quantity || 0;
      const room = Math.max(0, child.quantity - have);
      const add = Math.min(Math.max(1, requestedQty), room);
      if (add <= 0) return prev;
      next.set(child.itemId, {
        itemId: child.itemId,
        title: displayName,
        price: displayPrice,
        quantity: have + add,
      });
      return next;
    });
  };

  const clearCart = () => setCart(new Map());

  const totals = useMemo(() => {
    let qty = 0;
    let sum = 0;
    for (const line of cart.values()) {
      qty += line.quantity;
      sum += line.price * line.quantity;
    }
    return { qty, sum };
  }, [cart]);

  // Adapt cart Map to modal's array-based API
  const cartArray: CartItem[] = useMemo(() => {
    return Array.from(cart.values()).map((l) => ({
      id: l.itemId,
      name: l.title,
      price: l.price,
      quantity: l.quantity,
    }));
  }, [cart]);

  const setCartFromModal = (updater: React.SetStateAction<CartItem[]>) => {
    setCart((prev) => {
      const prevArr: CartItem[] = Array.from(prev.values()).map((l) => ({
        id: l.itemId,
        name: l.title,
        price: l.price,
        quantity: l.quantity,
      }));
      const nextArr =
        typeof updater === 'function'
          ? (updater as (p: CartItem[]) => CartItem[])(prevArr)
          : updater;
      const next = new Map<string, CartLine>();
      for (const item of nextArr) {
        if (item.quantity > 0) {
          next.set(item.id, {
            itemId: item.id,
            title: item.name,
            price: item.price,
            quantity: item.quantity,
          });
        }
      }
      return next;
    });
  };

  return {
    cart,
    setCart,
    addVariantToCart,
    clearCart,
    totals,
    cartArray,
    setCartFromModal,
  } as const;
}

// Group duplicate place items by itemId and sum quantities + search filter state
export function useGroupedSearch(placeItems: PlaceItem[] | null) {
  const [search, setSearch] = useState('');

  const groupedItems: GroupedPlaceItem[] = useMemo(() => {
    const map = new Map<string, GroupedPlaceItem>();
    for (const pi of placeItems || []) {
      const fullName = (pi.item.name ?? '').trim();
      const base = (fullName.split(' - ')[0] || fullName).trim();
      const color = (pi.item.color ?? '').trim() || null;
      const key = `${base.toLowerCase()}|${(color ?? '').toLowerCase()}`;
      const imageUrl = pi.item.imageUrl ?? pi.item.image ?? null;
      const child = {
        placeItemId: pi.id,
        itemId: pi.itemId,
        quantity: pi.quantity,
        price: pi.item.price,
        sku: pi.item.sku,
        imageUrl,
        image: imageUrl,
        size: pi.item.size ?? null,
        unit: pi.item.unit ?? null,
        measurementType: pi.item.measurementType ?? 'PCS',
      };
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          key,
          name: base,
          color,
          image: imageUrl,
          price: pi.item.price,
          quantity: pi.quantity,
          items: [child],
        });
      } else {
        existing.quantity += pi.quantity;
        existing.items.push(child);
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [placeItems]);

  const visiblePlaceItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return groupedItems;
    return groupedItems.filter((gi) => {
      const name = gi.name.toLowerCase();
      const skus = gi.items.map((c) => c.sku?.toLowerCase() ?? '').join(' ');
      const color = (gi.color ?? '').toLowerCase();
      return tokens.every(
        (t) => name.includes(t) || skus.includes(t) || color.includes(t),
      );
    });
  }, [groupedItems, search]);

  return { search, setSearch, groupedItems, visiblePlaceItems } as const;
}
