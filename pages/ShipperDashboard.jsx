import React, { useEffect, useState } from "react";
import {
  Package,
  Plus,
  RefreshCcw,
  DollarSign,
  Truck,
  Clock,
  ClipboardList,
  CheckCircle,
  Building2,
  Home,
  AlertCircle,
  ArrowDownToLine,
  User,
  Bike,
} from "lucide-react";
import MobileStatCard from "../components/ui/MobileStatCard.jsx";
import StatusCard from "../components/ui/StatusCard.jsx";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../src/contexts/AuthContext";
import { getToken } from "../src/utils/auth";

const ShipperDashboard = () => {
  const location = useLocation();
  const [view, setView] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [sortValue, setSortValue] = useState("date:desc");
  const [dateRange, setDateRange] = useState("all");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [finance, setFinance] = useState(null);
  const [summaryOrdersData, setSummaryOrdersData] = useState({
    pendingCod: 0,
    pendingPrepaid: 0,
    totalOrders: 0,
    lllWarehouse: 0,
    outForDelivery: 0,
    totalCod: 0,
    totalServiceCharges: 0,
    netAmount: 0,
  });
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("COD"); // 'COD' or 'DP' (Delivery Paid/Prepaid)
  const [timeFilter, setTimeFilter] = useState("today"); // 'today', '7days', '15days', '30days'
  const [form, setForm] = useState({
    consigneeName: "",
    consigneePhone: "",
    consigneeAddress: "",
    destinationCity: "Lahore",
    serviceType: "SAME_DAY",
    codAmount: "",
    productDescription: "",
    pieces: "1",
    fragile: false,
    weightKg: "",
    remarks: "",
  });

  const { user } = useAuth();
  // Always derive token from auth or storage to avoid stale null
  const token = user?.token || getToken();
  const navigate = useNavigate();
  const [searchId, setSearchId] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState([]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      console.log(
        "DEBUG fetchOrders response status:",
        res.status,
        "ok:",
        res.ok,
      );
      if (res.ok) {
        const data = await res.json();
        console.log("DEBUG fetchOrders data count:", data.length);
        setOrders(data);
        setFiltered(data);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        if (timeFilter === "7days") {
          startDate.setDate(startDate.getDate() - 6);
        } else if (timeFilter === "15days") {
          startDate.setDate(startDate.getDate() - 14);
        } else if (timeFilter === "30days") {
          startDate.setDate(startDate.getDate() - 29);
        }

        const filteredOrders = data.filter((o) => {
          const orderDate = new Date(o.createdAt);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() >= startDate.getTime();
        });

        const pendingCod = filteredOrders
          .filter(
            (o) =>
              o.paymentType === "COD" &&
              !["DELIVERED", "RETURNED", "FAILED"].includes(o.status),
          )
          .reduce((sum, o) => sum + Number(o.codAmount || 0), 0);

        const pendingPrepaid = filteredOrders
          .filter(
            (o) =>
              o.paymentType !== "COD" &&
              !["DELIVERED", "RETURNED", "FAILED"].includes(o.status),
          )
          .reduce((sum, o) => sum + Number(o.codAmount || 0), 0); // Assuming DP orders might still have a codAmount of 0

        const totalCod = filteredOrders.reduce(
          (sum, o) => sum + Number(o.codAmount || 0),
          0,
        );
        const totalServiceCharges = filteredOrders.reduce(
          (sum, o) => sum + Number(o.serviceCharges || 0),
          0,
        );
        const netAmount = totalCod - totalServiceCharges;

        setSummaryOrdersData({
          pendingCod,
          pendingPrepaid,
          totalOrders: filteredOrders.length,
          // LLL Warehouse should only reflect parcels that have actually reached LLL warehouse
          lllWarehouse: filteredOrders.filter(
            (o) => o.status === "AT_LLL_WAREHOUSE",
          ).length,
          outForDelivery: filteredOrders.filter(
            (o) => o.status === "OUT_FOR_DELIVERY",
          ).length,
          totalCod,
          totalServiceCharges,
          netAmount,
        });
      } else if (res.status === 401) {
        const msg = "Session expired. Please login again.";
        console.log("DEBUG fetchOrders 401:", msg);
        setError(msg);
      } else {
        const msg = "Failed to load orders";
        console.log("DEBUG fetchOrders error:", msg);
        setError(msg);
      }
    } catch (e) {
      console.error("DEBUG fetchOrders exception:", e.message);
      setError("Error: " + e.message);
    }
  };
  const handleTimeFilterChange = (filter) => {
    setTimeFilter(filter);
  };

  const fetchFinance = async () => {
    try {
      const res = await fetch("/api/finance/summary/shipper/me", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      console.log(
        "DEBUG fetchFinance response status:",
        res.status,
        "ok:",
        res.ok,
      );
      const data = await res.json();
      console.log("DEBUG fetchFinance response data:", data);
      if (res.ok) {
        setFinance(data);
      } else {
        const msg = data?.message || "Failed to load finance data";
        console.log("DEBUG fetchFinance error message:", msg);
        setError(msg);
      }
    } catch (e) {
      console.error("DEBUG fetchFinance exception:", e.message);
      setError("Error loading finance data: " + e.message);
    }
  };

  const lookup = async (e) => {
    e && e.preventDefault();
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
        navigate(`/shipper/order/${data[0]._id}`);
      }
    } catch {}
  };

  useEffect(() => {
    fetchOrders();
    fetchFinance();
  }, [token, timeFilter]);
  useEffect(() => {
    if (location.pathname.includes("/shipper/create")) {
      setView("list");
    } else if (location.pathname.includes("/shipper/orders")) {
      setView("orders");
    } else {
      setView("dashboard");
    }
  }, [location.pathname]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      orders.filter(
        (o) =>
          o.bookingId?.toLowerCase().includes(q) ||
          o.consigneeName?.toLowerCase().includes(q) ||
          o.destinationCity?.toLowerCase().includes(q),
      ),
    );
  }, [search, orders]);

  const dateRangeFiltered = React.useMemo(() => {
    if (dateRange === "all") return filtered;

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

    return filtered.filter((o) => {
      const d = new Date(o?.createdAt);
      if (Number.isNaN(d.getTime())) return false;
      return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
    });
  }, [filtered, dateRange]);

  const statusFiltered = React.useMemo(() => {
    if (statusFilter === "ALL") return dateRangeFiltered;

    return dateRangeFiltered.filter((o) => {
      if (statusFilter === "DELIVERED") return o.status === "DELIVERED";
      if (statusFilter === "RETURNED") return o.status === "RETURNED";
      if (statusFilter === "OUT_FOR_DELIVERY")
        return o.status === "OUT_FOR_DELIVERY";
      if (statusFilter === "PENDING") {
        return ![
          "DELIVERED",
          "RETURNED",
          "FAILED",
          "OUT_FOR_DELIVERY",
        ].includes(o.status);
      }
      return true;
    });
  }, [dateRangeFiltered, statusFilter]);

  const sortedOrders = React.useMemo(() => {
    const parseDateValue = (value) => {
      if (!value) return NaN;
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) return d.getTime();
      if (typeof value === 'string') {
        const s = value.trim();
        if (s.includes('/')) {
          const parts = s.split('/');
          if (parts.length === 3) {
            const [a, b, c] = parts;
            if (String(a).length === 2) {
              const dd = Number(a);
              const mm = Number(b);
              const yyyy = Number(c);
              const dt = new Date(yyyy, mm - 1, dd);
              return dt.getTime();
            }
          }
        }
        if (s.includes('-')) {
          const parts = s.split('-');
          if (parts.length === 3 && String(parts[0]).length === 2) {
            const [dd, mm, yyyy] = parts;
            const dt = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
            return dt.getTime();
          }
        }
      }
      return NaN;
    };

    const getCodValue = (o) => Number(o?.codAmount || 0);
    const getChargesValue = (o) => Number(o?.serviceCharges || 0);

    const [field, order] = String(sortValue || "date:desc").split(":");
    const dir = order === 'asc' ? 1 : -1;

    const indexed = statusFiltered.map((o, idx) => ({ o, idx }));
    indexed.sort((a, b) => {
      let av;
      let bv;

      if (field === 'date') {
        av = parseDateValue(a.o?.createdAt);
        bv = parseDateValue(b.o?.createdAt);
      } else if (field === 'cod') {
        av = getCodValue(a.o);
        bv = getCodValue(b.o);
      } else if (field === 'charges') {
        av = getChargesValue(a.o);
        bv = getChargesValue(b.o);
      } else if (field === 'status') {
        av = String(a.o?.status || '').toLowerCase();
        bv = String(b.o?.status || '').toLowerCase();
      }

      if (av === bv) return a.idx - b.idx;

      if (typeof av === 'string' || typeof bv === 'string') {
        return String(av).localeCompare(String(bv)) * dir;
      }

      if (Number.isNaN(av) && Number.isNaN(bv)) return a.idx - b.idx;
      if (Number.isNaN(av)) return 1;
      if (Number.isNaN(bv)) return -1;
      return (av - bv) * dir;
    });

    return indexed.map((x) => x.o);
  }, [statusFiltered, sortValue]);

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

  const toggleSelected = (id, checked) => {
    setSelected((prev) => {
      if (!checked) return prev.filter((x) => x !== id);
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  };

  const printSelected = async () => {
    if (selected.length === 0) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/orders/labels/print", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ orderIds: selected }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          alert("Session expired. Please login again.");
          return;
        }
        const t = await res.text();
        alert(t || "Failed to generate labels");
        return;
      }
      const html = await res.text();
      const w = window.open("", "_blank");
      if (!w) {
        alert("Popup blocked. Please allow popups to print labels.");
        return;
      }
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => {
        try {
          w.print();
        } catch {}
      }, 200);
    } catch (e) {
      alert(e.message || "Error generating labels");
    }
  };

  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;
  const codPending = orders
    .filter((o) => !["DELIVERED", "RETURNED", "FAILED"].includes(o.status))
    .reduce((sum, o) => sum + Number(o.codAmount || 0), 0);
  const returnedCount = orders.filter((o) => o.status === "RETURNED").length;

  const statusLabel = (s) =>
    ({
      CREATED: "Pending",
      ASSIGNED: "In LLL Warehouse",
      OUT_FOR_DELIVERY: "Out for delivery",
      RETURNED: "Returned",
      DELIVERED: "Delivered",
      FAILED: "Failed",
    })[s] || s;

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

  const bookOrderNow = async (orderId) => {
    try {
      setError("");
      const res = await fetch(`/api/orders/${orderId}/book`, {
        method: "PATCH",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated?.message || "Booking failed");
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
      setFiltered((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
    } catch (e) {
      setError(e.message || "Failed to book order");
    }
  };

  const mobileStats = React.useMemo(() => {
    // Calculate stats based on Time Filter (Same as Grid)
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (timeFilter === "7days") startDate.setDate(startDate.getDate() - 6);
    else if (timeFilter === "15days")
      startDate.setDate(startDate.getDate() - 14);
    else if (timeFilter === "30days")
      startDate.setDate(startDate.getDate() - 29);
    // if 'today', startDate is already today.

    const filtered = orders.filter((o) => {
      const d = new Date(o.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime() >= startDate.getTime();
    });

    // Header Stats (Derived from the Filtered list, so it updates with pills)
    const headerTotalOrders = filtered.length;

    // Pending: Not delivered/returned/failed
    const headerPendingOrders = filtered.filter(
      (o) => !["DELIVERED", "RETURNED", "FAILED"].includes(o.status),
    ).length;

    // Pending Amount: Based on paymentTypeFilter AND Time Filter
    const headerPendingAmount = filtered
      .filter((o) => !["DELIVERED", "RETURNED", "FAILED"].includes(o.status))
      .reduce((sum, o) => {
        const isCod = o.paymentType === "COD";
        if (paymentTypeFilter === "COD" && isCod)
          return sum + (o.codAmount || 0);
        if (paymentTypeFilter === "DP" && !isCod)
          return sum + (o.codAmount || 0);
        return sum;
      }, 0);

    const stats = {
      total: filtered.length,
      unbooked: filtered.filter((o) => o.bookingState !== "BOOKED").length,
      booked: filtered.filter((o) => o.bookingState === "BOOKED").length,
      // In Warehouse should align with LLL Warehouse logic: only AT_LLL_WAREHOUSE
      warehouse: filtered.filter((o) => o.status === "AT_LLL_WAREHOUSE").length,
      ofd: filtered.filter((o) => o.status === "OUT_FOR_DELIVERY").length,
      delivered: filtered.filter((o) => o.status === "DELIVERED").length,
      attempted: filtered.filter((o) =>
        [
          "FAILED",
          "FIRST_ATTEMPT",
          "SECOND_ATTEMPT",
          "THIRD_ATTEMPT",
        ].includes(o.status),
      ).length,
      returned: filtered.filter((o) => o.status === "RETURNED").length,
    };

    return {
      header: {
        total: headerTotalOrders,
        pending: headerPendingOrders,
        amount: headerPendingAmount,
      },
      grid: stats,
    };
  }, [orders, timeFilter, paymentTypeFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    // Validate weight
    if (!form.weightKg || form.weightKg <= 0) {
      setError("Weight must be greater than 0");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        consigneeName: form.consigneeName,
        consigneePhone: form.consigneePhone,
        consigneeAddress: form.consigneeAddress,
        destinationCity: form.destinationCity,
        serviceType: form.serviceType,
        codAmount:
          form.paymentType === "ADVANCE" ? 0 : Number(form.codAmount || 0),
        paymentType: form.paymentType,
        productDescription: form.productDescription,
        pieces: Number(form.pieces),
        fragile: !!form.fragile,
        weightKg: Number(form.weightKg),
        remarks: form.remarks,
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Failed" }));
        throw new Error(data.message || "Order creation failed");
      }
      await fetchOrders();
      setView("list");
      setForm({
        consigneeName: "",
        consigneePhone: "",
        consigneeAddress: "",
        destinationCity: "Lahore",
        serviceType: "SAME_DAY",
        codAmount: "",
        paymentType: "COD",
        productDescription: "",
        pieces: "1",
        fragile: false,
        weightKg: "",
        remarks: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const isDashboard = view === "dashboard";

  return (
    <div className="space-y-8">
      {/* Mobile Dashboard Layout */}
      {isDashboard && (
        <div className="block sm:hidden space-y-4">
          <div className="bg-[#0B6D45] p-6 rounded-b-3xl text-white shadow-lg -mx-4 -mt-4 mb-4">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold">
                  {timeFilter === "7days"
                    ? "7 Days Orders"
                    : timeFilter === "15days"
                      ? "15 Days Orders"
                      : timeFilter === "30days"
                        ? "30 Days Orders"
                        : "Today's Orders"}
                </h2>
                <div className="flex items-center gap-2 mt-1 opacity-80">
                  <span className="text-2xl font-bold">
                    {mobileStats.header.total}
                  </span>
                  <RefreshCcw
                    className="w-4 h-4 cursor-pointer"
                    onClick={fetchOrders}
                  />
                </div>
              </div>
              <div className="bg-[#085233] rounded-lg p-1 flex text-xs font-semibold">
                <button
                  onClick={() => setPaymentTypeFilter("COD")}
                  className={`px-3 py-1 rounded-md transition-all ${paymentTypeFilter === "COD" ? "bg-white text-[#0B6D45] shadow-sm" : "text-green-100"}`}
                >
                  COD
                </button>
              </div>
            </div>

            <div className="mb-2">
              <p className="text-green-100 text-sm">
                PKR <AlertCircle className="inline w-3 h-3 ml-1" />
              </p>
              <div className="flex justify-between items-end mt-1">
                <div>
                  <span className="text-3xl font-bold">
                    {mobileStats.header.amount.toLocaleString()}
                  </span>
                  <p className="text-xs text-green-100 mt-1">Pending Amount</p>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-bold">
                    {mobileStats.header.pending}
                  </span>
                  <p className="text-xs text-green-100 mt-1">Pending Orders</p>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-bold">
                    {mobileStats.header.total}
                  </span>
                  <p className="text-xs text-green-100 mt-1">Total Orders</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-2 mb-4 px-2 overflow-x-auto">
            <button
              onClick={() => handleTimeFilterChange("7days")}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${timeFilter === "7days" ? "bg-black text-white" : "bg-white text-gray-500 border border-gray-200"}`}
            >
              7 DAYS
            </button>
            <button
              onClick={() => handleTimeFilterChange("15days")}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${timeFilter === "15days" ? "bg-black text-white" : "bg-white text-gray-500 border border-gray-200"}`}
            >
              15 DAYS
            </button>
            <button
              onClick={() => handleTimeFilterChange("30days")}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${timeFilter === "30days" ? "bg-black text-white" : "bg-white text-gray-500 border border-gray-200"}`}
            >
              30 DAYS
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 px-1">
            <MobileStatCard
              icon={ClipboardList}
              title="Total Orders"
              count={mobileStats.grid.total}
              colorClass="text-gray-600"
            />
            <MobileStatCard
              icon={Package}
              title="Unbooked"
              count={mobileStats.grid.unbooked}
              colorClass="text-amber-600"
            />
            <MobileStatCard
              icon={ArrowDownToLine}
              title="Booked"
              count={mobileStats.grid.booked}
              colorClass="text-green-600"
            />
            <MobileStatCard
              icon={Building2}
              title="In Warehouse"
              count={mobileStats.grid.warehouse}
              colorClass="text-blue-600"
            />
            <MobileStatCard
              icon={Bike}
              title="Out for Delivery"
              count={mobileStats.grid.ofd}
              colorClass="text-cyan-600"
            />
            <MobileStatCard
              icon={CheckCircle}
              title="Delivered"
              count={mobileStats.grid.delivered}
              colorClass="text-green-700"
            />
            <MobileStatCard
              icon={AlertCircle}
              title="Attempted"
              count={mobileStats.grid.attempted}
              colorClass="text-red-500"
            />
            <MobileStatCard
              icon={Home}
              title="Returned"
              count={mobileStats.grid.returned}
              colorClass="text-orange-600"
            />
          </div>
        </div>
      )}

      <div
        className={`${isDashboard ? "hidden sm:block" : ""} bg-white p-6 rounded-xl border border-gray-100 shadow-sm`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-bold text-secondary">
              Shipper Dashboard
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {view === "dashboard" && (
              <Button
                onClick={async () => {
                  try {
                    const res = await fetch(
                      "/api/notifications/pickup-request",
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: token ? `Bearer ${token}` : "",
                        },
                        body: JSON.stringify({
                          shipperId: user?.id || localStorage.getItem("userId"),
                          message: "Pickup required",
                        }),
                      },
                    );
                    if (res.ok) {
                      alert("Pickup request sent successfully!");
                    } else {
                      const data = await res.json();
                      alert(data.message || "Failed to send pickup request");
                    }
                  } catch (e) {
                    alert("Error sending pickup request: " + e.message);
                  }
                }}
                variant="outline"
              >
                Send Pickup Request
              </Button>
            )}
            {view === "list" && (
              <Button onClick={() => setView("create")}>
                <Plus className="w-4 h-4" /> New Order
              </Button>
            )}
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-2">
          Create and track shipments.
        </p>
      </div>

      {view === "dashboard" && (
        <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-secondary">Quick Actions</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setView("create")}>
              <Plus className="w-4 h-4" /> Create New Order
            </Button>
            <Button variant="outline" onClick={() => setView("orders")}>
              <Package className="w-4 h-4" /> View All Orders
            </Button>
          </div>
        </div>
      )}

      {view === "dashboard" && (
        <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-secondary">
                {timeFilter === "7days"
                  ? "Last 7 Days Orders"
                  : timeFilter === "15days"
                    ? "Last 15 Days Orders"
                    : timeFilter === "30days"
                      ? "Last 30 Days Orders"
                      : "Today's Orders"}
              </h3>
              <button
                onClick={fetchOrders}
                className="text-gray-400 hover:text-primary"
              >
                <RefreshCcw className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => handleTimeFilterChange("today")}
                className={`px-3 py-1.5 text-xs rounded-full ${timeFilter === "today" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}
              >
                Today
              </button>
              <button
                onClick={() => handleTimeFilterChange("7days")}
                className={`px-3 py-1.5 text-xs rounded-full ${timeFilter === "7days" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}
              >
                7 Days
              </button>
              <button
                onClick={() => handleTimeFilterChange("15days")}
                className={`px-3 py-1.5 text-xs rounded-full ${timeFilter === "15days" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}
              >
                15 Days
              </button>
              <button
                onClick={() => handleTimeFilterChange("30days")}
                className={`px-3 py-1.5 text-xs rounded-full ${timeFilter === "30days" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}
              >
                30 Days
              </button>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setPaymentTypeFilter("COD")}
                  className={`px-3 py-1.5 text-xs rounded-full ${paymentTypeFilter === "COD" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}
                >
                  COD
                </button>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Pending Amount</p>
                <p className="text-lg font-bold text-secondary">
                  PKR{" "}
                  {paymentTypeFilter === "COD"
                    ? summaryOrdersData.pendingCod.toLocaleString()
                    : summaryOrdersData.pendingPrepaid.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-500">Total Orders Today</p>
              <p className="text-lg font-bold text-secondary">
                {summaryOrdersData.totalOrders}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <StatusCard
              icon={Truck}
              title="Total Orders"
              count={summaryOrdersData.totalOrders}
            />
            <StatusCard
              icon={Package}
              title="LLL Warehouse"
              count={summaryOrdersData.lllWarehouse}
            />
            <StatusCard
              icon={Truck}
              title="Out for Delivery"
              count={summaryOrdersData.outForDelivery}
            />
            <StatusCard
              icon={DollarSign}
              title="Pending COD"
              count={`PKR ${summaryOrdersData.pendingCod.toLocaleString()}`}
            />
            <StatusCard
              icon={Clock}
              title="Pending Prepaid"
              count={`PKR ${summaryOrdersData.pendingPrepaid.toLocaleString()}`}
            />
          </div>
        </div>
      )}

      {view === "dashboard" && (
        <div className="hidden sm:block grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusCard
            icon={Package}
            title="Total Bookings"
            count={orders.length}
          />
          <StatusCard icon={Truck} title="Delivered" count={deliveredCount} />
          <StatusCard
            icon={DollarSign}
            title="COD Pending"
            count={`PKR ${codPending.toLocaleString()}`}
          />
          <StatusCard
            icon={RefreshCcw}
            title="Returned"
            count={returnedCount}
          />
          <StatusCard
            icon={DollarSign}
            title="Total COD"
            count={`PKR ${summaryOrdersData.totalCod.toLocaleString()}`}
          />
          <StatusCard
            icon={DollarSign}
            title="Service Charges"
            count={`PKR ${summaryOrdersData.totalServiceCharges.toLocaleString()}`}
          />
          <StatusCard
            icon={DollarSign}
            title="Net Amount"
            count={`PKR ${summaryOrdersData.netAmount.toLocaleString()}`}
          />
        </div>
      )}

      {view === "create" ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm max-w-2xl">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Consignee Name"
                value={form.consigneeName}
                onChange={(e) =>
                  setForm({ ...form, consigneeName: e.target.value })
                }
                required
              />
              <Input
                label="Consignee Phone"
                value={form.consigneePhone}
                onChange={(e) =>
                  setForm({ ...form, consigneePhone: e.target.value })
                }
                required
              />
              <Input
                label="City"
                value={form.destinationCity}
                onChange={(e) =>
                  setForm({ ...form, destinationCity: e.target.value })
                }
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Service Type
                </label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:border-primary focus:ring-primary/20 focus:outline-none"
                  value={form.serviceType}
                  onChange={(e) =>
                    setForm({ ...form, serviceType: e.target.value })
                  }
                >
                  <option value="SAME_DAY">SAME_DAY</option>
                  <option value="OVERNIGHT">OVERNIGHT</option>
                  <option value="ECONOMY">ECONOMY</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Address"
                  value={form.consigneeAddress}
                  onChange={(e) =>
                    setForm({ ...form, consigneeAddress: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Payment Type
                </label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900"
                  value={form.paymentType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      paymentType: e.target.value,
                      codAmount:
                        e.target.value === "ADVANCE" ? "" : form.codAmount,
                    })
                  }
                >
                  <option value="COD">COD</option>
                  <option value="ADVANCE">ADVANCE</option>
                </select>
              </div>
              <Input
                label="COD Amount (PKR)"
                type="number"
                value={form.codAmount}
                onChange={(e) =>
                  setForm({ ...form, codAmount: e.target.value })
                }
                disabled={form.paymentType === "ADVANCE"}
              />
              <Input
                label="Weight (kg)"
                type="number"
                step="0.1"
                min="0.1"
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                required
                placeholder="Enter weight in kg (e.g. 0.5, 1.2, 2.5)"
              />
              <div className="md:col-span-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>
                      Service charges will be calculated automatically
                    </strong>{" "}
                    based on the weight you enter and your shipper's configured
                    weight brackets.
                  </p>
                </div>
              </div>
              <Input
                label="Pieces"
                type="number"
                value={form.pieces}
                onChange={(e) => setForm({ ...form, pieces: e.target.value })}
              />
              <div className="md:col-span-2">
                <Input
                  label="Product Description"
                  value={form.productDescription}
                  onChange={(e) =>
                    setForm({ ...form, productDescription: e.target.value })
                  }
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.fragile}
                  onChange={(e) =>
                    setForm({ ...form, fragile: e.target.checked })
                  }
                />
                <span className="text-sm">Fragile</span>
              </label>
              <Input
                label="Remarks"
                value={form.remarks}
                onChange={(e) =>
                  setForm({ ...form, remarks: e.target.value })
                }
              />
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (location.pathname.includes("/shipper/create")) {
                      setView("list");
                    } else {
                      setView("dashboard");
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Creating..." : "Create Shipment"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      ) : view === "orders" ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-secondary">My Orders</h3>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type="text"
                  placeholder="Search orders..."
                  className="pl-3 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg w-full sm:w-auto"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-3 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-white w-full sm:w-auto"
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
                  className="pl-3 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-white w-full sm:w-auto"
                  aria-label="Filter by Date Range"
                >
                  <option value="all">All Orders</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                <button
                  onClick={fetchOrders}
                  className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600"
                >
                  Refresh
                </button>
                {!selecting ? (
                  <button
                    onClick={() => {
                      setSelecting(true);
                      setSelected([]);
                    }}
                    className="px-3 py-1.5 text-xs bg-primary hover:bg-primary-hover text-white rounded border border-primary"
                  >
                    Print Labels
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={printSelected}
                      className="px-3 py-1.5 text-xs bg-primary hover:bg-primary-hover text-white rounded border border-primary"
                    >
                      Print Selected ({selected.length}/{filtered.length})
                    </button>
                    <button
                      onClick={() => {
                        setSelecting(false);
                        setSelected([]);
                      }}
                      className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="p-6">
            {sortedOrders.length === 0 ? (
              <p className="text-sm text-gray-500">No orders yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2 px-3">Select</th>
                      <th className="py-2 px-3">Order ID</th>
                      <th className="py-2 px-3">Source</th>
                      <th className="py-2 px-3">Booking</th>
                      <th className="py-2 px-3">Consignee</th>
                      <th className="py-2 px-3">COD</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Payment</th>
                      <th className="py-2 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOrders.map((o) => (
                      <tr
                        key={o._id}
                        className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() =>
                          !selecting && navigate(`/shipper/order/${o._id}`)
                        }
                      >
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            onClick={(e) => e.stopPropagation()}
                            checked={selected.includes(o._id)}
                            onChange={(e) =>
                              toggleSelected(o._id, e.target.checked)
                            }
                            disabled={!selecting}
                          />
                        </td>
                        <td className="py-2 px-3 font-mono text-xs">
                          {o.bookingId}
                        </td>
                        <td className="py-2 px-3">{sourceBadge(o)}</td>
                        <td className="py-2 px-3">{bookingBadge(o)}</td>
                        <td className="py-2 px-3 text-secondary">
                          {o.consigneeName}
                        </td>
                        <td className="py-2 px-3">
                          PKR{" "}
                          {Number(o.codAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-2 px-3">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3 text-xs">
                          {statusLabel(o.status)}
                        </td>
                        <td className="py-2 px-3 text-xs">{o.paymentType}</td>
                        <td className="py-2 px-3">
                          {o.isIntegrated && o.bookingState === "UNBOOKED" && (
                            <button
                              className="px-3 py-1 text-xs rounded border border-primary text-primary hover:bg-primary hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                bookOrderNow(o._id);
                              }}
                            >
                              Book Now
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
      ) : null}
    </div>
  );
};

export default ShipperDashboard;
