import React, { useEffect, useState } from "react";
import { Search, Truck, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../src/contexts/AuthContext";
import { getToken } from "../src/utils/auth";

const CeoOrders = () => {
  const { user } = useAuth();
  const token = user?.token || getToken();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [shippers, setShippers] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchId, setSearchId] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const [dateRange, setDateRange] = useState("all");
  const [selectedRiderFilter, setSelectedRiderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [shipperFilter, setShipperFilter] = useState("");

  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchRiders = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/users/riders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setRiders(data);
      }
    } catch {}
  };

  const fetchShippers = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/users/shippers?active=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setShippers(data);
      }
    } catch {
      // optional filter only
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchRiders();
    fetchShippers();
  }, [token]);

  const lookup = async (e) => {
    e && e.preventDefault();
    if (!searchId.trim() || !token) return;
    try {
      const res = await fetch(
        `/api/orders?q=${encodeURIComponent(searchId.trim())}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (res.ok && Array.isArray(data) && data.length > 0) {
        navigate(`/ceo/orders/${data[0]._id}`);
      } else {
        setError("No order found for the provided ID");
      }
    } catch (err) {
      setError(err.message || "Failed to search order");
    }
  };

  useEffect(() => {
    const q = searchId.trim().toLowerCase();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setSuggestions(
      orders
        .filter(
          (o) =>
            o.bookingId?.toLowerCase().includes(q) ||
            o.trackingId?.toLowerCase().includes(q) ||
            o.consigneeName?.toLowerCase().includes(q) ||
            o.destinationCity?.toLowerCase().includes(q),
        )
        .slice(0, 8),
    );
  }, [searchId, orders]);

  const filteredOrders = React.useMemo(() => {
    if (!Array.isArray(orders)) return [];

    let list = orders;

    if (dateRange !== "all") {
      const now = new Date();
      let start = new Date(now);
      let end = new Date(now);

      if (dateRange === "today") {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      } else if (dateRange === "week") {
        const day = now.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        start = new Date(now);
        start.setDate(now.getDate() + diffToMonday);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      } else if (dateRange === "month") {
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        end = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
      }

      list = list.filter((o) => {
        const d = new Date(o?.createdAt);
        if (Number.isNaN(d.getTime())) return false;
        return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
      });
    }

    if (selectedRiderFilter === "unassigned") {
      list = list.filter((o) => !o.assignedRider);
    } else if (selectedRiderFilter) {
      list = list.filter(
        (o) => o.assignedRider && o.assignedRider._id === selectedRiderFilter,
      );
    }

    if (statusFilter === "PENDING") {
      list = list.filter(
        (o) => !["DELIVERED", "RETURNED", "FAILED"].includes(o.status),
      );
    } else if (statusFilter === "OUT_FOR_DELIVERY") {
      list = list.filter((o) => o.status === "OUT_FOR_DELIVERY");
    } else if (statusFilter === "DELIVERED") {
      list = list.filter((o) => o.status === "DELIVERED");
    } else if (statusFilter === "RETURNED") {
      list = list.filter((o) => o.status === "RETURNED");
    }

    if (shipperFilter) {
      list = list.filter((o) => o.shipper && o.shipper._id === shipperFilter);
    }

    // Search by Booking/Tracking ID (acts as a filter similar to Manager/ Shipper views)
    const q = searchId.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.bookingId?.toLowerCase().includes(q) ||
          o.trackingId?.toLowerCase().includes(q),
      );
    }

    return list;
  }, [orders, dateRange, selectedRiderFilter, statusFilter, shipperFilter, searchId]);

  const assignRider = async (orderId, riderId) => {
    if (!token || !orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ riderId: riderId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to assign rider");
      setSelectedOrder(null);
      await fetchOrders();
    } catch (e) {
      setError(e.message || "Failed to assign rider");
    }
  };

  const sortedShippers = React.useMemo(() => {
    return [...shippers].sort((a, b) => {
      const an = (a.companyName || a.name || "").toLowerCase();
      const bn = (b.companyName || b.name || "").toLowerCase();
      return an.localeCompare(bn);
    });
  }, [shippers]);

  const statusLabel = (s) =>
    ({
      CREATED: "Pending",
      ASSIGNED: "In LLL Warehouse",
      AT_LLL_WAREHOUSE: "In LLL Warehouse",
      OUT_FOR_DELIVERY: "Out for delivery",
      RETURNED: "Returned",
      DELIVERED: "Delivered",
      FAILED: "Failed",
    }[s] || s);

  const bookingBadge = (order) => {
    const isBooked = order.bookingState === "BOOKED";
    const color = isBooked
      ? "bg-green-100 text-green-700 border-green-200"
      : "bg-amber-100 text-amber-700 border-amber-200";
    const label = isBooked ? "Booked" : "Unbooked";
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs border ${color}`}>
        {label}
      </span>
    );
  };

  const sourceBadge = (order) => {
    if (order.isIntegrated) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs border border-blue-200 bg-blue-50 text-blue-700">
          Integrated
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs border border-gray-200 bg-gray-50 text-gray-700">
        Manual
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="font-bold text-lg text-secondary">All Orders</h3>
          <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
            <form
              onSubmit={lookup}
              className="relative flex flex-col sm:flex-row sm:flex-wrap items-stretch gap-2 w-full sm:justify-end"
            >
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                type="text"
                placeholder="Enter Booking/Tracking ID"
                className="w-full sm:w-auto pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg"
              />
              <select
                value={selectedRiderFilter}
                onChange={(e) => setSelectedRiderFilter(e.target.value)}
                className="w-full sm:w-auto pl-3 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
                aria-label="Filter by Assigned Rider"
              >
                <option value="">All Riders</option>
                <option value="unassigned">Unassigned</option>
                {riders.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name || "Unnamed"}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto pl-3 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
                aria-label="Filter by Order Status"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="RETURNED">Returned</option>
              </select>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full sm:w-auto pl-3 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
                aria-label="Filter by Date Range"
              >
                <option value="all">All Orders</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <select
                value={shipperFilter}
                onChange={(e) => setShipperFilter(e.target.value)}
                className="w-full sm:w-auto pl-3 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
                aria-label="Filter by Shipper"
              >
                <option value="">All Shippers</option>
                {sortedShippers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {(s.companyName || s.name || "Unnamed") + (s.email ? ` - ${s.email}` : "")}
                  </option>
                ))}
              </select>
              {suggestions.length > 0 && (
                <ul className="absolute left-0 top-full mt-1 w-full sm:w-80 bg-white border border-gray-200 rounded-lg shadow z-10">
                  {suggestions.map((s) => (
                    <li
                      key={s._id}
                      className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                      onMouseDown={() => {
                        navigate(`/ceo/orders/${s._id}`);
                      }}
                    >
                      <span className="font-mono text-xs mr-2">{s.bookingId}</span>
                      <span>{s.consigneeName}</span>
                      <span className="text-xs text-gray-500"> · {s.destinationCity}</span>
                    </li>
                  ))}
                </ul>
              )}
            </form>
          </div>
        </div>
        <div className="p-6">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : filteredOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No orders found for selected filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 px-3">Shipper</th>
                    <th className="py-2 px-3">Order ID</th>
                    <th className="py-2 px-3">Source</th>
                    <th className="py-2 px-3">Booking</th>
                    <th className="py-2 px-3">Consignee</th>
                    <th className="py-2 px-3">COD</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Delivery Status</th>
                    <th className="py-2 px-3">Payment</th>
                    <th className="py-2 px-3">Rider</th>
                    <th className="py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => (
                    <tr
                      key={o._id}
                      className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/ceo/orders/${o._id}`)}
                    >
                      <td className="py-2 px-3 text-xs text-gray-700">
                        {o.shipper?.companyName || o.shipper?.name || "Unknown"}
                      </td>
                      <td className="py-2 px-3 font-mono text-xs">
                        {o.bookingId || o.trackingId || "-"}
                      </td>
                      <td className="py-2 px-3">{sourceBadge(o)}</td>
                      <td className="py-2 px-3">{bookingBadge(o)}</td>
                      <td className="py-2 px-3 text-secondary">
                        {o.consigneeName}
                      </td>
                      <td className="py-2 px-3">
                        PKR {Number(o.codAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-3">
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="py-2 px-3 text-xs">
                        {statusLabel(o.status)}
                      </td>
                      <td className="py-2 px-3 text-xs">
                        {o.paymentType || "-"}
                      </td>
                      <td className="py-2 px-3 text-xs">
                        {o.assignedRider?.name || "Unassigned"}
                      </td>
                      <td className="py-2 px-3">
                        {(o.status === "CREATED" || o.assignedRider) && (
                          <button
                            className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(o);
                            }}
                          >
                            {o.assignedRider ? "Change Assignment" : "Assign"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-secondary">Assign Rider</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-2 max-h-80 overflow-y-auto">
              <button
                onClick={() => assignRider(selectedOrder._id, null)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-red-200 hover:border-red-300 hover:bg-red-50 text-left mb-4"
              >
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-red-700">Unassign</div>
                  <div className="text-xs text-red-500">Remove rider assignment</div>
                </div>
              </button>
              {riders.length === 0 && (
                <p className="text-sm text-gray-500">No riders found.</p>
              )}
              {riders.map((r) => (
                <button
                  key={r._id}
                  onClick={() => assignRider(selectedOrder._id, r._id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-secondary">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.email}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CeoOrders;
