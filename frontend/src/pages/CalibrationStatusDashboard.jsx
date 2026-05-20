import React, { useState, useEffect } from 'react';
import { LayoutGrid, CheckCircle, XCircle, RefreshCw, Wrench, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { subscribeCalibrationRecords, getLatestByEquipment } from '../store/calibrationStore';
import { useCalibrations } from '../hooks/useCalibrations';

const INSPECTION_FIELDS = [
  { key: 'rust_status', label: 'Rust' },
  { key: 'dent_status', label: 'Dent' },
  { key: 'damage_status', label: 'Damage' },
  { key: 'surface_finish_status', label: 'Surface Finish' },
];

const StatusBadge = ({ value }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
      value === 'OK' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
    }`}
  >
    {value === 'OK' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
    {value}
  </span>
);

const CalibrationStatusDashboard = () => {
  const [equipmentStatus, setEquipmentStatus] = useState([]);
  const navigate = useNavigate();

  const { loading, error, refresh } = useCalibrations();

  useEffect(() => {
    return subscribeCalibrationRecords(() => {
      setEquipmentStatus(getLatestByEquipment());
    });
  }, []);

  const passCount = equipmentStatus.filter((r) => r.result === 'PASS').length;
  const failCount = equipmentStatus.filter((r) => r.result === 'FAIL').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <LayoutGrid className="w-6 h-6 mr-3 text-emerald-500" />
            Equipment Calibration Status
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Updates automatically when calibration is completed for an equipment number — including rust, dent, damage, surface finish, and go / no-go sizes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center text-gray-500 text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Live
          </span>
          <button
            type="button"
            onClick={() => navigate('/calibration')}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            New Calibration
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error} <button type="button" onClick={refresh} className="underline ml-2">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#1a1c23] p-5 rounded-2xl border border-gray-800">
          <p className="text-gray-400 text-sm mb-1">Equipment Calibrated</p>
          <p className="text-3xl font-bold text-white">{equipmentStatus.length}</p>
        </div>
        <div className="bg-[#1a1c23] p-5 rounded-2xl border border-green-500/20">
          <p className="text-gray-400 text-sm mb-1">Latest — Passed</p>
          <p className="text-3xl font-bold text-green-400">{passCount}</p>
        </div>
        <div className="bg-[#1a1c23] p-5 rounded-2xl border border-red-500/20">
          <p className="text-gray-400 text-sm mb-1">Latest — Failed</p>
          <p className="text-3xl font-bold text-red-400">{failCount}</p>
        </div>
      </div>

      {equipmentStatus.length === 0 ? (
        <div className="bg-[#1a1c23] rounded-2xl border border-gray-800 py-20 text-center">
          <Wrench className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No equipment calibrated yet.</p>
          <p className="text-gray-600 text-sm mt-1 max-w-md mx-auto">
            Complete a calibration for an equipment number. This dashboard will show the latest status with full inspection results.
          </p>
          <button
            type="button"
            onClick={() => navigate('/calibration')}
            className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Start Calibration
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {equipmentStatus.map((rec) => (
            <div
              key={rec.equipment_no}
              className={`bg-[#1a1c23] rounded-2xl border overflow-hidden ${
                rec.result === 'PASS' ? 'border-green-500/30' : 'border-red-500/30'
              }`}
            >
              <div
                className={`px-6 py-4 flex items-center justify-between ${
                  rec.result === 'PASS' ? 'bg-green-500/5' : 'bg-red-500/5'
                }`}
              >
                <div>
                  <p className="text-white font-bold text-lg">{rec.equipment_no}</p>
                  <p className="text-gray-400 text-sm">{rec.description_name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">S/N: {rec.serial_no}</p>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-full text-sm font-bold border ${
                    rec.result === 'PASS'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}
                >
                  {rec.result === 'PASS' ? 'PASS' : 'FAIL'}
                </span>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Physical Inspection
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {INSPECTION_FIELDS.map(({ key, label }) => (
                      <div key={key} className="bg-[#242731] rounded-xl px-3 py-2.5 flex items-center justify-between">
                        <span className="text-gray-300 text-sm">{label}</span>
                        <StatusBadge value={rec.inspection?.[key] || '—'} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Go / No-Go Gauge Sizes
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#242731] rounded-xl p-3 border border-green-500/20">
                      <p className="text-xs text-green-400 mb-1">Go Size</p>
                      <p className="text-white font-mono font-bold">
                        {rec.go_size} {rec.unit}
                      </p>
                    </div>
                    <div className="bg-[#242731] rounded-xl p-3 border border-red-500/20">
                      <p className="text-xs text-red-400 mb-1">No-Go Size</p>
                      <p className="text-white font-mono font-bold">
                        {rec.no_go_size} {rec.unit}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-800">
                  <span>
                    Nom: {rec.nominal_value} | Meas: {rec.measured_value} {rec.unit}
                  </span>
                  <span>{rec.calibration_date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalibrationStatusDashboard;




