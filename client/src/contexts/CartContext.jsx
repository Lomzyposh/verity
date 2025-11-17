
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Generate or retrieve session ID for guest users
  useEffect(() => {
    if (!user) {
      let guestSessionId = localStorage.getItem('veritygem_session_id');
      if (!guestSessionId) {
        guestSessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('veritygem_session_id', guestSessionId);
      }
      setSessionId(guestSessionId);
    }
  }, [user]);

  // Load cart from localStorage for guest or fetch from server for logged-in users
  useEffect(() => {
    if (user) {
      fetchCartFromServer();
    } else {
      loadGuestCartFromLocalStorage();
    }
  }, [user]);

  const loadGuestCartFromLocalStorage = () => {
    const savedCart = localStorage.getItem('veritygem_guest_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        setCartItems([]);
      }
    }
  };

  const saveGuestCartToLocalStorage = (items) => {
    localStorage.setItem('veritygem_guest_cart', JSON.stringify(items));
  };

  const fetchCartFromServer = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/cart', { 
        withCredentials: true,
        headers: user ? {} : {},
        params: sessionId ? { sessionId } : {}
      });
      setCartItems(response.data.cart?.items || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product, quantity = 1, customization = {}) => {
    try {
      if (user) {
        // Logged-in user: save to server
        const response = await axios.post('/api/cart', {
          productId: product._id,
          quantity,
          customization
        }, { withCredentials: true });
        setCartItems(response.data.cart.items);
      } else {
        // Guest user: save to localStorage
        const existingItemIndex = cartItems.findIndex(item => 
          item.product._id === product._id &&
          JSON.stringify(item.customization) === JSON.stringify(customization)
        );

        let updatedCart;
        if (existingItemIndex > -1) {
          updatedCart = [...cartItems];
          updatedCart[existingItemIndex].quantity += quantity;
        } else {
          updatedCart = [...cartItems, {
            _id: `temp_${Date.now()}`,
            product,
            quantity,
            customization,
            priceAtAdd: product.finalPrice || product.price
          }];
        }
        setCartItems(updatedCart);
        saveGuestCartToLocalStorage(updatedCart);
      }
      return { success: true };
    } catch (error) {
      console.error('Error adding to cart:', error);
      return { success: false, error: error.message };
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      if (user) {
        const response = await axios.put(`/api/cart/${itemId}`, { quantity }, { withCredentials: true });
        setCartItems(response.data.cart.items);
      } else {
        const updatedCart = cartItems.map(item => 
          item._id === itemId ? { ...item, quantity } : item
        ).filter(item => item.quantity > 0);
        setCartItems(updatedCart);
        saveGuestCartToLocalStorage(updatedCart);
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      if (user) {
        const response = await axios.delete(`/api/cart/${itemId}`, { 
          withCredentials: true,
          params: sessionId ? { sessionId } : {}
        });
        setCartItems(response.data.cart.items);
      } else {
        const updatedCart = cartItems.filter(item => item._id !== itemId);
        setCartItems(updatedCart);
        saveGuestCartToLocalStorage(updatedCart);
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    if (!user) {
      localStorage.removeItem('veritygem_guest_cart');
    }
  };

  const syncGuestCartWithUser = async () => {
    if (!user || cartItems.length === 0) return;

    try {
      const guestCart = cartItems.map(item => ({
        productId: item.product._id,
        quantity: item.quantity,
        customization: item.customization,
        price: item.priceAtAdd
      }));

      const response = await axios.post('/api/cart/sync', { guestCart }, { withCredentials: true });
      setCartItems(response.data.cart.items);
      localStorage.removeItem('veritygem_guest_cart');
    } catch (error) {
      console.error('Error syncing cart:', error);
    }
  };

  // Sync guest cart when user logs in
  useEffect(() => {
    if (user && cartItems.length > 0 && cartItems[0]._id?.startsWith('temp_')) {
      syncGuestCartWithUser();
    }
  }, [user]);

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => {
      const price = item.priceAtAdd || item.product?.finalPrice || item.product?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const getItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ 
      cartItems,
      loading,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
      getTotalAmount,
      getItemCount,
      cartCount: cartItems.length
    }}>
      {children}
    </CartContext.Provider>
  );
};