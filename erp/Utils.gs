function getSettings() {
  var rows = getAllRows(SHEET_NAMES.SETTINGS);
  var settings = {};
  rows.forEach(function(row) {
    settings[row.key] = row.value;
  });
  return settings;
}

function updateSettings(settingsObj) {
  var sheet = getSheet_(SHEET_NAMES.SETTINGS);
  var headers = getHeaders_(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  var keyIndex = {};
  data.forEach(function(row, i) {
    keyIndex[row[0]] = i + 2;
  });
  Object.keys(settingsObj).forEach(function(key) {
    if (keyIndex[key]) {
      sheet.getRange(keyIndex[key], 2).setValue(settingsObj[key]);
    } else {
      sheet.appendRow([key, settingsObj[key]]);
    }
  });
  return getSettings();
}

function getDashboardStats() {
  var quotes = getAllRows(SHEET_NAMES.QUOTES);
  var invoices = getAllRows(SHEET_NAMES.INVOICES);
  var now = new Date();
  var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  var paidThisMonth = invoices
    .filter(function(inv) {
      return inv.status === 'Paid' && inv.paid_date && new Date(inv.paid_date) >= monthStart;
    })
    .reduce(function(sum, inv) { return sum + (parseFloat(inv.total) || 0); }, 0);

  var outstanding = invoices
    .filter(function(inv) { return inv.status === 'Sent' || inv.status === 'Overdue'; })
    .reduce(function(sum, inv) { return sum + (parseFloat(inv.total) || 0); }, 0);

  var recentQuotes = quotes.slice(-5).reverse().map(function(q) {
    return { type: 'Quote', id: q.id, client: q.client_id, amount: q.total, status: q.status, date: q.created_date };
  });
  var recentInvoices = invoices.slice(-5).reverse().map(function(inv) {
    return { type: 'Invoice', id: inv.id, client: inv.client_id, amount: inv.total, status: inv.status, date: inv.created_date };
  });

  var recentActivity = recentQuotes.concat(recentInvoices)
    .sort(function(a, b) { return new Date(b.date) - new Date(a.date); })
    .slice(0, 10);

  return {
    totalQuotes: quotes.length,
    totalInvoices: invoices.length,
    outstandingAmount: outstanding,
    paidThisMonth: paidThisMonth,
    recentActivity: recentActivity
  };
}

function getClientName_(clientId) {
  var client = findRowById(SHEET_NAMES.CLIENTS, clientId);
  return client ? client.data.name : clientId;
}

function formatCurrency(amount, currency) {
  var curr = currency || 'USD';
  var num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr }).format(num);
}

function parseJsonSafely_(str) {
  if (!str) return [];
  try { return JSON.parse(str); } catch(e) { return []; }
}

function handleError_(context, error) {
  Logger.log('[ERROR] ' + context + ': ' + error.message);
  return { success: false, error: error.message };
}

function today_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function addDays_(dateStr, days) {
  var d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function calcTotals_(items, discountVal, discountType, taxRate) {
  var subtotal = items.reduce(function(sum, item) {
    return sum + ((parseFloat(item.qty) || 0) * (parseFloat(item.unit_price) || 0));
  }, 0);
  var discount = discountType === 'percent'
    ? subtotal * ((parseFloat(discountVal) || 0) / 100)
    : (parseFloat(discountVal) || 0);
  var taxable = subtotal - discount;
  var tax = taxable * (parseFloat(taxRate) || 0);
  var total = taxable + tax;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    tax_amount: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}
