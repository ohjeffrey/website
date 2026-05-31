function generateQuoteSheet(quoteId) {
  var quote = getQuote(quoteId);
  if (!quote) throw new Error('Quote not found: ' + quoteId);

  var props = PropertiesService.getScriptProperties();
  var templateId = props.getProperty('quoteTemplateId');
  var folderId = props.getProperty('quotesFolderId');
  if (!templateId || !folderId) throw new Error('ERP not initialized. Run setup first.');

  var client = quote.client || {};
  var settings = getSettings();
  var clientName = client.name || quote.client_id;
  var fileName = quoteId + ' - ' + clientName + ' - ' + (quote.event_date || 'TBD');

  var folder = DriveApp.getFolderById(folderId);
  var copy = DriveApp.getFileById(templateId).makeCopy(fileName, folder);
  var ss = SpreadsheetApp.openById(copy.getId());

  fillDocumentSheet_(ss, {
    docId: quoteId,
    docDate: quote.created_date,
    validOrDue: quote.valid_until,
    docLabel: 'QUOTE',
    validLabel: 'Valid Until',
    client: client,
    eventDate: quote.event_date,
    eventType: quote.event_type,
    venue: quote.venue,
    items: quote.items,
    subtotal: quote.subtotal,
    discount: quote.discount,
    discount_type: quote.discount_type,
    tax_rate: quote.tax_rate,
    tax_amount: quote.tax_amount,
    total: quote.total,
    notes: quote.notes,
    settings: settings
  });

  SpreadsheetApp.flush();
  return 'https://docs.google.com/spreadsheets/d/' + copy.getId();
}

function generateQuotePDF(quoteId) {
  var quote = getQuote(quoteId);
  if (!quote) throw new Error('Quote not found: ' + quoteId);

  var props = PropertiesService.getScriptProperties();
  var quoteSheetId = findGeneratedSheetId_(quoteId, SHEET_NAMES.QUOTES);
  var folderId = props.getProperty('quotesFolderId');

  var client = quote.client || {};
  var clientName = client.name || quote.client_id;
  var fileName = quoteId + ' - ' + clientName + ' - ' + (quote.event_date || 'TBD');

  return exportAsPDF_(quoteSheetId, folderId, fileName);
}

function generateInvoiceSheet(invoiceId) {
  var invoice = getInvoice(invoiceId);
  if (!invoice) throw new Error('Invoice not found: ' + invoiceId);

  var props = PropertiesService.getScriptProperties();
  var templateId = props.getProperty('invoiceTemplateId');
  var folderId = props.getProperty('invoicesFolderId');
  if (!templateId || !folderId) throw new Error('ERP not initialized. Run setup first.');

  var client = invoice.client || {};
  var settings = getSettings();
  var clientName = client.name || invoice.client_id;
  var fileName = invoiceId + ' - ' + clientName + ' - Due ' + (invoice.due_date || 'TBD');

  var folder = DriveApp.getFolderById(folderId);
  var copy = DriveApp.getFileById(templateId).makeCopy(fileName, folder);
  var ss = SpreadsheetApp.openById(copy.getId());

  fillDocumentSheet_(ss, {
    docId: invoiceId,
    docDate: invoice.created_date,
    validOrDue: invoice.due_date,
    docLabel: 'INVOICE',
    validLabel: 'Due Date',
    client: client,
    eventDate: invoice.event_date || '',
    eventType: '',
    venue: '',
    items: invoice.items,
    subtotal: invoice.subtotal,
    discount: invoice.discount,
    discount_type: invoice.discount_type,
    tax_rate: invoice.tax_rate,
    tax_amount: invoice.tax_amount,
    total: invoice.total,
    notes: invoice.notes,
    settings: settings
  });

  SpreadsheetApp.flush();
  return 'https://docs.google.com/spreadsheets/d/' + copy.getId();
}

function generateInvoicePDF(invoiceId) {
  var invoice = getInvoice(invoiceId);
  if (!invoice) throw new Error('Invoice not found: ' + invoiceId);

  var props = PropertiesService.getScriptProperties();
  var invSheetId = findGeneratedSheetId_(invoiceId, SHEET_NAMES.INVOICES);
  var folderId = props.getProperty('invoicesFolderId');

  var client = invoice.client || {};
  var clientName = client.name || invoice.client_id;
  var fileName = invoiceId + ' - ' + clientName + ' - Due ' + (invoice.due_date || 'TBD');

  return exportAsPDF_(invSheetId, folderId, fileName);
}

function findGeneratedSheetId_(docId, tabName) {
  var found = findRowById(tabName, docId);
  if (!found || !found.data.sheet_url) throw new Error('Sheet not yet generated for ' + docId + '. Generate the sheet first.');
  var url = found.data.sheet_url;
  var match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error('Could not parse sheet URL: ' + url);
  return match[1];
}

