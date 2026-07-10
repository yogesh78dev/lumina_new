# Lumina Travel CRM - Project Information & Usage Guide

## 1. Project Overview

Lumina Travel CRM is a complete customer relationship management system designed for travel, visa, package, passport, and service-based agencies. The platform helps the team manage leads, customers, follow-ups, invoices, proforma invoices, users, vendors, master data, reports, and day-to-day operational tracking from one centralized panel.

The system is built for agencies that handle multiple enquiries every day and need a structured workflow from lead creation to customer conversion, billing, documentation, and team performance tracking.

## 2. Main Purpose

This CRM is useful for:

- Capturing and managing travel or visa leads.
- Assigning leads to agents and tracking ownership.
- Monitoring lead status, category, source, country, and service type.
- Managing follow-ups, reminders, notes, documents, and communication history.
- Converting successful leads into customers.
- Creating invoices and proforma invoices.
- Managing users, roles, permissions, vendors, master data, and company settings.
- Importing bulk leads using CSV, XLS, or XLSX files.
- Giving admin control over sidebar order, master dropdowns, and CRM configuration.

## 3. Technology Stack

- Frontend: React 18, TypeScript, Vite
- Routing: React Router
- UI/UX: Tailwind-style utility classes, custom CSS, Remix Icon
- Charts and Reports: Chart.js
- Excel/CSV Handling: xlsx
- QR Support: qrcode
- Alerts and Confirmations: SweetAlert2
- Backend Structure: Node.js/Express-style controllers and routes
- Data Modules: Leads, customers, invoices, users, roles, settings, vendors, notifications, imports, exports, targets, quotes, and communication

## 4. Key Modules

### 4.1 Login and Authentication

- Secure login page.
- Forgot password screen.
- Protected application routes after login.
- User profile access.
- Login activity tracking for users.
- Local fallback images and logo support for stable login screen display.

### 4.2 Dashboard

The dashboard gives a quick operational summary of the business.

It includes:

- Total leads overview.
- New leads count.
- Follow-up count.
- Unassigned leads count.
- Total customers.
- Paid invoice revenue tracking.
- Lead pipeline chart.
- Lead source chart.
- Agent performance overview.
- Quick actions for creating leads, invoices, and users.

### 4.3 Lead Management

The Lead module is the core module of the CRM.

Main features:

- Create lead.
- Edit lead.
- View lead details.
- Delete lead.
- Assign lead to an agent.
- Bulk assign leads.
- Bulk status update.
- Bulk delete leads.
- Search, filter, sort, and paginate leads.
- Responsive list and form design.
- Lead status color display.
- Lead progress/completion mapping.
- Lead category and lead type support.
- Country selection using dynamic managed country list.
- Searchable country dropdown.
- Lead source tracking.
- Notes and remarks.
- Reminder management.
- Lead activity timeline.
- Lead documents.
- Lead emails and communication tabs.
- Kanban-style pipeline movement.
- Convert lead into customer.

Supported lead data includes:

- Name
- Phone
- Email
- Service
- Lead Type
- Lead Category
- Country
- Location
- Lead Source
- Lead Status
- Assigned Agent
- Lead Date
- Notes/Remark
- Application Status
- Passport Status
- Document Status

### 4.4 Lead Status Management

Admin can manage lead statuses from Master Data.

Lead Status supports:

- Status name.
- Status color.
- Progress/completion percentage.
- Usage in lead dropdowns.
- Usage in lead table badges.
- Usage in pipeline and dashboard visualization.
- Backward compatibility with existing leads.

This helps the agency visually identify the stage of each lead.

### 4.5 Lead Category Management

Lead Category is configurable from Master Data.

Examples currently supported:

- Domestic Package
- International Package
- Study Visa
- Business Trip
- Package
- Passport

These categories appear in create lead, edit lead, filters, and import validation.

### 4.6 Lead Type Management

Lead Type is configurable from Master Data and appears in lead forms and import templates.

It can be used to classify the nature of the service, such as Visa, Holiday Package, Passport, Business Travel, or other agency-specific services.

### 4.7 Bulk Lead Import

The CRM supports importing leads through CSV, XLS, and XLSX files.

Import columns:

- Name
- Phone
- Email
- Service
- Lead Type
- Lead Category
- Country
- Date
- Assign To Agent
- Lead Source
- Notes/Remark

