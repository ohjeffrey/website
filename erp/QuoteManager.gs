function getAllQuotes() {
  try {
    var quotes = getAllRows(SHEET_NAMES.QUOTES);
    return quotes.reverse();
  } catch(e) { return handleError_('getAllQuotes', e); }
}

function getQuote(id) {
  try {
    var found = findRowById(SHEET_NAMES.QUOTES, id);
    if (!found) return null;
    var q = found.data;
    q.items = parseJsonSafely_(q.items_json);
    q.client = getClient(q.client_id);
    return q;
  } catch(e) { return handleError_('getQuote', e); }
}

function createQuote(data) {
  try {
    if (!data.client_id) throw new Error('client_id is required.');
    if (!data.items || !data.items.length) throw new Error('At least one item is required.');

    var settings = getSettings();
    var existing = getAllRows(SHEET_NAMES.QUOTES);
    var id = generateId_('Q', existing.map(function(q) { return q.id; }));

    var taxRate = parseFloat(data.tax_rate !== undefined ? data.tax_rate : settings.tax_rate) || 0;
    var totals = calcTotals_(data.items, data.discount || 0, data.discount_type || 'flat', taxRate);
    var today = today_();
    var validDays = parseInt(settings.quote_validity_days) || 30;

    var items = data.items.map(function(item) {
      return {
        item_id: item.item_id || '',
        name: item.name || '',
        qty: parseFloat(item.qty) || 1,
        unit_price: parseFloat(item.unit_price) || 0,
        line_total: (parseFloat(item.qty) || 1) * (parseFloat(item.unit_price) || 0)
      };
    });

    var quote = {
      id: id,
      client_id: data.client_id,
      event_date: data.event_date || '',
      event_type: data.event_type || '',
      venue: data.venue || '',
      status: 'Draft',
      items_json: JSON.stringify(items),
      subtotal: totals.subtotal,
      discount: totals.discount,
      discount_type: data.discount_type || 'flat',
      tax_rate: taxRate,
      tax_amount: totals.tax_amount,
      total: totals.total,
      notes: data.notes || '',
      created_date: today,
      valid_until: addDays_(today, validDays),
      sheet_url: '',
      pdf_url: ''
    };

    appendRow(SHEET_NAMES.QUOTES, quote);
    quote.items = items;
    return { success: true, data: quote };
  } catch(e) { return handleError_('createQuote', e); }
}

function updateQuote(id, data) {
  try {
    var allowedFields = ['event_date','event_type','venue','notes','valid_until','discount','discount_type','tax_rate'];
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
      var existing = findRowById(SHEET_NAMES.QUOTES, id);
      if (existing) {
        var taxRate = parseFloat(updates.tax_rate !== undefined ? updates.tax_rate : existing.data.tax_rate) || 0;
        var discount = parseFloat(updates.discount !== undefined ? updates.discount : existing.data.discount) || 0;
        var discountType = updates.discount_type || existing.data.discount_type || 'flat';
        var totals = calcTotals_(items, discount, discountType, taxRate);
        Object.assign(updates, { subtotal: totals.subtotal, discount: totals.discount, tax_amount: totals.tax_amount, total: totals.total });
      }
    }

    var updated = updateRow(SHEET_NAMES.QUOTES, id, updates);
    if (!updated) throw new Error('Quote not found: ' + id);
    return { success: true, data: updated };
  } catch(e) { return handleError_('updateQuote', e); }
}

function updateQuoteStatus(id, status) {
  try {
    var allowed = ['Draft', 'Sent', 'Approved', 'Declined'];
    if (!allowed.includes(status)) throw new Error('Invalid status: ' + status);
    var updated = updateRow(SHEET_NAMES.QUOTES, id, { status: status });
    if (!updated) throw new Error('Quote not found: ' + id);
    return { success: true, data: updated };
  } catch(e) { return handleError_('updateQuoteStatus', e); }
}

function convertQuoteToInvoice(quoteId) {
  try {
    var quote = getQuote(quoteId);
    if (!quote) throw new Error('Quote not found: ' + quoteId);
    if (quote.status !== 'Approved') throw new Error('Only Approved quotes can be converted to invoices.');
    var settings = getSettings();
    var paymentDays = parseInt(String(settings.payment_terms).replace(/\D/g, '')) || 14;
    var result = createInvoice({
      quote_id: quoteId,
      client_id: quote.client_id,
      due_date: addDays_(today_(), paymentDays),
      items: quote.items,
      discount: quote.discount,
      discount_type: quote.discount_type,
      tax_rate: quote.tax_rate,
      notes: quote.notes,
      event_date: quote.event_date
    });
    return result;
  } catch(e) { return handleError_('convertQuoteToInvoice', e); }
}

function generateQuoteDocuments(quoteId) {
  try {
    var sheetUrl = generateQuoteSheet(quoteId);
    var pdfUrl = generateQuotePDF(quoteId);
    updateRow(SHEET_NAMES.QUOTES, quoteId, { sheet_url: sheetUrl, pdf_url: pdfUrl });
    return { success: true, sheetUrl: sheetUrl, pdfUrl: pdfUrl };
  } catch(e) { return handleError_('generateQuoteDocuments', e); }
}
