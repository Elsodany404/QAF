import { useState } from 'react';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import About from './pages/About';

type Page = 'home' | 'menu' | 'checkout' | 'success' | 'about';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [orderId, setOrderId] = useState('');

  const navigate = (p: string) => {
    setPage(p as Page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSuccess = (id: string) => {
    setOrderId(id);
    navigate('success');
  };

  return (
    <CartProvider>
      <div className="font-body antialiased">
        <Navbar currentPage={page} onNavigate={navigate} />
        <CartDrawer onCheckout={() => navigate('checkout')} />

        {page === 'home' && <Home onNavigate={navigate} />}
        {page === 'menu' && <Menu />}
        {page === 'checkout' && <Checkout onBack={() => navigate('menu')} onSuccess={handleSuccess} />}
        {page === 'success' && <OrderSuccess orderId={orderId} onContinue={() => navigate('home')} />}
        {page === 'about' && <About onShop={() => navigate('menu')} />}

        {page !== 'success' && <Footer onNavigate={navigate} />}
      </div>
    </CartProvider>
  );
}
