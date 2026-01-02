import React from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import MobileStatCard from "./MobileStatCard.jsx";

const PeriodPills = ({ options, active, onChange }) => {
  if (!options || options.length === 0) return null;

  return (
    <div className="flex justify-center gap-2 mb-4 px-2 overflow-x-auto">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange?.(opt.value)}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${active === opt.value ? "bg-black text-white" : "bg-white text-gray-500 border border-gray-200"}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

const TogglePills = ({ options, value, onChange }) => {
  if (!options || options.length === 0) return null;

  return (
    <div className="bg-[#085233] rounded-lg p-1 flex text-xs font-semibold">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange?.(opt.value)}
          className={`px-3 py-1 rounded-md transition-all ${value === opt.value ? "bg-white text-[#0B6D45] shadow-sm" : "text-green-100"}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

const KpiRow = ({ kpis }) => {
  if (!kpis || kpis.length === 0) return null;

  const first = kpis[0];
  const second = kpis[1];
  const third = kpis[2];

  return (
    <div className="mb-2">
      {first?.prefix && (
        <p className="text-green-100 text-sm">
          {first.prefix} <AlertCircle className="inline w-3 h-3 ml-1" />
        </p>
      )}
      <div className="flex justify-between items-end mt-1">
        {first && (
          <div>
            <span className="text-3xl font-bold">{first.value}</span>
            <p className="text-xs text-green-100 mt-1">{first.label}</p>
          </div>
        )}
        {second && (
          <div className="text-center">
            <span className="text-2xl font-bold">{second.value}</span>
            <p className="text-xs text-green-100 mt-1">{second.label}</p>
          </div>
        )}
        {third && (
          <div className="text-center">
            <span className="text-2xl font-bold">{third.value}</span>
            <p className="text-xs text-green-100 mt-1">{third.label}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MobileDashboardShell = ({
  heroTitle,
  heroCount,
  onRefresh,
  toggles,
  kpis,
  periodOptions,
  activePeriod,
  onPeriodChange,
  statCards,
}) => {
  return (
    <div className="space-y-4 md:hidden">
      <div className="bg-[#0B6D45] p-6 rounded-b-3xl text-white shadow-lg -mx-4 -mt-4 mb-4">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold">{heroTitle}</h2>
            {typeof heroCount !== "undefined" && (
              <div className="flex items-center gap-2 mt-1 opacity-80">
                <span className="text-2xl font-bold">{heroCount}</span>
                {onRefresh && (
                  <RefreshCcw
                    className="w-4 h-4 cursor-pointer"
                    onClick={onRefresh}
                  />
                )}
              </div>
            )}
          </div>
          {toggles && (
            <TogglePills
              options={toggles.options}
              value={toggles.value}
              onChange={toggles.onChange}
            />
          )}
        </div>

        <KpiRow kpis={kpis} />
      </div>

      <PeriodPills
        options={periodOptions}
        active={activePeriod}
        onChange={onPeriodChange}
      />

      {statCards && statCards.length > 0 && (
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 px-1">
          {statCards.map((c) => (
            <MobileStatCard
              key={c.key || c.title}
              icon={c.icon}
              title={c.title}
              count={c.value}
              onClick={c.onClick}
              colorClass={c.colorClass}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileDashboardShell;
