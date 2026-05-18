[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

# Excel Student Profiles

A Google Apps Script bound to a Google Sheet that automates the creation of student profile documents. It converts student BMP photo files to JPG format, uploads them to Google Drive, and inserts the image hyperlinks into the spreadsheet for use with a mail-merge tool such as [AutoCrat](https://workspace.google.com/marketplace/app/autocrat/539341275670).

Originally created for Northside ISD. Generalized for public use.

---

## What It Does

When a user clicks **Get Picture Hyperlinks → Import Picture Hyperlinks** from the custom menu:

1. Reads student names and entry dates from the active sheet (columns B and D).
2. Looks up each student's BMP photo file in a source Google Drive folder.
3. Converts the BMP to JPG by renaming the file blob.
4. Uploads the JPG to a destination Google Drive folder.
5. Writes the image URL back into column L of the spreadsheet.
6. Displays a summary of processed and skipped students.

Rows that already have an image link in column L are skipped automatically, so the script is safe to run multiple times.

---

## Requirements

- A Google Account with access to Google Sheets and Google Drive
- [AutoCrat](https://workspace.google.com/marketplace/app/autocrat/539341275670) (for the mail-merge step that generates the profile documents)
- Student BMP photo files uploaded to a Google Drive folder
- The script bound to a Google Sheet with the following structure:
  - **Setup sheet** — contains the Drive folder IDs in cells B3 and B4
  - **Enrolled sheet** — contains student data with names in column B, entry dates in column D, and image links in column L

---

## Setup

### 1. Clone or copy the project

```bash
git clone https://github.com/AlvaroGomezMartinez/excel-student-profiles-project.git
```

Or use [clasp](https://github.com/google/clasp) to push directly to an existing Apps Script project:

```bash
npm install -g @google/clasp
clasp login
clasp push
```

### 2. Create the required Google Drive folders

- **BMP folder** — upload student `.bmp` photo files here
- **JPG folder** — converted images will be saved here
- **Profiles folder** — where AutoCrat will place the finished profile documents

### 3. Configure the Setup sheet

Open the bound Google Sheet, go to the **Setup** tab, and enter:

| Cell | Value |
|------|-------|
| B3   | Google Drive folder ID for BMP source images |
| B4   | Google Drive folder ID for JPG destination images |

To find a folder ID, open the folder in Google Drive and copy the string of characters after `/folders/` in the URL.

### 4. Set up AutoCrat

AutoCrat handles the mail-merge step that generates the individual profile documents. See the in-app Help dialog (**Get Picture Hyperlinks → Profiles Help**) for full AutoCrat setup instructions.

### 5. Run the script

1. Open the bound Google Sheet.
2. Click **Get Picture Hyperlinks → Import Picture Hyperlinks**.
3. After the script completes, run your AutoCrat job to generate the profile documents.

---

## Script Properties

This script does not use Script Properties. Folder IDs are read directly from the **Setup** sheet at runtime, keeping configuration visible and editable without touching the script.

---

## Triggers

No triggers are required. The script runs on demand from the custom menu. The `onOpen()` function runs automatically when the spreadsheet is opened to create the menu — this is a built-in Apps Script trigger that requires no manual setup.

---

## Project Structure

```
excel-student-profiles-project/
├── src/
│   ├── Code.js           # Main script
│   ├── Help.html         # In-app help dialog
│   └── appsscript.json   # Apps Script manifest
├── .clasp.json           # clasp config (not committed — see .gitignore)
├── .claspignore          # Controls which files clasp pushes
├── .gitignore
├── LICENSE
└── README.md
```

---

## Attribution

Originally created for Northside Independent School District (NISD). Generalized and released for public use upon retirement.

---

## License

[MIT](LICENSE) © 2025 Alvaro Gomez
