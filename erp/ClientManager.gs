function getAllClients() {
  try {
    var clients = getAllRows(SHEET_NAMES.CLIENTS);
    return clients.sort(function(a, b) { return String(a.name).localeCompare(String(b.name)); });
  } catch(e) { return handleError_('getAllClients', e); }
}

function getClient(id) {
  try {
    var found = findRowById(SHEET_NAMES.CLIENTS, id);
    return found ? found.data : null;
  } catch(e) { return handleError_('getClient', e); }
}

function createClient(data) {
  try {
    if (!data.name) throw new Error('Client name is required.');
    var existing = getAllRows(SHEET_NAMES.CLIENTS);
    var id = generateId_('CLI', existing.map(function(c) { return c.id; }));
    var client = {
      id: id,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      notes: data.notes || '',
      created_date: today_()
    };
    appendRow(SHEET_NAMES.CLIENTS, client);
    return { success: true, data: client };
  } catch(e) { return handleError_('createClient', e); }
}

function updateClient(id, data) {
  try {
    var allowedFields = ['name','email','phone','address','notes'];
    var updates = {};
    allowedFields.forEach(function(f) {
      if (data[f] !== undefined) updates[f] = data[f];
    });
    var updated = updateRow(SHEET_NAMES.CLIENTS, id, updates);
    if (!updated) throw new Error('Client not found: ' + id);
    return { success: true, data: updated };
  } catch(e) { return handleError_('updateClient', e); }
}

function searchClients(query) {
  try {
    if (!query) return getAllClients();
    var q = String(query).toLowerCase();
    return getAllRows(SHEET_NAMES.CLIENTS).filter(function(c) {
      return String(c.name).toLowerCase().includes(q) ||
             String(c.email).toLowerCase().includes(q) ||
             String(c.phone).toLowerCase().includes(q);
    });
  } catch(e) { return handleError_('searchClients', e); }
}