function fillDocumentSheet_(ss, d) {
  var sheet = ss.getSheets()[0];
  var numRows = sheet.getLastRow();
  var numCols = sheet.getLastColumn();
  if (numRows < 1 || numCols < 1) return;

  var data = sheet.getRange(1, 1, numRows, numCols).getValues();

  var curr = d.settings.currency || 'USD';
  var taxPct = Math.round((parseFloat(d.tax_rate) || 0) * 100);

  var replacements = {
    '{{BUSINESS_NAME}}': d.settings.business_name || '',
    '{{BUSINESS_ADDRESS}}': d.settings.address || '',
    '{{BUSINESS_EMAIL}}': d.settings.email || '',
    '{{BUSINESS_PHONE}}': d.settings.phone || '',
    '{{QUOTE_ID}}': d.docId,
    '{{INVOICE_ID}}': d.docId,
    '{{QUOTE_DATE}}': d.docDate || '',
    '{{INVOICE_DATE}}': d.docDate || '',
    '{{VALID_UNTIL}}': d.validOrDue || '',
    '{{DUE_DATE}}': d.validOrDue || '',
    '{{EVENT_DATE}}': d.eventDate || '',
    '{{EVENT_TYPE}}': d.eventType || '',
    '{{VENUE}}': d.venue || '',
    '{{CLIENT_NAME}}': d.client.name || '',
    '{{CLIENT_ADDRESS}}': d.client.address || '',
    '{{CLIENT_EMAIL}}': d.client.email || '',
    '{{CLIENT_PHONE}}': d.client.phone || '',
    '{{SUBTOTAL}}': formatMoney_(d.subtotal, curr),
    '{{DISCOUNT}}': formatMoney_(d.discount, curr),
    '{{TAX_RATE}}': taxPct + '%',
    '{{TAX_AMOUNT}}': formatMoney_(d.tax_amount, curr),
    '{{TOTAL}}': formatMoney_(d.total, curr),
    '{{NOTES}}': d.notes || '',
    '{{PAYMENT_TERMS}}': d.settings.payment_terms || ''
  };

  for (var r = 0; r < data.length; r++) {
    for (var c = 0; c < data[r].length; c++) {
      var cell = String(data[r][c]);
      if (cell.includes('{{')) {
        var replaced = cell;
        Object.keys(replacements).forEach(function(key) {
          replaced = replaced.split(key).join(replacements[key]);
        });
        if (replaced !== cell) {
          sheet.getRange(r + 1, c + 1).setValue(replaced);
        }
      }
    }
  }

  var ITEM_START_ROW = 14;
  var items = d.items || [];
  for (var i = 0; i < items.length && i < 20; i++) {
    var item = items[i];
    var rowNum = ITEM_START_ROW + i;
    sheet.getRange(rowNum, 1).setValue(i + 1);
    sheet.getRange(rowNum, 2).setValue(item.name || '');
    sheet.getRange(rowNum, 3).setValue(item.qty || 1);
    sheet.getRange(rowNum, 4).setValue(formatMoney_(item.unit_price, curr));
    sheet.getRange(rowNum, 5).setValue(formatMoney_(item.line_total, curr));
  }
}

function exportAsPDF_(fileId, folderId, baseName) {
  if (!fileId) throw new Error('No fileId provided for PDF export.');
  var ss = SpreadsheetApp.openById(fileId);
  var sheetId = ss.getSheets()[0].getSheetId();

  var exportUrl = 'https://docs.google.com/spreadsheets/d/' + fileId + '/export?' +
    'format=pdf' +
    '&gid=' + sheetId +
    '&portrait=true' +
    '&size=7' +
    '&fitw=true' +
    '&gridlines=false' +
    '&printtitle=false' +
    '&sheetnames=false' +
    '&fzr=false' +
    '&top_margin=0.5' +
    '&bottom_margin=0.5' +
    '&left_margin=0.5' +
    '&right_margin=0.5';

  var token = ScriptApp.getOAuthToken();
  var response = UrlFetchApp.fetch(exportUrl, {
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error('PDF export failed with status ' + response.getResponseCode());
  }

  var pdfBlob = response.getBlob().setName(baseName + '.pdf');
  var folder = DriveApp.getFolderById(folderId);
  var pdfFile = folder.createFile(pdfBlob);
  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return pdfFile.getUrl();
}

function formatMoney_(amount, currency) {
  var num = parseFloat(amount) || 0;
  var symbols = { USD: '$', GBP: '£', EUR: '€', CAD: 'CA$', AUD: 'A$' };
  var symbol = symbols[currency] || '$';
  return symbol + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