Important import behavior:

- Date should be entered in DD-MM-YYYY format.
- Lead Status validation supports case-insensitive matching.
- Lead Category validation supports case-insensitive matching.
- Country validation uses the managed Country master list.
- Assign To Agent supports valid portal user names.
- Blank, UNKNOWN, unknown, unassigned, N/A, none, null, and similar empty values are treated as unassigned.
- Import errors are shown row-wise so the user can correct the file.
- Import history is maintained.

Admin can also download a sample CSV template from the Import screen.

### 4.8 Customer Management

The Customer module helps maintain confirmed or converted clients.

Features:

- Customer listing.
- Add customer.
- Edit customer.
- Customer details such as name, phone, email, company name, GST number, country, location, service type, vendor, sale by, close date, action, and passport status.
- Searchable country dropdown.
- Customer data linked with lead conversion.

### 4.9 Proforma Invoice

The Proforma Invoice module is available from the Lead module.

Features:

- Generate proforma invoice for a lead.
- Page-based invoice generation instead of modal-only flow.
- Service charge input.
- Handling charges input.
- Other charges input.
- Tax percentage applicable on handling and other charges.
- Default tax percentage can be 18%.
- Company branding and panel logo support.
- Bank details and QR code support.
- Payment terms section.
- Clean invoice layout suitable for sharing with clients.
- Powered by My Way Destination branding line.

### 4.10 Invoice Management

Invoice module supports business billing operations.

Features:

- Create invoice.
- Edit invoice.
- Track invoice status.
- Invoice list.
- Paid revenue usage in dashboard.
- Invoice-related role permission support.

### 4.11 Reminders and Follow-ups

The CRM includes follow-up and reminder functionality to help agents stay on top of active leads.

Features:

- Lead reminders.
- Follow-up tracking.
- Reminder page.
- Dashboard visibility for pending follow-up work.

### 4.12 Vendors

Vendor management is available for agencies that work with multiple partners, suppliers, visa vendors, or service providers.

Features:

- Vendor listing.
- Add/edit vendor.
- Vendor assignment in customer records.

### 4.13 Chat and Communication

The project contains chat and communication-related modules.

Available areas include:

- Chat page.
- Communication backend routes.
- Lead email tab.
- Notification routes and notification types.

### 4.14 Settings

The Settings module gives admin-level control over the CRM.

Major settings include:

- Company Profile
- Sidebar Menu
- Master Data
- Announcements
- Users
- Roles
- Data Import
- Data Export
- Set Targets

### 4.15 Company Profile

Admin can manage company information used across the CRM.

Company details include:

- Company name.
- Address.
- Phone.
- Email.
- Website.
- Country.
- Logo.
- Other company-related branding details.

### 4.16 Sidebar Menu Management

Admin can manage the order of sidebar modules.

Example:

- Customer first
- Lead second
- Settings later

This allows the admin to arrange the CRM navigation according to the team workflow.

This functionality is available only for admin users.

### 4.17 Master Data

Master Data allows admin users to manage dropdown values used across the CRM.

Available master data sections include:

- Lead Status
- Lead Category
- Application Status
- Remark Status
- Lead Source
- Lead Type
- Lost Reason
- Passport Status
- Document Type
- Country

Country master includes:

- Country name.
- ISO code.
- Phone code.
- Searchable and responsive country list.
- Usage in lead and customer dropdowns.
- Usage in bulk import validation.

### 4.18 User Management

Admin can manage system users.

Features:

- Add user.
- Edit user.
- Delete user.
- View users.
- Role assignment.
- User activity and login tracking.
- Protection against deleting own logged-in account.

### 4.19 Role and Permission Management

Role management controls what each user can access.

Permission areas include:

- Leads Management
- Customer Relations
- Billing & Invoices
- User Management
- General Settings
- Reports and other permission sections depending on configuration

This helps separate admin, manager, and agent-level access.

### 4.20 Data Export

Data export functionality is available from Settings.

It can be used to record and manage export requests or operational data extraction based on admin needs.

### 4.21 Targets

Admin can set targets for users.

Target module supports:

- Assigning goals to users.
- Tracking active target matrix.
- Managing target records.

### 4.22 Announcements

