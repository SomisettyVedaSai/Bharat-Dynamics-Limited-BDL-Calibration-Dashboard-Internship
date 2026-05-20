import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Save, Info, Loader2, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '../api/client';

const FactoryCalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [isWorkingDay, setIsWorkingDay] = useState(false);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulkYear, setBulkYear] = useState('2026');
  const [generatingBulk, setGeneratingBulk] = useState(false);

  const loadCalendar = async () => {
    setLoading(true);
    try {
      const res = await api.get('/calendar');
      setDays(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/calendar/factory', {
        date: selectedDate,
        is_working_day: isWorkingDay,
        description: description.trim(),
      });
      setSuccess('Calendar day saved.');
      loadCalendar();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (calendarId) => {
    if (!calendarId) return;
    if (!window.confirm('Delete this calendar entry?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/calendar/${calendarId}`);
      setDays(prev => prev.filter(d => d.calendar_id !== calendarId));
      setSuccess('Calendar day removed.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    setGeneratingBulk(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/calendar/factory/bulk-holidays', { year: parseInt(bulkYear) });
      setSuccess(`Success: ${res.data.message} (${res.data.count} holidays generated).`);
      loadCalendar();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGeneratingBulk(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center">
          <CalendarIcon className="w-6 h-6 mr-3 text-blue-500" />
          Factory Calendar Configuration
        </h1>
        <p className="text-gray-400 text-sm mt-2">Define working days and holidays for due-date calculations.</p>
      </div>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single Day Configuration Card */}
        <div className="bg-[#1a1c23] p-6 rounded-2xl border border-gray-800 flex flex-col justify-between">
          <form onSubmit={handleSave} className="space-y-6 flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-blue-500" />
                Configure Single Day
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Select Date</label>
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="block w-full px-4 py-3 border border-gray-600 rounded-xl bg-[#242731] text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={saving} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Working Status</label>
                  <div className="flex items-center space-x-4">
                    <label className="inline-flex items-center text-gray-300">
                      <input type="radio" checked={isWorkingDay} onChange={() => setIsWorkingDay(true)} className="mr-2" /> Working Day
                    </label>
                    <label className="inline-flex items-center text-gray-300">
                      <input type="radio" checked={!isWorkingDay} onChange={() => setIsWorkingDay(false)} className="mr-2" /> Holiday
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Plant holiday" className="block w-full px-4 py-3 border border-gray-600 rounded-xl bg-[#242731] text-white focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={saving} />
              </div>
            </div>
            <button type="submit" disabled={saving} className="mt-6 flex items-center justify-center w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium transition-all">
              {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              Save Configuration
            </button>
          </form>
        </div>

        {/* Bulk Holiday Generation Card */}
        <div className="bg-[#1a1c23] p-6 rounded-2xl border border-gray-800 flex flex-col justify-between">
          <form onSubmit={handleBulkGenerate} className="space-y-6 flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-blue-500" />
                Bulk Holiday Generator
              </h2>
              <p className="text-gray-400 text-xs mb-4">Automatically configure all Sundays and national holidays as holidays for a complete calendar year.</p>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Year</label>
                <select
                  value={bulkYear}
                  onChange={(e) => setBulkYear(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-600 rounded-xl bg-[#242731] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={generatingBulk}
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                  <option value="2029">2029</option>
                  <option value="2030">2030</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={generatingBulk}
              className="mt-6 flex items-center justify-center w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium transition-all"
            >
              {generatingBulk ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CalendarIcon className="w-5 h-5 mr-2" />}
              Bulk Generate Holidays
            </button>
          </form>
        </div>
      </div>

      <div className="bg-[#1a1c23] rounded-2xl border border-gray-800 p-4">
        <h3 className="text-white font-medium mb-3">Saved days</h3>
        {loading ? <p className="text-gray-500 text-sm">Loading...</p> : days.length === 0 ? <p className="text-gray-500 text-sm">No entries yet.</p> : (
          <ul className="space-y-2 max-h-48 overflow-y-auto text-sm">
            {days.map((d) => (
              <li key={d.calendar_id || d.date} className="text-gray-400 flex justify-between items-center bg-[#242731]/40 px-3 py-2 rounded-xl border border-gray-800/40 hover:border-gray-700/60 transition-all">
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-white">{new Date(d.date).toLocaleDateString()}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    d.is_working_day ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  }`}>
                    {d.is_working_day ? 'Working' : 'Holiday'}
                  </span>
                  {d.description && <span className="text-xs text-gray-500">({d.description})</span>}
                </div>
                <button
                  onClick={() => handleDelete(d.calendar_id)}
                  className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Delete Entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start">
        <Info className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
        <p className="text-sm text-blue-200">Working days are counted when calculating next calibration due dates.</p>
      </div>
    </div>
  );
};

export default FactoryCalendarPage;



