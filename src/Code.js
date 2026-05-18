/**
 * @module ExcelStudentProfiles
 *
 * A Google Apps Script bound to a Google Sheet that automates the creation of
 * student profile documents. It converts student BMP photo files to JPG format,
 * uploads them to Google Drive, and inserts the image hyperlinks into the
 * spreadsheet for use with a mail-merge tool such as AutoCrat.
 *
 * Originally created for a school district. Generalized for public use.
 */

/**
 * Creates a custom menu in the Google Sheet for running the image import and accessing help.
 * Runs automatically when the spreadsheet is opened.
 *
 * @return {void}
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Get Picture Hyperlinks')
      .addItem('Import Picture Hyperlinks', 'processStudentImages')
      .addItem('Profiles Help', 'showHelp')
      .addToUi();
}

/**
 * Reads the source (BMP) and destination (JPG) Google Drive folder IDs from
 * the 'Setup' sheet. Expects the BMP folder ID in cell B3 and the JPG folder
 * ID in cell B4. Alerts the user and throws if either value is missing.
 *
 * @return {{ BMP_FOLDER_ID: string, JPG_FOLDER_ID: string }} An object containing
 *     the source folder ID for BMP images and the destination folder ID for JPG images.
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
 * Opens the Help dialog as a modal window using an HTML file named 'Help'.
 *
 * @return {void}
 */
function showHelp() {
  var html = HtmlService.createHtmlOutputFromFile('Help')
    .setWidth(700)
    .setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, 'Help');
}

/**
 * Main entry point. For each student row in the active sheet, converts the
 * corresponding BMP photo file to JPG, uploads it to Google Drive, and writes
 * the image URL back into the spreadsheet. Rows that already have an image link
 * or are missing a valid entry date are skipped. Displays a summary alert when
 * complete.
 *
 * Reads student names from column B, entry dates from column D, and existing
 * image links from column L. Writes updated image links back to column L.
 *
 * @return {void}
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
  var skippedSummary = [];

  for (var i = 0; i < studentNames.length; i++) {
    var studentName = studentNames[i][0];
    var entryDate = entryDates[i][0];
    var existingImageLink = imageLinks[i][0];

    if (!existingImageLink) {
      if (!(entryDate instanceof Date) || isNaN(entryDate)) {
        Logger.log('Invalid or missing date for: ' + studentName);
        updatedLinks.push(['']);
        skippedSummary.push(studentName + ': Invalid or missing date');
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
          if (!jpgUrl) skippedSummary.push(studentName + ': Upload failed');
        } else {
          Logger.log('Conversion failed for: ' + studentName);
          updatedLinks.push(['']);
        }
      } else {
        Logger.log('File not found for: ' + studentName + ' (' + bmpFileName + ')');
        updatedLinks.push(['']);
        skippedSummary.push(studentName + ': BMP file not found');
      }
    } else {
      Logger.log('Skipping (already has image): ' + studentName);
      updatedLinks.push([existingImageLink]);
      skippedSummary.push(studentName + ': Already has image');
    }
  }

  // Write all links back to column L in the sheet
  sheet.getRange(2, 12, updatedLinks.length, 1).setValues(updatedLinks);
  
  let processedCount = updatedLinks.filter(link => link[0]).length;
  let skippedCount = updatedLinks.length - processedCount;

  var summaryText = `Student image processing completed.\nProcessed: ${processedCount}\nSkipped: ${skippedCount}`;
  if (skippedSummary.length > 0) {
    summaryText += '\n\nSkipped Students and Reasons:';
    summaryText += '\n' + skippedSummary.join('\n');
  }
  SpreadsheetApp.getUi().alert(summaryText);
}

/**
 * Formats a Date object into "M.D.YY" format (e.g., 9.5.24 for September 5, 2024).
 *
 * @param {Date} date - The date to format.
 * @return {string} The formatted date string in M.D.YY format.
 */
function formatCustomDate(date) {
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var year = date.getYear() - 100;
  return month + '.' + day + '.' + year;
}

/**
 * Searches a Google Drive folder for a file matching the given name.
 *
 * @param {GoogleAppsScript.Drive.Folder} folder - The Drive folder to search.
 * @param {string} fileName - The exact file name to look for.
 * @return {GoogleAppsScript.Drive.File|null} The matching file, or null if not found.
 */
function findFileInFolder(folder, fileName) {
  var files = folder.getFilesByName(fileName);
  return files.hasNext() ? files.next() : null;
}

/**
 * Converts a BMP file to JPG by renaming its blob with a .jpg extension.
 * Note: This does not perform a true image format conversion — it renames the
 * blob so it can be stored and referenced as a JPG in Google Drive.
 *
 * @param {GoogleAppsScript.Drive.File} bmpFile - The BMP file to convert.
 * @return {GoogleAppsScript.Base.Blob|null} The renamed blob, or null if an error occurs.
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
 * Uploads a JPG blob to a specified Google Drive folder and returns the file URL.
 *
 * @param {GoogleAppsScript.Base.Blob} jpgBlob - The JPG blob to upload.
 * @param {string} studentName - The student's name, used for logging purposes.
 * @param {string} JPG_FOLDER_ID - The ID of the destination Drive folder.
 * @return {string|null} The URL of the uploaded file, or null if the upload fails.
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
