# Requirements Document

## Introduction

This feature automates the beginning-of-year setup process for the Chavez Excel Student Profiles project and replaces the third-party AutoCrat add-on with a native Google Apps Script solution for profile document generation. Currently, setup involves 10+ manual steps (creating folders, copying templates, pasting folder IDs, configuring data validation, and setting up AutoCrat merge jobs). This feature consolidates those steps into a single automated workflow and adds native mail-merge capability using the Google Docs API, enabling full end-to-end automation from setup through profile document creation.

## Glossary

- **Setup_Script**: The Google Apps Script function(s) responsible for automating the beginning-of-year setup process, including folder creation, template copying, and spreadsheet configuration.
- **Profile_Generator**: The Google Apps Script module that replaces AutoCrat by performing mail-merge operations using the Google Docs API to produce student profile documents.
- **Setup_Sheet**: The sheet named "Setup" within the Excel Student Profiles Google Spreadsheet that stores configuration values such as folder IDs.
- **Enrolled_Sheet**: The sheet named "Enrolled" within the Excel Student Profiles Google Spreadsheet that contains student data in columns A through L.
- **Main_Folder**: The top-level Google Drive folder that houses all project subfolders and files for a given school year.
- **BMP_Folder**: The subfolder within Main_Folder where student .bmp picture files are uploaded.
- **JPG_Folder**: The subfolder within Main_Folder where converted .jpg files are stored.
- **Profiles_Folder**: The subfolder within Main_Folder where generated student profile documents are saved and shared with teachers.
- **Spreadsheet_Template**: The Google Spreadsheet template (ID: 1Xn0kIGAcfEItonYtEe1lp44IlnEnwZRkbatNmwMp7Zw) used as the student data source.
- **Doc_Template**: The Google Doc template (ID: 1EMIjCPSyxfVeyFQncplevMR66RRb_pNv0yqnJ27EJjg) used for generating student profile documents via mail merge.
- **Tag**: A placeholder in the Doc_Template enclosed in double angle brackets (e.g., `<<Name>>`) that is replaced with student data during profile generation.

## Requirements

### Requirement 1: Automated Folder Structure Creation

**User Story:** As an Academic Technology Coach, I want the setup script to automatically create the required folder structure in Google Drive, so that I do not have to manually create and organize folders at the beginning of each school year.

#### Acceptance Criteria

1. WHEN the user runs the Setup_Script, THE Setup_Script SHALL create a Main_Folder in the user's Google Drive with a name that includes the current school year (e.g., "Excel Student Profiles 2025-2026").
2. WHEN the Main_Folder is created, THE Setup_Script SHALL create a BMP_Folder inside the Main_Folder named "BMP Images".
3. WHEN the Main_Folder is created, THE Setup_Script SHALL create a JPG_Folder inside the Main_Folder named "JPG Images".
4. WHEN the Main_Folder is created, THE Setup_Script SHALL create a Profiles_Folder inside the Main_Folder named "Student Profiles".
5. IF any folder creation fails, THEN THE Setup_Script SHALL display an error message identifying which folder could not be created and stop execution.

### Requirement 2: Automated Template Copying

**User Story:** As an Academic Technology Coach, I want the setup script to automatically copy the spreadsheet and document templates into the main folder, so that I do not have to manually copy and move template files.

#### Acceptance Criteria

1. WHEN the folder structure has been created, THE Setup_Script SHALL copy the Spreadsheet_Template into the Main_Folder.
2. WHEN the folder structure has been created, THE Setup_Script SHALL copy the Doc_Template into the Main_Folder.
3. IF the Spreadsheet_Template cannot be accessed or copied, THEN THE Setup_Script SHALL display an error message stating that the spreadsheet template could not be copied.
4. IF the Doc_Template cannot be accessed or copied, THEN THE Setup_Script SHALL display an error message stating that the document template could not be copied.

### Requirement 3: Automated Setup Sheet Configuration

**User Story:** As an Academic Technology Coach, I want the setup script to automatically write the folder IDs into the Setup sheet, so that I do not have to manually find and paste folder IDs.

#### Acceptance Criteria

1. WHEN the BMP_Folder has been created, THE Setup_Script SHALL write the BMP_Folder's Google Drive ID into cell B3 of the Setup_Sheet.
2. WHEN the JPG_Folder has been created, THE Setup_Script SHALL write the JPG_Folder's Google Drive ID into cell B4 of the Setup_Sheet.
3. WHEN the Profiles_Folder has been created, THE Setup_Script SHALL write the Profiles_Folder's Google Drive ID into cell B5 of the Setup_Sheet.
4. IF the Setup_Sheet does not exist in the copied spreadsheet, THEN THE Setup_Script SHALL display an error message stating that the Setup sheet was not found.

### Requirement 4: Automated Data Validation for Advisory Column

**User Story:** As an Academic Technology Coach, I want the setup script to configure the data validation dropdown for the Advisory column based on a list of teacher initials I provide, so that I do not have to manually set up data validation rules each year.

#### Acceptance Criteria

1. WHEN the user provides a list of teacher initials, THE Setup_Script SHALL create a data validation rule on the range C2:C of the Enrolled_Sheet with a dropdown containing those teacher initials.
2. WHEN the data validation rule is applied, THE Setup_Script SHALL configure the rule to show a warning when invalid data is entered.
3. IF no teacher initials are provided, THEN THE Setup_Script SHALL skip data validation setup and display a message informing the user that data validation was not configured.

