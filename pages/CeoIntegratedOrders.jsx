import React, { useEffect, useMemo, useState } from "react";
import { Package, RefreshCcw, Trash2 } from "lucide-react";
import { useAuth } from "../src/contexts/AuthContext";
import { getToken } from "../src/utils/auth";

const CeoIntegratedOrders = () => {
  const { user } = useAuth();
  const token = user?.token || getToken();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders/integrated/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Failed to load integrated orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load integrated orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const orderIdDisplay = o.isIntegrated
        ? o.shopifyOrderNumber ||
          o.sourceProviderOrderNumber ||
          o.externalOrderId ||
          o.bookingId
        : o.bookingId;

      return (
        String(orderIdDisplay || "").toLowerCase().includes(q) ||
        String(o?.consigneeName || "").toLowerCase().includes(q) ||
        String(o?.destinationCity || "").toLowerCase().includes(q) ||
        String(o?.shipper?.companyName || o?.shipper?.name || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [orders, search]);

  const badge = (o) => {
    const isBooked = o?.bookingState === "BOOKED";
    const isDeleted = o?.isDeleted === true;
    const label = isDeleted
      ? "Deleted"
      : isBooked
        ? "Booked"
        : "Pending Approval";

    const color = isDeleted
      ? "bg-red-50 text-red-700 border-red-200"
      : isBooked
        ? "bg-green-50 text-green-700 border-green-200"
        : "bg-amber-50 text-amber-800 border-amber-200";

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs border ${color}`}>
        {label}
      </span>
    );
  };

  const book = async (id) => {
    if (!token) return;
    try {
      setActionLoading((p) => ({ ...p, [id]: true }));
      const res = await fetch(`/api/orders/${id}/book`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to book order");
      setOrders((prev) => prev.filter((x) => x._id !== id));
    } catch (e) {
      setError(e.message || "Failed to book order");
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  };

  const reject = async (id) => {
    if (!token) return;
    try {
      setActionLoading((p) => ({ ...p, [id]: true }));
      const res = await fetch(`/api/orders/${id}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to delete order");
      setOrders((prev) => prev.filter((x) => x._id !== id));
      setConfirmDelete(null);
    } catch (e) {
      setError(e.message || "Failed to delete order");
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
            <h3 className="text-lg font-bold text-secondary">
              Integrated Orders
            </h3>
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
            <p className="text-sm text-gray-500">
              No integrated orders pending approval.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 px-3">Order ID</th>
                    <th className="py-2 px-3">Shipper</th>
                    <th className="py-2 px-3">Customer</th>
                    <th className="py-2 px-3">City</th>
                    <th className="py-2 px-3">COD / Amount</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => {
                    const disabled = !!actionLoading[o._id];
                    const cod = Number(o?.codAmount || 0);
                    const orderIdDisplay = o.isIntegrated
                      ? o.shopifyOrderNumber ||
                        o.sourceProviderOrderNumber ||
                        o.externalOrderId ||
                        o.bookingId
                      : o.bookingId;

                    return (
                      <tr key={o._id} className="border-t border-gray-100">
                        <td className="py-2 px-3 font-mono text-xs">
                          {orderIdDisplay}
                        </td>
                        <td className="py-2 px-3 text-xs text-gray-700">
                          {o.shipper?.companyName || o.shipper?.name || "—"}
                        </td>
                        <td className="py-2 px-3 text-secondary">
                          {o.consigneeName || "—"}
                        </td>
                        <td className="py-2 px-3">{o.destinationCity || "—"}</td>
                        <td className="py-2 px-3">
                          PKR {cod.toLocaleString()}
                        </td>
                        <td className="py-2 px-3">{badge(o)}</td>
                        <td className="py-2 px-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => book(o._id)}
                              disabled={disabled}
                              className="px-3 py-1.5 text-xs bg-primary hover:bg-primary-hover text-white rounded border border-primary disabled:opacity-60"
                            >
                              {disabled ? "Working..." : "Book"}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(o)}
                              disabled={disabled}
                              className="px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200 flex items-center gap-2 disabled:opacity-60"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
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

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-secondary">
                Confirm Delete
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Are you sure you want to delete this integrated order?
              </p>
            </div>
            <div className="p-6 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => reject(confirmDelete._id)}
                className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded border border-red-600"
                disabled={!!actionLoading[confirmDelete._id]}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CeoIntegratedOrders;
