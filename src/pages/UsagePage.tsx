import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Users, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getRelyingParties, getUsageSummary } from '../lib/api';
import type { RelyingPartySummary, UsageSummary } from '../types/api';
import { Button } from '../components/Button';

interface ChartDataPoint {
  month: string;
  monthLabel: string;
  mau: number;
  logins: number;
  retention?: number;
  activeRecently?: number;
}

export const UsagePage: React.FC = () => {
  const [relyingParties, setRelyingParties] = useState<RelyingPartySummary[]>([]);
  const [selectedRpId, setSelectedRpId] = useState<string>('ALL');
  const [timeWindow, setTimeWindow] = useState<number>(12);
  const [loading, setLoading] = useState(true);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<ChartDataPoint[]>([]);
  const [rawUsage, setRawUsage] = useState<UsageSummary | null>(null);

  // Load RP list on mount
  useEffect(() => {
    const loadRPs = async () => {
      setLoading(true);
      try {
        const data = await getRelyingParties();
        setRelyingParties(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load relying parties:', err);
        setError('Failed to load relying parties');
      } finally {
        setLoading(false);
      }
    };
    loadRPs();
  }, []);

  // Load usage data when RP or time window changes
  useEffect(() => {
    const loadUsage = async () => {
      setLoadingUsage(true);
      setError(null);
      try {
        const data = await getUsageSummary(selectedRpId, timeWindow);
        setRawUsage(data);
        
        // Transform parallel arrays into chart data
        const chartData: ChartDataPoint[] = data.months.map((month, index) => ({
          month,
          monthLabel: formatMonthLabel(month),
          mau: data.mau[index] || 0,
          logins: data.logins[index] || 0,
          retention: data.retention?.[index],
          activeRecently: data.activeRecently?.[index],
        }));
        
        setUsageData(chartData);
      } catch (err) {
        console.error('Failed to load usage data:', err);
        setError('Failed to load usage data. The backend API may not be implemented yet.');
        setUsageData([]);
        setRawUsage(null);
      } finally {
        setLoadingUsage(false);
      }
    };

    if (!loading) {
      loadUsage();
    }
  }, [selectedRpId, timeWindow, loading]);

  const formatMonthLabel = (monthStr: string): string => {
    try {
      const date = new Date(monthStr);
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    } catch {
      return monthStr;
    }
  };

  const handleRefresh = () => {
    setLoadingUsage(true);
    // Trigger reload by updating a key (force useEffect re-run)
    const loadUsage = async () => {
      try {
        const data = await getUsageSummary(selectedRpId, timeWindow);
        setRawUsage(data);
        const chartData: ChartDataPoint[] = data.months.map((month, index) => ({
          month,
          monthLabel: formatMonthLabel(month),
          mau: data.mau[index] || 0,
          logins: data.logins[index] || 0,
          retention: data.retention?.[index],
          activeRecently: data.activeRecently?.[index],
        }));
        setUsageData(chartData);
        setError(null);
      } catch (err) {
        console.error('Failed to refresh usage data:', err);
        setError('Failed to refresh usage data');
      } finally {
        setLoadingUsage(false);
      }
    };
    loadUsage();
  };

  // Calculate KPIs from latest month
  const latestMonthMau = usageData.length > 0 ? usageData[usageData.length - 1].mau : 0;
  const latestMonthLogins = usageData.length > 0 ? usageData[usageData.length - 1].logins : 0;
  const latestMonthRetention = usageData.length > 0 ? usageData[usageData.length - 1].retention : undefined;

  const selectedRpName = selectedRpId === 'ALL' 
    ? 'All RPs' 
    : relyingParties.find(rp => rp.id === selectedRpId)?.name || 'Unknown';

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-mono font-bold text-gray-900">Usage</h1>
        <div className="font-mono text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-3xl font-mono font-bold text-gray-900">Usage</h1>

      {/* Controls Row */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1">
          <label className="block text-sm font-mono font-medium text-gray-700 mb-1">
            Relying Party
          </label>
          <select
            value={selectedRpId}
            onChange={(e) => setSelectedRpId(e.target.value)}
            className="w-full px-3 py-2 font-mono text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="ALL">All</option>
            {relyingParties.map((rp) => (
              <option key={rp.id} value={rp.id}>
                {rp.name} ({rp.rpId})
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-mono font-medium text-gray-700 mb-1">
            Time Window
          </label>
          <select
            value={timeWindow}
            onChange={(e) => setTimeWindow(Number(e.target.value))}
            className="w-full px-3 py-2 font-mono text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
            <option value={24}>Last 24 months</option>
          </select>
        </div>

        <div className="pt-6">
          <Button
            onClick={handleRefresh}
            disabled={loadingUsage}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={loadingUsage ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="font-mono text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-sm text-gray-600">Latest Month MAU</p>
            <Users size={20} className="text-gray-400" />
          </div>
          <p className="text-3xl font-mono font-bold text-gray-900">
            {loadingUsage ? '...' : latestMonthMau.toLocaleString()}
          </p>
          <p className="font-mono text-xs text-gray-500 mt-1">{selectedRpName}</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-sm text-gray-600">Latest Month Logins</p>
            <Activity size={20} className="text-gray-400" />
          </div>
          <p className="text-3xl font-mono font-bold text-gray-900">
            {loadingUsage ? '...' : latestMonthLogins.toLocaleString()}
          </p>
          <p className="font-mono text-xs text-gray-500 mt-1">{selectedRpName}</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-sm text-gray-600">Latest Month Retention</p>
            <TrendingUp size={20} className="text-gray-400" />
          </div>
          <p className="text-3xl font-mono font-bold text-gray-900">
            {loadingUsage 
              ? '...' 
              : latestMonthRetention !== undefined 
                ? `${latestMonthRetention.toFixed(1)}%` 
                : 'N/A'}
          </p>
          <p className="font-mono text-xs text-gray-500 mt-1">{selectedRpName}</p>
        </div>
      </div>

      {/* Loading State for Charts */}
      {loadingUsage && (
        <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
          <p className="font-mono text-gray-600">Loading usage data...</p>
        </div>
      )}

      {/* Empty State */}
      {!loadingUsage && !error && usageData.length === 0 && (
        <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
          <p className="font-mono text-gray-600">No usage data available for the selected period</p>
        </div>
      )}

      {/* Charts */}
      {!loadingUsage && !error && usageData.length > 0 && (
        <>
          {/* Chart A: MAU */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-mono font-bold text-gray-900 mb-4">
              Monthly Active Users (MAU)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="monthLabel" 
                  tick={{ fontSize: 12, fontFamily: 'monospace' }}
                />
                <YAxis tick={{ fontSize: 12, fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ fontFamily: 'monospace', fontSize: 12 }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 12 }} />
                <Line 
                  type="monotone" 
                  dataKey="mau" 
                  stroke="#1f2937" 
                  strokeWidth={2}
                  name="MAU"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart B: Monthly Logins */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-mono font-bold text-gray-900 mb-4">
              Monthly Logins
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="monthLabel" 
                  tick={{ fontSize: 12, fontFamily: 'monospace' }}
                />
                <YAxis tick={{ fontSize: 12, fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ fontFamily: 'monospace', fontSize: 12 }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 12 }} />
                <Line 
                  type="monotone" 
                  dataKey="logins" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Logins"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart C: Retention (if available) */}
          {rawUsage?.retention && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-mono font-bold text-gray-900 mb-4">
                Retention (prev month → this month)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="monthLabel" 
                    tick={{ fontSize: 12, fontFamily: 'monospace' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fontFamily: 'monospace' }}
                    label={{ value: '%', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ fontFamily: 'monospace', fontSize: 12 }}
                    labelStyle={{ fontWeight: 'bold' }}
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 12 }} />
                  <Line 
                    type="monotone" 
                    dataKey="retention" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Retention %"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Chart D: Active Recently (if available) */}
          {rawUsage?.activeRecently && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-mono font-bold text-gray-900 mb-4">
                Active Recently
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="monthLabel" 
                    tick={{ fontSize: 12, fontFamily: 'monospace' }}
                  />
                  <YAxis tick={{ fontSize: 12, fontFamily: 'monospace' }} />
                  <Tooltip 
                    contentStyle={{ fontFamily: 'monospace', fontSize: 12 }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 12 }} />
                  <Line 
                    type="monotone" 
                    dataKey="activeRecently" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Active Recently"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
};
