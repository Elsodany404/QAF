import { Outlet, useLocation } from "react-router-dom";

import styles from "./AppLayout.module.css";
import CartDrawer from "../../components/CartDrawer/CartDrawer";
import Footer from "../../components/Footer/Footer";
import Navbar from "../../components/Navbar/Navbar";
function AppLayout() {
  const location = useLocation();
  // Define the paths where you want to HIDE the component

  return (
    <div className={styles.app}>
      <Navbar />
      <CartDrawer />
      <Outlet />
      <Footer />
    </div>
  );
}

export default AppLayout;
