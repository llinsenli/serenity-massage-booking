# Serenity Massage Studio Booking System

A Google Apps Script-based appointment booking system for a massage studio, integrated with Google Forms and Google Sheets for seamless scheduling, cancellation, and rescheduling functionality.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Deployment Instructions](#deployment-instructions)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Overview
This project automates appointment scheduling for a massage studio using Google Apps Script. It integrates with Google Forms for booking, Google Sheets for data storage, and provides email notifications for confirmations, cancellations, and rescheduling. The system supports dynamic time slot management, prevents double-booking, and allows clients to manage their appointments via unique links.

## Features
- **Dynamic Time Slot Management**: Generates available appointment slots for a configurable number of days (default: 5 days) between specified hours (default: 9 AM to 9 PM).
- **Booking Confirmation**: Sends HTML-formatted email confirmations to clients with appointment details and links to cancel or reschedule.
- **Cancellation and Rescheduling**: Provides a web app interface for clients to cancel or reschedule appointments, with automatic updates to the Google Form and Sheet.
- **Admin Notifications**: Emails the studio owner with booking updates and a summary of today's and tomorrow's appointments.
- **Automatic Slot Refresh**: Updates available time slots daily or when the "Status" column is edited, ensuring no past or booked slots are offered.
- **Spreadsheet Integration**: Stores booking details (name, email, phone, duration, time slot, status) in a Google Sheet for easy management.
- **Custom Admin Menu**: Adds a Google Sheets menu to manually refresh available time slots.

## Repository Structure
```
serenity-massage-booking/
├── Code.gs                # Main Google Apps Script file
├── README.md              # Project documentation (this file)
├── appsscript.json        # Google Apps Script project configuration
├── LICENSE                # MIT License file
└── .gitignore             # Git ignore file for sensitive data
```

## Prerequisites
- A Google account with access to Google Forms, Google Sheets, and Google Apps Script.
- Basic familiarity with Google Apps Script and Google Cloud Platform.
- A GitHub account for version control.

## Setup Instructions
1. **Create Google Form and Sheet**:
   - Create a Google Form with fields for:
     - Name (Short answer)
     - Email (Short answer)
     - Phone (Short answer)
     - Duration (Multiple choice, e.g., "30 min", "60 min")
     - Select Appointment Time (Multiple choice, will be populated dynamically)
   - Link the form to a Google Sheet to store responses (Form → Responses → Click the green Sheets icon “Create Spreadsheet”).
   - From the spreadsheet: Go to Extensions > Apps Script

2. **Get Form and Sheet IDs**:
   - Copy the Form ID from the Google Form URL: `https://docs.google.com/forms/d/[FORM_ID]/edit`.
   - Copy the Sheet URL from the Google Sheet: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`.

3. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/serenity-massage-booking.git
   cd serenity-massage-booking
   ```

4. **Configure the Script**:
   - Open `Code.gs` and update the configuration variables:
     - `FORM_ID`: Set to your Google Form ID.
     - `SHEET_URL`: Set to your Google Sheet URL.
     - `YOUR_EMAIL`: Set to the studio owner's email address.
     - `START_HOUR` and `END_HOUR`: Define the operating hours (e.g., 9 for 9 AM, 21 for 9 PM).
     - `DAYS_AHEAD`: Number of days to offer slots for (e.g., 5 for today + 4 days).
   - Ensure column indices (`COL_NAME`, `COL_EMAIL`, etc.) match your Google Sheet's response structure.

5. **Set Up Google Apps Script Project**:
   - Go to [script.google.com](https://script.google.com) and create a new project.
   - Copy the contents of `Code.gs` into the script editor.
   - Copy the contents of `appsscript.json` into the project’s `appsscript.json` file (enable "Show manifest file" in Project Settings if needed).

6. **Add Triggers**:
   Configure the following triggers in the Google Apps Script editor under **Triggers**:
   1. **Daily Time Slot Refresh**  
      - **Function**: `resetWeeklyTimeSlots`  
      - **Event Source**: Time-driven  
      - **Trigger Type**: Day timer  
      - **Time**: 12 AM–1 AM  
   2. **Form Submission Handler**  
      - **Function**: `onFormSubmit`  
      - **Event Source**: From spreadsheet  
      - **Event Type**: On form submit  
   3. **Spreadsheet Edit Handler (Optional)**  
      - **Function**: `onEdit`  
      - **Event Source**: From spreadsheet  
      - **Event Type**: On edit

## Deployment Instructions
1. **Deploy the Web App**:
   - In the Apps Script editor, click **Deploy** → **New deployment** → **Web app**.
   - Set:
     - **Execute as**: Me (your Google account).
     - **Who has access**: Anyone (to allow clients to cancel/reschedule).
   - Click **Deploy** and copy the web app URL.
   - Update the `WEB_APP_URL` constant in `Code.gs` with this URL.

2. **Test the Form**:
   - Open the Google Form and verify that time slots are populated correctly.
   - Submit a test booking to ensure:
     - The Sheet updates with the booking details.
     - The client receives a confirmation email with cancel/reschedule links.
     - The admin receives a notification with a today/tomorrow schedule table.

3. **Push to GitHub**:
   - Initialize Git if not already done:
     ```bash
     git init
     git add .
     git commit -m "Initial commit of Serenity Massage Booking system"
     git remote add origin https://github.com/your-username/serenity-massage-booking.git
     git push -u origin main
     ```

## Usage
- **Clients**:
  - Fill out the Google Form to book an appointment.
  - Receive a confirmation email with appointment details and links to cancel or reschedule.
  - Use the cancel link to cancel the appointment or the reschedule link to return to the form for a new time slot.
- **Admins**:
  - View bookings in the linked Google Sheet.
  - Receive email notifications for new bookings, cancellations, and rescheduling requests.
  - Use the custom "Appointments" menu in the Sheet to manually refresh available time slots.

## Contributing
Contributions are welcome! Please:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.