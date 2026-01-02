import React, { useState, useEffect } from "react";
import {
  Filter,
  Printer,
  Save,
  Download,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  Globe,
} from "lucide-react";
import { useToast } from "../src/contexts/ToastContext";

// Reusable UI Components
const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}
  >
    {children}
  </div>
);

const SectionTitle = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
);

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-center space-x-3 text-sm">
    {Icon && <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />}
    <div>
      <span className="text-gray-600">{label}:</span>
      <span className="text-gray-900 font-medium ml-2">{value}</span>
    </div>
  </div>
);

const StatRow = ({ label, value, type = "default", children }) => (
  <div
    className={`flex justify-between items-center py-3 px-0 ${
      type === "total"
        ? "border-t-2 border-gray-300 pt-4 mt-2"
        : "border-b border-gray-100"
    }`}
  >
    <span
      className={`text-sm ${
        type === "total" ? "font-bold text-gray-900" : "text-gray-700"
      }`}
    >
      {label}:
    </span>
    {children || (
      <span
        className={`text-sm ${
          type === "total"
            ? "text-lg font-bold text-green-600"
            : "font-semibold text-gray-900"
        }`}
      >
        {value}
      </span>
    )}
  </div>
);

const StatusBadge = ({ status, invoiced }) => {
  if (invoiced) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Paid
      </span>
    );
  }

  const statusConfig = {
    CREATED: { bg: "bg-blue-100", text: "text-blue-800", icon: Clock },
    DELIVERED: {
      bg: "bg-green-100",
      text: "text-green-800",
      icon: CheckCircle,
    },
    IN_TRANSIT: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
    FAILED: { bg: "bg-red-100", text: "text-red-800", icon: AlertCircle },
  };

  const config = statusConfig[status] || statusConfig.CREATED;
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.text}`}
    >
      <IconComponent className="w-3 h-3 mr-1" />
      {status || "Unpaid"}
    </span>
  );
};

const ManagerInvoice = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savedInvoiceId, setSavedInvoiceId] = useState(null);

  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Filter state
  const [parcelFrom, setParcelFrom] = useState("");
  const [parcelTo, setParcelTo] = useState("");
  const [parcelList, setParcelList] = useState("uninvoiced");
  const [parcelLimit, setParcelLimit] = useState("100");

  // Calculation state
  const [whtIt, setWhtIt] = useState(0); // WHT IT u/s 6A of ITO, 2001 (2.0%)
  const [whtSt, setWhtSt] = useState(0); // WHT ST u/s 3 of STA, 1990 (2.0%)

  // Legacy extra charge fields kept to avoid runtime errors in existing flows
  const [flyerCharges, setFlyerCharges] = useState(0);
  const [fuelCharges, setFuelCharges] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [discount, setDiscount] = useState(0);

  // Data state
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedParcelIds, setSelectedParcelIds] = useState(new Set());
  const [companyProfile, setCompanyProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Debug log state changes
  console.log(
    "📊 Current selectedParcelIds state:",
    Array.from(selectedParcelIds),
  );

  const token = localStorage.getItem("token");
  const { showToast } = useToast();

  // Load initial data
  useEffect(() => {
    loadCustomers();
    getNextInvoiceNumber();
    loadCompanyProfile();
  }, []);

  // Load orders when filters change
  useEffect(() => {
    if (selectedCustomer && parcelFrom && parcelTo) {
      loadOrders();
    }
  }, [selectedCustomer, parcelFrom, parcelTo, parcelList]);

  // Update customer data when selection changes
  const customer = customers.find((c) => c._id === selectedCustomer);

  const loadCustomers = async () => {
    try {
      const res = await fetch("/api/invoice/shippers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (e) {
      setError("Failed to load customers");
    }
  };

  const loadCompanyProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await fetch("/api/company-profile/public");
      const data = await res.json();

      if (res.ok && data.success) {
        setCompanyProfile(data.data);
      } else {
        console.warn("Failed to load company profile, using defaults");
        // Set default fallback data
        setCompanyProfile({
          companyName: "LahoreLink Courier Services",
          logoUrl: "",
          address: {
            line1: "Office # 123, Main Boulevard, Gulberg III",
            city: "Lahore",
            country: "Pakistan",
          },
          phone: "+92-42-111-LINK (5465)",
          email: "finance@lahorelink.com",
          website: "www.lahorelink.com",
          footerNote:
            "For support contact: +92-42-111-LINK (5465) | Email: support@lahorelink.com",
        });
      }
    } catch (error) {
      console.error("Error loading company profile:", error);
      // Set default fallback data on error
      setCompanyProfile({
        companyName: "LahoreLink Courier Services",
        logoUrl: "",
        address: {
          line1: "Office # 123, Main Boulevard, Gulberg III",
          city: "Lahore",
          country: "Pakistan",
        },
        phone: "+92-42-111-LINK (5465)",
        email: "finance@lahorelink.com",
        website: "www.lahorelink.com",
        footerNote:
          "For support contact: +92-42-111-LINK (5465) | Email: support@lahorelink.com",
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const getNextInvoiceNumber = async () => {
    try {
      const res = await fetch("/api/invoice/next-number", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setInvoiceNumber(data.invoiceNumber);
      }
    } catch (e) {
      console.error("Failed to get next invoice number");
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        shipperId: selectedCustomer,
        from: parcelFrom,
        to: parcelTo,
        list: parcelList,
      });

      const res = await fetch(`/api/invoice/orders?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (res.ok && Array.isArray(data)) {
        console.log("Orders loaded from API:", data);

        // Validate order structure
        const validatedOrders = data.map((order) => ({
          ...order,
          _id: order._id || order.id,
          invoice: order.invoice || null,
          bookingId: order.bookingId || order.trackingId || "N/A",
          serviceCharges: Number(order.serviceCharges || 0),
          codAmount: Number(order.codAmount || 0),
          weightKg: Number(order.weightKg || 0),
        }));

        console.log("Validated orders:", validatedOrders);

        // Debug order invoice status
        validatedOrders.forEach((order) => {
          console.log(
            `📋 Order ${order.bookingId || order._id}: invoice=${order.invoice}, isInvoiced=${order.invoice !== null && order.invoice !== undefined}`,
          );
        });

        const uninvoiced = validatedOrders.filter(
          (o) => o.invoice === null || o.invoice === undefined,
        );
        console.log(
          `📊 Total orders: ${validatedOrders.length}, Uninvoiced: ${uninvoiced.length}`,
        );

        setOrders(validatedOrders);
        setSelectedParcelIds(new Set());
      } else {
        console.error("Failed to load orders:", data);
        setOrders([]);
        setError(data.message || "Failed to load orders");
      }
    } catch (e) {
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = (orderId) => {
    console.log("🔥 CHECKBOX CLICKED - Order ID:", orderId);
    console.log("🔥 Current selectedParcelIds:", Array.from(selectedParcelIds));

    const order = orders.find((o) => o._id === orderId);
    if (!order) {
      console.error("❌ Order not found:", orderId);
      return;
    }

    console.log("📋 Order details:", {
      id: order._id,
      bookingId: order.bookingId,
      invoice: order.invoice,
      isInvoiced: order.invoice !== null && order.invoice !== undefined,
    });

    // Check if order is already invoiced
    if (order.invoice !== null && order.invoice !== undefined) {
      console.log("⚠️ Order already invoiced, cannot select:", orderId);
      return;
    }

    console.log("✅ Proceeding with selection toggle");

    setSelectedParcelIds((prev) => {
      console.log("🔄 State update - Previous selection:", Array.from(prev));
      const newSelection = new Set(prev);
      const wasSelected = newSelection.has(orderId);

      if (wasSelected) {
        newSelection.delete(orderId);
        console.log("➖ Deselected order:", orderId);
      } else {
        newSelection.add(orderId);
        console.log("➕ Selected order:", orderId);
      }

      console.log("🆕 New selection:", Array.from(newSelection));
      console.log("📊 New selection size:", newSelection.size);
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    console.log("🔥 SELECT ALL BUTTON CLICKED");
    const uninvoicedOrders = orders.filter(
      (order) => order.invoice === null || order.invoice === undefined,
    );

    console.log("📊 Select all analysis:");
    console.log("  - Total orders:", orders.length);
    console.log("  - Uninvoiced orders:", uninvoicedOrders.length);
    console.log("  - Current selection size:", selectedParcelIds.size);

    if (uninvoicedOrders.length === 0) {
      console.log("❌ No uninvoiced orders to select");
      return;
    }

    const uninvoicedIds = uninvoicedOrders.map((order) => order._id);
    const currentlySelectedUninvoiced = uninvoicedIds.filter((id) =>
      selectedParcelIds.has(id),
    );
    const allCurrentlySelected =
      currentlySelectedUninvoiced.length === uninvoicedIds.length;

    console.log("📊 Selection details:");
    console.log("  - Uninvoiced IDs:", uninvoicedIds);
    console.log(
      "  - Currently selected uninvoiced:",
      currentlySelectedUninvoiced,
    );
    console.log("  - All currently selected:", allCurrentlySelected);

    setSelectedParcelIds((prev) => {
      console.log("🔄 SELECT ALL - Previous state:", Array.from(prev));
      const newSelection = new Set(prev);

      if (allCurrentlySelected) {
        // Deselect all currently visible uninvoiced orders
        console.log("➖ Deselecting all visible orders");
        uninvoicedIds.forEach((id) => newSelection.delete(id));
      } else {
        // Select all currently visible uninvoiced orders
        console.log("➕ Selecting all visible orders");
        uninvoicedIds.forEach((id) => newSelection.add(id));
      }

      console.log("🆕 SELECT ALL - New state:", Array.from(newSelection));
      console.log("📊 SELECT ALL - New selection size:", newSelection.size);
      return newSelection;
    });
  };

  // Calculations
  // Filter to only include currently visible selected orders (exclude test IDs)
  const selectedOrdersData = orders.filter(
    (o) => selectedParcelIds.has(o._id) && !o._id.startsWith("TEST-"),
  );
  const codTotal = selectedOrdersData.reduce(
    (sum, order) => sum + (order.codAmount || 0),
    0,
  );
  const serviceChargesTotal = selectedOrdersData.reduce(
    (sum, order) => sum + (order.serviceCharges || 0),
    0,
  );

  const grossTotal = codTotal + serviceChargesTotal;
  const netPayable =
    grossTotal - Number(whtIt || 0) - Number(whtSt || 0);

  const formatCurrency = (amount) => {
    return `PKR ${Number(amount || 0).toLocaleString()}`;
  };

  const handleSaveInvoice = async () => {
    // Filter out test IDs
    const realSelectedIds = Array.from(selectedParcelIds).filter(
      (id) => !id.startsWith("TEST-"),
    );

    if (!selectedCustomer || !accountName || realSelectedIds.length === 0) {
      setError("Please fill all required fields and select at least one order");
      return;
    }

    console.log("💾 Saving invoice with IDs:", realSelectedIds);

    try {
      setLoading(true);
      setError("");

      const payload = {
        shipperId: selectedCustomer,
        accountName,
        accountNumber,
        invoiceDate,
        parcelFrom,
        parcelTo,
        selectedOrderIds: realSelectedIds,
        whtIt: Number(whtIt || 0),
        whtSt: Number(whtSt || 0),
      };

      const res = await fetch("/api/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("Invoice created successfully!");
        setSavedInvoiceId(data.invoice._id);
        setSelectedParcelIds(new Set());
        setFlyerCharges(0);
        setFuelCharges(0);
        setOtherCharges(0);
        setDiscount(0);
        getNextInvoiceNumber();
        if (selectedCustomer && parcelFrom && parcelTo) {
          loadOrders();
        }
        showToast({
          type: "success",
          title: "Invoice saved",
          description:
            data.invoice?.invoiceNumber
              ? `Invoice ${data.invoice.invoiceNumber} created successfully.`
              : "Invoice created successfully.",
        });
      } else {
        setError(data.message || "Failed to create invoice");
        showToast({
          type: "error",
          title: "Invoice error",
          description: data.message || "Failed to create invoice",
        });
      }
    } catch (e) {
      setError("Failed to create invoice");
      showToast({
        type: "error",
        title: "Invoice error",
        description: "Failed to create invoice",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (savedInvoiceId) {
      window.open(`/invoice-print/${savedInvoiceId}`, "_blank");
    } else {
      setError("Please save the invoice first before printing");
      showToast({
        type: "error",
        title: "Cannot print",
        description: "Please save the invoice first before printing.",
      });
    }
  };

  const handleExportExcel = async () => {
    if (!savedInvoiceId) {
      setError("Please save the invoice first before exporting");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/invoice/${savedInvoiceId}/export.xlsx`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to export Excel file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice_${invoiceNumber}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess("Excel file downloaded successfully!");
      showToast({
        type: "success",
        title: "Export ready",
        description: "Excel file downloaded successfully.",
      });
    } catch (error) {
      setError("Failed to export Excel file");
      console.error("Export error:", error);
      showToast({
        type: "error",
        title: "Export failed",
        description: "Failed to export Excel file.",
      });
    } finally {
      setLoading(false);
    }
  };

  const ParcelCard = ({ order }) => (
    <Card className="mb-3 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedParcelIds.has(order._id)}
              onChange={(e) => {
                console.log(
                  "📱 Mobile Checkbox onChange fired for:",
                  order._id,
                );
                console.log("📱 Event target checked:", e.target.checked);
                console.log(
                  "📱 Current state has ID:",
                  selectedParcelIds.has(order._id),
                );
                e.stopPropagation();
                handleOrderSelect(order._id);
              }}
              onClick={(e) => {
                console.log("📱 Mobile Checkbox onClick fired for:", order._id);
              }}
              disabled={order.invoice !== null && order.invoice !== undefined}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div>
              <div className="font-mono text-sm font-semibold text-gray-900">
                {order.bookingId || order.trackingId}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(order.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <StatusBadge
            status={order.status}
            invoiced={order.invoice !== null && order.invoice !== undefined}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Consignee:</span>
            <div className="font-medium text-gray-900">
              {order.consigneeName}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Destination:</span>
            <div className="font-medium text-gray-900">
              {order.destinationCity}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Weight:</span>
            <div className="font-medium text-gray-900">{order.weightKg} kg</div>
          </div>
          <div>
            <span className="text-gray-600">COD Amount:</span>
            <div className="font-medium text-gray-900">
              {formatCurrency(order.codAmount)}
            </div>
          </div>
          <div className="col-span-2">
            <span className="text-gray-600">Service Charges:</span>
            <div className="font-medium text-gray-900">
              {formatCurrency(order.serviceCharges)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Top App Header - Sticky on desktop */}
	  <header className="bg-white border-b border-gray-200 md:sticky md:top-0 md:z-50 print:relative print:border-b-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3 mb-2 sm:mb-0">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  LahoreLink Logistics
                </h1>
                <p className="text-sm text-gray-600">Payment Invoice</p>
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="text-right sm:text-left">
              <div className="text-sm font-medium text-gray-900">
                Invoice No: <span className="font-mono">{invoiceNumber}</span>
              </div>
              <div className="text-xs text-gray-600">
                Date: {new Date(invoiceDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Invoice Setup Card */}
        <Card className="mb-6 p-6">
          <SectionTitle className="mb-6">Invoice Setup</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="xl:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedCustomer(value);
                  const customer = customers.find((c) => c._id === value);

                  // Auto-fill from shipper's saved bank details
                  setAccountName(
                    customer?.accountHolderName ||
                      customer?.companyName ||
                      customer?.name ||
                      "",
                  );
                  setAccountNumber(
                    customer?.accountNumber || customer?.iban || "",
                  );
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.companyName || customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceNumber}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="md:col-span-2 xl:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Date
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </Card>

        {/* Order Status Info */}
        {orders.length > 0 && (
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              📊 Order Status Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded border">
                <div className="font-medium text-gray-900">Total Orders</div>
                <div className="text-2xl font-bold text-blue-600">
                  {orders.length}
                </div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="font-medium text-gray-900">Unpaid</div>
                <div className="text-2xl font-bold text-green-600">
                  {
                    orders.filter(
                      (o) => o.invoice === null || o.invoice === undefined,
                    ).length
                  }
                </div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="font-medium text-gray-900">
                  Already Paid
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {
                    orders.filter(
                      (o) => o.invoice !== null && o.invoice !== undefined,
                    ).length
                  }
                </div>
              </div>
            </div>
            {orders.filter((o) => o.invoice === null || o.invoice === undefined)
              .length === 0 && (
              <div className="mt-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <div className="text-orange-800">
                    <strong>No unpaid orders found.</strong> All orders in this
                    date range have already been paid. Try selecting a
                    different date range or customer to find unpaid orders.
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Company Info */}
          <Card className="p-6">
            <SectionTitle className="mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-green-600" />
              Company Information
            </SectionTitle>
            {loadingProfile ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <span className="ml-2 text-sm text-gray-600">
                  Loading company info...
                </span>
              </div>
            ) : companyProfile ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  {companyProfile.logoUrl && (
                    <img
                      src={companyProfile.logoUrl}
                      alt="Company Logo"
                      className="w-12 h-12 object-contain"
                    />
                  )}
                  <div>
                    <div className="font-semibold text-gray-900">
                      {companyProfile.companyName}
                    </div>
                    <div className="text-sm text-gray-600">
                      Professional Logistics Solutions
                    </div>
                  </div>
                </div>
                <InfoRow
                  icon={MapPin}
                  label="Address"
                  value={`${companyProfile.address.line1}, ${companyProfile.address.city}, ${companyProfile.address.country}`}
                />
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={companyProfile.email}
                />
                <InfoRow
                  icon={Phone}
                  label="Phone"
                  value={companyProfile.phone}
                />
                {companyProfile.website && (
                  <InfoRow
                    icon={Globe}
                    label="Website"
                    value={companyProfile.website}
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-2">
                  Company profile not set
                </p>
                <p className="text-xs text-gray-400">
                  Set company profile from CEO dashboard
                </p>
              </div>
            )}
          </Card>

          {/* Customer Info */}
          <Card className="p-6">
            <SectionTitle className="mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Customer Information
            </SectionTitle>
            {customer ? (
              <div className="space-y-3">
                <div>
                  <div className="font-semibold text-gray-900">
                    {customer.companyName || customer.name}
                  </div>
                </div>
                {customer.address && (
                  <InfoRow
                    icon={MapPin}
                    label="Address"
                    value={customer.address}
                  />
                )}
                <InfoRow icon={Mail} label="Email" value={customer.email} />
                {customer.phone && (
                  <InfoRow icon={Phone} label="Phone" value={customer.phone} />
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Please select a customer to view details</p>
              </div>
            )}
          </Card>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Filters + Parcel List */}
          <div className="xl:col-span-3 space-y-6">
            {/* Filters Card */}
            <Card className="p-6">
              <SectionTitle className="mb-4">Parcel Filters</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parcel From
                  </label>
                  <input
                    type="date"
                    value={parcelFrom}
                    onChange={(e) => setParcelFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parcel To
                  </label>
                  <input
                    type="date"
                    value={parcelTo}
                    onChange={(e) => setParcelTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status Filter
                  </label>
                  <select
                    value={parcelList}
                    onChange={(e) => setParcelList(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">All Parcels</option>
                    <option value="uninvoiced">Unpaid</option>
                    <option value="invoiced">Paid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limit
                  </label>
                  <input
                    type="number"
                    value={parcelLimit}
                    onChange={(e) => setParcelLimit(e.target.value)}
                    min="1"
                    max="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-4 xl:col-span-1 flex items-end">
                  <button
                    onClick={loadOrders}
                    disabled={!selectedCustomer || loading}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2"
                  >
                    <Filter className="w-4 h-4" />
                    <span>{loading ? "Loading..." : "Filter"}</span>
                  </button>
                </div>
              </div>
            </Card>

            {/* Parcel List Card */}
            <Card className="overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <SectionTitle>Parcel List</SectionTitle>
                  {orders.length > 0 && (
                    <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                      <span className="text-sm text-gray-600">
                        {
                          orders.filter(
                            (o) =>
                              selectedParcelIds.has(o._id) &&
                              !o._id.startsWith("TEST-") &&
                              (o.invoice === null || o.invoice === undefined),
                          ).length
                        }{" "}
                        of{" "}
                        {
                          orders.filter(
                            (o) =>
                              o.invoice === null || o.invoice === undefined,
                          ).length
                        }{" "}
                        selected
                      </span>
                      <button
                        onClick={(e) => {
                          console.log("🔘 Select All BUTTON clicked");
                          handleSelectAll();
                        }}
                        className="text-sm font-medium text-green-600 hover:text-green-700 px-3 py-1 border border-green-300 rounded-md hover:bg-green-50 transition-colors"
                      >
                        {(() => {
                          const uninvoicedOrders = orders.filter(
                            (o) =>
                              o.invoice === null || o.invoice === undefined,
                          );
                          const selectedUninvoiced = uninvoicedOrders.filter(
                            (o) =>
                              selectedParcelIds.has(o._id) &&
                              !o._id.startsWith("TEST-"),
                          );
                          return selectedUninvoiced.length ===
                            uninvoicedOrders.length &&
                            uninvoicedOrders.length > 0
                            ? "Deselect All"
                            : "Select All";
                        })()}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="text-gray-500">Loading parcels...</div>
                </div>
              ) : orders.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="mb-2">
                    No parcels found for selected filters
                  </div>
                  <div className="text-sm">
                    Try adjusting your customer selection and date range
                  </div>
                </div>
              ) : orders.filter(
                  (o) => o.invoice === null || o.invoice === undefined,
                ).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <div className="text-lg font-medium mb-2">
                    No selectable parcels found
                  </div>
                  <div className="text-sm">
                    All parcels in this date range have already been paid.
                    <br />
                    Try selecting a different date range to find unpaid
                    parcels.
                  </div>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={(() => {
                                const uninvoicedOrders = orders.filter(
                                  (o) =>
                                    o.invoice === null ||
                                    o.invoice === undefined,
                                );
                                const selectedUninvoiced =
                                  uninvoicedOrders.filter(
                                    (o) =>
                                      selectedParcelIds.has(o._id) &&
                                      !o._id.startsWith("TEST-"),
                                  );
                                const isChecked =
                                  uninvoicedOrders.length > 0 &&
                                  selectedUninvoiced.length ===
                                    uninvoicedOrders.length;
                                console.log("🏷️ Header checkbox state:", {
                                  uninvoicedCount: uninvoicedOrders.length,
                                  selectedUninvoicedCount:
                                    selectedUninvoiced.length,
                                  isChecked: isChecked,
                                });
                                return isChecked;
                              })()}
                              onChange={(e) => {
                                console.log(
                                  "🏷️ Header checkbox onChange:",
                                  e.target.checked,
                                );
                                handleSelectAll();
                              }}
                              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            CN/Booking ID
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Consignee
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Destination
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Weight
                          </th>
                          <th className="px-6 py-3 text-right font-semibold text-gray-900">
                            COD Amount
                          </th>
                          <th className="px-6 py-3 text-right font-semibold text-gray-900">
                            Service Charges
                          </th>
                          <th className="px-6 py-3 text-center font-semibold text-gray-900">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {orders.map((order) => (
                          <tr
                            key={order._id}
                            className={`hover:bg-gray-50 transition-colors ${
                              selectedParcelIds.has(order._id)
                                ? "bg-green-50"
                                : ""
                            }`}
                          >
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedParcelIds.has(order._id)}
                                onChange={(e) => {
                                  console.log(
                                    "🎯 Checkbox onChange fired for:",
                                    order._id,
                                  );
                                  console.log(
                                    "🎯 Event target checked:",
                                    e.target.checked,
                                  );
                                  console.log(
                                    "🎯 Current state has ID:",
                                    selectedParcelIds.has(order._id),
                                  );
                                  e.stopPropagation();
                                  handleOrderSelect(order._id);
                                }}
                                onClick={(e) => {
                                  console.log(
                                    "👆 Checkbox onClick fired for:",
                                    order._id,
                                  );
                                  // Don't prevent default - let onChange handle it
                                }}
                                disabled={
                                  order.invoice !== null &&
                                  order.invoice !== undefined
                                }
                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">
                              {order.bookingId || order.trackingId}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {order.consigneeName}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {order.destinationCity}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {order.weightKg} kg
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                              {formatCurrency(order.codAmount)}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                              {formatCurrency(order.serviceCharges)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <StatusBadge
                                status={order.status}
                                invoiced={
                                  order.invoice !== null &&
                                  order.invoice !== undefined
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden p-4 space-y-4">
                    {orders.map((order) => (
                      <ParcelCard key={order._id} order={order} />
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* Invoice Summary - Right Sidebar on desktop, bottom on mobile */}
          <div className="xl:col-span-1">
            <Card className="p-6 xl:sticky xl:top-24">
              <SectionTitle className="mb-6">Invoice Summary</SectionTitle>

              <div className="space-y-4">
                <StatRow label="COD Total" value={formatCurrency(codTotal)} />

                <StatRow
                  label="Service Charges"
                  value={formatCurrency(serviceChargesTotal)}
                />

                <StatRow label="WHT IT u/s 6A of ITO, 2001 (2.0%)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={whtIt}
                    onChange={(e) =>
                      setWhtIt(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="w-28 px-3 py-1 text-sm text-right border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    placeholder="0.00"
                  />
                </StatRow>

                <StatRow label="WHT ST u/s 3 of STA, 1990 (2.0%)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={whtSt}
                    onChange={(e) =>
                      setWhtSt(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="w-28 px-3 py-1 text-sm text-right border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    placeholder="0.00"
                  />
                </StatRow>

                <StatRow
                  label="Net Payable"
                  value={formatCurrency(netPayable)}
                  type="total"
                />
              </div>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <Card className="p-6 mt-6 print:hidden">
          <div className="flex flex-col sm:flex-row sm:justify-end gap-4">
            <button
              onClick={handleSaveInvoice}
              disabled={
                loading ||
                Array.from(selectedParcelIds).filter(
                  (id) => !id.startsWith("TEST-"),
                ).length === 0 ||
                !selectedCustomer ||
                !accountName
              }
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>{loading ? "Saving Invoice..." : "Save Invoice"}</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={!savedInvoiceId}
              className="px-6 py-3 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2"
            >
              <Printer className="w-5 h-5" />
              <span>Print Invoice</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={!savedInvoiceId || loading}
              className="px-6 py-3 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>{loading ? "Exporting..." : "Export Excel"}</span>
            </button>
          </div>
        </Card>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{error}</span>
              <button
                onClick={() => setError("")}
                className="ml-4 text-red-600 hover:text-red-800 font-bold text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{success}</span>
              <button
                onClick={() => setSuccess("")}
                className="ml-4 text-green-600 hover:text-green-800 font-bold text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerInvoice;
