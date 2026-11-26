import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CART_STORAGE_KEY = 'roast_reverie_cart_v1';
const COUPON_STORAGE_KEY = 'roast_reverie_coupon_v1';

const CartContext = createContext(null);

function makeCartKey(productId, optionIds = []) {
  const sorted = [...optionIds].sort((a, b) => a - b);
  return `${productId}::${sorted.join(',')}`;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedOffer, setAppliedOffer] = useState(() => {
    try {
      const saved = localStorage.getItem(COUPON_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota errors
    }
  }, [items]);

  useEffect(() => {
    try {
      if (appliedOffer) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedOffer));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch {
      // Ignore storage quota errors
    }
  }, [appliedOffer]);

  const addItem = (product, selectedOptions = [], quantity = 1) => {
    const optionIds = selectedOptions.map((o) => o.id);
    const key = makeCartKey(product.id, optionIds);
    const optionsDelta = selectedOptions.reduce((sum, o) => sum + Number(o.price_delta || 0), 0);
    const unitPrice = Number(product.base_price) + optionsDelta;

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.key === key);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: Math.min(50, next[existingIdx].quantity + quantity),
        };
        return next;
      }

      return [
        ...prev,
        {
          key,
          product_id: product.id,
          slug: product.slug,
          name: product.name,
          image_url: product.image_url,
          base_price: Number(product.base_price),
          unit_price: unitPrice,
          selected_options: selectedOptions.map((o) => ({
            id: o.id,
            group: o.option_group,
            name: o.option_name,
            price_delta: Number(o.price_delta || 0),
          })),
          option_ids: optionIds,
          quantity,
        },
      ];
    });
  };

  const updateQuantity = (key, quantity) => {
    if (quantity <= 0) {
      removeItem(key);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, quantity: Math.min(50, quantity) } : item))
    );
  };

  const removeItem = (key) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedOffer(null);
  };

  const summary = useMemo(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

    let discountAmount = 0;
    if (appliedOffer && subtotal >= Number(appliedOffer.min_order_amount || 0)) {
      if (appliedOffer.discount_type === 'percentage') {
        discountAmount = Math.round(((subtotal * Number(appliedOffer.discount_value)) / 100) * 100) / 100;
      } else {
        discountAmount = Math.min(subtotal, Number(appliedOffer.discount_value));
      }
    }

    const total = Math.max(0, subtotal - discountAmount);
    return { itemCount, subtotal, discountAmount, total };
  }, [items, appliedOffer]);

  return (
    <CartContext.Provider
      value={{
        items,
        appliedOffer,
        setAppliedOffer,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        ...summary,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
