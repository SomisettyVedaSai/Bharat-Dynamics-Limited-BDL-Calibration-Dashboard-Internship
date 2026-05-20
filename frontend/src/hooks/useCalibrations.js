import { useState, useEffect, useCallback } from 'react';
import api, { getErrorMessage } from '../api/client';
import { setCalibrationRecords } from '../store/calibrationStore';

export function useCalibrations() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/calibration/recent');
      const mapped = res.data.map((r) => ({
        ...r,
        calibration_date: r.calibration_date
          ? new Date(r.calibration_date).toLocaleString()
          : '',
      }));
      setCalibrationRecords(mapped);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { loading, error, refresh };
}
