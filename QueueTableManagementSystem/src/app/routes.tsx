import { createBrowserRouter } from "react-router";
import { CustomerLanding } from "./pages/customer/CustomerLanding";
import { QueueJoin } from "./pages/customer/QueueJoin";
import { QueueStatus } from "./pages/customer/QueueStatus";
import { StaffDashboard } from "./pages/staff/StaffDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: CustomerLanding,
  },
  {
    path: "/join",
    Component: QueueJoin,
  },
  {
    path: "/status/:queueId",
    Component: QueueStatus,
  },
  {
    path: "/staff",
    Component: StaffDashboard,
  },
]);
