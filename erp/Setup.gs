var QUOTE_HEADERS = ['id','client_id','event_date','event_type','venue','status','items_json','subtotal','discount','discount_type','tax_rate','tax_amount','total','notes','created_date','valid_until','sheet_url','pdf_url'];
var INVOICE_HEADERS = ['id','quote_id','client_id','status','due_date','paid_date','items_json','subtotal','discount','discount_type','tax_rate','tax_amount','total','notes','created_date','sheet_url','pdf_url'];
var CLIENT_HEADERS = ['id','name','email','phone','address','notes','created_date'];
var CATALOG_HEADERS = ['id','name','category','description','unit','unit_price','active'];
var SETTINGS_HEADERS = ['key','value'];

function runSetup() {
  var props = PropertiesService.getScriptProperties();
  var rootFolderId = props.getProperty('rootFolderId');

  if (!rootFolderId) {
    createDriveFolderStructure_();
  }
  if (!props.getProperty('spreadsheetId')) {
    createMasterSpreadsheet_();
  }
  if (!props.getProperty('quoteTemplateId')) {
    createQuoteTemplate_();
  }
  if (!props.getProperty('invoiceTemplateId')) {
    createInvoiceTemplate_();
  }

  var sheet = getSheet_(SHEET_NAMES.CATALOG);
  if (sheet.getLastRow() < 2) {
    seedSampleCatalog_();
  }

  var settingsSheet = getSheet_(SHEET_NAMES.SETTINGS);
  if (settingsSheet.getLastRow() < 2) {
    seedSettings_();
  }

  return { success: true, message: 'ERP setup complete.' };
}

function createDriveFolderStructure_() {
  var props = PropertiesService.getScriptProperties();
  var rootFolder = DriveApp.createFolder('Event Decor ERP');
  var templatesFolder = rootFolder.createFolder('Templates');
  var quotesFolder = rootFolder.createFolder('Quotes');
  var invoicesFolder = rootFolder.createFolder('Invoices');

  props.setProperties({
    rootFolderId: rootFolder.getId(),
    templatesFolderId: templatesFolder.getId(),
    quotesFolderId: quotesFolder.getId(),
    invoicesFolderId: invoicesFolder.getId()
  });
}

function createMasterSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var rootFolder = DriveApp.getFolderById(props.getProperty('rootFolderId'));
  var ss = SpreadsheetApp.create('Event Decor ERP — Hub');

  DriveApp.getFileById(ss.getId()).moveTo(rootFolder);

  var defaultSheet = ss.getSheets()[0];

  var clientSheet = ss.insertSheet(SHEET_NAMES.CLIENTS);
  clientSheet.getRange(1, 1, 1, CLIENT_HEADERS.length).setValues([CLIENT_HEADERS]);
  styleHeaderRow_(clientSheet);

  var catalogSheet = ss.insertSheet(SHEET_NAMES.CATALOG);
  catalogSheet.getRange(1, 1, 1, CATALOG_HEADERS.length).setValues([CATALOG_HEADERS]);
  styleHeaderRow_(catalogSheet);

  var quotesSheet = ss.insertSheet(SHEET_NAMES.QUOTES);
  quotesSheet.getRange(1, 1, 1, QUOTE_HEADERS.length).setValues([QUOTE_HEADERS]);
  styleHeaderRow_(quotesSheet);

  var invoicesSheet = ss.insertSheet(SHEET_NAMES.INVOICES);
  invoicesSheet.getRange(1, 1, 1, INVOICE_HEADERS.length).setValues([INVOICE_HEADERS]);
  styleHeaderRow_(invoicesSheet);

  var settingsSheet = ss.insertSheet(SHEET_NAMES.SETTINGS);
  settingsSheet.getRange(1, 1, 1, SETTINGS_HEADERS.length).setValues([SETTINGS_HEADERS]);
  styleHeaderRow_(settingsSheet);

  ss.deleteSheet(defaultSheet);
  props.setProperty('spreadsheetId', ss.getId());
}

