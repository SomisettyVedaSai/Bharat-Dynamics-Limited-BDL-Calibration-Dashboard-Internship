import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, XCircle, RefreshCw, Eye } from 'lucide-react';
import { subscribeCalibrationRecords } from '../store/calibrationStore';
import { useCalibrations } from '../hooks/useCalibrations';
import { useNavigate } from 'react-router-dom';

const CalibrationHistory = () => {
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const navigate = useNavigate();

  const { loading, error, refresh } = useCalibrations();

  useEffect(() => {
    return subscribeCalibrationRecords((next) => setRecords([...next]));
  }, []);

  const passCount = records.filter(r => r.result === 'PASS').length;
  const failCount = records.filter(r => r.result === 'FAIL').length;

  const inspectionLabels = {
    rust_status: 'Rust',
    dent_status: 'Dent',
    damage_status: 'Damage',
    surface_finish_status: 'Surface Finish'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <ClipboardList className="w-6 h-6 mr-3 text-blue-500" />
            Calibration History Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">Live record of all completed calibrations, including inspection results.</p>
        </div>
        <button onClick={() => navigate('/calibration')} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
          + New Calibration
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error} <button type="button" onClick={refresh} className="underline ml-2">Retry</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#1a1c23] p-5 rounded-2xl border border-gray-800 flex items-center justify-between">
          <div><p className="text-gray-400 text-sm mb-1">Total Records</p><p className="text-3xl font-bold text-white">{records.length}</p></div>
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
            <ClipboardList className="w-6 h-6 text-blue-400" />
          </div>
        </div>
        <div className="bg-[#1a1c23] p-5 rounded-2xl border border-gray-800 flex items-center justify-between">
          <div><p className="text-gray-400 text-sm mb-1">Passed</p><p className="text-3xl font-bold text-green-400">{passCount}</p></div>
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
            <CheckCircle className="w-6 h-6 text-green-400" />
          </div>
        </div>
        <div className="bg-[#1a1c23] p-5 rounded-2xl border border-gray-800 flex items-center justify-between">
          <div><p className="text-gray-400 text-sm mb-1">Failed</p><p className="text-3xl font-bold text-red-400">{failCount}</p></div>
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
            <XCircle className="w-6 h-6 text-red-400" />
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-[#1a1c23] rounded-2xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">All Calibration Records</h3>
          <div className="flex items-center text-gray-500 text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Auto-refreshing
          </div>
        </div>

        {records.length === 0 ? (
          <div className="py-20 text-center">
            <ClipboardList className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No calibration records yet.</p>
            <p className="text-gray-600 text-sm mt-1">Complete a calibration to see it appear here automatically.</p>
            <button onClick={() => navigate('/calibration')} className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              Start Calibration
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="bg-[#242731]/50 text-xs uppercase border-b border-gray-800">
                <tr>
                  <th className="px-5 py-4 text-gray-300 font-medium">Equipment</th>
                  <th className="px-5 py-4 text-gray-300 font-medium">Nominal / Measured</th>
                  <th className="px-5 py-4 text-gray-300 font-medium">Error</th>
                  <th className="px-5 py-4 text-gray-300 font-medium">Inspection</th>
                  <th className="px-5 py-4 text-gray-300 font-medium">Go / No-Go</th>
                  <th className="px-5 py-4 text-gray-300 font-medium">Result</th>
                  <th className="px-5 py-4 text-gray-300 font-medium">Date</th>
                  <th className="px-5 py-4 text-gray-300 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {records.map(rec => {
                  const allOk = rec.inspection && Object.values(rec.inspection).every(v => v === 'OK');
                  return (
                    <tr key={rec.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-white font-bold">{rec.equipment_no}</p>
                        <p className="text-gray-500 text-xs">{rec.serial_no}</p>
                        <p className="text-gray-500 text-xs">{rec.description_name}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-mono text-gray-300">Nom: {rec.nominal_value}</p>
                        <p className="font-mono text-gray-300">Meas: {rec.measured_value}</p>
                        <p className="font-mono text-xs text-gray-500">({rec.lower_limit?.toFixed(3)} – {rec.upper_limit?.toFixed(3)})</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`font-mono font-bold ${Math.abs(rec.error_value) <= rec.q01_tolerance ? 'text-green-400' : 'text-red-400'}`}>
                          {rec.error_value > 0 ? '+' : ''}{rec.error_value?.toFixed(3)}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">± q01: {rec.q01_tolerance}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {rec.inspection && [
                            { statusKey: 'rust_status', label: 'Rust' },
                            { statusKey: 'dent_status', label: 'Dent' },
                            { statusKey: 'damage_status', label: 'Damage' },
                            { statusKey: 'surface_finish_status', label: 'Surface Finish' }
                          ].map(({ statusKey, label }) => {
                            const val = rec.inspection[statusKey];
                            return (
                              <div key={statusKey} className="flex items-center text-xs">
                                {val === 'OK'
                                  ? <CheckCircle className="w-3 h-3 text-green-400 mr-1.5 flex-shrink-0" />
                                  : <XCircle className="w-3 h-3 text-red-400 mr-1.5 flex-shrink-0" />}
                                <span className={val === 'OK' ? 'text-green-400' : 'text-red-400'}>{label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {rec.go_size ? (
                          <div className="space-y-1 text-xs">
                            <p className="text-green-400 font-mono">Go: {rec.go_size}</p>
                            <p className="text-red-400 font-mono">No-Go: {rec.no_go_size || '—'}</p>
                          </div>
                        ) : <span className="text-gray-600 text-xs">Not recorded</span>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${rec.result === 'PASS' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {rec.result === 'PASS' ? '✅ PASS' : '❌ FAIL'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500">{rec.calibration_date}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => setSelectedRecord(rec)} className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors">
                          <Eye className="w-4 h-4 text-blue-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedRecord(null)}>
          <div className="bg-[#1a1c23] border border-gray-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedRecord.equipment_no} — {selectedRecord.description_name}</h3>
                <p className="text-gray-500 text-sm mt-1">Serial: {selectedRecord.serial_no} | {selectedRecord.calibration_date}</p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-sm font-bold border ${selectedRecord.result === 'PASS' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                {selectedRecord.result}
              </span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#242731] rounded-xl p-3"><p className="text-gray-500 text-xs mb-1">Nominal</p><p className="text-white font-mono font-bold">{selectedRecord.nominal_value}</p></div>
                <div className="bg-[#242731] rounded-xl p-3"><p className="text-gray-500 text-xs mb-1">Measured</p><p className="text-white font-mono font-bold">{selectedRecord.measured_value}</p></div>
                <div className="bg-[#242731] rounded-xl p-3"><p className="text-gray-500 text-xs mb-1">Lower Limit</p><p className="text-white font-mono font-bold">{selectedRecord.lower_limit?.toFixed(3)}</p></div>
                <div className="bg-[#242731] rounded-xl p-3"><p className="text-gray-500 text-xs mb-1">Upper Limit</p><p className="text-white font-mono font-bold">{selectedRecord.upper_limit?.toFixed(3)}</p></div>
              </div>
              <div className="bg-[#242731] rounded-xl p-4">
                <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider font-medium">Inspection Checklist</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedRecord.inspection && [
                    { statusKey: 'rust_status', descKey: 'rust_description', label: 'Rust' },
                    { statusKey: 'dent_status', descKey: 'dent_description', label: 'Dent' },
                    { statusKey: 'damage_status', descKey: 'damage_description', label: 'Damage' },
                    { statusKey: 'surface_finish_status', descKey: 'surface_finish_description', label: 'Surface Finish' }
                  ].map(({ statusKey, descKey, label }) => {
                    const status = selectedRecord.inspection[statusKey];
                    const desc = selectedRecord.inspection[descKey];
                    return (
                      <div key={statusKey} className="bg-[#1a1c23]/40 p-2.5 rounded-lg border border-gray-800">
                        <div className="flex items-center">
                          {status === 'OK'
                            ? <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                            : <XCircle className="w-4 h-4 text-red-400 mr-2 flex-shrink-0" />}
                          <span className={`text-sm font-semibold ${status === 'OK' ? 'text-green-400' : 'text-red-400'}`}>{label}</span>
                        </div>
                        {desc && (
                          <p className="text-gray-400 text-xs mt-1.5 pl-3 border-l border-gray-700 italic">
                            {desc}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {selectedRecord.go_size && (
                <div className="bg-[#242731] rounded-xl p-4 grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-gray-500 mb-1">Go Size</p><p className="text-green-400 font-mono font-bold">{selectedRecord.go_size} {selectedRecord.unit}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">No-Go Size</p><p className="text-red-400 font-mono font-bold">{selectedRecord.no_go_size || '—'} {selectedRecord.unit}</p></div>
                </div>
              )}
            </div>
            <button onClick={() => setSelectedRecord(null)} className="mt-5 w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-medium transition-colors">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalibrationHistory;






