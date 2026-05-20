let records = [];
const listeners = new Set();

export function getCalibrationRecords() {
  return [...records];
}

export function setCalibrationRecords(next) {
  records = [...next];
  listeners.forEach((fn) => fn(records));
}

export function addCalibrationRecord(record) {
  records = [record, ...records];
  listeners.forEach((fn) => fn(records));
}

export function subscribeCalibrationRecords(listener) {
  listeners.add(listener);
  listener(records);
  return () => listeners.delete(listener);
}

export function getLatestByEquipment() {
  const map = new Map();
  for (const rec of records) {
    if (!map.has(rec.equipment_no)) {
      map.set(rec.equipment_no, rec);
    }
  }
  return Array.from(map.values());
}