Admin can create announcements for selected users.

Features:

- Create announcement.
- Select recipients.
- Schedule announcement.
- View announcement list.
- Delete announcement.

### 4.23 Security and Activity

The project includes security and logging-related modules.

Available areas include:

- Login activity.
- User activity logs.
- System logs.
- Protected routes.
- Role-based access structure.

## 5. Typical Usage Flow

### Step 1: Admin Configures CRM

Admin should first configure:

- Company profile.
- Company logo.
- Lead statuses with colors and progress.
- Lead categories.
- Lead types.
- Lead sources.
- Countries.
- Users and roles.
- Sidebar order.

### Step 2: Team Adds or Imports Leads

Leads can be created manually or imported in bulk through CSV/XLS/XLSX.

During lead creation, the user can select:

- Service.
- Lead Type.
- Lead Category.
- Country.
- Lead Source.
- Lead Status.
- Assigned Agent.

### Step 3: Agents Work on Leads

Agents can:

- Update lead status.
- Add notes.
- Add reminders.
- Track documents.
- Follow up with clients.
- Move lead through pipeline stages.

### Step 4: Lead Converts to Customer

When a lead is confirmed, it can be converted into a customer.

### Step 5: Generate Invoice or Proforma Invoice

Team can create:

- Proforma invoice from lead.
- Invoice from billing module.

### Step 6: Admin Monitors Performance

Admin can review:

- Dashboard metrics.
- Lead pipeline.
- Agent performance.
- Import history.
- Targets.
- Customer and invoice data.

## 6. Bulk Import Guidelines for Client

Use the sample template from the portal whenever possible.

Recommended date format:

```text
DD-MM-YYYY
Example: 01-06-2026
```

Assign To Agent column:

```text
Allowed empty values:
blank
UNKNOWN
unknown
unassigned
N/A
none
null
-
```

If the lead should be assigned to a user, enter the exact portal user name.

Lead Category and Lead Status:

- Matching is case-insensitive.
- Example: `study visa`, `Study Visa`, and `STUDY VISA` can be accepted if the master value exists.

Country:

- Country must exist in the Country master list.
- If a country is missing, admin should add it in Settings > Master Data > Country.

## 7. Admin Configuration Checklist

Before giving the CRM to the team, admin should verify:

- Company logo is uploaded.
- Company profile is complete.
- Users are created.
- Roles and permissions are configured.
- Lead statuses have correct colors and progress.
- Lead categories are configured.
- Lead types are configured.
- Lead sources are configured.
- Country list is complete.
- Sidebar menu order is arranged.
- Invoice and proforma invoice details are checked.
- QR and bank details are verified.

## 8. Project Setup for Developers

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Create production build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## 9. Project Folder Structure

```text
backend/      Backend controllers, routes, and utility logic
components/   Reusable UI components and module components
context/      CRM global state and actions
hooks/        Custom React hooks
pages/        Main application pages
public/       Public assets such as QR codes and auth images
services/     API layer and mock data
utils/        Common utilities
types.ts      Shared TypeScript interfaces and types
App.tsx       Main route configuration
index.css     Global styling
```

## 10. Business Benefits

- Reduces manual lead tracking.
- Improves follow-up discipline.
- Helps avoid missed enquiries.
- Gives admins visibility into team performance.
- Keeps master data centralized.
- Supports bulk import for faster onboarding of leads.
- Helps maintain consistent client records.
- Simplifies proforma invoice and invoice generation.
- Provides role-based access for better control.
- Makes the CRM flexible through configurable dropdowns and sidebar ordering.

## 11. Recommended Client Training Topics

Train the client team on:

- How to create a lead.
- How to import leads.
- How to correct import validation errors.
- How to assign leads.
- How to update lead status.
- How to add reminders and notes.
- How to convert a lead to customer.
- How to generate proforma invoice.
- How to manage countries and master data.
- How admin can manage users, roles, and sidebar order.

## 12. Summary

Lumina Travel CRM is a configurable CRM solution for travel and visa businesses. It brings lead management, customer management, billing, proforma invoice generation, follow-ups, reminders, master data, imports, users, roles, and admin controls into one organized platform.

The system is suitable for teams that want better control over enquiries, faster lead handling, cleaner reporting, and a professional workflow from first contact to final billing.
