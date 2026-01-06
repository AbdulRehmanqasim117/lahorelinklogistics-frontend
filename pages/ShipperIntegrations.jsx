import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Eye,
  EyeOff,
  RefreshCw,
  ShoppingBag,
  Store,
} from "lucide-react";
import { getApiBaseUrl } from "../src/config/env";
import { useToast } from "../src/contexts/ToastContext";

const PROVIDERS = ["SHOPIFY", "WOOCOMMERCE"];

const buildApiUrl = (path) => {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return path;
  return `${baseUrl}${path}`;
};

const buildWebhookUrl = (provider, apiKey) => {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return "";

  const name = String(provider || "").toUpperCase();
  if (name === "SHOPIFY") {
    // Shopify webhooks use HMAC verification and a dedicated /webhooks endpoint
    return `${baseUrl}/webhooks/shopify`;
  }

  const keyParam = apiKey ? `?key=${encodeURIComponent(apiKey)}` : "";
  return `${baseUrl}/api/integrations/${name.toLowerCase()}/orders${keyParam}`;
};

const normalizeConfig = (raw) => {
  const providers = Array.isArray(raw?.providers) ? raw.providers : [];

  const mapProvider = (name) => {
    const existing = providers.find(
      (p) => String(p.provider || "").toUpperCase() === name,
    );
    return {
      provider: name,
      enabled: !!existing?.enabled,
      settings: existing?.settings || {},
    };
  };

  return {
    shipper: raw?.shipper ?? null,
    apiKey: raw?.apiKey || "",
    enabled: !!raw?.enabled,
    providers: PROVIDERS.map(mapProvider),
  };
};

const getProviderEntry = (cfg, name) => {
  return (
    cfg?.providers?.find(
      (p) => String(p.provider || "").toUpperCase() === name,
    ) || { provider: name, enabled: false, settings: {} }
  );
};

const maskKey = (key) => {
  if (!key) return "Not generated yet";
  const visible = key.slice(-6);
  const maskedLength = Math.max(6, key.length - 6);
  return "•".repeat(maskedLength) + visible;
};

