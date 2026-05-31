var CATALOG_CATEGORIES = ['Flowers', 'Lighting', 'Furniture', 'Linens', 'Tableware', 'Backdrop', 'Other'];

function getAllCatalogItems(includeInactive) {
  try {
    var items = getAllRows(SHEET_NAMES.CATALOG);
    if (!includeInactive) {
      items = items.filter(function(item) {
        return item.active === true || item.active === 'TRUE' || item.active === 'true';
      });
    }
    return items.sort(function(a, b) {
      var catCmp = String(a.category).localeCompare(String(b.category));
      return catCmp !== 0 ? catCmp : String(a.name).localeCompare(String(b.name));
    });
  } catch(e) { return handleError_('getAllCatalogItems', e); }
}

function getCatalogItemsByCategory() {
  try {
    var items = getAllCatalogItems(false);
    var grouped = {};
    CATALOG_CATEGORIES.forEach(function(cat) { grouped[cat] = []; });
    items.forEach(function(item) {
      var cat = item.category || 'Other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });
    return grouped;
  } catch(e) { return handleError_('getCatalogItemsByCategory', e); }
}

function getCatalogItem(id) {
  try {
    var found = findRowById(SHEET_NAMES.CATALOG, id);
    return found ? found.data : null;
  } catch(e) { return handleError_('getCatalogItem', e); }
}

function createCatalogItem(data) {
  try {
    if (!data.name) throw new Error('Item name is required.');
    if (!data.category) throw new Error('Category is required.');
    if (data.unit_price === undefined || data.unit_price === '') throw new Error('Unit price is required.');
    var existing = getAllRows(SHEET_NAMES.CATALOG);
    var id = generateId_('CAT', existing.map(function(c) { return c.id; }));
    var item = {
      id: id,
      name: data.name,
      category: data.category,
      description: data.description || '',
      unit: data.unit || 'each',
      unit_price: parseFloat(data.unit_price) || 0,
      active: true
    };
    appendRow(SHEET_NAMES.CATALOG, item);
    return { success: true, data: item };
  } catch(e) { return handleError_('createCatalogItem', e); }
}

function updateCatalogItem(id, data) {
  try {
    var allowedFields = ['name','category','description','unit','unit_price'];
    var updates = {};
    allowedFields.forEach(function(f) {
      if (data[f] !== undefined) updates[f] = data[f];
    });
    if (updates.unit_price !== undefined) updates.unit_price = parseFloat(updates.unit_price) || 0;
    var updated = updateRow(SHEET_NAMES.CATALOG, id, updates);
    if (!updated) throw new Error('Catalog item not found: ' + id);
    return { success: true, data: updated };
  } catch(e) { return handleError_('updateCatalogItem', e); }
}

function toggleCatalogItemActive(id) {
  try {
    var found = findRowById(SHEET_NAMES.CATALOG, id);
    if (!found) throw new Error('Catalog item not found: ' + id);
    var currentActive = found.data.active === true || found.data.active === 'TRUE' || found.data.active === 'true';
    var updated = updateRow(SHEET_NAMES.CATALOG, id, { active: !currentActive });
    return { success: true, active: !currentActive, data: updated };
  } catch(e) { return handleError_('toggleCatalogItemActive', e); }
}
