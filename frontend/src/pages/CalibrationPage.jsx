import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calculator, CheckCircle, XCircle, AlertCircle, Save, Search, Wrench, Hash, Tag, Ruler, Loader2, Calendar, Printer, Download, ExternalLink, FileText } from 'lucide-react';
import { addCalibrationRecord } from '../store/calibrationStore';
import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage } from '../api/client';
import { assetUrl } from '../utils/format';

const CalibrationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [equipmentList, setEquipmentList] = useState([]);
  const [equipLoading, setEquipLoading] = useState(true);
  const [equipError, setEquipError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEq, setSelectedEq] = useState(null);
  const [nominal, setNominal] = useState('');
  const [measured, setMeasured] = useState('');
  const [tolerance, setTolerance] = useState('');
  const [upperLimit, setUpperLimit] = useState(null);
  const [lowerLimit, setLowerLimit] = useState(null);
  const [errorValue, setErrorValue] = useState(null);
  const [inTolerance, setInTolerance] = useState(null);
  const [withinQ01, setWithinQ01] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showCertModal, setShowCertModal] = useState(false);
  const [generatedCertificate, setGeneratedCertificate] = useState(null);

  const [inspection, setInspection] = useState({
    rust_status: 'OK',
    rust_description: '',
    dent_status: 'OK',
    dent_description: '',
    damage_status: 'OK',
    damage_description: '',
    surface_finish_status: 'OK',
    surface_finish_description: '',
  });
  const [goSize, setGoSize] = useState('');
  const [noGoSize, setNoGoSize] = useState('');
  const [currentStatus, setCurrentStatus] = useState('Active');

  useEffect(() => {
    const load = async () => {
      setEquipLoading(true);
      setEquipError('');
      try {
        const res = await api.get('/equipment');
        setEquipmentList(res.data);
      } catch (err) {
        setEquipError(getErrorMessage(err));
      } finally {
        setEquipLoading(false);
      }
    };
    load();
  }, []);

  const filteredEquipment = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return equipmentList.filter(
      (eq) =>
        eq.equipment_no?.toLowerCase().includes(q) ||
        eq.serial_no?.toLowerCase().includes(q) ||
        eq.description_name?.toLowerCase().includes(q)
    );
  }, [equipmentList, searchQuery]);

  const dueTodayOrOverdue = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return equipmentList.filter((eq) => {
      if (eq.current_status === 'Scrapped') return false;
      if (!eq.calibration_due_date) return false;
      const dueDate = new Date(eq.calibration_due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate <= today;
    });
  }, [equipmentList]);

  const isBeforeDueDate = useMemo(() => {
    if (!selectedEq || !selectedEq.calibration_due_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(selectedEq.calibration_due_date);
    dueDate.setHours(0, 0, 0, 0);
    return today < dueDate;
  }, [selectedEq]);

  useEffect(() => {
    if (searchQuery.trim().length >= 1) {
      setSearchResults(filteredEquipment);
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [searchQuery, filteredEquipment]);

  const handleSelectEquipment = (eq) => {
    setSelectedEq({ ...eq, id: eq.equipment_id });
    setSearchQuery('');
    setShowDropdown(false);
    setNominal(''); setMeasured(''); setTolerance('');
    setUpperLimit(null); setLowerLimit(null); setErrorValue(null);
    setInTolerance(null); setWithinQ01(null);
    setGoSize(''); setNoGoSize('');
    setInspection({
      rust_status: 'OK',
      rust_description: '',
      dent_status: 'OK',
      dent_description: '',
      damage_status: 'OK',
      damage_description: '',
      surface_finish_status: 'OK',
      surface_finish_description: '',
    });
    setSavedSuccess(false);
    setCurrentStatus('Active');
  };

  useEffect(() => {
    if (!selectedEq) return;
    const nom = parseFloat(nominal), meas = parseFloat(measured), tol = parseFloat(tolerance);
    const q01 = selectedEq.q01_tolerance;
    if (!isNaN(nom) && !isNaN(meas) && !isNaN(tol)) {
      const ul = nom + tol, ll = nom - tol, err = meas - nom;
      setUpperLimit(ul); setLowerLimit(ll); setErrorValue(err);
      setInTolerance(meas >= ll && meas <= ul);
      setWithinQ01(Math.abs(err) <= q01);
    } else {
      setUpperLimit(null); setLowerLimit(null); setErrorValue(null);
      setInTolerance(null); setWithinQ01(null);
    }
  }, [nominal, measured, tolerance, selectedEq]);

  const allInspectionOk = [
    inspection.rust_status,
    inspection.dent_status,
    inspection.damage_status,
    inspection.surface_finish_status
  ].every(s => s === 'OK');
  const isFinalPass = inTolerance && withinQ01 && allInspectionOk;

  useEffect(() => {
    setCurrentStatus(isFinalPass ? 'Active' : 'Failed');
  }, [isFinalPass]);

  const handleDownloadPdf = async (cert) => {
    const url = assetUrl(cert.pdf_path);
    if (!url) {
      alert('PDF path not available.');
      return;
    }
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${cert.certificate_no || 'certificate'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      window.open(url, '_blank');
    }
  };

  const handleViewPdf = (cert) => {
    const url = assetUrl(cert.pdf_path);
    if (url) window.open(url, '_blank', 'noopener');
    else alert('PDF path not available.');
  };

  const handlePrintLabel = (cert) => {
    const url = assetUrl(cert.label_path);
    if (url) window.open(url, '_blank', 'noopener');
    else alert('Label file not available.');
  };

  const resetForm = () => {
    setSelectedEq(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    setNominal('');
    setMeasured('');
    setTolerance('');
    setUpperLimit(null);
    setLowerLimit(null);
    setErrorValue(null);
    setInTolerance(null);
    setWithinQ01(null);
    setGoSize('');
    setNoGoSize('');
    setCurrentStatus('Active');
    setInspection({
      rust_status: 'OK',
      rust_description: '',
      dent_status: 'OK',
      dent_description: '',
      damage_status: 'OK',
      damage_description: '',
      surface_finish_status: 'OK',
      surface_finish_description: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!goSize.trim() || !noGoSize.trim()) {
      setSubmitError('Please enter both Go Size and No-Go Size before saving.');
      return;
    }
    setSaving(true);
    setSubmitError('');
    try {
      const res = await api.post('/calibration/with-inspection', {
        equipment_id: selectedEq.equipment_id || selectedEq.id,
        nominal_value: parseFloat(nominal),
        measured_value: parseFloat(measured),
        tolerance_value: parseFloat(tolerance),
        calibrated_by: user?.employee_no || user?.name || 'operator',
        current_status: currentStatus,
        inspection_data: {
          ...inspection,
          go_size: parseFloat(goSize),
          no_go_size: parseFloat(noGoSize),
        },
      });
      const record = {
        ...res.data.record,
        calibration_date: new Date(res.data.record.calibration_date || Date.now()).toLocaleString(),
      };
      addCalibrationRecord(record);
      
      resetForm();

      if (res.data.certificate) {
        setGeneratedCertificate({
          ...res.data.certificate,
          equipment: selectedEq
        });
        setShowCertModal(true);
      } else {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleInspectionChange = (field, value) => setInspection(prev => ({ ...prev, [field]: value }));

  const inspectionFields = [
    { statusKey: 'rust_status', descKey: 'rust_description', label: 'Rust' },
    { statusKey: 'dent_status', descKey: 'dent_description', label: 'Dent' },
    { statusKey: 'damage_status', descKey: 'damage_description', label: 'Damage' },
    { statusKey: 'surface_finish_status', descKey: 'surface_finish_description', label: 'Surface Finish' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center">
          <Calculator className="w-6 h-6 mr-3 text-blue-500" />
          Calibration Entry & Engine
        </h1>
        <p className="text-gray-400 text-sm mt-2">Search by Equipment No. or Serial No., then record calibration measurements and inspection data.</p>
      </div>

      {equipError && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{equipError}</div>}
      {submitError && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{submitError}</div>}
      {savedSuccess && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center text-green-400 font-medium">
          <CheckCircle className="w-5 h-5 mr-3" />
          Saved to database. <Link to="/cal-status" className="underline mx-1">Status</Link>
          {' '}<Link to="/cal-history" className="underline">History</Link>.
        </div>
      )}

      {/* Pending Calibrations Section */}
      <div className="bg-[#1a1c23] p-6 rounded-2xl border border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2.5 text-blue-500" />
          Calibrations Pending Today
        </h2>
        {equipLoading ? (
          <div className="flex items-center text-gray-500 text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading pending calibrations...
          </div>
        ) : dueTodayOrOverdue.length === 0 ? (
          <div className="p-5 bg-green-500/5 border border-green-500/20 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-white font-semibold text-sm">All Calibrations Up to Date</p>
              <p className="text-gray-400 text-xs mt-0.5">No equipment is currently due or overdue for calibration today.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {dueTodayOrOverdue.map((eq) => {
              const isOverdue = new Date(eq.calibration_due_date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
              return (
                <div
                  key={eq.equipment_id}
                  className="bg-[#242731]/50 border border-gray-800 hover:border-blue-500/50 rounded-xl p-4 flex items-center justify-between transition-all hover:bg-[#242731]/80"
                >
                  <div className="min-w-0 flex-1 mr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm truncate">{eq.equipment_no}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isOverdue ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      }`}>
                        {isOverdue ? 'Overdue' : 'Due Today'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs truncate mt-1">{eq.description_name}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5">
                      Due: {new Date(eq.calibration_due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectEquipment(eq)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
                  >
                    Calibrate
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: Equipment Search */}
        <div className="bg-[#1a1c23] p-6 rounded-2xl border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-5 flex items-center">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center mr-3">1</span>
            Find Equipment by No. or Serial No.
          </h3>
          <div className="relative">
            <div className="flex items-center bg-[#242731] border border-gray-600 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-colors">
              <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type Equipment No. (e.g. VC-001) or Serial No. (e.g. SRL-2024-001)..."
                className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
              />
            </div>
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-[#1f2230] border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                {searchResults.map(eq => (
                  <button key={eq.equipment_id} type="button" onClick={() => handleSelectEquipment(eq)}
                    className="w-full flex items-center px-4 py-4 hover:bg-blue-500/10 transition-colors text-left border-b border-gray-800 last:border-b-0">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                      <Wrench className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <span className="text-white font-bold text-sm">{eq.equipment_no}</span>
                        <span className="text-gray-500 text-xs">|</span>
                        <span className="text-gray-400 text-sm">{eq.serial_no}</span>
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">{eq.description_name} • {eq.equipment_type}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 border ${eq.current_status === 'Active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>{eq.current_status}</span>
                  </button>
                ))}
              </div>
            )}
            {equipLoading && (
              <p className="text-gray-500 text-sm mt-2 flex items-center"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading equipment...</p>
            )}
            {showDropdown && !equipLoading && searchResults.length === 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-[#1f2230] border border-gray-700 rounded-xl shadow-xl px-4 py-6 text-center">
                <p className="text-gray-400 text-sm">No equipment found for "{searchQuery}"</p>
              </div>
            )}
          </div>

          {selectedEq ? (
            <div className="mt-5 p-5 bg-blue-500/5 border border-blue-500/20 rounded-xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center mr-4">
                    <Wrench className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">{selectedEq.description_name}</h4>
                    <p className="text-blue-400 text-sm font-medium">{selectedEq.equipment_type}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedEq(null)} className="text-gray-500 hover:text-gray-300 text-xs underline">Change</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#242731] rounded-xl p-3">
                  <div className="flex items-center mb-1"><Tag className="w-3.5 h-3.5 text-blue-400 mr-1.5" /><p className="text-xs text-gray-500 uppercase tracking-wider">Equip. No.</p></div>
                  <p className="text-white font-bold text-base">{selectedEq.equipment_no}</p>
                </div>
                <div className="bg-[#242731] rounded-xl p-3">
                  <div className="flex items-center mb-1"><Hash className="w-3.5 h-3.5 text-purple-400 mr-1.5" /><p className="text-xs text-gray-500 uppercase tracking-wider">Serial No.</p></div>
                  <p className="text-white font-bold text-base">{selectedEq.serial_no}</p>
                </div>
                <div className="bg-[#242731] rounded-xl p-3">
                  <div className="flex items-center mb-1"><Ruler className="w-3.5 h-3.5 text-green-400 mr-1.5" /><p className="text-xs text-gray-500 uppercase tracking-wider">Range</p></div>
                  <p className="text-white font-bold text-base">{selectedEq.range_min}–{selectedEq.range_max} {selectedEq.unit}</p>
                </div>
                <div className="bg-[#242731] rounded-xl p-3">
                  <div className="flex items-center mb-1"><Calculator className="w-3.5 h-3.5 text-yellow-400 mr-1.5" /><p className="text-xs text-gray-500 uppercase tracking-wider">± q01 Tolerance</p></div>
                  <p className="text-yellow-400 font-bold text-base">± {selectedEq.q01_tolerance} {selectedEq.unit}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="bg-[#242731] rounded-xl p-3 flex items-center"><p className="text-xs text-gray-500 mr-2">Least Count:</p><p className="text-gray-200 font-medium text-sm">{selectedEq.least_count} {selectedEq.unit}</p></div>
                <div className="bg-[#242731] rounded-xl p-3 flex items-center"><p className="text-xs text-gray-500 mr-2">Accuracy:</p><p className="text-gray-200 font-medium text-sm">± {selectedEq.accuracy} {selectedEq.unit}</p></div>
              </div>
              {isBeforeDueDate && (
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-500" />
                  <div>
                    <p className="font-bold">Early Calibration Warning</p>
                    <p className="text-gray-300 mt-1">
                      This equipment is not yet due for calibration. You can proceed with an early calibration if needed. Next scheduled calibration is on{' '}
                      <span className="text-yellow-400 font-bold">
                        {new Date(selectedEq.calibration_due_date).toLocaleDateString()}
                      </span>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-5 p-5 border-2 border-dashed border-gray-700 rounded-xl text-center">
              <Wrench className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No equipment selected. Search above to find and load instrument details.</p>
            </div>
          )}
        </div>

        {/* STEP 2: Measurements */}
        {selectedEq && (
          <div className="bg-[#1a1c23] p-6 rounded-2xl border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-5 flex items-center">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center mr-3">2</span>
              Calibration Measurements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nominal Value <span className="text-gray-500">({selectedEq.unit})</span></label>
                <input type="number" step="0.001" value={nominal} onChange={(e) => setNominal(e.target.value)} placeholder="e.g. 10.000" className="w-full bg-[#242731] text-white border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Measured Value <span className="text-gray-500">({selectedEq.unit})</span></label>
                <input type="number" step="0.001" value={measured} onChange={(e) => setMeasured(e.target.value)} placeholder="e.g. 10.008" className="w-full bg-[#242731] text-white border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tolerance (±) <span className="text-gray-500">({selectedEq.unit})</span></label>
                <input type="number" step="0.001" value={tolerance} onChange={(e) => setTolerance(e.target.value)} placeholder="e.g. 0.02" className="w-full bg-[#242731] text-white border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500" required />
              </div>
            </div>
            {upperLimit !== null && (
              <div className="mt-6 p-5 bg-[#242731] rounded-xl border border-gray-700">
                <h4 className="text-xs font-bold text-gray-400 tracking-widest mb-4">⚡ Live Engine Calculations</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#1a1c23] rounded-lg p-3"><p className="text-xs text-gray-500 mb-1">Lower Limit</p><p className="text-lg font-mono font-bold text-gray-200">{lowerLimit.toFixed(3)}</p></div>
                  <div className="bg-[#1a1c23] rounded-lg p-3"><p className="text-xs text-gray-500 mb-1">Upper Limit</p><p className="text-lg font-mono font-bold text-gray-200">{upperLimit.toFixed(3)}</p></div>
                  <div className="bg-[#1a1c23] rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Error (Meas − Nom)</p>
                    <p className={`text-lg font-mono font-bold ${withinQ01 ? 'text-green-400' : 'text-red-400'}`}>{errorValue > 0 ? '+' : ''}{errorValue.toFixed(3)}</p>
                    <p className={`text-xs mt-1 ${withinQ01 ? 'text-green-500' : 'text-red-500'}`}>{withinQ01 ? `Within ±${selectedEq.q01_tolerance}` : `Exceeds ±${selectedEq.q01_tolerance} q01`}</p>
                  </div>
                  <div className="bg-[#1a1c23] rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Limit Check</p>
                    <div className="flex items-center mt-1">
                      {inTolerance ? <CheckCircle className="w-5 h-5 text-green-500 mr-2" /> : <XCircle className="w-5 h-5 text-red-500 mr-2" />}
                      <span className={`text-sm font-bold ${inTolerance ? 'text-green-400' : 'text-red-400'}`}>{inTolerance ? 'IN TOLERANCE' : 'OUT OF TOLERANCE'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Full Inspection Checklist */}
        {selectedEq && (
          <div className="bg-[#1a1c23] p-6 rounded-2xl border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-5 flex items-center">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center mr-3">3</span>
              Physical Inspection Checklist
            </h3>

            {/* OK / NOT OK toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              {inspectionFields.map(({ statusKey, descKey, label }) => (
                <div key={statusKey} className="flex flex-col justify-between h-full bg-[#242731]/30 p-4 rounded-xl border border-gray-800/80">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">{label}</label>
                    <div className="flex space-x-2">
                      <button type="button" onClick={() => handleInspectionChange(statusKey, 'OK')}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${inspection[statusKey] === 'OK' ? 'bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-[#242731] border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                        ✓ OK
                      </button>
                      <button type="button" onClick={() => handleInspectionChange(statusKey, 'NOT OK')}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${inspection[statusKey] === 'NOT OK' ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.15)]' : 'bg-[#242731] border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                        ✗ FAIL
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <input
                      type="text"
                      value={inspection[descKey] || ''}
                      onChange={(e) => handleInspectionChange(descKey, e.target.value)}
                      placeholder={`Enter ${label.toLowerCase()} details...`}
                      className="w-full bg-[#1c1e27] text-white border border-gray-700/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 placeholder-gray-600 transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Go Size / No Go Size */}
            <div className="border-t border-gray-800 pt-6">
              <p className="text-sm font-semibold text-gray-300 mb-4">Go / No-Go Gauge Sizes <span className="text-gray-500 font-normal">({selectedEq.unit})</span></p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-green-400 mb-2">✓ Go Size</label>
                  <input type="number" step="0.001" value={goSize} onChange={(e) => setGoSize(e.target.value)}
                    placeholder={`Enter Go gauge size in ${selectedEq.unit}...`}
                    className="w-full bg-[#242731] text-white border border-green-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 placeholder-gray-600"
                    required />
                  <p className="text-xs text-gray-500 mt-1">The maximum acceptable dimension (part must fit).</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-400 mb-2">✗ No-Go Size</label>
                  <input type="number" step="0.001" value={noGoSize} onChange={(e) => setNoGoSize(e.target.value)}
                    placeholder={`Enter No-Go gauge size in ${selectedEq.unit}...`}
                    className="w-full bg-[#242731] text-white border border-red-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 placeholder-gray-600"
                    required />
                  <p className="text-xs text-gray-500 mt-1">The minimum reject dimension (part must NOT fit).</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Final Result */}
        {selectedEq && upperLimit !== null && (
          <div className={`p-6 rounded-2xl border ${isFinalPass ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'} flex flex-col md:flex-row items-center justify-between gap-6`}>
            <div className="flex items-start flex-1">
              {isFinalPass ? <CheckCircle className="w-12 h-12 text-green-500 mr-4 flex-shrink-0" /> : <AlertCircle className="w-12 h-12 text-red-500 mr-4 flex-shrink-0" />}
              <div>
                <h2 className={`text-2xl font-bold ${isFinalPass ? 'text-green-500' : 'text-red-500'}`}>
                  {isFinalPass ? '✅ CALIBRATION PASSED' : '❌ CALIBRATION FAILED'}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {!inTolerance ? '• Out of mathematical tolerance limits. ' : ''}
                  {!withinQ01 ? `• Error exceeded ±${selectedEq.q01_tolerance} q01. ` : ''}
                  {!allInspectionOk ? '• Physical inspection check failed.' : ''}
                  {isFinalPass ? 'All parameters are within specification.' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 w-full md:w-auto">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-400 mb-1.5">Equipment Status</label>
                <select 
                  value={currentStatus} 
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  className="bg-[#242731] text-white border border-gray-700/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 min-w-[180px]"
                >
                  <option value="Active">Active</option>
                  <option value="General Store">General Store</option>
                  <option value="Under Calibration">Under Calibration</option>
                  <option value="Failed">Failed</option>
                  <option value="Scrapped">Scrapped</option>
                </select>
              </div>

              <button type="submit" disabled={saving}
                className={`flex items-center justify-center px-8 py-4 rounded-xl font-bold text-white transition-colors disabled:opacity-50 ${isFinalPass ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                {saving ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Success & Certificate Generator Modal */}
      {showCertModal && generatedCertificate && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1c23] border border-gray-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => {
                setShowCertModal(false);
                setGeneratedCertificate(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold transition-colors"
            >
              &times;
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">Calibration Passed!</h2>
              <p className="text-gray-400 text-sm mt-1">A professional A4 calibration certificate has been generated.</p>
            </div>

            <div className="bg-[#242731]/50 border border-gray-800 rounded-2xl p-5 my-6 space-y-3">
              <div className="flex justify-between border-b border-gray-800/80 pb-2">
                <span className="text-gray-400 text-sm">Certificate No</span>
                <span className="text-blue-400 font-mono font-bold text-sm">{generatedCertificate.certificate_no}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800/80 pb-2">
                <span className="text-gray-400 text-sm">Equipment No</span>
                <span className="text-white font-bold text-sm">{generatedCertificate.equipment?.equipment_no}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800/80 pb-2">
                <span className="text-gray-400 text-sm">Description</span>
                <span className="text-gray-200 text-sm max-w-[200px] truncate">{generatedCertificate.equipment?.description_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Result</span>
                <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-bold text-xs">PASS</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleDownloadPdf(generatedCertificate)}
                className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg"
              >
                <Download className="w-4 h-4 mr-2" /> Download PDF Certificate
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleViewPdf(generatedCertificate)}
                  className="flex items-center justify-center px-4 py-2.5 bg-[#242731] hover:bg-gray-700 text-white rounded-xl text-sm border border-gray-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> View PDF
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintLabel(generatedCertificate)}
                  className="flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-colors"
                >
                  <Printer className="w-4 h-4 mr-2" /> Print Label
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowCertModal(false);
                  setGeneratedCertificate(null);
                  navigate('/certificates');
                }}
                className="w-full text-center text-gray-400 hover:text-white text-sm font-semibold underline pt-2 block transition-colors"
              >
                Go to Certificates Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalibrationPage;







