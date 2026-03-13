import { createBrowserRouter } from "react-router";
import { KioskIdleScreen } from "./pages/KioskIdleScreen";
import { JobisteCheckoutForm } from "./pages/JobisteCheckoutForm";
import { DirectorDashboard } from "./pages/DirectorDashboard";

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
    path: "/dashboard",
    Component: DirectorDashboard,
  },
]);
