# Product Requirements Document (PRD)
## Construction Machinery Maintenance & Spare Parts Tracking System (CMMS)

**Version:** 1.0
**Status:** Draft
**Document Owner:** Product Team
**Platform:** Web Application

---

## 1. Executive Summary

### Purpose
The Construction Machinery Maintenance & Spare Parts Tracking System (CMMS) is a centralized web-based platform designed to monitor, manage, and document every maintenance activity performed on construction machinery.

Unlike a traditional maintenance management system, this platform is built around administrative oversight. Every maintenance activity—from issue reporting to spare part replacement—is monitored, verified, approved, and permanently recorded by the Admin.

The system introduces multiple verification stages involving the Driver, Site Manager, Accountant, and Admin to ensure that no spare part is replaced without proper authorization and documentation.

---

## 2. Vision

To build a transparent, accountable, and traceable machinery maintenance system where every spare part replacement is monitored, verified, and permanently recorded, enabling the Admin to oversee all maintenance activities with complete visibility.

---

## 3. Primary Goal

The primary goal of the system is to enable the Admin to oversee every maintenance activity and manage every spare part replacement throughout its complete lifecycle.

The system enables the Admin to:
- Monitor all construction machinery.
- Track every issue reported.
- Compare independent reports from Drivers and Site Managers.
- Prevent unauthorized spare part replacement.
- Manage spare part purchasing.
- Verify spare part delivery.
- Track installation of new spare parts.
- Record removed (old) spare parts and newly installed spare parts.
- Maintain complete maintenance histories for every machine.
- Generate operational and maintenance reports.

---

## 4. Problem Statement

Construction companies frequently encounter the following challenges:
- Spare parts are replaced without proper approval.
- Drivers are unaware that parts have been replaced.
- Poor communication between field personnel.
- No centralized maintenance history.
- Lack of accountability in spare part purchasing.
- Missing maintenance documentation.
- Difficulty auditing previous maintenance activities.

This system addresses these challenges through a structured approval and verification workflow.

---

## 5. User Roles

| Role | Responsibility |
|---|---|
| **Admin** | Oversees the entire maintenance process and approves all critical actions. |
| **Driver** | Reports machinery issues and confirms repairs after maintenance. |
| **Site Manager** | Reports machinery issues, confirms receipt of purchased spare parts, and verifies completed repairs. |
| **Accountant** | Purchases requested spare parts and reports purchasing details to the Admin. |

---

## 6. Core Business Principle

> Every spare part replacement must be independently verified, approved, documented, and permanently recorded before it becomes part of a machine's maintenance history.

No spare part replacement should occur based on a single user's request.

---

## 7. Overall Workflow

```
Issue Occurs
│
├──────────────► Driver submits Issue Report
│
└──────────────► Site Manager submits Issue Report
│
▼
Admin compares both reports
│
┌───────────┴───────────┐
│                       │
Reports Match      Reports Do Not Match
│                       │
▼                       ▼
Approve            Request Clarification / Reject
│
▼
Admin creates Spare Part Purchase Request
│
▼
Accountant purchases Spare Part
│
▼
Accountant submits Purchase Report
│
▼
Site Manager receives Spare Part
│
▼
Site Manager submits Receipt Verification
│
▼
Admin verifies Purchase + Receipt
│
▼
Repair / Spare Part Installation
│
├──────────────► Driver Final Verification
│
└──────────────► Site Manager Final Verification
│
▼
Admin Final Approval
│
▼
Vehicle Maintenance History Updated
```

---

## 8. Functional Requirements

### 8.1 Admin Module

The Admin has complete control over the system and monitors all maintenance activities.

#### Dashboard
The dashboard displays:
- Total Vehicles
- Active Drivers
- Active Site Managers
- Active Accountants
- Pending Driver Issue Reports
- Pending Site Manager Issue Reports
- Pending Issue Validations
- Pending Spare Part Requests
- Pending Purchases
- Pending Spare Part Receipt Confirmations
- Pending Final Repair Verifications
- Maintenance Statistics
- Recent Activities
- Notifications

### 8.2 Vehicle (Car) Management

The Admin can:
- Create Vehicle
- View Vehicle
- Update Vehicle
- Delete Vehicle
- Search Vehicle
- Filter Vehicle

#### Vehicle Information
- Vehicle ID
- Plate Number
- Machine Name
- Machine Type
- Brand
- Model
- Manufacturing Year
- Engine Number
- Chassis Number
- Current Mileage / Engine Hours
- Assigned Driver
- Assigned Site
- Current Status
- Registration Documents

#### Vehicle Status
- Active
- Under Maintenance
- Waiting for Spare Part
- Out of Service

#### Vehicle Details
Each vehicle displays:
- General Information
- Assigned Driver
- Assigned Site
- Current Maintenance Status
- Issue Timeline
- Maintenance Timeline
- Spare Parts Replaced
- Maintenance Cost Summary
- Photos
- Documents

### 8.3 Vehicle Maintenance History (Core Module)

This is the heart of the system.

Every maintenance record permanently stores:

