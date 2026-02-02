import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
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
import Account from "./pages/acccount/Account.jsx";
import Security from "./pages/acccount/Security.jsx";
import Blog from "./pages/Blog.jsx";
import BlogPost from "./pages/BlogPost.jsx";
import Contact from "./pages/Contact.jsx";
import { useEffect } from "react";
import AdminPanel from "./pages/admin/AdminPanel.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import AddProduct from "./pages/admin/AddProduct.jsx";
import Faq from "./pages/Faq.jsx";

function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <div
        className="min-h-screen flex flex-col"
        style={{ color: "#111827" }} // Diamond & Silver base
      >
        <Navbar />

        <main className="flex-1 mt-40 sm:mt-20">
          <Routes>
            {/* other routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/payment/:orderId" element={<Payment />} />
            <Route path="/account/security" element={<Security />} />
            <Route path="/account" element={<Account />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/faq" element={<Faq />} />

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/admin/products/new" element={<AddProduct />} />
            </Route>

            {/* product detail page route, e.g.: */}
            <Route path="/product/:slug" element={<ProductDetail />} />
          </Routes>
        </main>

        <Footer />
      </div>
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
