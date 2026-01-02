import React, { useEffect, useState } from "react";
import { Wallet, Truck, Plus, Trash2 } from "lucide-react";
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
    weightBrackets: [{ minKg: 0, maxKg: 1, charge: 100 }],
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
        setForm({
          type: config.type || "FLAT",
          value:
            typeof config.value === "number" && !Number.isNaN(config.value)
              ? config.value
              : 0,
          weightBrackets:
            config.weightBrackets && config.weightBrackets.length > 0
              ? config.weightBrackets
              : [{ minKg: 0, maxKg: 1, charge: 100 }],
        });
      } else if (res.status === 404) {
        // No config found, use defaults
        setForm({
          type: "FLAT",
          value: 0,
          weightBrackets: [{ minKg: 0, maxKg: 1, charge: 100 }],
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

  // Validation function for weight brackets
  const validateBrackets = (brackets) => {
    if (!Array.isArray(brackets) || brackets.length === 0) {
      return {
        valid: false,
        message: "At least one weight bracket is required",
      };
    }

    // Normalize values (treat empty string as null for maxKg) and sort by minKg
    const normalized = brackets
      .map((b, idx) => {
        const rawMin = b.minKg;
        const rawMax = b.maxKg;
        const rawCharge = b.charge;

        const minKg =
          rawMin === "" || rawMin === null || rawMin === undefined
            ? NaN
            : Number(rawMin);
        const maxKg =
          rawMax === "" || rawMax === null || rawMax === undefined
            ? null
            : Number(rawMax);
        const charge =
          rawCharge === "" || rawCharge === null || rawCharge === undefined
            ? NaN
            : Number(rawCharge);

        return { index: idx, minKg, maxKg, charge };
      })
      .sort((a, b) => a.minKg - b.minKg);

    for (let i = 0; i < normalized.length; i++) {
      const bracket = normalized[i];

      // Validate minKg
      if (!Number.isFinite(bracket.minKg) || bracket.minKg < 0) {
        return {
          valid: false,
          message: `Invalid minimum weight for bracket ${i + 1}`,
        };
      }

      // Validate charge
      if (!Number.isFinite(bracket.charge) || bracket.charge < 0) {
        return { valid: false, message: `Invalid charge for bracket ${i + 1}` };
      }

      // Validate maxKg if provided
      if (
        bracket.maxKg !== null &&
        (!Number.isFinite(bracket.maxKg) || bracket.maxKg <= bracket.minKg)
      ) {
        return {
          valid: false,
          message: `Maximum weight must be greater than minimum weight for bracket ${i + 1}`,
        };
      }

      // Check for overlaps
      if (i > 0) {
        const prevBracket = normalized[i - 1];
        if (
          prevBracket.maxKg !== null &&
          bracket.minKg < prevBracket.maxKg
        ) {
          return {
            valid: false,
            message: `Overlap between ${prevBracket.minKg}-${prevBracket.maxKg}kg and ${bracket.minKg}-${bracket.maxKg || "∞"}kg`,
          };
        }
      }

      // Only the last bracket can have null maxKg
      if (bracket.maxKg === null && i !== normalized.length - 1) {
        return {
          valid: false,
          message: "Only the last bracket can have unlimited maximum weight",
        };
      }
    }

    return { valid: true };
  };

  const save = async () => {
    try {
      setError("");

      // Validate brackets
      const validation = validateBrackets(form.weightBrackets);
      if (!validation.valid) {
        setError(validation.message);
        return;
      }

      // Preserve existing type/value from form but ensure numeric value
      const payload = {
        type: form.type || "FLAT",
        value:
          typeof form.value === "number"
            ? form.value
            : Number(form.value) || 0,
        weightBrackets: form.weightBrackets.map((b) => ({
          minKg: Number(b.minKg),
          maxKg:
            b.maxKg === "" || b.maxKg === null || b.maxKg === undefined
              ? null
              : Number(b.maxKg),
          charge: Number(b.charge),
        })),
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

  const addBracket = () => {
    const lastBracket = form.weightBrackets[form.weightBrackets.length - 1];
    const newMinKg =
      lastBracket && lastBracket.maxKg != null ? lastBracket.maxKg : 0;

    setForm((prev) => ({
      ...prev,
      weightBrackets: [
        ...prev.weightBrackets,
        { minKg: newMinKg, maxKg: newMinKg + 1, charge: 0 },
      ],
    }));
  };

  const deleteBracket = (index) => {
    if (form.weightBrackets.length <= 1) {
      setError("At least one weight bracket is required");
      return;
    }

    setForm((prev) => ({
      ...prev,
      weightBrackets: prev.weightBrackets.filter((_, i) => i !== index),
    }));
  };

  const updateBracket = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      weightBrackets: prev.weightBrackets.map((bracket, i) =>
        i === index ? { ...bracket, [field]: value } : bracket,
      ),
    }));
  };

  const validation = validateBrackets(form.weightBrackets);

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

        {/* Weight-Based Service Charges Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-secondary">
              Weight-Based Service Charges
            </h4>
            <button
              onClick={addBracket}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary hover:bg-primary-hover text-white rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Add Bracket
            </button>
          </div>

          <div className="space-y-3">
            {form.weightBrackets.map((bracket, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={bracket.minKg || ""}
                    onChange={(e) =>
                      updateBracket(index, "minKg", e.target.value)
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
                    value={bracket.maxKg || ""}
                    onChange={(e) =>
                      updateBracket(index, "maxKg", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                    placeholder="Leave empty for ∞"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Charge (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={bracket.charge || ""}
                    onChange={(e) =>
                      updateBracket(index, "charge", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                    placeholder="0"
                  />
                </div>
                <div className="text-sm text-gray-600 self-center">
                  {bracket.minKg || 0}kg - {bracket.maxKg || "∞"}kg
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => deleteBracket(index)}
                    disabled={form.weightBrackets.length <= 1}
                    className={`p-2 rounded-lg ${
                      form.weightBrackets.length <= 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-red-100 hover:bg-red-200 text-red-600"
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!validation.valid && (
            <p className="text-sm text-red-600 mt-2">{validation.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={save}
            disabled={!validation.valid || !selectedShipperId}
            className={`px-6 py-2 rounded-lg text-sm ${
              !validation.valid || !selectedShipperId
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
                <th className="py-2 px-3">Weight Brackets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {configs.map((c) => (
                <tr key={c._id}>
                  <td className="py-2 px-3">{c.shipper?.name || c.shipper}</td>
                  <td className="py-2 px-3">
                    {c.weightBrackets && c.weightBrackets.length > 0 ? (
                      <div className="space-y-1">
                        {c.weightBrackets.map((bracket, i) => (
                          <div key={i} className="text-xs text-gray-600">
                            {bracket.minKg}kg - {bracket.maxKg || "∞"}kg: PKR{" "}
                            {bracket.charge}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">No brackets</span>
                    )}
                  </td>
                </tr>
              ))}
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
