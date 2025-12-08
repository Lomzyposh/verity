import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import Home from "./pages/Home.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import Shop from "./pages/Shop.jsx";
import ProductDetail from "./pages/ProductDetails.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Orders from "./pages/Orders.jsx";
import Payment from "./pages/Payment.jsx";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <BrowserRouter>
        <div
          className="min-h-screen flex flex-col"
          style={{ background: "#F5F5F7", color: "#111827" }} // Diamond & Silver base
        >
          <Navbar />

          <main className="flex-11">
            <Routes>
              {/* other routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/payment/:orderId" element={<Payment />} />

              {/* product detail page route, e.g.: */}
              <Route path="/product/:slug" element={<ProductDetail />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#111827",
            color: "#FFFFFF",
            borderRadius: "12px",
            padding: "12px 16px",
          },
        }}
      />
    </>
  );
}

export default App;
