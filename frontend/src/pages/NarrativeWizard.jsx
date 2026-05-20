import React, { useState, useEffect } from 'react';
import { PenTool, ArrowRight, Save, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';

const NarrativeWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [calibrations, setCalibrations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    calibration_id: '',
    characteristic_name: '',
    explanation: '',
    weakness: '',
    summary_paragraph: '',
    memory_story: '',
    character_description: '',
    setting_description: '',
    conflict_description: '',
    resolution_description: '',
  });

  useEffect(() => {
    api.get('/calibration/recent').then((res) => setCalibrations(res.data)).catch(() => {});
  }, []);

  const handleNext = () => setStep((p) => Math.min(p + 1, 6));
  const handlePrev = () => setStep((p) => Math.max(p - 1, 1));
  const handleChange = (field) => (e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.characteristic_name.trim()) {
      setError('Characteristic name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/narratives', {
        ...formData,
        calibration_id: formData.calibration_id || null,
        plot_description: `${formData.conflict_description}\n${formData.resolution_description}`,
        theme_description: formData.summary_paragraph,
      });
      navigate('/narratives');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center">
          <PenTool className="w-8 h-8 mr-3 text-blue-500" />
          Characteristic Analyzer
        </h1>
        <Link to="/narratives" className="text-blue-400 text-sm hover:underline">← Back to gallery</Link>
      </div>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}

      <div className="bg-[#1a1c23] p-8 rounded-2xl border border-gray-800 min-h-[360px]">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">1. The Trait</h2>
            <select value={formData.calibration_id} onChange={handleChange('calibration_id')} className="w-full bg-[#242731] text-white border border-gray-700 rounded-xl px-4 py-3">
              <option value="">Link to calibration (optional)</option>
              {calibrations.map((c) => (
                <option key={c.id} value={c.id}>{c.equipment_no} — {c.calibration_date}</option>
              ))}
            </select>
            <input placeholder="Characteristic name *" value={formData.characteristic_name} onChange={handleChange('characteristic_name')} className="w-full bg-[#242731] text-white border border-gray-700 rounded-xl px-4 py-3" required />
            <textarea rows={3} placeholder="Technical explanation" value={formData.explanation} onChange={handleChange('explanation')} className="w-full bg-[#242731] text-white border border-gray-700 rounded-xl px-4 py-3" />
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">2. Vulnerability</h2>
            <textarea rows={3} value={formData.weakness} onChange={handleChange('weakness')} className="w-full bg-[#242731] text-white border border-red-500/30 rounded-xl px-4 py-3" placeholder="Weakness" />
            <textarea rows={4} value={formData.summary_paragraph} onChange={handleChange('summary_paragraph')} className="w-full bg-[#242731] text-white border border-gray-700 rounded-xl px-4 py-3" placeholder="Summary" />
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">3. Memory</h2>
            <textarea rows={6} value={formData.memory_story} onChange={handleChange('memory_story')} className="w-full bg-[#242731] text-white border border-blue-500/30 rounded-xl px-4 py-3" placeholder="Memory story" />
          </div>
        )}
        {step >= 4 && step <= 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">{step === 4 ? '4. Character & Setting' : '5. Conflict & Resolution'}</h2>
            {step === 4 ? (
              <>
                <textarea rows={4} value={formData.character_description} onChange={handleChange('character_description')} className="w-full bg-[#242731] text-white border border-gray-700 rounded-xl px-4 py-3" placeholder="Character" />
                <textarea rows={4} value={formData.setting_description} onChange={handleChange('setting_description')} className="w-full bg-[#242731] text-white border border-gray-700 rounded-xl px-4 py-3" placeholder="Setting" />
              </>
            ) : (
              <>
                <textarea rows={4} value={formData.conflict_description} onChange={handleChange('conflict_description')} className="w-full bg-[#242731] text-white border border-gray-700 rounded-xl px-4 py-3" placeholder="Conflict" />
                <textarea rows={4} value={formData.resolution_description} onChange={handleChange('resolution_description')} className="w-full bg-[#242731] text-white border border-gray-700 rounded-xl px-4 py-3" placeholder="Resolution" />
              </>
            )}
          </div>
        )}
        {step === 6 && (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Ready to publish</h2>
            <button type="button" onClick={handleSubmit} disabled={saving} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold inline-flex items-center">
              {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              Save Narrative
            </button>
          </div>
        )}

        <div className="flex justify-between mt-10 pt-6 border-t border-gray-800">
          <button type="button" onClick={handlePrev} disabled={step === 1} className="px-6 py-2 text-gray-300 disabled:opacity-40">Back</button>
          {step < 6 && (
            <button type="button" onClick={handleNext} className="flex items-center px-6 py-2 bg-white text-black rounded-lg font-bold">
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NarrativeWizard;

