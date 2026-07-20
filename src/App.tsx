import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { CartProvider } from "./context/CartContext";
import About from "./pages/About/About";
import AppLayout from "./pages/AppLayout/AppLayout";
import Checkout from "./pages/Checkout/Checkout";
import Home from "./pages/Home/Home";
import Menu from "./pages/Menu/Menu";
import OrderSuccess from "./pages/OrderSuccess/OrderSuccess";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Product from "./pages/ProductPage/Product";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate replace to="home" />} />
              <Route path="home" element={<Home />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="menu" element={<Menu />} />
              <Route path="products/:id" element={<Product />} />
              <Route path="about" element={<About />} />
              <Route path="order-success" element={<OrderSuccess />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </QueryClientProvider>
  );
}
