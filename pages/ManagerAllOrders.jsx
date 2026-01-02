import React, { useEffect, useState } from "react";
import { Search, XCircle, Truck } from "lucide-react";

const ManagerAllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchId, setSearchId] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [found, setFound] = useState(null);
  const [tx, setTx] = useState(null);
  const [settlementUpdating, setSettlementUpdating] = useState(false);
  const [dateRange, setDateRange] = useState("all"); // 'all' | 'today' | 'week' | 'month'
  const [selectedRiderFilter, setSelectedRiderFilter] = useState(""); // '' = all, 'unassigned' = only unassigned, riderId = specific rider
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | PENDING | OUT_FOR_DELIVERY | DELIVERED | RETURNED

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch orders");
      setOrders(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const lookup = async (e) => {
    e && e.preventDefault();
    setFound(null);
    if (!searchId.trim()) return;
    try {
      const res = await fetch(
        `/api/orders?q=${encodeURIComponent(searchId.trim())}`,
        {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        },
      );
      const data = await res.json();
      if (res.ok && Array.isArray(data) && data.length > 0) {
        setFound(data[0]);
      } else {
        setFound({ notFound: true });
      }
    } catch {}
  };

  useEffect(() => {
    const loadTx = async () => {
      if (!found || found.notFound) {
        setTx(null);
        return;
      }
      try {
        const res = await fetch(
          `/api/finance/transactions/order/${found._id}`,
          {
            headers: { Authorization: token ? `Bearer ${token}` : "" },
          },
        );
        const data = await res.json();
        if (res.ok) setTx(data);
        else setTx(null);
      } catch {
        setTx(null);
      }
    };
    loadTx();
  }, [found]);

  const updateSettlement = async (transactionId, desiredStatus) => {
    if (!transactionId) return;
    setSettlementUpdating(true);
    setError('');
    try {
      const res = await fetch(`/api/finance/transactions/${transactionId}/settlement`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ status: desiredStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update settlement');
      setTx(data);

      // Refresh transaction by order (ensures we reflect any server-side normalization)
      if (found && found._id) {
        try {
          const txRes = await fetch(`/api/finance/transactions/order/${found._id}`, {
            headers: { Authorization: token ? `Bearer ${token}` : "" },
          });
          const txData = await txRes.json();
          if (txRes.ok) setTx(txData);
        } catch {}
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSettlementUpdating(false);
    }
  };

  const fetchRiders = async () => {
    try {
      const res = await fetch("/api/users/riders", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch riders");
      setRiders(data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchOrders();
    fetchRiders();
  }, []);

  const filteredOrders = React.useMemo(() => {
    if (!Array.isArray(orders)) return [];

    // Date range filter (client-side, similar to CeoOrders)
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
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }

      list = list.filter((o) => {
        const d = new Date(o?.createdAt);
        if (Number.isNaN(d.getTime())) return false;
        return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
      });
    }

    // Rider filter
    if (selectedRiderFilter === "unassigned") {
      list = list.filter((o) => !o.assignedRider);
    } else if (selectedRiderFilter) {
      list = list.filter((o) => o.assignedRider && o.assignedRider._id === selectedRiderFilter);
    }

    // Status filter (manager view specific)
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

    return list;
  }, [orders, dateRange, selectedRiderFilter, statusFilter]);

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

  const assignRider = async (orderId, riderId) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ riderId: riderId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to assign rider");
      setSelectedOrder(null);
      await fetchOrders();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-secondary">All Orders</h3>
          <div className="flex items-center gap-3">
            <form onSubmit={lookup} className="relative flex flex-wrap items-stretch gap-2 justify-end">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                type="text"
                placeholder="Enter Booking/Tracking ID"
                className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg"
              />
              <select
                value={selectedRiderFilter}
                onChange={(e) => setSelectedRiderFilter(e.target.value)}
                className="pl-3 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
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
                className="pl-3 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
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
                className="pl-3 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
                aria-label="Filter by Date Range"
              >
                <option value="all">All Orders</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              {suggestions.length > 0 && (
                <ul className="absolute left-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow z-10">
                  {suggestions.map((s) => (
                    <li
                      key={s._id}
                      className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                      onMouseDown={() => setFound(s)}
                    >
                      <span className="font-mono text-xs mr-2">
                        {s.bookingId}
                      </span>
                      <span>{s.consigneeName}</span>
                      <span className="text-xs text-gray-500">
                        {" "}
                        • {s.destinationCity}
                      </span>
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
            <ul className="space-y-3">
              {filteredOrders.map((o) => (
                <li
                  key={o._id}
                  className="border border-gray-100 rounded-lg p-4"
                >
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">
                      {o.shipper?.companyName || o.shipper?.name || "Unknown"}
                    </span>
                    <span className="font-mono text-xs">{o.bookingId}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span>
                      Created: {new Date(o.createdAt).toLocaleString()}
                    </span>
                    {o.assignedRider && (
                      <span className="ml-3">
                        Assigned to: {o.assignedRider.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs text-gray-500">{o.status}</div>
                    <div className="flex items-center gap-2">
                      {(o.status === "CREATED" || o.assignedRider) && (
                        <button
                          className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                          onClick={() => setSelectedOrder(o)}
                        >
                          {o.assignedRider ? "Change Assignment" : "Assign"}
                        </button>
                      )}
                      <button
                        className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                        onClick={() => setFound(o)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {found && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setFound(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-secondary">Order Detail</h3>
              <button
                onClick={() => setFound(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm max-h-96 overflow-y-auto">
              {found.notFound ? (
                <p className="text-red-600">No order found</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-500 font-medium">Order ID:</span>{" "}
                    <span className="font-mono">{found.bookingId}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">
                      Tracking ID:
                    </span>{" "}
                    <span className="font-mono">{found.trackingId}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Shipper:</span>{" "}
                    {found.shipper?.companyName ||
                      found.shipper?.name ||
                      "Unknown"}
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Status:</span>{" "}
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {found.status}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 font-medium">
                      Consignee Name:
                    </span>{" "}
                    {found.consigneeName}
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Phone:</span>{" "}
                    {found.consigneePhone}
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">City:</span>{" "}
                    {found.destinationCity}
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 font-medium">Address:</span>{" "}
                    {found.consigneeAddress}
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">
                      COD Amount:
                    </span>{" "}
                    PKR {Number(found.codAmount || 0).toLocaleString()}
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Pieces:</span>{" "}
                    {found.pieces || 1}
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Fragile:</span>{" "}
                    {found.fragile ? "Yes" : "No"}
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Weight:</span>{" "}
                    {found.weightKg || found.weight || "N/A"} kg
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">
                      Service Charges:
                    </span>{" "}
                    PKR {Number(found.serviceCharges || 0).toLocaleString()}
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">
                      Total Charges:
                    </span>{" "}
                    PKR{" "}
                    {Number(
                      found.totalAmount ||
                        (found.codAmount || 0) + (found.serviceCharges || 0),
                    ).toLocaleString()}
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 font-medium">Remarks:</span>{" "}
                    {found.remarks || "N/A"}
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 font-medium">
                      Assigned Rider:
                    </span>{" "}
                    {found.assignedRider?.name || "Unassigned"}
                  </div>
                  {tx && (
                    <>
                      <div>
                        <span className="text-gray-500 font-medium">
                          Rider Commission:
                        </span>{" "}
                        PKR {Number(tx.riderCommission || 0).toLocaleString()}
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">
                          Net Amount:
                        </span>{" "}
                        PKR{" "}
                        {Number(
                          (tx.totalCodCollected || 0) -
                            (tx.riderCommission || 0),
                        ).toLocaleString()}
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">
                          Settlement Status:
                        </span>{" "}
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            String(tx.settlementStatus || '').toUpperCase() === 'PAID' ||
                            String(tx.settlementStatus || '').toUpperCase() === 'SETTLED'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {String(tx.settlementStatus || '').toUpperCase() === 'PAID' ||
                          String(tx.settlementStatus || '').toUpperCase() === 'SETTLED'
                            ? 'Paid'
                            : 'Unpaid'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        {(() => {
                          const paid =
                            String(tx.settlementStatus || '').toUpperCase() === 'PAID' ||
                            String(tx.settlementStatus || '').toUpperCase() === 'SETTLED';
                          return (
                            <button
                              disabled={settlementUpdating}
                              onClick={() =>
                                updateSettlement(tx._id, paid ? 'UNPAID' : 'PAID')
                              }
                              className={`mt-2 px-3 py-1 text-xs rounded border ${
                                paid
                                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                                  : 'bg-primary text-white hover:bg-primary-hover border-primary'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {paid ? 'Mark Unpaid' : 'Mark Paid'}
                            </button>
                          );
                        })()}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="p-4 flex justify-end gap-2 border-t border-gray-100">
              <button
                className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600"
                onClick={() => setFound(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
                  <div className="text-xs text-red-500">
                    Remove rider assignment
                  </div>
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

export default ManagerAllOrders;
