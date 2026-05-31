function doGet(e) {
  var template = HtmlService.createTemplateFromFile('index');
  return template.evaluate()
    .setTitle('Event Decor ERP')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Expose all server functions callable via google.script.run

// Setup
function serverRunSetup() { return runSetup(); }

// Settings
function serverGetSettings() { return getSettings(); }
function serverUpdateSettings(data) { return updateSettings(data); }

// Dashboard
function serverGetDashboardStats() { return getDashboardStats(); }

// Clients
function serverGetAllClients() { return getAllClients(); }
function serverGetClient(id) { return getClient(id); }
function serverCreateClient(data) { return createClient(data); }
function serverUpdateClient(id, data) { return updateClient(id, data); }
function serverSearchClients(query) { return searchClients(query); }

// Catalog
function serverGetAllCatalogItems(includeInactive) { return getAllCatalogItems(includeInactive); }
function serverGetCatalogItemsByCategory() { return getCatalogItemsByCategory(); }
function serverCreateCatalogItem(data) { return createCatalogItem(data); }
function serverUpdateCatalogItem(id, data) { return updateCatalogItem(id, data); }
function serverToggleCatalogItemActive(id) { return toggleCatalogItemActive(id); }

// Quotes
function serverGetAllQuotes() { return getAllQuotes(); }
function serverGetQuote(id) { return getQuote(id); }
function serverCreateQuote(data) { return createQuote(data); }
function serverUpdateQuote(id, data) { return updateQuote(id, data); }
function serverUpdateQuoteStatus(id, status) { return updateQuoteStatus(id, status); }
function serverConvertQuoteToInvoice(quoteId) { return convertQuoteToInvoice(quoteId); }
function serverGenerateQuoteDocuments(quoteId) { return generateQuoteDocuments(quoteId); }

// Invoices
function serverGetAllInvoices() { return getAllInvoices(); }
function serverGetInvoice(id) { return getInvoice(id); }
function serverCreateInvoice(data) { return createInvoice(data); }
function serverUpdateInvoice(id, data) { return updateInvoice(id, data); }
function serverMarkInvoicePaid(id, paidDate) { return markInvoicePaid(id, paidDate); }
function serverUpdateInvoiceStatus(id, status) { return updateInvoiceStatus(id, status); }
function serverGenerateInvoiceDocuments(invoiceId) { return generateInvoiceDocuments(invoiceId); }