**Issue Reporting:** Driver Report, Site Manager Report
**Admin Validation:** Validation Decision, Notes
**Spare Part Request:** Requested Spare Part, Quantity, Serial Number, Request Date
**Purchasing:** Accountant Purchase Report, Supplier, Invoice, Price, Purchase Photo
**Spare Part Receipt:** Site Manager Receipt Verification, Receipt Photo, Receipt Date
**Installation:** Old Spare Part, New Spare Part, Installation Date, Installed By
**Final Verification:** Driver Verification, Site Manager Verification, Admin Approval
**Attachments:** Photos Before Repair, Photos After Repair

> Maintenance history cannot be edited or deleted after completion.

---

## 9. Driver Module

### Login
- Username, Assigned Vehicle Type, Password

### Dashboard
Displays:
- Assigned Vehicle
- Active Maintenance Requests
- Previous Reports
- Notifications

### Issue Report
The Driver independently submits an issue report to the Admin. The Driver cannot view the Site Manager's report.

Fields:
- Vehicle
- Issue Category
- Photo (Required)
- Description (Optional)
- Date

### Final Verification
After repair: Photo, Description, Date — Submitted to Admin.

---

## 10. Site Manager Module

### Login
- Username, Password

### Dashboard
Displays:
- Active Issues
- Pending Spare Part Receipts
- Pending Final Verifications
- Notifications

### Issue Report
The Site Manager independently submits an issue report to the Admin. The Site Manager cannot view the Driver's report.

Fields:
- Vehicle
- Issue Category
- Photo (Required)
- Description (Optional)
- Date

### Spare Part Receipt Verification
After receiving the purchased spare part from the Accountant:
- Spare Part Name
- Serial Number
- Photo (Required)
- Description (Optional)
- Date Received

### Final Verification
After repair: Photo, Description, Date — Submitted to Admin.

---

## 11. Accountant Module

### Login
- Username, Password

### Dashboard
Displays:
- Pending Purchase Requests
- Completed Purchases
- Notifications

### Purchase Requests
Receives requests from Admin. Each request contains:
- Vehicle
- Assigned Site Manager
- Spare Part Name
- Serial Number
- Quantity
- Priority
- Notes

### Purchased Spare Part Report
After purchasing, the Accountant submits:
- Spare Part Name, Serial Number, Supplier, Quantity, Unit Price, Total Price, Purchase Date, Invoice Number, Purchase Photo, Receipt Photo, Description

---

## 12. Admin Issue Validation (Critical Module)

The system compares: Vehicle, Issue Category, Date, Photos, Description

Possible outcomes:
- **Approved** — Reports match. Maintenance continues.
- **Clarification Required** — Reports partially match. Admin requests more information.
- **Rejected** — Reports do not match. No maintenance request is created.

---

## 13. Spare Part Request Module

Fields:
- Request Number, Vehicle, Assigned Site Manager, Spare Part Name, Serial Number, Quantity, Priority, Reason, Photo (Optional), Date

Status: Pending → Approved → Purchased → Delivered → Installed → Closed

---

## 14–15. Purchase Verification & Final Maintenance Verification

(See workflow sections 7 and 8.3)

---

## 16. Notifications

Automatic notifications are sent when:
- Driver/Site Manager submits an issue report
- Admin validates an issue
- Spare part request is created
- Accountant submits a purchase report
- Site Manager confirms receipt of the spare part
- Driver/Site Manager submits final verification
- Admin approves maintenance

---

## 17. Reports

The Admin can generate:
- Vehicle Maintenance Report
- Spare Part Replacement Report
- Spare Part Purchase Report
- Driver Activity Report
- Site Manager Activity Report
- Accountant Purchase Report
- Maintenance Cost Report
- Vehicle Downtime Report
- Pending Maintenance Report
- Monthly/Annual Maintenance Reports

---

## 18. Search & Filters

Search and filter by: Vehicle, Driver, Site Manager, Accountant, Spare Part, Serial Number, Supplier, Issue Status, Purchase Status, Date Range

---

## 19. Non-Functional Requirements

- **Performance:** Dashboard < 3s, Search < 2s, 100+ concurrent users
- **Security:** JWT Auth, RBAC, bcrypt hashing, HTTPS, Audit Logging
- **Reliability:** 99.9% uptime, daily backups, transaction-safe operations
- **Scalability:** Thousands of vehicles, millions of records, modular architecture

---

## 20. Core Database Entities

Users, Vehicles, Driver Issue Reports, Site Manager Issue Reports, Issue Validations, Spare Part Requests, Purchased Spare Parts, Spare Part Receipt Verifications, Driver Final Verifications, Site Manager Final Verifications, Vehicle Maintenance Histories, Notifications, Audit Logs

---

## 21. Business Rules

1. Every issue must be reported independently by both the Driver and the Site Manager.
2. Neither can view or modify the other's report before Admin review.
3. Admin must compare and validate both reports before approving maintenance.
4. No spare part purchase request may be created until issue validation is complete.
5. Every spare part purchase must originate from an approved Admin request.
6. Accountant must submit a detailed purchase report with invoice, pricing, and photographic evidence.
7. Site Manager must independently confirm receipt before installation.
8. Admin must verify that purchase report and receipt confirmation match.
9. Every replacement must record both old (removed) and new (installed) spare parts with serial numbers.
10. After installation, both Driver and Site Manager must independently submit final verification reports.
11. Admin must review both final verifications before closing.
12. Every completed maintenance activity is permanently recorded and cannot be deleted or modified.
13. Every critical action must be timestamped and associated with the responsible user.

---

*End of Document*
