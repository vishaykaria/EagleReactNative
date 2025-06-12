import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ExchangeRates {
  USD: number;
}

interface CurrencyData {
  rates: ExchangeRates;
  timestamp: number;
}

interface StoredCurrencyData {
  rate: number;
  lastUpdated: string; // ISO date string
}

const STORAGE_KEY = 'currency_exchange_rate';
const FALLBACK_RATE = 1.27; // Fallback GBP to USD rate

export function useCurrencyConverter() {
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if we need to update the exchange rate (daily at 00:01)
  const shouldUpdateRate = (lastUpdated: string): boolean => {
    const lastUpdateDate = new Date(lastUpdated);
    const now = new Date();
    
    // Check if it's a different day or if it's past 00:01 today and we haven't updated today
    const isNewDay = lastUpdateDate.toDateString() !== now.toDateString();
    const isPast0001 = now.getHours() >= 0 && now.getMinutes() >= 1;
    const hasntUpdatedToday = lastUpdateDate.toDateString() !== now.toDateString();
    
    return isNewDay || (isPast0001 && hasntUpdatedToday);
  };

  // Platform-specific storage functions
  const getStoredRate = async (): Promise<StoredCurrencyData | null> => {
    try {
      let stored: string | null = null;
      
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          stored = localStorage.getItem(STORAGE_KEY);
        }
      } else {
        stored = await AsyncStorage.getItem(STORAGE_KEY);
      }
      
      if (!stored) return null;
      
      return JSON.parse(stored);
    } catch (error) {
      console.warn('Failed to parse stored currency data:', error);
      return null;
    }
  };

  // Store exchange rate using platform-specific storage
  const storeRate = async (rate: number): Promise<void> => {
    try {
      const dataToStore: StoredCurrencyData = {
        rate,
        lastUpdated: new Date().toISOString()
      };
      
      const stringData = JSON.stringify(dataToStore);
      
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(STORAGE_KEY, stringData);
        }
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, stringData);
      }
    } catch (error) {
      console.warn('Failed to store currency data:', error);
    }
  };

  // Fetch fresh exchange rate from API
  const fetchExchangeRate = async (): Promise<number> => {
    try {
      // Using exchangerate-api.com (free tier allows 1500 requests/month)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/GBP');
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      
      const data: CurrencyData = await response.json();
      return data.rates.USD;
    } catch (err) {
      console.warn('Failed to fetch exchange rates:', err);
      throw err;
    }
  };

  useEffect(() => {
    const initializeCurrencyRate = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check for stored rate first
        const storedData = await getStoredRate();
        
        if (storedData && !shouldUpdateRate(storedData.lastUpdated)) {
          // Use stored rate if it's still valid (updated today)
          setExchangeRate(storedData.rate);
          setLoading(false);
          return;
        }
        
        // Fetch fresh rate if needed
        try {
          const freshRate = await fetchExchangeRate();
          setExchangeRate(freshRate);
          await storeRate(freshRate);
        } catch (fetchError) {
          // If API fails, use stored rate if available, otherwise use fallback
          if (storedData) {
            setExchangeRate(storedData.rate);
            setError('Using cached exchange rate (API unavailable)');
          } else {
            setExchangeRate(FALLBACK_RATE);
            setError('Using fallback exchange rate (API unavailable)');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize currency converter');
        setExchangeRate(FALLBACK_RATE);
      } finally {
        setLoading(false);
      }
    };

    initializeCurrencyRate();
    
    // Set up daily update at 00:01
    const setupDailyUpdate = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 1, 0, 0); // Set to 00:01 tomorrow
      
      const msUntilUpdate = tomorrow.getTime() - now.getTime();
      
      const timeoutId = setTimeout(() => {
        // Update the rate at 00:01
        initializeCurrencyRate();
        
        // Set up recurring daily updates
        const intervalId = setInterval(() => {
          initializeCurrencyRate();
        }, 24 * 60 * 60 * 1000); // 24 hours
        
        // Store interval ID for cleanup
        return () => clearInterval(intervalId);
      }, msUntilUpdate);
      
      return () => clearTimeout(timeoutId);
    };
    
    const cleanupDailyUpdate = setupDailyUpdate();
    
    return cleanupDailyUpdate;
  }, []);

  const convertToUSD = (gbpAmount: number): number => {
    if (!exchangeRate) return 0;
    return gbpAmount * exchangeRate;
  };

  return {
    exchangeRate,
    loading,
    error,
    convertToUSD,
  };
}