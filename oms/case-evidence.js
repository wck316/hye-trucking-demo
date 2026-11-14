const allowedTypes = new Set(['image/jpeg', 'image/png', 'application/pdf']);

function evidenceDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('hye-oms-case-evidence', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function evidenceTransaction(mode, action) {
  const database = await evidenceDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction('files', mode);
      const result = action(transaction.objectStore('files'));
      transaction.oncomplete = () => resolve(result?.result);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

export async function saveEvidence(files) {
  if (!files.length) return [];
  if (files.length > 3 || files.some(file => !allowedTypes.has(file.type) || !file.size || file.size > 2 * 1024 * 1024)) {
    throw new Error('请选取最多 3 个 JPG、PNG 或 PDF 文件，每个不超过 2 MB。');
  }
  const records = files.map(file => ({ id: crypto.randomUUID(), name: file.name }));
  try {
    await evidenceTransaction('readwrite', store => records.forEach((record, index) => store.add(files[index], record.id)));
  } catch {
    throw new Error('凭证保存失败，请重试。');
  }
  return records;
}

export function removeEvidence(records) {
  if (records.length) return evidenceTransaction('readwrite', store => records.forEach(record => store.delete(record.id)));
}

export function loadEvidence(id) {
  return evidenceTransaction('readonly', store => store.get(id));
}
