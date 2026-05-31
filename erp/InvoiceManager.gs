function getAllInvoices() {
  try {
    var invoices = getAllRows(SHEET_NAMES.INVOICES);
    return invoices.reverse();
  } catch(e) { return handleError_('getAllInvoices', e); }
}

function getInvoice(id) {
  try {
    var found = findRowById(SHEET_NAMES.INVOICES, id);
    if (!found) return null;
    var inv = found.data;
    inv.items = parseJsonSafely_(inv.items_json);
    inv.client = getClient(inv.client_id);
    return inv;
  } catch(e) { return handleError_('getInvoice', e); }
}

function createInvoice(data) {
  try {
    if (!data.client_id) throw new Error('client_id is required.');
    if (!data.items || !data.items.length) throw new Error('At least one item is required.');

    var settings = getSettings();
    var existing = getAllRows(SHEET_NAMES.INVOICES);
    var id = generateId_('INV', existing.map(function(inv) { return inv.id; }));

    var taxRate = parseFloat(data.tax_rate !== undefined ? data.tax_rate : settings.tax_rate) || 0;
    var totals = calcTotals_(data.items, data.discount || 0, data.discount_type || 'flat', taxRate);

    var items = data.items.map(function(item) {
      return {
        item_id: item.item_id || '',
        name: item.name || '',
        qty: parseFloat(item.qty) || 1,
        unit_price: parseFloat(item.unit_price) || 0,
        line_total: (parseFloat(item.qty) || 1) * (parseFloat(item.unit_price) || 0)
      };
    });

    var invoice = {
      id: id,
      quote_id: data.quote_id || '',
      client_id: data.client_id,
      status: 'Draft',
      due_date: data.due_date || '',
      paid_date: '',
      items_json: JSON.stringify(items),
      subtotal: totals.subtotal,
      discount: totals.discount,
      discount_type: data.discount_type || 'flat',
      tax_rate: taxRate,
      tax_amount: totals.tax_amount,
      total: totals.total,
      notes: data.notes || '',
      created_date: today_(),
      sheet_url: '',
      pdf_url: ''
    };

    appendRow(SHEET_NAMES.INVOICES, invoice);
    invoice.items = items;
    return { success: true, data: invoice };
  } catch(e) { return handleError_('createInvoice', e); }
}

function updateInvoice(id, data) {
  try {
    var allowedFields = ['due_date','notes','discount','discount_type','tax_rate'];
    var updates = {};
    allowedFields.forEach(function(f) {
      if (data[f] !== undefined) updates[f] = data[f];
    });

    if (data.items) {
      var items = data.items.map(function(item) {
        return {
          item_id: item.item_id || '',
          name: item.name || '',
          qty: parseFloat(item.qty) || 1,
          unit_price: parseFloat(item.unit_price) || 0,
          line_total: (parseFloat(item.qty) || 1) * (parseFloat(item.unit_price) || 0)
        };
      });
      updates.items_json = JSON.stringify(items);
      var existing = findRowById(SHEET_NAMES.INVOICES, id);
      if (existing) {
        var taxRate = parseFloat(updates.tax_rate !== undefined ? updates.tax_rate : existing.data.tax_rate) || 0;
        var discount = parseFloat(updates.discount !== undefined ? updates.discount : existing.data.discount) || 0;
        var discountType = updates.discount_type || existing.data.discount_type || 'flat';
        var totals = calcTotals_(items, discount, discountType, taxRate);
        Object.assign(updates, { subtotal: totals.subtotal, discount: totals.discount, tax_amount: totals.tax_amount, total: totals.total });
      }
    }

    var updated = updateRow(SHEET_NAMES.INVOICES, id, updates);
    if (!updated) throw new Error('Invoice not found: ' + id);
    return { success: true, data: updated };
  } catch(e) { return handleError_('updateInvoice', e); }
}

function markInvoicePaid(id, paidDate) {
  try {
    var updated = updateRow(SHEET_NAMES.INVOICES, id, {
      status: 'Paid',
      paid_date: paidDate || today_()
    });
    if (!updated) throw new Error('Invoice not found: ' + id);
    return { success: true, data: updated };
  } catch(e) { return handleError_('markInvoicePaid', e); }
}

function updateInvoiceStatus(id, status) {
  try {
    var allowed = ['Draft', 'Sent', 'Paid', 'Overdue'];
    if (!allowed.includes(status)) throw new Error('Invalid status: ' + status);
    var updated = updateRow(SHEET_NAMES.INVOICES, id, { status: status });
    if (!updated) throw new Error('Invoice not found: ' + id);
    return { success: true, data: updated };
  } catch(e) { return handleError_('updateInvoiceStatus', e); }
}

function generateInvoiceDocuments(invoiceId) {
  try {
    var sheetUrl = generateInvoiceSheet(invoiceId);
    var pdfUrl = generateInvoicePDF(invoiceId);
    updateRow(SHEET_NAMES.INVOICES, invoiceId, { sheet_url: sheetUrl, pdf_url: pdfUrl });
    return { success: true, sheetUrl: sheetUrl, pdfUrl: pdfUrl };
  } catch(e) { return handleError_('generateInvoiceDocuments', e); }
}