function styleHeaderRow_(sheet) {
  var range = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 20);
  range.setBackground('#2D2A26');
  range.setFontColor('#FFFFFF');
  range.setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function createQuoteTemplate_() {
  var props = PropertiesService.getScriptProperties();
  var templatesFolder = DriveApp.getFolderById(props.getProperty('templatesFolderId'));
  var ss = SpreadsheetApp.create('Quote Template');
  DriveApp.getFileById(ss.getId()).moveTo(templatesFolder);
  var sheet = ss.getActiveSheet();
  sheet.setName('Quote');

  buildDocumentLayout_(sheet, 'QUOTE', [
    ['{{QUOTE_ID}}', '{{QUOTE_DATE}}'],
    ['{{VALID_UNTIL}}', '{{EVENT_DATE}}'],
    ['{{EVENT_TYPE}}', '{{VENUE}}']
  ]);

  props.setProperty('quoteTemplateId', ss.getId());
}

function createInvoiceTemplate_() {
  var props = PropertiesService.getScriptProperties();
  var templatesFolder = DriveApp.getFolderById(props.getProperty('templatesFolderId'));
  var ss = SpreadsheetApp.create('Invoice Template');
  DriveApp.getFileById(ss.getId()).moveTo(templatesFolder);
  var sheet = ss.getActiveSheet();
  sheet.setName('Invoice');

  buildDocumentLayout_(sheet, 'INVOICE', [
    ['{{INVOICE_ID}}', '{{INVOICE_DATE}}'],
    ['{{DUE_DATE}}', '{{EVENT_DATE}}'],
    ['{{EVENT_TYPE}}', '{{VENUE}}']
  ]);

  props.setProperty('invoiceTemplateId', ss.getId());
}

function buildDocumentLayout_(sheet, docType, metaRows) {
  sheet.setColumnWidth(1, 40);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(3, 80);
  sheet.setColumnWidth(4, 80);
  sheet.setColumnWidth(5, 100);
  sheet.setColumnWidth(6, 40);

  var ROSE = '#C9956C';
  var DARK = '#2D2A26';
  var LIGHT = '#F5EBE0';

  sheet.getRange('B1:E1').merge().setValue('{{BUSINESS_NAME}}')
    .setFontSize(18).setFontWeight('bold').setFontColor(DARK);
  sheet.getRange('B2:E2').merge().setValue('{{BUSINESS_ADDRESS}}')
    .setFontColor('#666666');
  sheet.getRange('B3:E3').merge().setValue('{{BUSINESS_EMAIL}} | {{BUSINESS_PHONE}}')
    .setFontColor('#666666');

  sheet.getRange('B5:C5').merge().setValue(docType)
    .setFontSize(22).setFontWeight('bold').setFontColor(ROSE);

  sheet.getRange('B7').setValue('Bill To:').setFontWeight('bold');
  sheet.getRange('B8:E8').merge().setValue('{{CLIENT_NAME}}').setFontSize(12).setFontWeight('bold');
  sheet.getRange('B9:E9').merge().setValue('{{CLIENT_ADDRESS}}');
  sheet.getRange('B10:E10').merge().setValue('{{CLIENT_EMAIL}} | {{CLIENT_PHONE}}');

  var metaLabels = [docType + ' #', 'Date', 'Valid Until / Due', 'Event Date', 'Event Type', 'Venue'];
  var metaRow = 7;
  for (var i = 0; i < metaRows.length; i++) {
    sheet.getRange(metaRow + i, 5).setValue(metaLabels[i * 2] + ':').setFontWeight('bold').setHorizontalAlignment('right');
    sheet.getRange(metaRow + i, 6).setValue(metaRows[i][0]);
    if (metaRows[i][1]) {
      sheet.getRange(metaRow + i + 1, 5).setValue(metaLabels[i * 2 + 1] + ':').setFontWeight('bold').setHorizontalAlignment('right');
      sheet.getRange(metaRow + i + 1, 6).setValue(metaRows[i][1]);
    }
  }

  var itemHeaderRow = 13;
  var itemHeaders = [['#', 'Item / Description', 'Qty', 'Unit Price', 'Total', '']];
  var headerRange = sheet.getRange(itemHeaderRow, 1, 1, 6);
  headerRange.setValues(itemHeaders);
  headerRange.setBackground(DARK).setFontColor('#FFFFFF').setFontWeight('bold');

  for (var r = itemHeaderRow + 1; r <= itemHeaderRow + 20; r++) {
    if ((r - itemHeaderRow) % 2 === 0) {
      sheet.getRange(r, 1, 1, 6).setBackground(LIGHT);
    }
  }

  sheet.getRange(itemHeaderRow + 21, 4).setValue('Subtotal').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange(itemHeaderRow + 21, 5).setValue('{{SUBTOTAL}}');
  sheet.getRange(itemHeaderRow + 22, 4).setValue('Discount').setHorizontalAlignment('right');
  sheet.getRange(itemHeaderRow + 22, 5).setValue('{{DISCOUNT}}');
  sheet.getRange(itemHeaderRow + 23, 4).setValue('Tax ({{TAX_RATE}}%)').setHorizontalAlignment('right');
  sheet.getRange(itemHeaderRow + 23, 5).setValue('{{TAX_AMOUNT}}');

  var totalRow = itemHeaderRow + 24;
  sheet.getRange(totalRow, 4, 1, 2).setBackground(ROSE).setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.getRange(totalRow, 4).setValue('TOTAL').setHorizontalAlignment('right');
  sheet.getRange(totalRow, 5).setValue('{{TOTAL}}');

  sheet.getRange(totalRow + 2, 2, 1, 4).merge()
    .setValue('Notes: {{NOTES}}').setFontColor('#666666').setWrap(true);

  sheet.getRange(totalRow + 4, 2, 1, 4).merge()
    .setValue('Thank you for choosing {{BUSINESS_NAME}}! Payment terms: {{PAYMENT_TERMS}}')
    .setFontColor('#888888').setFontStyle('italic');
}