### Requirement 5: Folder Sharing with Teachers

**User Story:** As an Academic Technology Coach, I want the setup script to share the profiles folder with specified teachers, so that I do not have to manually share the folder with each teacher.

#### Acceptance Criteria

1. WHEN the user provides a list of teacher email addresses, THE Setup_Script SHALL share the Profiles_Folder with each email address using "Viewer" permission.
2. WHEN sharing is complete, THE Setup_Script SHALL display a summary indicating how many teachers were granted access.
3. IF a provided email address is invalid or sharing fails for a specific teacher, THEN THE Setup_Script SHALL log the failed email address and continue sharing with the remaining addresses.
4. IF no email addresses are provided, THEN THE Setup_Script SHALL skip the sharing step and display a message informing the user that folder sharing was not configured.

### Requirement 6: Native Profile Document Generation (AutoCrat Replacement)

**User Story:** As an Academic Technology Coach, I want to generate student profile documents using native Google Apps Script instead of AutoCrat, so that the entire workflow is automated end-to-end without depending on a third-party add-on.

#### Acceptance Criteria

1. WHEN the user runs the Profile_Generator, THE Profile_Generator SHALL read student data from columns A through L of the Enrolled_Sheet.
2. WHEN processing each student row, THE Profile_Generator SHALL create a copy of the Doc_Template in the Profiles_Folder.
3. WHEN a Doc_Template copy is created, THE Profile_Generator SHALL replace all Tags in the document body with the corresponding student data from the Enrolled_Sheet.
4. WHEN a Tag references the student image (column L), THE Profile_Generator SHALL insert the image from the hyperlink URL into the document at the Tag location.
5. WHEN the profile document is generated, THE Profile_Generator SHALL name the file using the student's name and ID number (e.g., "LastName, FirstName - 123456").
6. WHEN all student profiles have been processed, THE Profile_Generator SHALL display a summary indicating the number of profiles created and the number of rows skipped.
7. IF a student row has incomplete required data (columns A, B, or C are empty), THEN THE Profile_Generator SHALL skip that row and include the student in the skipped summary.
8. IF the Doc_Template cannot be accessed, THEN THE Profile_Generator SHALL display an error message and stop execution.
9. IF image insertion fails for a student, THEN THE Profile_Generator SHALL generate the profile document without the image and log the student's name in the summary.

### Requirement 7: Profile Generation for New Students Only

**User Story:** As an Academic Technology Coach, I want the profile generator to only create profiles for students who do not already have one, so that existing profiles are not overwritten when the script is run throughout the year.

#### Acceptance Criteria

1. WHEN processing a student row, THE Profile_Generator SHALL check columns M through P of the Enrolled_Sheet for existing AutoCrat or profile generation output data.
2. WHILE a student row already contains profile document data in column M, THE Profile_Generator SHALL skip that row.
3. WHEN a new profile document is created, THE Profile_Generator SHALL write the document URL into column M of the corresponding student row in the Enrolled_Sheet.
4. WHEN a new profile document is created, THE Profile_Generator SHALL write the document title into column N of the corresponding student row in the Enrolled_Sheet.

### Requirement 8: Setup Menu Integration

**User Story:** As an Academic Technology Coach, I want the setup and profile generation functions accessible from the spreadsheet menu, so that I can run them without opening the Apps Script editor.

#### Acceptance Criteria

1. THE onOpen function SHALL add a "Setup" menu item to the custom menu that triggers the Setup_Script.
2. THE onOpen function SHALL add a "Generate Profiles" menu item to the custom menu that triggers the Profile_Generator.
3. THE onOpen function SHALL retain the existing "Import Picture Hyperlinks" and "Profiles Help" menu items.

### Requirement 9: Setup Idempotency and Re-run Safety

**User Story:** As an Academic Technology Coach, I want the setup script to be safe to re-run without creating duplicate folders or overwriting existing configuration, so that I can re-run setup if something goes wrong.

#### Acceptance Criteria

1. WHEN the Setup_Script is run and a Main_Folder for the current school year already exists in the user's Drive, THE Setup_Script SHALL prompt the user to confirm whether to use the existing folder or create a new one.
2. WHEN the user chooses to use an existing Main_Folder, THE Setup_Script SHALL check for existing subfolders (BMP_Folder, JPG_Folder, Profiles_Folder) and reuse them instead of creating duplicates.
3. WHEN reusing existing folders, THE Setup_Script SHALL update the Setup_Sheet with the correct folder IDs.

### Requirement 10: Setup Progress Feedback

**User Story:** As an Academic Technology Coach, I want to see progress updates while the setup script runs, so that I know the script is working and can identify where issues occur.

#### Acceptance Criteria

1. WHILE the Setup_Script is executing, THE Setup_Script SHALL display a status message in the spreadsheet UI indicating the current step (e.g., "Creating folders...", "Copying templates...", "Configuring Setup sheet...").
2. WHEN the Setup_Script completes all steps, THE Setup_Script SHALL display a summary dialog listing all created folders, copied templates, and configured settings with their Google Drive URLs.
3. IF any step is skipped due to existing resources, THEN THE Setup_Script SHALL include the skipped step in the summary with a note that the existing resource was reused.
