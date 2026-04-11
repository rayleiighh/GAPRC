import { createBrowserRouter } from "react-router";
import { KioskIdleScreen } from "./pages/KioskIdleScreen";
import { JobisteCheckoutForm } from "./pages/JobisteCheckoutForm";
import { DirectorDashboard } from "./pages/DirectorDashboard";
import { AdminLogin } from "./pages/AdminLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

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
    path: "/admin/login",
    Component: AdminLogin,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/reset-password",
    Component: ResetPassword,
  },
  {
    path: "/dashboard",
    Component: DirectorDashboard,
  },
]);