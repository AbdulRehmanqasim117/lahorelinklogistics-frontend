import React, { useEffect, useMemo, useState } from "react";
import { Package, RefreshCcw } from "lucide-react";

const ShipperIntegratedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/integrations/shopify/orders", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load integrated orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load integrated orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      return (
        String(o?.providerOrderNumber || o?.providerOrderId || "").toLowerCase().includes(q) ||
        String(o?.customerName || "").toLowerCase().includes(q) ||
        String(o?.city || "").toLowerCase().includes(q)
      );
    });
  }, [orders, search]);

  const badge = (o) => {
    const isBooked = o?.lllBookingStatus === "BOOKED";
    const label = isBooked ? "Booked" : "Not Booked";

    const color = isBooked
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-amber-50 text-amber-800 border-amber-200";

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs border ${color}`}>{label}</span>
    );
  };

  const book = async (id) => {
    try {
      setActionLoading((p) => ({ ...p, [id]: true }));
      const res = await fetch(`/api/integrations/shopify/orders/${id}/book`, {
        method: "POST",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to book order");
      const updatedIntegrated = data?.integratedOrder || null;
      setOrders((prev) =>
        prev.map((o) => (o._id === id && updatedIntegrated ? updatedIntegrated : o)),
      );
    } catch (e) {
      setError(e.message || "Failed to book order");
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-bold text-secondary">Integrated Orders</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search orders..."
              className="pl-3 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg w-full sm:w-auto"
            />
            <button
              onClick={load}
              className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600 flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-500">No integrated orders pending approval.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 px-3">Shopify Order</th>
                    <th className="py-2 px-3">Customer</th>
                    <th className="py-2 px-3">City</th>
                    <th className="py-2 px-3">Total</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => {
                    const disabled = !!actionLoading[o._id];
                    const total = Number(o?.totalPrice || 0);
                    return (
                      <tr key={o._id} className="border-t border-gray-100">
                        <td className="py-2 px-3 font-mono text-xs">
                          {o.providerOrderNumber || o.providerOrderId}
                        </td>
                        <td className="py-2 px-3 text-secondary">{o.customerName || "—"}</td>
                        <td className="py-2 px-3">{o.city || "—"}</td>
                        <td className="py-2 px-3">
                          {o.currency || "PKR"} {total.toLocaleString()}
                        </td>
                        <td className="py-2 px-3">{badge(o)}</td>
                        <td className="py-2 px-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => book(o._id)}
                              disabled={disabled}
                              className="px-3 py-1.5 text-xs bg-primary hover:bg-primary-hover text-white rounded border border-primary disabled:opacity-60"
                            >
                              {disabled ? "Working..." : "Book with LLL"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete/reject flow for integrated orders is intentionally omitted in the
          Shopify flow; shippers can ignore unbooked orders or manage them in
          their Shopify admin. */}
    </div>
  );
};

export default ShipperIntegratedOrders;
