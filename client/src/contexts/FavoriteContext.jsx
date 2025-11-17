
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load favorites
  useEffect(() => {
    if (user) {
      fetchFavoritesFromServer();
    } else {
      loadGuestFavoritesFromLocalStorage();
    }
  }, [user]);

  const loadGuestFavoritesFromLocalStorage = () => {
    const savedFavorites = localStorage.getItem('veritygem_guest_favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        setFavorites([]);
      }
    }
  };

  const saveGuestFavoritesToLocalStorage = (favs) => {
    localStorage.setItem('veritygem_guest_favorites', JSON.stringify(favs));
  };

  const fetchFavoritesFromServer = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/favorites', { withCredentials: true });
      setFavorites(response.data.favorites || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async (productId) => {
    try {
      if (user) {
        const response = await axios.post(`/api/favorites/${productId}`, {}, { withCredentials: true });
        setFavorites(response.data.favorites);
      } else {
        if (!favorites.includes(productId)) {
          const updatedFavorites = [...favorites, productId];
          setFavorites(updatedFavorites);
          saveGuestFavoritesToLocalStorage(updatedFavorites);
        }
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  const removeFromFavorites = async (productId) => {
    try {
      if (user) {
        const response = await axios.delete(`/api/favorites/${productId}`, { withCredentials: true });
        setFavorites(response.data.favorites);
      } else {
        const updatedFavorites = favorites.filter(id => id !== productId);
        setFavorites(updatedFavorites);
        saveGuestFavoritesToLocalStorage(updatedFavorites);
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  const toggleFavorite = async (productId) => {
    if (isFavorite(productId)) {
      await removeFromFavorites(productId);
    } else {
      await addToFavorites(productId);
    }
  };

  const isFavorite = (productId) => {
    if (Array.isArray(favorites)) {
      return favorites.some(fav => {
        if (typeof fav === 'string') {
          return fav === productId;
        }
        return fav._id === productId;
      });
    }
    return false;
  };

  return (
    <FavoritesContext.Provider value={{
      favorites,
      loading,
      addToFavorites,
      removeFromFavorites,
      toggleFavorite,
      isFavorite,
      favoritesCount: favorites.length
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};
