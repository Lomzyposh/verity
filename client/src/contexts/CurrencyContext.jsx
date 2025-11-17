
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const { user, updateUserCurrency } = useAuth();
  const [currency, setCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({});
  const [loading, setLoading] = useState(false);

  const availableCurrencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' }
  ];

  // Load currency preference
  useEffect(() => {
    if (user?.currency) {
      setCurrency(user.currency);
    } else {
      const savedCurrency = localStorage.getItem('veritygem_currency');
      if (savedCurrency) {
        setCurrency(savedCurrency);
      }
    }
  }, [user]);

  // Fetch exchange rates
  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/currency/rates', {
        params: { base: 'USD' }
      });
      setExchangeRates(response.data.rates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeCurrency = async (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem('veritygem_currency', newCurrency);

    if (user) {
      try {
        await axios.put('/api/user/profile', { currency: newCurrency }, { withCredentials: true });
        updateUserCurrency(newCurrency);
      } catch (error) {
        console.error('Error updating user currency:', error);
      }
    }
  };

  const convertPrice = (price, fromCurrency = 'USD') => {
    if (fromCurrency === currency) return price;
    
    if (!exchangeRates[currency]) return price;

    const priceInUSD = fromCurrency === 'USD' ? price : price / exchangeRates[fromCurrency];
    const convertedPrice = priceInUSD * exchangeRates[currency];
    
    return convertedPrice;
  };

  const formatPrice = (price, fromCurrency = 'USD') => {
    const convertedPrice = convertPrice(price, fromCurrency);
    const currencyData = availableCurrencies.find(c => c.code === currency);
    const symbol = currencyData?.symbol || currency;

    return `${symbol}${convertedPrice.toFixed(2)}`;
  };

  const getCurrencySymbol = (currencyCode = currency) => {
    const currencyData = availableCurrencies.find(c => c.code === currencyCode);
    return currencyData?.symbol || currencyCode;
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      exchangeRates,
      availableCurrencies,
      loading,
      changeCurrency,
      convertPrice,
      formatPrice,
      getCurrencySymbol
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};