function seedSampleCatalog_() {
  var items = [
    ['CAT-001','Rose Arch','Backdrop','Full floral arch with fresh roses','each',450],
    ['CAT-002','Balloon Garland','Backdrop','Custom balloon garland (5ft)','each',120],
    ['CAT-003','Fairy Light Canopy','Lighting','Ceiling fairy light canopy installation','set',300],
    ['CAT-004','Edison Bulb String','Lighting','Vintage Edison string lights (20ft)','set',80],
    ['CAT-005','Chiavari Chair','Furniture','Gold chiavari banquet chair','each',12],
    ['CAT-006','Round Banquet Table','Furniture','60" round table, seats 8','each',25],
    ['CAT-007','Linen Tablecloth','Linens','60" round satin tablecloth','each',18],
    ['CAT-008','Chair Sash','Linens','Organza chair sash with bow','each',5],
    ['CAT-009','Centrepiece Vase','Tableware','Tall glass cylinder vase with florals','each',65],
    ['CAT-010','Candle Holder Set','Tableware','Mercury glass votives, set of 3','set',15],
    ['CAT-011','Floral Wall Panel','Backdrop','4x4ft artificial floral wall panel','each',200],
    ['CAT-012','Neon Sign Rental','Backdrop','Custom LED neon sign (any phrase)','each',180],
    ['CAT-013','Photo Booth Setup','Other','Backdrop + props + 3hr rental','set',350],
    ['CAT-014','Aisle Runner','Linens','Ivory satin aisle runner (25ft)','each',40],
    ['CAT-015','Delivery & Setup','Other','Delivery, setup, and breakdown service','event',150]
  ];

  var sheet = getSheet_(SHEET_NAMES.CATALOG);
  items.forEach(function(item) {
    sheet.appendRow([item[0], item[1], item[2], item[3], item[4], item[5], true]);
  });
}

function seedSettings_() {
  var defaults = [
    ['business_name', 'Your Business Name'],
    ['address', '123 Main Street, City, State 00000'],
    ['phone', '(555) 000-0000'],
    ['email', 'hello@yourbusiness.com'],
    ['logo_url', ''],
    ['tax_rate', '0.08'],
    ['payment_terms', 'Net 14'],
    ['quote_validity_days', '30'],
    ['currency', 'USD']
  ];
  var sheet = getSheet_(SHEET_NAMES.SETTINGS);
  defaults.forEach(function(row) {
    sheet.appendRow(row);
  });
}
