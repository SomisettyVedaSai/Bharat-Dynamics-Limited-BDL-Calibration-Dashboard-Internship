import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, Filter, X, Loader2, ChevronLeft, Gauge, Wrench, Calendar, Camera } from 'lucide-react';
import api, { getErrorMessage } from '../api/client';

const STATUS_OPTIONS = ['Active', 'Due', 'Under Calibration', 'General Store', 'Failed', 'Scrapped'];

const GAUGE_TYPES = ['Plug Gauge', 'Ring Gauge', 'Snap Gauge', 'Thread Gauge', 'Radius Gauge', 'Feeler Gauge', 'Taper Gauge', 'Pin Gauge', 'Gap Gauge', 'Other'];
const INSTRUMENT_TYPES = ['Vernier Caliper', 'Micrometer', 'Dial Gauge', 'Height Gauge', 'Bore Gauge', 'Depth Gauge', 'Pressure Gauge', 'Thermometer', 'Torque Wrench', 'CMM Probe', 'Other'];

const today = () => new Date().toISOString().split('T')[0];

/** Compute due date string from start + period */
function computeDueDate(startStr, value, unit) {
  if (!startStr || !value) return '';
  const d = new Date(startStr);
  const v = Number(value) || 0;
  if (unit === 'Months') d.setMonth(d.getMonth() + v);
  else if (unit === 'Years') d.setFullYear(d.getFullYear() + v);
  else d.setDate(d.getDate() + v);
  return d.toISOString().split('T')[0];
}

const emptyGaugeForm = () => ({
  equipment_no: '', description_name: '', serial_no: '',
  equipment_type: 'Plug Gauge',
  range_min: '', range_max: '', unit: 'mm',
  q01_tolerance: '0.01', accuracy: '', deviation_allowed: '',
  periodicity_value: '365', periodicity_unit: 'Days', current_status: 'Active',
  calibration_start_date: today(),
  maintenance_plan: '', plant_location: '', storage_location: '', technical_no: '',
  plant_name: '', place: '', pincode: '', manufacturer_no: '',
  employee_id: '', employee_name: '', qr_code_scanned: ''
});

const emptyInstrumentForm = () => ({
  equipment_no: '', description_name: '', serial_no: '',
  equipment_type: 'Vernier Caliper',
  range_min: '', range_max: '', unit: 'mm',
  accuracy: '', least_count: '', q01_tolerance: '0.01',
  periodicity_value: '365', periodicity_unit: 'Days', current_status: 'Active',
  calibration_start_date: today(),
  maintenance_plan: '', plant_location: '', storage_location: '', technical_no: '',
  plant_name: '', place: '', pincode: '', manufacturer_no: '',
  employee_id: '', employee_name: '', qr_code_scanned: ''
});

