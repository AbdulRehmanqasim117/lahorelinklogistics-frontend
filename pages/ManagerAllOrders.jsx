import React from "react";
import CeoOrders from "./CeoOrders.jsx";

const ManagerAllOrders = () => {
  // Reuse CeoOrders component for Manager so that All Orders UI and
  // behaviour match CEO view. Backend already scopes data by role,
  // and CeoOrders uses shared /api/orders endpoint.
  return <CeoOrders />;
};

export default ManagerAllOrders;
