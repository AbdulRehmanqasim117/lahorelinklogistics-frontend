import React, { useEffect, useState } from 'react';
import { Clipboard } from 'lucide-react';

export default function ShipperIntegrations() {
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/integrations/shipper/me', { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load');
      setCfg(json);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const res = await fetch('/api/integrations/shipper/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ enabled: cfg.enabled, providers: cfg.providers })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to save');
      setCfg(json);
      alert('Saved');
    } catch (e) { alert(e.message); }
  };

  const regen = async () => {
    try {
      const res = await fetch('/api/integrations/shipper/me/regenerate-key', { method: 'POST', headers: { Authorization: token ? `Bearer ${token}` : '' } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to regenerate key');
      setCfg(prev => ({ ...prev, apiKey: json.apiKey }));
    } catch (e) { alert(e.message); }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(cfg.apiKey || ''); alert('API Key copied'); } catch { }
  };

  const webhookUrl = (provider) => {
    const baseUrl = 'https://jeanelle-relaxative-lera.ngrok-free.dev';
    return `${baseUrl}/api/integrations/${provider.toLowerCase()}/orders?key=${cfg.apiKey}`;
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!cfg) return null;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-secondary">Integrations</h1>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="font-semibold">Enable Integrations</div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!cfg.enabled} onChange={(e)=>setCfg(prev=>({ ...prev, enabled: e.target.checked }))} /> Enabled
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="font-semibold mb-2">API Key</div>
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <code className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm select-all w-full sm:w-auto mb-2 sm:mb-0 break-all">{cfg.apiKey}</code>
          <button onClick={copy} className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600 w-full sm:w-auto"><Clipboard className="w-4 h-4 inline" /> Copy</button>
          <button onClick={regen} className="px-3 py-1.5 text-xs bg-primary hover:bg-primary-hover text-white rounded border border-primary w-full sm:w-auto">Regenerate</button>
        </div>
        <p className="text-xs text-gray-500 mt-2">External systems must send header <code>X-LahoreLink-Integration-Key</code> with this value.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="font-semibold mb-2">Providers</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['SHOPIFY','WOOCOMMERCE','CUSTOM'].map(p => {
            const idx = (cfg.providers || []).findIndex(x => x.provider === p);
            const entry = idx >= 0 ? cfg.providers[idx] : { provider: p, enabled: false };
            const setEntry = (up) => setCfg(prev => {
              const arr = [...(prev.providers || [])];
              const i = arr.findIndex(x => x.provider === p);
              if (i >= 0) arr[i] = { ...arr[i], ...up }; else arr.push({ provider: p, ...up });
              return { ...prev, providers: arr };
            });
            return (
              <div key={p} className="border border-gray-200 rounded p-4">
                <div className="font-semibold mb-2">{p}</div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!entry.enabled} onChange={(e)=>setEntry({ enabled: e.target.checked })} /> Enabled
                </label>
                <div className="text-xs text-gray-600 mt-2">Webhook URL:</div>
                <code className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 block mt-1 break-all">{webhookUrl(p)}</code>
              </div>
            );
          })}
        </div>
        <div className="mt-4">
          <button onClick={save} className="px-3 py-1.5 text-xs bg-primary hover:bg-primary-hover text-white rounded border border-primary">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

