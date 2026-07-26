import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { CartProvider } from "./context/CartContext";
import Spinner from "./components/Spinner/Spinner";

// Lazy-loaded route components
const AppLayout = lazy(() => import("./pages/AppLayout/AppLayout"));
const Home = lazy(() => import("./pages/Home/Home"));
const About = lazy(() => import("./pages/About/About"));
const Menu = lazy(() => import("./pages/Menu/Menu"));
const Product = lazy(() => import("./pages/ProductPage/Product"));
const Checkout = lazy(() => import("./pages/Checkout/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess/OrderSuccess"));

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
          <Suspense
            fallback={
              <Spinner
                fullScreen
                size="lg"
                variant="gold"
              />
            }
          >
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
          </Suspense>
        </BrowserRouter>
      </CartProvider>
    </QueryClientProvider>
  );
}
