/**
 * Excel Student Profiles Project
 * 
 * Automates the creation of Student Profiles for Chavez Excel Academy.
 * 
 * Point of contact: Alvaro Gomez, Special Campuses Academic Technology Coach, 210-363-1577
 */

/**
 * Creates a custom menu in the Google Sheet for running the image import and accessing help.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Get Picture Hyperlinks')
      .addItem('Import Picture Hyperlinks', 'processStudentImages')
      .addItem('Profiles Help', 'showHelp')
      .addToUi();
}

/**
 * Retrieves folder IDs from the 'Setup' sheet used for source BMPs and target JPGs.
 * 
 * @returns {{ BMP_FOLDER_ID: string, JPG_FOLDER_ID: string }} Object containing the source and destination folder IDs.
 */
function getFolderIds() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Setup');
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Error: 'Setup' sheet not found.");
    throw new Error("'Setup' sheet not found.");
  }

  const BMP_FOLDER_ID = sheet.getRange('B3').getValue(); // Folder ID containing .bmp images for students
  const JPG_FOLDER_ID = sheet.getRange('B4').getValue(); // Folder ID where converted .jpg files will be saved
  if (!BMP_FOLDER_ID || !JPG_FOLDER_ID) {
    SpreadsheetApp.getUi().alert("Error: Folder IDs are missing in cells B3 or B4 of the Setup sheet.");
    throw new Error("Folder IDs are missing.");
  }

  return { BMP_FOLDER_ID, JPG_FOLDER_ID };
}

/**
 * Opens the custom Help dialog window from an HTML file.
 */
function showHelp() {
  var html = HtmlService.createHtmlOutputFromFile('Help')
    .setWidth(700)
    .setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, 'Help');
}

/**
 * Converts BMP files into JPEGs, uploads them to Drive, and inserts hyperlinks
 * into column L of the spreadsheet for each student.
 */
function processStudentImages() {
  const { BMP_FOLDER_ID, JPG_FOLDER_ID } = getFolderIds();

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  
  // Get data from columns B, D, and L
  var studentNames = sheet.getRange(2, 2, lastRow - 1, 1).getValues(); // Column B
  var entryDates = sheet.getRange(2, 4, lastRow - 1, 1).getValues(); // Column D
  var imageLinks = sheet.getRange(2, 12, lastRow - 1, 1).getValues(); // Column L

  var imageFolder = DriveApp.getFolderById(BMP_FOLDER_ID);
  var updatedLinks = [];

  for (var i = 0; i < studentNames.length; i++) {
    var studentName = studentNames[i][0];
    var entryDate = entryDates[i][0];
    var existingImageLink = imageLinks[i][0];

    if (!existingImageLink) {
      if (!(entryDate instanceof Date) || isNaN(entryDate)) {
        Logger.log('Invalid or missing date for: ' + studentName);
        updatedLinks.push(['']);
        continue;
      }

      var formattedDate = formatCustomDate(entryDate);
      var bmpFileName = studentName + ' ' + formattedDate + '.bmp';
      var bmpFile = findFileInFolder(imageFolder, bmpFileName);

      if (bmpFile) {
        var jpgBlob = convertBmpToJpg(bmpFile);
        if (jpgBlob) {
          var jpgUrl = uploadJpgToDrive(jpgBlob, studentName, JPG_FOLDER_ID);
          updatedLinks.push([jpgUrl || '']);
          Logger.log(jpgUrl ? 'Processed: ' + studentName : 'Upload failed for: ' + studentName);
        } else {
          Logger.log('Conversion failed for: ' + studentName);
          updatedLinks.push(['']);
        }
      } else {
        Logger.log('File not found for: ' + studentName + ' (' + bmpFileName + ')');
        updatedLinks.push(['']);
      }
    } else {
      Logger.log('Skipping (already has image): ' + studentName);
      updatedLinks.push([existingImageLink]);
    }
  }

  // Write all links back to column L in the sheet
  sheet.getRange(2, 12, updatedLinks.length, 1).setValues(updatedLinks);
  
  let processedCount = updatedLinks.filter(link => link[0]).length;
  let skippedCount = updatedLinks.length - processedCount;

  SpreadsheetApp.getUi().alert(
    `Student image processing completed.\nProcessed: ${processedCount}\nSkipped: ${skippedCount}`
  );
}

/**
 * Formats a Date object into "M.D.YY" format.
 * 
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date string.
 */
function formatCustomDate(date) {
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var year = date.getYear() - 100;
  return month + '.' + day + '.' + year;
}

/**
 * Finds a file by name within a given Google Drive folder.
 * 
 * @param {GoogleAppsScript.Drive.Folder} folder - The Drive folder to search in.
 * @param {string} fileName - The exact name of the file to find.
 * @returns {GoogleAppsScript.Drive.File|null} The found file, or null if not found.
 */
function findFileInFolder(folder, fileName) {
  var files = folder.getFilesByName(fileName);
  return files.hasNext() ? files.next() : null;
}

/**
 * Simulates conversion of a BMP file to JPG by renaming the blob with a .jpg extension.
 * 
 * @param {GoogleAppsScript.Drive.File} bmpFile - The BMP file to "convert".
 * @returns {GoogleAppsScript.Base.Blob|null} A renamed Blob as JPG, or null on failure.
 */
function convertBmpToJpg(bmpFile) {
  try {
    return bmpFile.getBlob().setName(bmpFile.getName().replace(/\.bmp$/, '.jpg'));
  } catch (e) {
    Logger.log('Error converting BMP to JPG: ' + e.message);
    return null;
  }
}

/**
 * Uploads a JPG Blob to a specified folder in Drive and returns its URL.
 * 
 * @param {GoogleAppsScript.Base.Blob} jpgBlob - The JPG blob to upload.
 * @param {string} studentName - The name associated with the image (for logging).
 * @param {string} JPG_FOLDER_ID - The ID of the Drive folder to upload the image to.
 * @returns {string|null} The URL of the uploaded image, or null if upload fails.
 */
function uploadJpgToDrive(jpgBlob, studentName, JPG_FOLDER_ID) {
  try {
    var folder = DriveApp.getFolderById(JPG_FOLDER_ID);
    var jpgFile = folder.createFile(jpgBlob);
    return jpgFile.getUrl();
  } catch (e) {
    Logger.log('Error uploading JPG for ' + studentName + ': ' + e.message);
    return null;
  }
}
