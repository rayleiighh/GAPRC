import { createBrowserRouter } from "react-router";
import { KioskIdleScreen } from "./pages/KioskIdleScreen";
import { JobisteCheckoutForm } from "./pages/JobisteCheckoutForm";
import { DirectorDashboard } from "./pages/DirectorDashboard";
import { AdminLogin } from "./pages/AdminLogin"; // Ajout de l'import

export const router = createBrowserRouter([
  {
    path: "/",
    Component: KioskIdleScreen,
  },
  {
    path: "/checkout/:name",
    Component: JobisteCheckoutForm,
  },
  {
    path: "/admin/login", // Nouvelle route
    Component: AdminLogin,
  },
  {
    path: "/dashboard",
    Component: DirectorDashboard,
  },
]);