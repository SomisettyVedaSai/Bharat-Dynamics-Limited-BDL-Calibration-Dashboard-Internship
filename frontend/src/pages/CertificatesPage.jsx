import React, { useState, useEffect } from 'react';
import { FileBadge, Printer, ExternalLink, Loader2, Search, Download } from 'lucide-react';
import api, { getErrorMessage } from '../api/client';
import { assetUrl } from '../utils/format';

const CertificatesPage = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/certificates');
      setCertificates(
        res.data.map((c) => ({
          certificate_id: c.certificate_id,
          certificate_no: c.certificate_no,
          equipment: c.calibration?.equipment || { equipment_no: '—', description_name: '—' },
          generated_date: c.generated_date,
          result: c.calibration?.result || '—',
          pdf_path: c.pdf_path,
          label_path: c.label_path,
        }))
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

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
      link.setAttribute('download', `${cert.certificate_no}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      window.open(url, '_blank');
    }
  };

  const filteredCertificates = certificates.filter((cert) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      cert.certificate_no?.toLowerCase().includes(q) ||
      cert.equipment?.equipment_no?.toLowerCase().includes(q) ||
      cert.equipment?.description_name?.toLowerCase().includes(q) ||
      cert.equipment?.serial_no?.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    load();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading certificates...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center">
          <FileBadge className="w-6 h-6 mr-3 text-blue-500" />
          Certificates & Labels
        </h1>
        <p className="text-gray-400 text-sm mt-2">Access official A4 PDFs and print shop floor labels.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error} <button type="button" onClick={load} className="underline ml-2">Retry</button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="flex items-center bg-[#242731] border border-gray-800 rounded-xl px-4 py-2.5 focus-within:border-blue-500 transition-colors">
          <Search className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search certificates (No, Equipment No, Serial...)"
            className="bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm w-full"
          />
        </div>
      </div>

      {filteredCertificates.length === 0 && !error ? (
        <p className="text-gray-500 text-center py-16">
          {certificates.length === 0 
            ? "No certificates generated yet. Complete a calibration first." 
            : "No certificates match your search query."}
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCertificates.map((cert) => (
            <div key={cert.certificate_id} className="bg-[#1a1c23] p-6 rounded-2xl border border-gray-800 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{cert.certificate_no}</h3>
                    <p className="text-sm text-gray-400">{new Date(cert.generated_date).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cert.result === 'PASS' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {cert.result}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-1">Asset: {cert.equipment.equipment_no}</p>
                <p className="text-sm text-gray-400">{cert.equipment.description_name}</p>
              </div>
              <div className="flex space-x-2 pt-4 border-t border-gray-800 mt-4">
                <button type="button" onClick={() => handleViewPdf(cert)} className="flex-1 flex items-center justify-center px-2 py-2 bg-[#242731] hover:bg-gray-700 text-white rounded-xl text-xs border border-gray-700 transition-colors" title="View PDF">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> View
                </button>
                <button type="button" onClick={() => handleDownloadPdf(cert)} className="flex-1 flex items-center justify-center px-2 py-2 bg-[#242731] hover:bg-gray-700 text-white rounded-xl text-xs border border-gray-700 transition-colors" title="Download PDF">
                  <Download className="w-3.5 h-3.5 mr-1" /> Download
                </button>
                <button type="button" onClick={() => handlePrintLabel(cert)} className="flex-1 flex items-center justify-center px-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs transition-colors" title="Print Label">
                  <Printer className="w-3.5 h-3.5 mr-1" /> Label
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificatesPage;




