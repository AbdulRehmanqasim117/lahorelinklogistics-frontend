import React, { useEffect, useMemo, useState } from "react";
import { DollarSign, Filter } from "lucide-react";
import { getToken } from "../src/utils/auth";
import Button from "../components/ui/Button.jsx";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
  }).format(Number(amount || 0));

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-PK");
};

const CeoCompanyFinance = () => {
  const token = getToken();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shipperSummary, setShipperSummary] = useState([]);
  const [riderSummary, setRiderSummary] = useState([]);
  const [companyMetrics, setCompanyMetrics] = useState(null);

  // Ledger state
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerRows, setLedgerRows] = useState([]);
  const [ledgerTotals, setLedgerTotals] = useState(null);
  const [activePeriod, setActivePeriod] = useState(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activeRange, setActiveRange] = useState("all");
  const [shipperFilter, setShipperFilter] = useState("all");
  const [riderFilter, setRiderFilter] = useState("all");

  const fetchData = async (overrides = {}) => {
    setLoading(true);
    setError("");
    try {
      const headers = {
        Authorization: token ? `Bearer ${token}` : "",
      };

      const params = new URLSearchParams();
      const rangeKey = overrides.range ?? activeRange;
      if (rangeKey && rangeKey !== "custom" && rangeKey !== "all") {
        if (rangeKey === "today") params.set("range", "today");
        else if (rangeKey === "7") params.set("range", "7d");
        else if (rangeKey === "15") params.set("range", "15d");
        else if (rangeKey === "30") params.set("range", "30d");
      } else if (rangeKey === "all") {
        params.set("range", "all");
      }

      const fromToUse = overrides.from ?? from;
      const toUse = overrides.to ?? to;
      if (fromToUse) params.set("from", fromToUse);
      if (toUse) params.set("to", toUse);

      if (shipperFilter && shipperFilter !== "all") {
        params.set("shipperId", shipperFilter);
      }
      if (riderFilter && riderFilter !== "all") {
        params.set("riderId", riderFilter);
      }

      const summaryRes = await fetch(
        `/api/finance/company/summary?${params.toString()}`,
        { headers }
      );
      const summaryJson = await summaryRes.json();
      if (!summaryRes.ok) {
        throw new Error(
          summaryJson.message || "Failed to load company finance summary"
        );
      }

      const metrics = summaryJson.metrics || {};
      setCompanyMetrics(metrics);

      // Separately load shipper/rider summaries for filter dropdown options.
      try {
        const [shipperRes, riderRes] = await Promise.all([
          fetch("/api/finance/summary/shipper", { headers }),
          fetch("/api/finance/summary/rider", { headers }),
        ]);

        const shipperJson = shipperRes.ok
          ? await shipperRes.json().catch(() => [])
          : [];
        const riderJson = riderRes.ok
          ? await riderRes.json().catch(() => [])
          : [];

        if (Array.isArray(shipperJson) && shipperJson.length > 0) {
          setShipperSummary(shipperJson);
        } else {
          setShipperSummary([]);
        }

        if (Array.isArray(riderJson) && riderJson.length > 0) {
          setRiderSummary(riderJson);
        } else {
          setRiderSummary([]);
        }
      } catch {
        // Ignore errors from auxiliary summaries; filters will just have fewer options.
        setShipperSummary([]);
        setRiderSummary([]);
      }
    } catch (e) {
      setError(e.message || "Failed to load company finance");
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async (opts = {}) => {
    setLedgerLoading(true);
    // Do not clear top-level error for summary if it already exists, but
    // surface ledger errors using the same banner.
    try {
      const params = new URLSearchParams();

      const rangeKey = opts.range ?? activeRange;
      if (rangeKey && rangeKey !== "custom" && rangeKey !== "all") {
        if (rangeKey === "today") params.set("range", "today");
        else if (rangeKey === "7") params.set("range", "7d");
        else if (rangeKey === "15") params.set("range", "15d");
        else if (rangeKey === "30") params.set("range", "30d");
      } else if (rangeKey === "all") {
        params.set("range", "all");
      }

      const fromToUse = opts.from ?? from;
      const toUse = opts.to ?? to;
      if (fromToUse) params.set("from", fromToUse);
      if (toUse) params.set("to", toUse);

      const shipperId = opts.shipperFilter ?? shipperFilter;
      if (shipperId && shipperId !== "all") params.set("shipperId", shipperId);

      const riderId = opts.riderFilter ?? riderFilter;
      if (riderId && riderId !== "all") params.set("riderId", riderId);

      const headers = {
        Authorization: token ? `Bearer ${token}` : "",
      };

      const res = await fetch(
        `/api/finance/company/ledger?${params.toString()}`,
        { headers },
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to load company ledger");
      }

      setLedgerRows(Array.isArray(json.rows) ? json.rows : []);
      setLedgerTotals(json.totals || null);
      setActivePeriod(json.activePeriod || null);
    } catch (e) {
      setError(e.message || "Failed to load company ledger");
      setLedgerRows([]);
      setLedgerTotals(null);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchLedger({ range: activeRange });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const applyQuickRange = (key) => {
    setActiveRange(key);
    let nextFrom = "";
    let nextTo = "";

    if (key === "all") {
      nextFrom = "";
      nextTo = "";
    } else {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      let start;

      if (key === "current") {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        if (key !== "today") {
          const days = Number(key);
          if (!Number.isNaN(days) && days > 0) {
            start = new Date(end);
            start.setDate(start.getDate() - (days - 1));
            start.setHours(0, 0, 0, 0);
          }
        }
      }

      const fmt = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };

      nextFrom = fmt(start);
      nextTo = fmt(end);
    }

    setFrom(nextFrom);
    setTo(nextTo);

    fetchLedger({ range: key, from: nextFrom, to: nextTo });
    fetchData({ range: key, from: nextFrom, to: nextTo });
  };

  const totals = useMemo(() => {
    const m = companyMetrics || {};

    const totalOrders = Number(m.ordersCount || 0);
    const totalCod = Number(m.totalCod || 0);
    const totalServiceCharges = Number(m.totalServiceCharges || 0);
    const totalCompanyCommission = Number(m.totalCompanyCommission || 0);
    const companyEarnings = totalServiceCharges + totalCompanyCommission;
    const companyProfit = Number(m.companyProfit || 0);

    const deliveredOrders = Number(m.deliveredOrders || 0);
    const returnedOrders = Number(m.returnedOrders || 0);

    const totalAmount = Number(m.totalAmount || totalCod + totalServiceCharges);
    const unpaidRiderBalances = Number(m.unpaidRiderBalances || 0);

    return {
      totalOrders,
      totalCod,
      totalServiceCharges,
      totalCompanyCommission,
      companyEarnings,
      companyProfit,
      deliveredOrders,
      returnedOrders,
      totalAmount,
      unpaidRiderBalances,
    };
  }, [companyMetrics]);

  const rangeLabel = useMemo(() => {
    if (activeRange === "today") return "today";
    if (activeRange === "7") return "last 7 days";
    if (activeRange === "15") return "last 15 days";
    if (activeRange === "30") return "last 30 days";
    if (activeRange === "all") return "all time";
    if (activeRange === "current") return "current month";
    return "custom";
  }, [activeRange]);

  const uniqueShippers = useMemo(() => {
    const shippers = Array.isArray(shipperSummary) ? shipperSummary : [];
    return shippers.map((s) => ({
      id: s._id,
      name: s.shipperName || s.shipperEmail || "Shipper",
    }));
  }, [shipperSummary]);

  const uniqueRiders = useMemo(() => {
    const riders = Array.isArray(riderSummary) ? riderSummary : [];
    return riders.map((r) => ({
      id: r._id,
      name: r.riderName || "Rider",
    }));
  }, [riderSummary]);

  const handleApplyLedgerFilters = () => {
    fetchLedger({});
    fetchData({});
  };

  const handleResetLedgerFilters = () => {
    setFrom("");
    setTo("");
    setActiveRange("all");
    setShipperFilter("all");
    setRiderFilter("all");
    fetchLedger({
      range: "all",
      from: "",
      to: "",
      shipperFilter: "all",
      riderFilter: "all",
    });
    fetchData({ range: "all", from: "", to: "" });
  };

  const handleCloseCurrentMonth = async () => {
    const confirmed = window.confirm(
      "Close current finance month? This will lock the current period and start a new active month."
    );
    if (!confirmed) return;

    try {
      setError("");
      setLoading(true);
      const res = await fetch("/api/finance/company/close-month", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to close current month");
      }

      // Refresh summary/top cards and ledger after closing
      await fetchData();
      setActiveRange("all");
      setFrom("");
      setTo("");
      setShipperFilter("all");
      setRiderFilter("all");
      await fetchLedger({ range: "all", from: "", to: "" });
    } catch (e) {
      setError(e.message || "Failed to close current month");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-bold text-secondary">Company Finance</h3>
          </div>

          <div className="flex flex-col items-stretch sm:flex-row sm:items-center gap-2 text-xs">
            {[
              { key: "today", label: "Today" },
              { key: "7", label: "7 Days" },
              { key: "30", label: "30 Days" },
              { key: "all", label: "All Time" },
            ].map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => applyQuickRange(r.key)}
                className={`px-3 py-1.5 rounded-full border text-xs whitespace-nowrap ${
                  activeRange === r.key
                    ? "bg-black text-white border-black"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setActiveRange("custom")}
            className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Custom Range
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500">Orders</div>
          <div className="mt-1 text-2xl font-bold text-secondary">
            {loading ? "..." : totals.totalOrders}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500">Total COD</div>
          <div className="mt-1 text-xl font-bold text-secondary">
            {loading ? "..." : formatCurrency(totals.totalCod)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500">Service Charges</div>
          <div className="mt-1 text-xl font-bold text-secondary">
            {loading ? "..." : formatCurrency(totals.totalServiceCharges)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500">Company Earnings</div>
          <div className="mt-1 text-xl font-bold text-secondary">
            {loading ? "..." : formatCurrency(totals.companyEarnings)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-secondary">Delivery Outcomes</h3>
          <span className="text-xs text-gray-500">Range: {rangeLabel}</span>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-100 rounded-xl px-4 py-3">
            <div className="text-xs text-gray-500">Delivered Orders</div>
            <div className="mt-1 text-2xl font-bold text-secondary">
              {loading ? "..." : totals.deliveredOrders}
            </div>
          </div>
          <div className="border border-gray-100 rounded-xl px-4 py-3">
            <div className="text-xs text-gray-500">Returned Orders</div>
            <div className="mt-1 text-2xl font-bold text-secondary">
              {loading ? "..." : totals.returnedOrders}
            </div>
          </div>
          <div className="border border-gray-100 rounded-xl px-4 py-3">
            <div className="text-xs text-gray-500">Total Amount (COD + Charges)</div>
            <div className="mt-1 text-xl font-bold text-secondary">
              {loading ? "..." : formatCurrency(totals.totalAmount)}
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 text-sm text-gray-700">
          <span>Unpaid rider balances:</span>
          <span className="ml-2 font-semibold text-secondary">
            {loading
              ? "..."
              : `Rs ${Number(totals.unpaidRiderBalances || 0).toLocaleString()}`}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <h3 className="font-bold text-lg text-secondary">
              Company Journal / Ledger
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 text-xs text-gray-500 w-full md:w-auto">
            {activePeriod && (
              <span className="whitespace-normal sm:whitespace-nowrap">
                Active Period:
                {" "}
                {formatDate(activePeriod.periodStart)}
                {" - "}
                {activePeriod.periodEnd
                  ? formatDate(activePeriod.periodEnd)
                  : "Open"}
              </span>
            )}
            <select
              value={activePeriod ? activePeriod._id || "current" : "current"}
              disabled
              className="w-full sm:w-auto px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-xs text-gray-600"
            >
              {activePeriod && (
                <option value={activePeriod._id || "current"}>
                  {formatDate(activePeriod.periodStart)}
                  {" - "}
                  {activePeriod.periodEnd
                    ? formatDate(activePeriod.periodEnd)
                    : "Open"}
                </option>
              )}
            </select>
            <Button
              variant="outline"
              onClick={handleCloseCurrentMonth}
              className="w-full sm:w-auto text-xs"
            >
              Close Current Month
            </Button>
          </div>
        </div>

        <div className="p-6 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="mb-4 flex flex-wrap gap-2 text-xs">
              {[
                { key: "today", label: "Today" },
                { key: "7", label: "7 Days" },
                { key: "15", label: "15 Days" },
                { key: "30", label: "30 Days" },
                { key: "current", label: "Current Month" },
                { key: "all", label: "All Time" },
              ].map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => applyQuickRange(r.key)}
                  className={`px-3 py-1.5 rounded-full border whitespace-nowrap ${
                    activeRange === r.key
                      ? "bg-black text-white border-black"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 text-xs">
              <div className="flex flex-col">
                <label className="text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setActiveRange("custom");
                  }}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setActiveRange("custom");
                  }}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-500 mb-1">Shipper</label>
                <select
                  value={shipperFilter}
                  onChange={(e) => setShipperFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
                >
                  <option value="all">All Shippers</option>
                  {uniqueShippers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-gray-500 mb-1">Rider</label>
                <select
                  value={riderFilter}
                  onChange={(e) => setRiderFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
                >
                  <option value="all">All Riders</option>
                  {uniqueRiders.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2 text-xs">
              <Button
                onClick={handleApplyLedgerFilters}
                className="px-4 py-2 text-xs"
              >
                Apply Filters
              </Button>
              <Button
                variant="outline"
                onClick={handleResetLedgerFilters}
                className="px-4 py-2 text-xs"
              >
                Reset
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[950px] md:min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b bg-gray-50">
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Shipper</th>
                    <th className="py-3 px-4">Order / CN</th>
                    <th className="py-3 px-4 text-right">COD</th>
                    <th className="py-3 px-4 text-right">Service Charges</th>
                    <th className="py-3 px-4 text-right">Rider Payout</th>
                    <th className="py-3 px-4 text-right">Company Profit</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ledgerLoading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-10 px-4 text-center text-gray-500"
                      >
                        Loading ledger…
                      </td>
                    </tr>
                  ) : ledgerRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-10 px-4 text-center text-gray-500"
                      >
                        No records found
                      </td>
                    </tr>
                  ) : (
                    ledgerRows.map((row) => {
                      const profit = Number(row.companyProfit || 0);
                      const profitClass =
                        profit > 0
                          ? "text-green-700"
                          : profit < 0
                            ? "text-red-600"
                            : "text-secondary";
                      return (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 text-xs text-gray-600">
                            {formatDateTime(row.date)}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {row.shipperName || "—"}
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-700">
                            <div className="flex flex-col">
                              <span className="font-mono text-[11px]">
                                {row.bookingId || "—"}
                              </span>
                              <span className="font-mono text-[11px] text-gray-500">
                                {row.trackingId || ""}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {formatCurrency(row.cod || 0)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {formatCurrency(row.serviceCharges || 0)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {formatCurrency(row.riderPayout || 0)}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-semibold ${profitClass}`}
                          >
                            {formatCurrency(profit)}
                          </td>
                          <td className="py-3 px-4 text-center text-xs text-gray-600">
                            {row.status || "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm">
              <h4 className="font-bold text-secondary mb-3 text-sm">
                Summary (Filtered)
              </h4>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Orders</span>
                  <span className="font-semibold text-secondary">
                    {ledgerTotals?.totalOrders || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total COD</span>
                  <span className="font-semibold text-secondary">
                    {formatCurrency(ledgerTotals?.totalCod || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Service Charges</span>
                  <span className="font-semibold text-secondary">
                    {formatCurrency(ledgerTotals?.totalServiceCharges || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Rider Payout</span>
                  <span className="font-semibold text-secondary">
                    {formatCurrency(
                      ledgerTotals?.totalRiderPayoutPaid || 0,
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-2">
                  <span>Company Profit</span>
                  <span className="font-semibold text-secondary">
                    {formatCurrency(ledgerTotals?.totalCompanyProfit || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CeoCompanyFinance;