export default function ShipperIntegrations() {
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [error, setError] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showShopifyHelp, setShowShopifyHelp] = useState(false);
  const [shopifyDomain, setShopifyDomain] = useState("");
  const [connectingShopify, setConnectingShopify] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  const token = localStorage.getItem("token");
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(buildApiUrl("/api/integrations/shipper/me"), {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to load integrations");
      }
      setCfg(normalizeConfig(json));
    } catch (e) {
      setError(e.message || "Failed to load integrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!cfg) return;
    setSaving(true);
    try {
      const body = {
        enabled: !!cfg.enabled,
        providers: (cfg.providers || []).map((p) => ({
          provider: p.provider,
          enabled: !!p.enabled,
          settings: p.settings || {},
        })),
      };

      const res = await fetch(buildApiUrl("/api/integrations/shipper/me"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to save settings");
      }
      setCfg(normalizeConfig(json));
      showToast({
        type: "success",
        title: "Integrations updated",
        description:
          "Your integration status and provider settings have been saved.",
      });
    } catch (e) {
      showToast({
        type: "error",
        title: "Save failed",
        description: e.message || "Unable to save integration settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!cfg) return;
    setRegenLoading(true);
    try {
      const res = await fetch(
        buildApiUrl("/api/integrations/shipper/me/regenerate-key"),
        {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to regenerate key");
      }
      setCfg((prev) =>
        prev
          ? {
              ...prev,
              apiKey: json.apiKey,
            }
          : prev,
      );
      setShowRegenConfirm(false);
      setShowKey(false);
      showToast({
        type: "success",
        title: "Integration key regenerated",
        description: "Update your store webhook settings to use the new key.",
      });
    } catch (e) {
      showToast({
        type: "error",
        title: "Could not regenerate key",
        description: e.message || "Please try again.",
      });
    } finally {
      setRegenLoading(false);
    }
  };

  const handleCopyKey = async () => {
    if (!cfg?.apiKey) return;
    try {
      await navigator.clipboard.writeText(cfg.apiKey);
      showToast({
        type: "success",
        title: "Key copied",
        description: "Your integration key has been copied to the clipboard.",
      });
    } catch {
      showToast({
        type: "error",
        title: "Copy failed",
        description: "Could not copy the key. Please copy it manually.",
      });
    }
  };

  const handleCopyUrl = async (provider) => {
    if (!cfg) return;
    const url = buildWebhookUrl(provider, cfg.apiKey);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      showToast({
        type: "success",
        title: "URL copied",
        description: "Webhook URL copied to the clipboard.",
      });
    } catch {
      showToast({
        type: "error",
        title: "Copy failed",
        description: "Could not copy the URL. Please copy it manually.",
      });
    }
  };

  const handleConnectShopify = async () => {
    const raw = (shopifyDomain || "").trim();
    if (!raw) {
      showToast({
        type: "error",
        title: "Shopify domain required",
        description:
          "Please enter your Shopify .myshopify.com domain, for example mystore.myshopify.com.",
      });
      return;
    }

    setConnectingShopify(true);
    try {
      const body = {
        shopDomain: raw.toLowerCase(),
        webhookVersion: "2026-01",
      };

      const res = await fetch(buildApiUrl("/api/integrations/shopify/connect"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to connect Shopify store");
      }

      const domain = json.integration?.shopDomain || raw.toLowerCase();

      showToast({
        type: "success",
        title: "Shopify store connected",
        description:
          domain
            ? `Store ${domain} is now linked. New Shopify webhooks will create integrated orders here.`
            : "Your Shopify store is now linked. New webhooks will create integrated orders.",
      });
    } catch (e) {
      showToast({
        type: "error",
        title: "Could not connect Shopify store",
        description: e.message || "Please check the domain and try again.",
      });
    } finally {
      setConnectingShopify(false);
    }
  };

  const updateProviderEnabled = (provider, enabled) => {
    setCfg((prev) => {
      if (!prev) return prev;
      const providers = PROVIDERS.map((name) => {
        const existing = getProviderEntry(prev, name);
        if (name === provider) {
          return { ...existing, enabled };
        }
        return existing;
      });
      return { ...prev, providers };
    });
  };

  const integrationHelperText = cfg?.enabled
    ? "Orders will automatically sync from your connected store."
    : "No automatic order syncing. You can still create orders manually.";

  const shopifyCfg = getProviderEntry(cfg, "SHOPIFY");
  const wooCfg = getProviderEntry(cfg, "WOOCOMMERCE");

  if (loading) {
    return <div className="p-6">Loading integrations...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!cfg) return null;

  const shopifyWebhookUrl = buildWebhookUrl("SHOPIFY", cfg.apiKey);
  const wooWebhookUrl = buildWebhookUrl("WOOCOMMERCE", cfg.apiKey);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-secondary">Integrations</h1>

      {/* Integration Status */}
      <section className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-gray-900">
            Integration Status
          </div>
          <p className="mt-1 text-xs text-gray-600">{integrationHelperText}</p>
        </div>
        <button
          type="button"
          onClick={() => setCfg((prev) => ({ ...prev, enabled: !prev.enabled }))}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border transition ${
            cfg.enabled
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-gray-50 border-gray-200 text-gray-600"
          }`}
        >
          <span
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
              cfg.enabled ? "bg-emerald-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                cfg.enabled ? "translate-x-4" : "translate-x-1"
              }`}
            />
          </span>
          <span>{cfg.enabled ? "ON" : "OFF"}</span>
        </button>
      </section>

      {/* Integration Key */}
      <section className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-gray-900">
              Integration Key
            </div>
            <p className="mt-1 text-xs text-gray-600">
              Keep this key secret. It secures your store integrations.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <div className="font-mono text-xs bg-gray-50 border border-gray-200 rounded px-3 py-2 break-all">
              {showKey ? cfg.apiKey || "No key" : maskKey(cfg.apiKey)}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopyKey}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-primary text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/60"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Copy Key</span>
            </button>
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              {showKey ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
              <span>{showKey ? "Hide" : "Reveal"}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowRegenConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          For Shopify, we verify webhooks automatically using Shopify&apos;s signature.
          For other platforms, your integration key is securely included in the webhook
          URL we generate for you.
        </p>
      </section>

      {/* Providers */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Shopify card */}
        <section className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Store className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Shopify (Recommended)
                </div>
                <p className="mt-0.5 text-xs text-gray-600">
                  Best experience for syncing orders from your Shopify store.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                updateProviderEnabled("SHOPIFY", !shopifyCfg.enabled)
              }
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border ${
                shopifyCfg.enabled
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-gray-50 border-gray-200 text-gray-600"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  shopifyCfg.enabled ? "bg-emerald-500" : "bg-gray-400"
                }`}
              />
              <span>{shopifyCfg.enabled ? "Enabled" : "Disabled"}</span>
            </button>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Setup steps
            </div>
            <ol className="space-y-2 text-xs text-gray-700">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                  1
                </span>
                <span>Copy the webhook URL below.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                  2
                </span>
                <span>
                  In Shopify Admin, go to
                  <span className="font-medium">
                    {" "}
                    Settings → Notifications → Webhooks
                  </span>
                  .
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                  3
                </span>
                <span>
                  Add a webhook, paste the URL, choose your order events, and
                  save.
                </span>
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700">
              Shopify webhook URL
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1">
                <div className="text-[11px] font-mono bg-gray-50 border border-gray-200 rounded px-3 py-2 break-all">
                  {shopifyWebhookUrl || "Webhook URL will appear here"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopyUrl("SHOPIFY")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-primary text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/60"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Copy URL</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700">
              Shopify store domain
            </div>
            <p className="text-[11px] text-gray-600">
              Enter your store&apos;s .myshopify.com domain (for example
              <span className="font-mono"> mystore.myshopify.com</span>). This links
              Shopify webhooks to your LahoreLink account so Integrated Orders can appear
              in your dashboard.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="text"
                value={shopifyDomain}
                onChange={(e) => setShopifyDomain(e.target.value)}
                placeholder="mystore.myshopify.com"
                className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="button"
                onClick={handleConnectShopify}
                disabled={connectingShopify}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
              >
                {connectingShopify && (
                  <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
                <span>{connectingShopify ? "Connecting..." : "Connect store"}</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowShopifyHelp((v) => !v)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-700 hover:text-gray-900"
          >
            {showShopifyHelp ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            <span>What does this integration do?</span>
          </button>

          {showShopifyHelp && (
            <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-[11px] text-gray-700 space-y-1.5">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5" />
                <p>
                  We import order details from Shopify including customer name,
                  phone, shipping address, city, COD amount (order total), item
                  titles and calculated weight.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5" />
                <p>
                  Orders are synced whenever Shopify sends a webhook for the
                  events you configure (for example when orders are created or
                  paid).
                </p>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5" />
                <p>
                  Your integration key is not needed in this URL. We securely
                  verify each webhook using Shopify&apos;s signature.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* WooCommerce card */}
        <section className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gray-50 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  WooCommerce (Optional)
                </div>
                <p className="mt-0.5 text-xs text-gray-600">
                  Use if your store is built on WooCommerce with webhook support.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                updateProviderEnabled("WOOCOMMERCE", !wooCfg.enabled)
              }
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border ${
                wooCfg.enabled
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-gray-50 border-gray-200 text-gray-600"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  wooCfg.enabled ? "bg-emerald-500" : "bg-gray-400"
                }`}
              />
              <span>{wooCfg.enabled ? "Enabled" : "Disabled"}</span>
            </button>
          </div>

          <div className="space-y-2 mt-2">
            <div className="text-xs font-medium text-gray-700">
              WooCommerce webhook URL
            </div>
            <p className="text-[11px] text-gray-600">
              Paste this URL when creating a webhook in your WooCommerce store.
              Your integration key is already included and will be validated by
              LahoreLink automatically.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1">
                <div className="text-[11px] font-mono bg-gray-50 border border-gray-200 rounded px-3 py-2 break-all">
                  {wooWebhookUrl || "Webhook URL will appear here"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopyUrl("WOOCOMMERCE")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-primary text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/60"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Copy URL</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/60"
        >
          {saving && (
            <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
          )}
          <span>{saving ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>

      {/* Regenerate confirmation modal */}
      {showRegenConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Regenerate integration key?
                </h2>
                <p className="mt-2 text-xs text-gray-600">
                  Regenerating will break existing integrations until you update
                  your Shopify and WooCommerce webhook settings with the new key.
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRegenConfirm(false)}
                disabled={regenLoading}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegenerateKey}
                disabled={regenLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                {regenLoading && (
                  <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
                <span>Regenerate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

