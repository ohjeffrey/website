var SHEET_NAMES = {
  CLIENTS: 'Clients',
  CATALOG: 'Catalog',
  QUOTES: 'Quotes',
  INVOICES: 'Invoices',
  SETTINGS: 'Settings'
};

function getErpSpreadsheet_() {
  var ssId = PropertiesService.getScriptProperties().getProperty('spreadsheetId');
  if (!ssId) throw new Error('ERP not initialized. Please run Setup first.');
  return SpreadsheetApp.openById(ssId);
}

function getSheet_(tabName) {
  var sheet = getErpSpreadsheet_().getSheetByName(tabName);
  if (!sheet) throw new Error('Sheet "' + tabName + '" not found.');
  return sheet;
}

function getHeaders_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
}

function getAllRows(tabName) {
  var sheet = getSheet_(tabName);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var headers = getHeaders_(sheet);
  var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return data
    .filter(function(row) { return row[0] !== '' && row[0] !== null && row[0] !== undefined; })
    .map(function(row) {
      var obj = {};
      headers.forEach(function(header, i) {
        var val = row[i];
        if (val instanceof Date) {
          obj[header] = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        } else {
          obj[header] = val;
        }
      });
      return obj;
    });
}

function findRowById(tabName, id) {
  var sheet = getSheet_(tabName);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  var headers = getHeaders_(sheet);
  var idColIndex = headers.indexOf('id');
  if (idColIndex === -1) return null;
  var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][idColIndex]) === String(id)) {
      var obj = {};
      headers.forEach(function(h, j) {
        var val = data[i][j];
        if (val instanceof Date) {
          obj[h] = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        } else {
          obj[h] = val;
        }
      });
      return { rowIndex: i + 2, data: obj };
    }
  }
  return null;
}

function appendRow(tabName, dataObj) {
  var sheet = getSheet_(tabName);
  var headers = getHeaders_(sheet);
  var row = headers.map(function(h) {
    return dataObj[h] !== undefined ? dataObj[h] : '';
  });
  sheet.appendRow(row);
}

function updateRow(tabName, id, updatedFields) {
  var sheet = getSheet_(tabName);
  var headers = getHeaders_(sheet);
  var found = findRowById(tabName, id);
  if (!found) return null;
  var merged = Object.assign({}, found.data, updatedFields);
  var row = headers.map(function(h) {
    return merged[h] !== undefined ? merged[h] : '';
  });
  sheet.getRange(found.rowIndex, 1, 1, headers.length).setValues([row]);
  return merged;
}

function deleteRow(tabName, id) {
  var sheet = getSheet_(tabName);
  var found = findRowById(tabName, id);
  if (!found) return false;
  sheet.deleteRow(found.rowIndex);
  return true;
}

function generateId_(prefix, existingIds) {
  var maxNum = 0;
  existingIds.forEach(function(id) {
    var parts = String(id).split('-');
    var num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  });
  var next = maxNum + 1;
  return prefix + '-' + String(next).padStart(3, '0');
}
