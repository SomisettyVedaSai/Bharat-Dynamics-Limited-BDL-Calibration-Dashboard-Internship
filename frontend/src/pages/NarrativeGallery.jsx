import React, { useState, useEffect } from 'react';
import { BookOpen, User, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';

const NarrativeGallery = () => {
  const navigate = useNavigate();
  const [narratives, setNarratives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/narratives');
        setNarratives(
          res.data.map((n) => ({
            narrative_id: n.narrative_id,
            characteristic_name: n.characteristic_name,
            weakness: n.weakness,
            summary_paragraph: n.summary_paragraph,
            memory_story: n.memory_story,
            equipment_no: n.calibration?.equipment?.equipment_no || '—',
          }))
        );
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading narratives...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <BookOpen className="w-6 h-6 mr-3 text-blue-500" />
            Narrative Gallery
          </h1>
          <p className="text-gray-400 text-sm mt-2">Browse instrument characteristic stories.</p>
        </div>
        <button type="button" onClick={() => navigate('/narrative/new')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
          Analyze Characteristic
        </button>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

      {narratives.length === 0 && !error ? (
        <p className="text-gray-500 text-center py-16">No narratives yet.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {narratives.map((nar) => (
            <div key={nar.narrative_id} className="bg-[#1a1c23] p-6 rounded-2xl border border-gray-800">
              <h3 className="text-lg font-bold text-white">{nar.characteristic_name}</h3>
              <p className="text-sm text-gray-500 mb-4">Asset: {nar.equipment_no}</p>
              <p className="text-red-400 text-sm italic mb-3">"{nar.weakness}"</p>
              <p className="text-gray-400 text-sm mb-3">{nar.summary_paragraph}</p>
              <div className="bg-[#242731] p-4 rounded-xl border border-gray-700">
                <p className="text-xs text-blue-400 mb-2 flex items-center"><User className="w-3 h-3 mr-1" /> Memory</p>
                <p className="text-gray-300 text-sm">"{nar.memory_story}"</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NarrativeGallery;


