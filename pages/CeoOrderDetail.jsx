import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Package, Printer, Check, RotateCcw } from "lucide-react";
import Badge from "../components/ui/Badge.jsx";

const CeoOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${id}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch order");
      setOrder(data);
      try {
        const txRes = await fetch(`/api/finance/transactions/order/${id}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        const txData = await txRes.json();
        if (txRes.ok) setTx(txData);
      } catch {}
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const updateStatus = async (status) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      setStatusError("Unauthorized: missing token");
      return;
    }

    try {
      setStatusSaving(true);
      setStatusError("");

      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update status");
      }

      setOrder(data);
    } catch (e) {
      setStatusError(e.message || "Failed to update status");
    } finally {
      setStatusSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600 text-sm">{error}</div>;
  if (!order) return null;

  const codText = Number(order.codAmount || 0).toLocaleString();
  const companyCharges = tx ? Number(tx.companyCommission || 0) : 0;
  const netAmount = tx
    ? Number((tx.totalCodCollected || 0) - (tx.companyCommission || 0))
    : null;

  const getDisplayStatus = (o) => {
    if (!o) return "";

    const hasRider = !!o.assignedRider;

    if (
      !hasRider &&
      ["ASSIGNED", "OUT_FOR_DELIVERY", "AT_LLL_WAREHOUSE"].includes(o.status)
    ) {
      return "Unassigned";
    }

    if (hasRider && ["ASSIGNED", "AT_LLL_WAREHOUSE"].includes(o.status)) {
      return "Out for delivery";
    }

    switch (o.status) {
      case "OUT_FOR_DELIVERY":
        return "Out for delivery";
      case "DELIVERED":
        return "Delivered";
      case "RETURNED":
        return "Returned";
      case "FAILED":
        return "Failed";
      case "CREATED":
        return "Created";
      case "ASSIGNED":
      case "AT_LLL_WAREHOUSE":
        return "Assigned";
      default:
        return o.status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-primary" />
          <div>
            <h3 className="text-lg font-bold text-secondary">
              Order {order.bookingId}
            </h3>
            <p className="text-xs text-gray-500">Service: {order.serviceType}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>

      <div className="bg-secondary text-white rounded-2xl p-6 flex items-center justify-between">
        <div>
          <div className="text-xs opacity-80">COD Amount</div>
          <div className="text-3xl font-bold">PKR {codText}</div>
        </div>
        <Badge status={getDisplayStatus(order)} />
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-secondary mb-3">Update Delivery Status</h3>
        {statusError && (
          <div className="mb-2 text-xs text-red-600">{statusError}</div>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateStatus("FIRST_ATTEMPT")}
            disabled={statusSaving}
            className="px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            1st Attempt
          </button>
          <button
            onClick={() => updateStatus("SECOND_ATTEMPT")}
            disabled={statusSaving}
            className="px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            2nd Attempt
          </button>
          <button
            onClick={() => updateStatus("THIRD_ATTEMPT")}
            disabled={statusSaving}
            className="px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            3rd Attempt
          </button>
          <button
            onClick={() => updateStatus("DELIVERED")}
            disabled={statusSaving}
            className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4 inline mr-1" /> Delivered
          </button>
          <button
            onClick={() => updateStatus("RETURNED")}
            disabled={statusSaving}
            className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4 inline mr-1" /> Return
          </button>
        </div>
      </div>

      {tx && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-secondary mb-2">Settlement</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Total COD Collected</div>
              <div className="font-semibold">
                PKR {Number(tx.totalCodCollected || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Service Charges</div>
              <div className="font-semibold">
                PKR {Number(companyCharges).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Net Amount</div>
              <div className="font-semibold">
                {netAmount !== null
                  ? `PKR ${Number(netAmount).toLocaleString()}`
                  : "—"}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-bold text-secondary">Order Details</h3>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Weight</div>
              <div className="font-semibold">
                {order.weightKg || order.weight || "N/A"} kg
              </div>
            </div>
            <div>
              <div className="text-gray-500">Service Charges</div>
              <div className="font-semibold">
                PKR {Number(order.serviceCharges || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Pieces</div>
              <div className="font-semibold">{order.pieces || 1}</div>
            </div>
            <div>
              <div className="text-gray-500">Payment Type</div>
              <div className="font-semibold">{order.paymentType || "COD"}</div>
            </div>
            {order.productDescription && (
              <div className="md:col-span-2">
                <div className="text-gray-500">Product Description</div>
                <div className="font-semibold">{order.productDescription}</div>
              </div>
            )}
            {order.remarks && (
              <div className="md:col-span-2">
                <div className="text-gray-500">Remarks</div>
                <div className="font-semibold">{order.remarks}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-bold text-secondary">Consignee</h3>
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {order.consigneeAddress},{" "}
              {order.destinationCity}
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" /> {order.consigneePhone}
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-400">
        Created on {new Date(order.createdAt).toDateString()}
      </div>
    </div>
  );
};

export default CeoOrderDetail;
