'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/providers/SessionProvider';
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
  const session = useSession();
  const router = useRouter();
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [activePlaceIdState, setActivePlaceIdState] = useState<string | null>(
    null,
  );
  // Wrapped setter - updates internal state only. URL sync happens in an effect
  // (after render) to avoid updating the Router during another component's
  // render phase.
  const setActivePlaceId = (value: React.SetStateAction<string | null>) => {
    setActivePlaceIdState((prev) =>
      typeof value === 'function'
        ? (value as (p: string | null) => string | null)(prev)
        : value,
    );
  };
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
        // If session role is ADMIN, include all returned places; otherwise only include places explicitly assigned to the user
        const shaped: Place[] = data
          .filter(
            (
              p: unknown,
            ): p is {
              id: string;
              teamId: string;
              name: string;
              currency: string | null;
              assignedToMe?: boolean;
            } => {
              if (!p || typeof p !== 'object') return false;
              const obj = p as Record<string, unknown>;
              // require id/team/name/currency
              const baseOk =
                typeof obj.id === 'string' &&
                typeof obj.teamId === 'string' &&
                typeof obj.name === 'string' &&
                (obj.currency === null || typeof obj.currency === 'string');
              if (!baseOk) return false;
              // admins see all places; other users only places assignedToMe
              if (session?.role === 'ADMIN') return true;
              return obj.assignedToMe === true;
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
          // Initialize internal state without using the exported setter to
          // avoid adding it to the effect dependencies.
          setActivePlaceIdState((id) => id ?? preferred);
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
  }, [queryPlaceId, session?.role]);

  const activePlaceId = activePlaceIdState;
  const activePlace = useMemo(
    () => places?.find((p) => p.id === activePlaceId) || null,
    [places, activePlaceId],
  );
  const currency = activePlace?.currency || 'EUR';

  // Keep the URL's `placeId` query param in sync with the active place after
  // the component has rendered. Doing this in an effect avoids React errors
  // about updating the Router during render.
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (activePlaceIdState)
        url.searchParams.set('placeId', activePlaceIdState);
      else url.searchParams.delete('placeId');
      // Use replace so we don't add history entries when switching places
      router.replace(url.pathname + url.search);
    } catch {
      // ignore URL update failures
    }
  }, [activePlaceIdState, router]);

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
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!activePlaceId) return;
    let cancelled = false;
    async function loadItems() {
      setError(null);
      setLoading(true);
      try {
        const res = await fetch(`/api/places/${activePlaceId}/items`);
        if (!res.ok) throw new Error('Failed to load items');
        const data: PlaceItem[] = await res.json();
        if (!cancelled) setPlaceItems(data);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error';
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
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
      setLoading(true);
      const res = await fetch(`/api/places/${activePlaceId}/items`);
      if (res.ok) setPlaceItems(await res.json());
    } catch {
      // ignore reload errors
    } finally {
      setLoading(false);
    }
  };

  // Quiet reload: fetch items but don't flip the public `loading` flag.
  // Useful for small background refreshes (post-checkout) where we want to
  // avoid showing the large skeleton UI.
  const reloadQuiet = async () => {
    if (!activePlaceId) return;
    try {
      const res = await fetch(`/api/places/${activePlaceId}/items`);
      if (res.ok) setPlaceItems(await res.json());
    } catch {
      // ignore
    }
  };

  return {
    placeItems,
    setPlaceItems,
    error,
    loading,
    reload,
    reloadQuiet,
  } as const;
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

      // For unlimited items, allow any quantity. Otherwise, respect stock limits.
      const room = child.isUnlimited ? Infinity : Math.max(0, child.quantity - have);

      // LENGTH: allow decimal meters; others remain integers
      const isLength = child.measurementType === 'LENGTH';
      const normalizedReq = isLength
        ? Math.max(0.01, requestedQty)
        : Math.max(1, Math.round(requestedQty));
      const add = Math.min(normalizedReq, room);
      if (add <= 0) return prev;
      next.set(child.itemId, {
        itemId: child.itemId,
        title: displayName,
        price: displayPrice,
        quantity: isLength ? have + add : Math.round(have + add),
        measurementType: child.measurementType,
      });
      return next;
    });
  };

  const clearCart = () => setCart(new Map());

  const totals = useMemo(() => {
    // qty = number of unique items in cart (cart lines), not raw quantity sum
    const qty = cart.size;
    let sum = 0;
    for (const line of cart.values()) {
      if (line.measurementType === 'WEIGHT') {
        // price per kg, quantity in grams -> convert to kg
        sum += line.price * (line.quantity / 1000);
      } else if (line.measurementType === 'LENGTH') {
        // price per meter, quantity in cm -> convert to meters
        sum += line.price * (line.quantity / 100);
      } else if (line.measurementType === 'VOLUME') {
        // price per liter, quantity in ml -> convert to liters
        sum += line.price * (line.quantity / 1000);
      } else if (line.measurementType === 'AREA') {
        // price per m², quantity in cm² -> convert to m²
        sum += line.price * (line.quantity / 10000);
      } else {
        // PCS - price per unit, quantity in units
        sum += line.price * line.quantity;
      }
    }
    return { qty, sum };
  }, [cart]);

  // Adapt cart Map to modal's array-based API
  const cartArray: CartItem[] = useMemo(() => {
    return Array.from(cart.values()).map((l) => {
      let subtotal = l.price * l.quantity;
      if (l.measurementType === 'WEIGHT') {
        // price per kg, quantity in grams -> convert to kg
        subtotal = l.price * (l.quantity / 1000);
      } else if (l.measurementType === 'LENGTH') {
        // price per meter, quantity in cm -> convert to meters
        subtotal = l.price * (l.quantity / 100);
      } else if (l.measurementType === 'VOLUME') {
        // price per liter, quantity in ml -> convert to liters
        subtotal = l.price * (l.quantity / 1000);
      } else if (l.measurementType === 'AREA') {
        // price per m², quantity in cm² -> convert to m²
        subtotal = l.price * (l.quantity / 10000);
      }
      return {
        id: l.itemId,
        name: l.title,
        price: l.price,
        quantity: l.quantity,
        subtotal,
        measurementType: l.measurementType,
      };
    });
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
export type SortKey = 'NAME_ASC' | 'PRICE_ASC' | 'PRICE_DESC' | 'STOCK_DESC';

// Group duplicate place items by itemId and sum quantities + search/sort/filter state
export function useGroupedSearch(placeItems: PlaceItem[] | null) {
  // Persisted filter state key
  const COOKIE_KEY = 'ratio_tuta_cash_filters';

  function readFiltersFromCookie() {
    try {
      const kv = document.cookie
        .split('; ')
        .find((s) => s.startsWith(COOKIE_KEY + '='));
      if (!kv) return null;
      const val = decodeURIComponent(kv.split('=')[1] || '');
      const parsed = JSON.parse(val);
      return parsed;
    } catch {
      return null;
    }
  }

  function writeFiltersToCookie(obj: {
    search?: string;
    inStockOnly?: boolean;
    sortKey?: SortKey;
  }) {
    try {
      const json = encodeURIComponent(JSON.stringify(obj));
      // persist for 30 days
      const maxAge = 30 * 24 * 60 * 60;
      document.cookie = `${COOKIE_KEY}=${json}; path=/; max-age=${maxAge}; samesite=lax`;
    } catch {
      // ignore
    }
  }

  const initialFilters = (() => {
    if (typeof document === 'undefined') return null;
    const read = readFiltersFromCookie();
    return read;
  })();

  const [search, setSearch] = useState(() => initialFilters?.search ?? '');
  const [inStockOnly, setInStockOnly] = useState<boolean>(
    () => initialFilters?.inStockOnly ?? false,
  );
  const [sortKey, setSortKey] = useState<SortKey>(
    () => initialFilters?.sortKey ?? 'NAME_ASC',
  );

  // Persist filter changes to a cookie so they survive page reloads
  useEffect(() => {
    try {
      writeFiltersToCookie({ search, inStockOnly, sortKey });
    } catch {
      // ignore
    }
  }, [search, inStockOnly, sortKey]);

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
        isUnlimited: pi.item.isUnlimited,
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
    // Text search
    const q = search.trim().toLowerCase();
    const tokens: string[] = q.split(/\s+/).filter(Boolean);
    let list = groupedItems;
    if (tokens.length > 0) {
      list = list.filter((gi) => {
        const name = gi.name.toLowerCase();
        const skus = gi.items.map((c) => c.sku?.toLowerCase() ?? '').join(' ');
        const color = (gi.color ?? '').toLowerCase();
        return tokens.every(
          (t: string) =>
            name.includes(t) || skus.includes(t) || color.includes(t),
        );
      });
    }

    // In-stock filter
    if (inStockOnly) {
      list = list.filter(
        (gi) =>
          (gi.quantity ?? 0) > 0 ||
          gi.items.some((c) => c.quantity > 0 || c.isUnlimited),
      );
    }

    // Sorting
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sortKey) {
        case 'PRICE_ASC':
          return a.price - b.price;
        case 'PRICE_DESC':
          return b.price - a.price;
        case 'STOCK_DESC':
          return (b.quantity ?? 0) - (a.quantity ?? 0);
        case 'NAME_ASC':
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return sorted;
  }, [groupedItems, search, inStockOnly, sortKey]);

  return {
    search,
    setSearch,
    inStockOnly,
    setInStockOnly,
    sortKey,
    setSortKey,
    groupedItems,
    visiblePlaceItems,
  } as const;
}
