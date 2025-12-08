import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import api from "../api/axios";

const JewelryContext = createContext(null);

export const useJewelry = () => {
  const ctx = useContext(JewelryContext);
  if (!ctx) {
    throw new Error("useJewelry must be used within JewelryProvider");
  }
  return ctx;
};

export function JewelryProvider({ children }) {
  const [jewelry, setJewelry] = useState([]);
  const [loadingJewelry, setLoadingJewelry] = useState(true);
  const [jewelryError, setJewelryError] = useState(null);

  const fetchJewelry = useCallback(async () => {
    try {
      setLoadingJewelry(true);
      setJewelryError(null);

      const { data } = await api.get("/api/products");

      console.log("Fetched jewelry data:", data);
      setJewelry(Array.isArray(data) ? data : data.products || []);
    } catch (err) {
      console.error("Error fetching jewelry:", err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Unable to load jewelry items.";
      setJewelryError(msg);
    } finally {
      setLoadingJewelry(false);
    }
  }, []);

  useEffect(() => {
    fetchJewelry();
  }, [fetchJewelry]);

  const getBySlug = useCallback(
    (slug) => jewelry.find((item) => item.slug === slug),
    [jewelry]
  );

  const value = {
    jewelry,
    loadingJewelry,
    jewelryError,
    reloadJewelry: fetchJewelry,
    getBySlug,
  };

  return (
    <JewelryContext.Provider value={value}>
      {children}
    </JewelryContext.Provider>
  );
}