const EquipmentPage = () => {
  const [searchParams] = useSearchParams();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState('Instrument'); // 'Gauge' | 'Instrument'
  const [form, setForm] = useState(emptyInstrumentForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startQRScanner = async () => {
    setShowScanner(true);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera access denied or not available", err);
    }
  };

  const stopQRScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowScanner(false);
  };

  const simulateQRScan = () => {
    setForm(p => ({
      ...p,
      employee_id: 'EMP-001',
      employee_name: 'Admin User',
      qr_code_scanned: 'QR_SCANNED_EMP_001_VALID'
    }));
    stopQRScanner();
  };

  const fetchEquipment = async () => {
    setLoading(true); setError('');
    try { const res = await api.get('/equipment'); setEquipment(res.data); }
    catch (err) { setError('Could not load equipment. Make sure the backend is running.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEquipment(); }, []);
  useEffect(() => { const q = searchParams.get('search'); if (q) setSearchQuery(q); }, [searchParams]);

  const openAdd = () => {
    setEditId(null); setCategory('Instrument');
    setForm(emptyInstrumentForm()); setError(''); setShowModal(true);
  };

  const handleEdit = (item) => {
    const isGauge = GAUGE_TYPES.includes(item.equipment_type);
    setCategory(isGauge ? 'Gauge' : 'Instrument');
    setForm({
      equipment_no: item.equipment_no || '', description_name: item.description_name || '',
      serial_no: item.serial_no || '', equipment_type: item.equipment_type || '',
      range_min: item.range_min ?? '', range_max: item.range_max ?? '',
      unit: item.unit || 'mm', accuracy: item.accuracy ?? '', least_count: item.least_count ?? '',
      q01_tolerance: item.q01_tolerance ?? '0.01', deviation_allowed: item.deviation_allowed ?? '',
      periodicity_value: item.periodicity_value || '365', periodicity_unit: item.periodicity_unit || 'Days',
      current_status: item.current_status || 'Active',
      calibration_start_date: item.calibration_start_date ? new Date(item.calibration_start_date).toISOString().split('T')[0] : today(),
      maintenance_plan: item.maintenance_plan || '',
      plant_location: item.plant_location || '',
      storage_location: item.storage_location || '',
      technical_no: item.technical_no || '',
      plant_name: item.plant_name || '',
      place: item.place || '',
      pincode: item.pincode || '',
      manufacturer_no: item.manufacturer_no || '',
      employee_id: item.employee_id || '',
      employee_name: item.employee_name || '',
      qr_code_scanned: item.qr_code_scanned || '',
    });
    setEditId(item.equipment_id); setError(''); setShowModal(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete ${item.equipment_no}? This cannot be undone.`)) return;
    try { await api.delete(`/equipment/${item.equipment_id}`); setEquipment(p => p.filter(e => e.equipment_id !== item.equipment_id)); }
    catch (err) { setError(getErrorMessage(err)); }
  };

  const handleFormChange = (e) => { const { name, value } = e.target; setForm(p => ({ ...p, [name]: value })); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = {
        equipment_no: form.equipment_no.trim(), equipment_type: form.equipment_type.trim(),
        description_name: form.description_name.trim(), serial_no: form.serial_no.trim() || null,
        range_min: parseFloat(form.range_min), range_max: parseFloat(form.range_max),
        unit: form.unit.trim(), accuracy: form.accuracy ? parseFloat(form.accuracy) : null,
        least_count: form.least_count ? parseFloat(form.least_count) : null,
        deviation_allowed: form.deviation_allowed ? parseFloat(form.deviation_allowed) : null,
        q01_tolerance: parseFloat(form.q01_tolerance) || 0.01,
        periodicity_value: parseInt(form.periodicity_value, 10) || 365,
        periodicity_unit: form.periodicity_unit, current_status: form.current_status,
        calibration_start_date: form.calibration_start_date || today(),
        maintenance_plan: form.maintenance_plan?.trim() || null,
        plant_location: form.plant_location?.trim() || null,
        storage_location: form.storage_location?.trim() || null,
        technical_no: form.technical_no?.trim() || null,
        plant_name: form.plant_name?.trim() || null,
        place: form.place?.trim() || null,
        pincode: form.pincode?.trim() || null,
        manufacturer_no: form.manufacturer_no?.trim() || null,
        employee_id: form.employee_id?.trim() || null,
        employee_name: form.employee_name?.trim() || null,
        qr_code_scanned: form.qr_code_scanned || null,
      };
      if (editId) {
        const res = await api.put(`/equipment/${editId}`, payload);
        setEquipment(p => p.map(i => i.equipment_id === editId ? res.data : i));
      } else {
        const res = await api.post('/equipment', payload);
        setEquipment(p => [res.data, ...p]);
      }
      setShowModal(false); setEditId(null);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to save';
      setError(/unique|already exists/i.test(msg) ? 'Equipment number already exists.' : msg);
    } finally { setSaving(false); }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return equipment;
    return equipment.filter(i =>
      i.equipment_no?.toLowerCase().includes(q) ||
      i.description_name?.toLowerCase().includes(q) ||
      i.serial_no?.toLowerCase().includes(q)
    );
  }, [equipment, searchQuery]);

  const closeModal = () => { if (!saving) { setShowModal(false); setEditId(null); } };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipment Master</h1>
          <p className="text-gray-400 text-sm mt-1">Manage all gauges and measuring instruments</p>
        </div>
        <button type="button" onClick={openAdd}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
          <Plus className="w-5 h-5 mr-2" /> Add Equipment
        </button>
      </div>

      {error && !showModal && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}<button type="button" onClick={fetchEquipment} className="ml-3 underline">Retry</button>
        </div>
      )}

      <div className="bg-[#1a1c23] rounded-2xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Search className="w-5 h-5 text-gray-500" /></span>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#242731] text-gray-300 border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500"
              placeholder="Search by ID, Name, or Serial No..." />
          </div>
          <button type="button" onClick={fetchEquipment}
            className="flex items-center px-4 py-2 bg-[#242731] hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg font-medium">
            <Filter className="w-5 h-5 mr-2" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading equipment...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-[#242731]/50 text-xs uppercase border-b border-gray-800">
                <tr>
                  {['Equip. No', 'Name & Type', 'Category', 'Serial No.', 'Range / Size', 'Status', 'Schedule', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-4 font-medium text-gray-300">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map(item => {
                  const isGauge = GAUGE_TYPES.includes(item.equipment_type);
                  return (
                    <tr key={item.equipment_id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{item.equipment_no}</td>
                      <td className="px-6 py-4">
                        <p className="text-gray-200">{item.description_name}</p>
                        <p className="text-xs text-gray-500">{item.equipment_type}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${isGauge ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}`}>
                          {isGauge ? '⬡ Gauge' : '⊞ Instrument'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{item.serial_no || '—'}</td>
                      <td className="px-6 py-4">
                        {isGauge
                          ? <><span className="text-green-400 text-xs">Go: </span>{item.range_min} / <span className="text-red-400 text-xs">No-Go: </span>{item.range_max} {item.unit}</>
                          : <>{item.range_min} – {item.range_max} {item.unit}</>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          item.current_status === 'Active' ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : item.current_status === 'Due' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          : item.current_status === 'General Store' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                          {item.current_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {item.calibration_start_date ? (
                          <div className="space-y-1">
                            <p className="text-gray-400"><span className="text-gray-600 font-medium">Start: </span>{new Date(item.calibration_start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                            <p className="text-blue-400 font-medium"><span className="text-gray-600 font-medium">Due: </span>{item.calibration_due_date ? new Date(item.calibration_due_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</p>
                          </div>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button type="button" onClick={() => handleEdit(item)}
                          className="px-3 py-1 text-xs text-blue-400 hover:bg-blue-500/10 border border-blue-500/30 rounded-lg">Edit</button>
                        <button type="button" onClick={() => handleDelete(item)}
                          className="px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded-lg">Delete</button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No equipment found. Click Add Equipment to register your first instrument.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-[#1a1c23] border border-gray-700 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {editId ? 'Edit Equipment' : `Add New ${category}`}
                  </h2>
                  {!editId && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Fill in the {category.toLowerCase()} details below
                    </p>
                  )}
                </div>
              </div>
              <button type="button" onClick={closeModal} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Switcher Tabs */}
            {!editId && (
              <div className="flex bg-[#242731] p-1.5 rounded-xl border border-gray-700/50 gap-1 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setCategory('Instrument');
                    setForm(p => ({
                      ...emptyInstrumentForm(),
                      equipment_no: p.equipment_no,
                      serial_no: p.serial_no,
                      description_name: p.description_name
                    }));
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    category === 'Instrument'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Wrench className="w-4.5 h-4.5" />
                  Instrument
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCategory('Gauge');
                    setForm(p => ({
                      ...emptyGaugeForm(),
                      equipment_no: p.equipment_no,
                      serial_no: p.serial_no,
                      description_name: p.description_name
                    }));
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    category === 'Gauge'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Gauge className="w-4.5 h-4.5" />
                  Gauge
                </button>
              </div>
            )}

            {/* Form */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Common top fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label={`${category === 'Gauge' ? 'Gauge' : 'Equipment'} No. *`} name="equipment_no" value={form.equipment_no} onChange={handleFormChange} placeholder={category === 'Gauge' ? 'e.g. PG-001' : 'e.g. VC-001'} required />
                    <Field label="Serial No." name="serial_no" value={form.serial_no} onChange={handleFormChange} placeholder="e.g. SRL-2024-001" />
                    <div className="sm:col-span-2">
                      <Field label="Description / Name *" name="description_name" value={form.description_name} onChange={handleFormChange} placeholder={category === 'Gauge' ? 'e.g. 25mm Plug Gauge' : 'e.g. Digital Vernier Caliper'} required />
                    </div>

                    {/* Type dropdown */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {category === 'Gauge' ? 'Gauge Type *' : 'Instrument Type *'}
                      </label>
                      <select name="equipment_type" value={form.equipment_type} onChange={handleFormChange}
                        className="w-full bg-[#242731] text-white border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500" required>
                        {(category === 'Gauge' ? GAUGE_TYPES : INSTRUMENT_TYPES).map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <hr className="border-gray-800" />

                  {/* Gauge-specific fields */}
                  {category === 'Gauge' && (
                    <>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Go / No-Go Sizes</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="✓ Go Size (min. acceptable) *" name="range_min" type="number" step="0.001"
                          value={form.range_min} onChange={handleFormChange} placeholder="e.g. 25.000" required
                          accent="green" />
                        <Field label="✗ No-Go Size (reject dimension) *" name="range_max" type="number" step="0.001"
                          value={form.range_max} onChange={handleFormChange} placeholder="e.g. 25.021" required
                          accent="red" />
                        <Field label="Unit *" name="unit" value={form.unit} onChange={handleFormChange} placeholder="mm" required />
                        <Field label="Tolerance Grade / Deviation Allowed" name="deviation_allowed" type="number" step="0.001"
                          value={form.deviation_allowed} onChange={handleFormChange} placeholder="e.g. 0.021" />
                        <Field label="± q01 Tolerance" name="q01_tolerance" type="number" step="0.001"
                          value={form.q01_tolerance} onChange={handleFormChange} />
                        <Field label="Accuracy" name="accuracy" type="number" step="0.001"
                          value={form.accuracy} onChange={handleFormChange} placeholder="e.g. 0.005" />
                      </div>
                    </>
                  )}

                  {/* Instrument-specific fields */}
                  {category === 'Instrument' && (
                    <>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Measurement Range</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Range Min *" name="range_min" type="number" step="0.001"
                          value={form.range_min} onChange={handleFormChange} placeholder="e.g. 0" required />
                        <Field label="Range Max *" name="range_max" type="number" step="0.001"
                          value={form.range_max} onChange={handleFormChange} placeholder="e.g. 150" required />
                        <Field label="Unit *" name="unit" value={form.unit} onChange={handleFormChange} placeholder="mm" required />
                        <Field label="Least Count" name="least_count" type="number" step="0.001"
                          value={form.least_count} onChange={handleFormChange} placeholder="e.g. 0.02" />
                        <Field label="Accuracy" name="accuracy" type="number" step="0.001"
                          value={form.accuracy} onChange={handleFormChange} placeholder="e.g. ±0.03" />
                        <Field label="± q01 Tolerance" name="q01_tolerance" type="number" step="0.001"
                          value={form.q01_tolerance} onChange={handleFormChange} />
                      </div>
                    </>
                  )}

                  <hr className="border-gray-800" />

                  {/* Calibration period */}
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Calibration Schedule</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Calibration Period *" name="periodicity_value" type="number"
                      value={form.periodicity_value} onChange={handleFormChange} required />
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Period Unit *</label>
                      <select name="periodicity_unit" value={form.periodicity_unit} onChange={handleFormChange}
                        className="w-full bg-[#242731] text-white border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500">
                        <option value="Days">Days</option>
                        <option value="Months">Months</option>
                        <option value="Years">Years</option>
                      </select>
                    </div>
                    <Field label="Calibration Start Date *" name="calibration_start_date" type="date"
                      value={form.calibration_start_date} onChange={handleFormChange} required />
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">Calibration Due Date (Calculated)</label>
                      <input type="date" disabled
                        value={computeDueDate(form.calibration_start_date, form.periodicity_value, form.periodicity_unit)}
                        className="w-full bg-[#1c1e24] text-gray-500 border border-gray-800 rounded-xl px-4 py-3 cursor-not-allowed" />
                    </div>
                  </div>

                  <hr className="border-gray-800" />

                  {/* Inventory & Location Details */}
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Inventory &amp; Location Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Maintenance Plan" name="maintenance_plan" value={form.maintenance_plan} onChange={handleFormChange} placeholder="e.g. Annual Maintenance Plan A" />
                    <Field label="Technical No" name="technical_no" value={form.technical_no} onChange={handleFormChange} placeholder="e.g. TECH-9821" />
                    <Field label="Plant Name" name="plant_name" value={form.plant_name} onChange={handleFormChange} placeholder="e.g. BDL Hyderabad Unit" />
                    <Field label="Plant Location" name="plant_location" value={form.plant_location} onChange={handleFormChange} placeholder="e.g. Machine Shop Floor" />
                    <Field label="Storage Location" name="storage_location" value={form.storage_location} onChange={handleFormChange} placeholder="e.g. Cabinet A, Shelf 2" />
                    <Field label="Place" name="place" value={form.place} onChange={handleFormChange} placeholder="e.g. Hyderabad" />
                    <Field label="Pincode" name="pincode" value={form.pincode} onChange={handleFormChange} placeholder="e.g. 500058" />
                    <Field label="Manufacture No" name="manufacturer_no" value={form.manufacturer_no} onChange={handleFormChange} placeholder="e.g. MFG-88910-BDL" />
                  </div>

                  <hr className="border-gray-800" />

                  {/* Registered By Employee Details */}
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Employee Registration Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <Field label="Employee ID" name="employee_id" value={form.employee_id} onChange={handleFormChange} placeholder="e.g. EMP-001" />
                    <Field label="Employee Name" name="employee_name" value={form.employee_name} onChange={handleFormChange} placeholder="e.g. Admin User" />

                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={startQRScanner}
                        className="flex items-center justify-center w-full px-4 py-3 bg-[#242731] hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl transition-all font-medium text-sm gap-2"
                      >
                        <Camera className="w-5 h-5 text-blue-500" />
                        Scan Employee ID Card QR
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={closeModal} disabled={saving}
                      className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium disabled:opacity-50">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving}
                      className={`flex-1 py-3 text-white rounded-xl font-medium flex items-center justify-center disabled:opacity-50 ${category === 'Gauge' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      {saving ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Saving...</> : `Save ${category}`}
                    </button>
                  </div>
                </form>
          </div>
        </div>
      )}

      {/* ── QR CODE SCANNER MODAL ── */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1a1c23] border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center">
              <Camera className="w-5 h-5 mr-2 text-blue-500" />
              ID Card QR Scanner
            </h3>
            <p className="text-gray-400 text-xs mb-4">Please position the ID card QR code in front of the camera.</p>

            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

              {/* Scan Overlay Lines */}
              <div className="absolute inset-0 border-2 border-dashed border-blue-500/30 m-4 rounded-lg pointer-events-none flex items-center justify-center">
                <div className="w-full h-0.5 bg-blue-500 absolute animate-pulse" style={{ top: '50%' }}></div>
              </div>

              {!streamRef.current && (
                <div className="absolute inset-0 bg-[#242731] flex flex-col items-center justify-center p-4 text-center">
                  <Camera className="w-8 h-8 text-gray-600 mb-2 animate-bounce" />
                  <p className="text-gray-400 text-sm font-semibold">Camera Access Blocked or Unavailable</p>
                  <p className="text-gray-500 text-xs mt-1">Using simulator override instead.</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={stopQRScanner}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-all"
              >
                Close Camera
              </button>
              <button
                type="button"
                onClick={simulateQRScan}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
              >
                Simulate Scan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, name, value, onChange, type = 'text', placeholder, required, step, accent }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
    <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
      step={step} required={required}
      className={`w-full bg-[#242731] text-white border rounded-xl px-4 py-3 focus:outline-none placeholder-gray-600 ${
        accent === 'green' ? 'border-green-500/30 focus:border-green-500'
        : accent === 'red' ? 'border-red-500/30 focus:border-red-500'
        : 'border-gray-700 focus:border-blue-500'
      }`} />
  </div>
);

export default EquipmentPage;
