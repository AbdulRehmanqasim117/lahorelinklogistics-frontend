import React, { useEffect, useState } from "react";
import { Wallet, Truck } from "lucide-react";
import { useToast } from "../src/contexts/ToastContext";

const ManagerCommission = () => {
  const [shippers, setShippers] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [riders, setRiders] = useState([]);
  const [riderConfigs, setRiderConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedShipperId, setSelectedShipperId] = useState("");
  const [form, setForm] = useState({
    type: "FLAT",
    value: 0,
    minWeightKg: 0,
    maxWeightKg: "",
    flatChargePkr: 0,
    overagePerKgPkr: 0,
    returnCharge: 0,
  });
  const [riderForm, setRiderForm] = useState({
    riderId: "",
    rules: [
      { status: "DELIVERED", type: "FLAT", value: "" },
      { status: "RETURNED", type: "FLAT", value: "" },
      { status: "FAILED", type: "FLAT", value: "" },
    ],
  });
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [uRes, rRes, cRes, rcRes] = await Promise.all([
        fetch("/api/users/shippers", {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        }),
        fetch("/api/users/riders", {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        }),
        fetch("/api/commission", {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        }),
        fetch("/api/commission/rider", {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        }),
      ]);
      const uData = await uRes.json();
      const rData = await rRes.json();
      const cData = await cRes.json();
      const rcData = await rcRes.json();
      if (!uRes.ok)
        throw new Error(uData.message || "Failed to fetch shippers");
      if (!rRes.ok) throw new Error(rData.message || "Failed to fetch riders");
      if (!cRes.ok)
        throw new Error(cData.message || "Failed to fetch commissions");
      if (!rcRes.ok)
        throw new Error(rcData.message || "Failed to fetch rider commissions");
      const shipperList = (uData || []).filter((u) => u.role === "SHIPPER");
      const riderList = (rData || []).filter((u) => u.role === "RIDER");
      setShippers(shipperList);
      setRiders(riderList);
      setConfigs(cData);
      setRiderConfigs(rcData);
      if (shipperList.length && !selectedShipperId) {
        setSelectedShipperId(shipperList[0]._id);
      }
      if (riderList.length && !riderForm.riderId) {
        setRiderForm((f) => ({ ...f, riderId: riderList[0]._id }));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Load shipper config when shipper changes
  const loadShipperConfig = async (shipperId) => {
    if (!shipperId) return;
    try {
      setError("");
      const res = await fetch(`/api/commission/${shipperId}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (res.ok) {
        const config = await res.json();
        const numericValue =
          typeof config.value === "number" && !Number.isNaN(config.value)
            ? config.value
            : Number(config.value) || 0;
        const numericReturnChargeRaw = Number(
          config.returnCharge !== undefined && config.returnCharge !== null
            ? config.returnCharge
            : 0,
        );
        const numericReturnCharge =
          Number.isNaN(numericReturnChargeRaw) || numericReturnChargeRaw < 0
            ? 0
            : numericReturnChargeRaw;

        setForm({
          type: config.type || "FLAT",
          value: numericValue,
          minWeightKg:
            config.minWeightKg !== null && config.minWeightKg !== undefined
              ? Number(config.minWeightKg)
              : 0,
          maxWeightKg:
            config.maxWeightKg !== null && config.maxWeightKg !== undefined
              ? Number(config.maxWeightKg)
              : "",
          flatChargePkr:
            config.flatChargePkr !== null && config.flatChargePkr !== undefined
              ? Number(config.flatChargePkr)
              : 0,
          overagePerKgPkr:
            config.overagePerKgPkr !== null &&
            config.overagePerKgPkr !== undefined
              ? Number(config.overagePerKgPkr)
              : 0,
          returnCharge: numericReturnCharge,
        });
      } else if (res.status === 404) {
        // No config found, use defaults
        setForm({
          type: "FLAT",
          value: 0,
          minWeightKg: 0,
          maxWeightKg: "",
          flatChargePkr: 0,
          overagePerKgPkr: 0,
          returnCharge: 0,
        });
      } else {
        const data = await res.json();
        throw new Error(data.message || "Failed to load config");
      }
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (selectedShipperId) {
      loadShipperConfig(selectedShipperId);
    }
  }, [selectedShipperId]);

  // Validation for the single weight-based rule
  const validateRule = (currentForm) => {
    const minRaw = currentForm.minWeightKg;
    const maxRaw = currentForm.maxWeightKg;
    const flatRaw = currentForm.flatChargePkr;
    const overRaw = currentForm.overagePerKgPkr;

    const min =
      minRaw === "" || minRaw === null || minRaw === undefined
        ? 0
        : Number(minRaw);

    if (!Number.isFinite(min) || min < 0) {
      return {
        valid: false,
        message: "Minimum weight must be a non-negative number",
      };
    }

    const hasMax =
      maxRaw !== "" && maxRaw !== null && maxRaw !== undefined;
    const max = hasMax ? Number(maxRaw) : null;

    if (hasMax && (!Number.isFinite(max) || max <= min)) {
      return {
        valid: false,
        message: "Maximum weight must be greater than minimum weight",
      };
    }

    const flat =
      flatRaw === "" || flatRaw === null || flatRaw === undefined
        ? 0
        : Number(flatRaw);
    if (!Number.isFinite(flat) || flat < 0) {
      return {
        valid: false,
        message: "Base charge must be a non-negative number",
      };
    }

    const over =
      overRaw === "" || overRaw === null || overRaw === undefined
        ? 0
        : Number(overRaw);
    if (!Number.isFinite(over) || over < 0) {
      return {
        valid: false,
        message: "Overage per kg must be a non-negative number",
      };
    }

    return { valid: true };
  };

  const save = async () => {
    try {
      setError("");

      const validation = validateRule(form);
      if (!validation.valid) {
        setError(validation.message || "Please fix the commission rule fields.");
        return;
      }

      const min =
        form.minWeightKg === "" ||
        form.minWeightKg === null ||
        form.minWeightKg === undefined
          ? 0
          : Number(form.minWeightKg);
      const hasMax =
        form.maxWeightKg !== "" &&
        form.maxWeightKg !== null &&
        form.maxWeightKg !== undefined;
      const max = hasMax ? Number(form.maxWeightKg) : null;
      const flat =
        form.flatChargePkr === "" ||
        form.flatChargePkr === null ||
        form.flatChargePkr === undefined
          ? 0
          : Number(form.flatChargePkr);
      const over =
        form.overagePerKgPkr === "" ||
        form.overagePerKgPkr === null ||
        form.overagePerKgPkr === undefined
          ? 0
          : Number(form.overagePerKgPkr);
      const rc =
        form.returnCharge === "" ||
        form.returnCharge === null ||
        form.returnCharge === undefined
          ? 0
          : Number(form.returnCharge) || 0;

      // Preserve existing type/value from form but ensure numeric value
      const payload = {
        type: form.type || "FLAT",
        value:
          typeof form.value === "number"
            ? form.value
            : Number(form.value) || 0,
        minWeightKg: min,
        maxWeightKg: max,
        flatChargePkr: flat,
        overagePerKgPkr: over,
        returnCharge: rc,
      };

      const res = await fetch(`/api/commission/${selectedShipperId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save commission");

      await load();
      const shipper = shippers.find((s) => s._id === selectedShipperId);
      showToast({
        type: "success",
        title: "Commission saved",
        description: shipper
          ? `Commission configuration updated for ${shipper.name}.`
          : "Commission configuration saved.",
      });
    } catch (e) {
      setError(e.message);
      showToast({
        type: "error",
        title: "Commission error",
        description: e.message || "Failed to save commission.",
      });
    }
  };

  const saveRider = async () => {
    try {
      setError("");
      const payload = {
        riderId: riderForm.riderId,
        rules: riderForm.rules.map((r) => ({ ...r, value: Number(r.value) })),
      };
      const res = await fetch("/api/commission/rider", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to save rider commission");
      await load();
      const rider = riders.find((r) => r._id === riderForm.riderId);
      showToast({
        type: "success",
        title: "Rider commission saved",
        description: rider
          ? `Commission rules updated for ${rider.name}.`
          : "Rider commission rules saved.",
      });
    } catch (e) {
      setError(e.message);
      showToast({
        type: "error",
        title: "Rider commission error",
        description: e.message || "Failed to save rider commission.",
      });
    }
  };

  const ruleValidation = validateRule(form);

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Wallet className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-bold text-secondary">
            Commission Settings
          </h3>
        </div>
        <p className="text-gray-500 text-sm mt-2">
          Set per-shipper company commission and dynamic weight-based service
          charges.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-4xl">
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Shipper
            </label>
            <select
              value={selectedShipperId}
              onChange={(e) => setSelectedShipperId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white"
            >
              {shippers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Weight-Based Service Charges Section (single rule) */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-semibold text-secondary">
              Weight-Based Service Charges (Single Rule)
            </h4>
            <span className="text-xs text-gray-500">
              Configure one base charge and optional overage per extra kg.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.minWeightKg ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    minWeightKg: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.maxWeightKg ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    maxWeightKg: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                placeholder="Leave empty for ∞"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Charge (PKR)
              </label>
              <input
                type="number"
                min="0"
                value={form.flatChargePkr ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    flatChargePkr: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                placeholder="e.g. 150"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Overage per extra kg (PKR)
              </label>
              <input
                type="number"
                min="0"
                value={form.overagePerKgPkr ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    overagePerKgPkr: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                placeholder="0 for no overage"
              />
            </div>
          </div>

          {ruleValidation && !ruleValidation.valid && (
            <p className="text-sm text-red-600">{ruleValidation.message}</p>
          )}

          {/* Live preview for a few example weights */}
          <div className="mt-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="text-xs font-semibold text-secondary mb-2">
              Live Preview (example weights)
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500">
                  <th className="py-1 pr-2 text-left">Weight (kg)</th>
                  <th className="py-1 pr-2 text-right">Charge (PKR)</th>
                  <th className="py-1 text-right">Note</th>
                </tr>
              </thead>
              <tbody>
                {[0.5, 1, 3, 5].map((w) => {
                  const minRaw = form.minWeightKg;
                  const maxRaw = form.maxWeightKg;
                  const flatRaw = form.flatChargePkr;
                  const overRaw = form.overagePerKgPkr;

                  const min =
                    minRaw === "" ||
                    minRaw === null ||
                    minRaw === undefined
                      ? 0
                      : Number(minRaw);
                  const hasMax =
                    maxRaw !== "" &&
                    maxRaw !== null &&
                    maxRaw !== undefined;
                  const max = hasMax ? Number(maxRaw) : null;
                  const flat =
                    flatRaw === "" ||
                    flatRaw === null ||
                    flatRaw === undefined
                      ? 0
                      : Number(flatRaw);
                  const over =
                    overRaw === "" ||
                    overRaw === null ||
                    overRaw === undefined
                      ? 0
                      : Number(overRaw);

                  let note = "";
                  let charge = 0;

                  if (
                    !Number.isFinite(min) ||
                    (hasMax && !Number.isFinite(max)) ||
                    !Number.isFinite(flat) ||
                    !Number.isFinite(over) ||
                    min < 0 ||
                    flat < 0 ||
                    over < 0
                  ) {
                    note = "Invalid rule";
                    charge = 0;
                  } else if (w < min) {
                    note = "Below min";
                    charge = 0;
                  } else {
                    let overKg = 0;
                    if (max !== null && w > max) {
                      overKg = Math.ceil(w - max);
                    }
                    charge = flat + overKg * over;
                    note =
                      overKg > 0
                        ? `Base + ${overKg}kg overage`
                        : "Base charge";
                  }

                  return (
                    <tr key={w}>
                      <td className="py-1 pr-2 text-left">{w}</td>
                      <td className="py-1 pr-2 text-right">
                        {Number.isFinite(charge)
                          ? Math.max(0, Math.round(charge))
                          : 0}
                      </td>
                      <td className="py-1 text-right text-gray-500">{note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 max-w-xs">
          <h4 className="text-md font-semibold text-secondary mb-2">
            Return Service Charge (per returned order)
          </h4>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (PKR)
          </label>
          <input
            type="number"
            min="0"
            value={form.returnCharge ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                returnCharge: e.target.value,
              }))
            }
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
            placeholder="e.g. 100"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={save}
            disabled={!ruleValidation.valid || !selectedShipperId}
            className={`px-6 py-2 rounded-lg text-sm ${
              !ruleValidation.valid || !selectedShipperId
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-primary hover:bg-primary-hover text-white"
            }`}
          >
            Save Configuration
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-2xl">
        <div className="flex items-center gap-3 mb-3">
          <Truck className="w-5 h-5 text-primary" />
          <h4 className="text-md font-semibold text-secondary">
            Rider Commission by Status
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Rider
            </label>
            <select
              value={riderForm.riderId}
              onChange={(e) =>
                setRiderForm({ ...riderForm, riderId: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white"
            >
              {riders.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} ({r.email})
                </option>
              ))}
            </select>
          </div>
          {riderForm.rules.map((rule, idx) => (
            <div
              key={rule.status}
              className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Status
                </label>
                <input
                  value={rule.status}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Type
                </label>
                <select
                  value={rule.type}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRiderForm((f) => ({
                      ...f,
                      rules: f.rules.map((r, i) =>
                        i === idx ? { ...r, type: val } : r,
                      ),
                    }));
                  }}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white"
                >
                  <option value="FLAT">FLAT</option>
                  <option value="PERCENTAGE">PERCENTAGE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Value
                </label>
                <input
                  type="number"
                  value={rule.value}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRiderForm((f) => ({
                      ...f,
                      rules: f.rules.map((r, i) =>
                        i === idx ? { ...r, value: val } : r,
                      ),
                    }));
                  }}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white"
                  placeholder={
                    rule.type === "PERCENTAGE" ? "5 for 5%" : "100 for PKR 100"
                  }
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={saveRider}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm"
          >
            Save Rider Rules
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-secondary">
            Current Configurations
          </h3>
          <button
            onClick={load}
            className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600"
          >
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 px-3">Shipper</th>
                <th className="py-2 px-3">Rule</th>
                <th className="py-2 px-3 text-right">Return Charge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {configs.map((c) => {
                const flat = Number(c.flatChargePkr || 0);
                const over = Number(c.overagePerKgPkr || 0);
                const min =
                  c.minWeightKg !== null && c.minWeightKg !== undefined
                    ? Number(c.minWeightKg)
                    : 0;
                const max =
                  c.maxWeightKg !== null && c.maxWeightKg !== undefined
                    ? Number(c.maxWeightKg)
                    : null;
                const hasRule = !!c.hasCommissionRule;
                const maxLabel =
                  max === null || Number.isNaN(max) ? "∞" : Number(max);

                let desc = "No rule configured";
                if (hasRule) {
                  desc = `From ${Number(min)}kg up to ${maxLabel}kg: PKR ${flat}`;
                  if (over > 0 && max !== null && !Number.isNaN(max)) {
                    desc += `, then + PKR ${over} per extra kg`;
                  }
                }

                return (
                  <tr key={c._id}>
                    <td className="py-2 px-3">{c.shipper?.name || c.shipper}</td>
                    <td className="py-2 px-3 text-xs text-gray-700">{desc}</td>
                    <td className="py-2 px-3 text-right text-xs text-gray-700">
                      PKR {Number(c.returnCharge ?? 0).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-secondary">
            Current Rider Commissions
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 px-3">Rider</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Value</th>
                <th className="py-2 px-3">Rules</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {riderConfigs.map((rc) => (
                <tr key={rc._id}>
                  <td className="py-2 px-3">{rc.rider?.name || rc.rider}</td>
                  <td className="py-2 px-3">{rc.type}</td>
                  <td className="py-2 px-3">
                    {rc.type === "PERCENTAGE"
                      ? `${rc.value}%`
                      : `PKR ${Number(rc.value || 0).toLocaleString()}`}
                  </td>
                  <td className="py-2 px-3">
                    {Array.isArray(rc.rules) && rc.rules.length ? (
                      <div className="space-y-1">
                        {rc.rules.map((r) => (
                          <div key={r.status} className="text-xs text-gray-600">
                            {r.status}:{" "}
                            {r.type === "PERCENTAGE"
                              ? `${r.value}%`
                              : `PKR ${Number(r.value || 0).toLocaleString()}`}
                          </div>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerCommission;
