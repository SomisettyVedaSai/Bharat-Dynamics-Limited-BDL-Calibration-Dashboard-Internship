import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Wrench, Package, TrendingUp, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import api, { getErrorMessage } from '../api/client';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-[#1a1c23] p-6 rounded-2xl border border-gray-800 flex items-center justify-between hover:border-gray-600 transition-colors">
    <div>
      <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-white">{value}</h3>
    </div>
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${colorClass}`}>
      <Icon className="w-7 h-7" />
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/analytics/dashboard');
      setStats(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleReport = async () => {
    setReportLoading(true);
    try {
      // 1. Fetch and download Excel Report
      const excelRes = await api.get('/analytics/report', { responseType: 'blob' });
      const excelUrl = URL.createObjectURL(excelRes.data);
      const aExcel = document.createElement('a');
      aExcel.href = excelUrl;
      aExcel.download = `BDL-CMS-Master-Report-${new Date().toISOString().slice(0, 10)}.xlsx`;
      aExcel.click();
      URL.revokeObjectURL(excelUrl);

      // 2. Fetch and download PDF Report
      const pdfRes = await api.get('/analytics/report-pdf', { responseType: 'blob' });
      const pdfUrl = URL.createObjectURL(pdfRes.data);
      const aPdf = document.createElement('a');
      aPdf.href = pdfUrl;
      aPdf.download = `BDL-CMS-Master-Report-${new Date().toISOString().slice(0, 10)}.pdf`;
      aPdf.click();
      URL.revokeObjectURL(pdfUrl);

    } catch (err) {
      alert('Could not generate reports: ' + getErrorMessage(err));
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mr-2" /> Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
        {error}
        <button type="button" onClick={loadStats} className="ml-3 underline">Retry</button>
      </div>
    );
  }

  const summary = stats?.summary || {};
  const charts = stats?.charts || { passFailData: [], driftData: [] };
  const alerts = stats?.alerts || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <button
          type="button"
          onClick={handleReport}
          disabled={reportLoading || !stats}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
        >
          {reportLoading ? 'Exporting...' : 'Generate Master Report'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Due Calibrations" value={summary.dueCalibrations ?? 0} icon={Clock} colorClass="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" />
        <StatCard title="Failed / Scrapped" value={summary.failedInstruments ?? 0} icon={AlertTriangle} colorClass="bg-red-500/10 text-red-500 border border-red-500/20" />
        <StatCard title="Under Calibration" value={summary.underCalibration ?? 0} icon={Wrench} colorClass="bg-blue-500/10 text-blue-500 border border-blue-500/20" />
        <StatCard title="General Store" value={summary.generalStore ?? 0} icon={Package} colorClass="bg-green-500/10 text-green-500 border border-green-500/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-[#1a1c23] p-6 rounded-2xl border border-gray-800 lg:col-span-2 min-h-[400px]">
          <h3 className="text-lg font-medium text-white mb-6">Calibration Activity (Pass vs Fail)</h3>
          <div className="h-72">
            {charts.passFailData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.passFailData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="pass" name="Passed" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fail" name="Failed" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-20">No calibration data yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1a1c23] p-6 rounded-2xl border border-gray-800">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
              Drift Analytics
            </h3>
            <div className="h-40">
              {charts.driftData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.driftData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis stroke="#64748b" fontSize={10} width={40} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="error" name="Drift Error" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">No drift records yet.</p>
              )}
            </div>
          </div>

          <div className="bg-[#1a1c23] p-6 rounded-2xl border border-gray-800">
            <h3 className="text-lg font-medium text-white mb-4">Action Required</h3>
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <p className="text-gray-500 text-sm">No failed calibrations requiring action.</p>
              ) : (
                alerts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => navigate('/cal-history')}
                    className="w-full text-left p-4 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors"
                  >
                    <p className="text-red-400 font-medium text-sm">{a.title}</p>
                    <p className="text-gray-500 text-xs mt-1">{a.subtitle}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;






