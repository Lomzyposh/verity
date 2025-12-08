import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import { AuthProvider } from "./contexts/AuthContext.jsx";
import { CurrencyProvider } from "./contexts/CurrencyContext.jsx";
import { CartProvider } from "./contexts/CartContext.jsx";
import { FavoritesProvider } from "./contexts/FavoriteContext.jsx";
import { JewelryProvider } from "./contexts/JewelryContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <CurrencyProvider>
        <CartProvider>
          <FavoritesProvider>
            <JewelryProvider>
              <App />
            </JewelryProvider>
          </FavoritesProvider>
        </CartProvider>
      </CurrencyProvider>
    </AuthProvider>
  </StrictMode>
);
