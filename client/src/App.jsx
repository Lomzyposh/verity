import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Login from "./pages/auth/Login.jsx";
import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import ProductDetail from "./pages/ProductDetails.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Orders from "./pages/Orders.jsx";
import Payment from "./pages/Payment.jsx";
import { Toaster } from "react-hot-toast";
import Blog from "./pages/Blog.jsx";
import BlogPost from "./pages/BlogPost.jsx";
import Contact from "./pages/Contact.jsx";
import { useEffect } from "react";
import AdminPanel from "./pages/admin/AdminPanel.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import AddProduct from "./pages/admin/AddProduct.jsx";
import Faq from "./pages/Faq.jsx";
import EditProduct from "./pages/admin/EditProduct.jsx";

function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <div
        className="min-h-screen flex flex-col"
        style={{ color: "#111827" }}
      >
        <Navbar />

        <main className="flex-1 mt-40 sm:mt-20">
          <Routes>
            {/* Public routes - no login required */}
            <Route path="/" element={<Home />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/payment/:orderId" element={<Payment />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/product/:slug" element={<ProductDetail />} />

            {/* Admin-only login + protected routes */}
            <Route path="/login" element={<Login />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/admin/products/new" element={<AddProduct />} />
              <Route path="/admin/products/:id/edit" element={<EditProduct />}/>
            </Route>
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
