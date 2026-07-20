# Construction Machinery Management System (CMMS)

A web-based platform for managing a fleet of heavy construction machinery/vehicles, tracking maintenance and spare-part history, and coordinating workflows between Drivers, Site Managers, Accountants, and Admins.

## Features

- **Role-Based Workspaces**: Scoped, dedicated Next.js portals for each of the four roles (Admin, Driver, Site Manager, Accountant).
- **Double-Confirmation Guardrails**: Cross-checks reporting at two sensitive points in the workflow to prevent fraud or reporting mismatches:
  - **Issue Reporting**: Requires independent issue reports from both the Driver and the Site Manager before a Spare Part Request can be created.
  - **Spare Part Handover**: Requires the Accountant to log a purchase record and the Site Manager to verify physical receipt before the handover is confirmed.
- **Complete Fleet History Audit**: Tracks the full lifecycle of vehicle repair logs, recording old spare parts removed, new spare parts installed, date, prices, and photo evidence.
- **In-App Notifications**: Real-time alerts for actions requiring attention.

---

## Project Structure

```text
THA Construction/
├── package.json               # Monorepo Workspace configuration
├── backend/                   # Node.js + Express.js API
└── frontend-admin/            # Next.js - Admin Portal (Port 3000)
└── frontend-driver/           # Next.js - Driver Portal (Port 3001)
└── frontend-site-manager/     # Next.js - Site Manager Portal (Port 3002)
└── frontend-accountant/       # Next.js - Accountant Portal (Port 3003)
```

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** running locally on default port `27017` (e.g. `mongodb://localhost:27017/cmms`)

### Installation

Install all backend and frontend dependencies in one command from the project root:

```bash
npm install
```

### Seeding default Admin

Seed the database with the default administrator account:

```bash
npm run seed --workspace=backend
```

- **Default Username**: `admin`
- **Default Password**: `admin123`

---

## Running the Application

You can launch all portals and the backend API concurrently using:

```bash
npm run dev:all
```

This will spin up:
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Admin Portal**: [http://localhost:3000](http://localhost:3000)
- **Driver Portal**: [http://localhost:3001](http://localhost:3001)
- **Site Manager Portal**: [http://localhost:3002](http://localhost:3002)
- **Accountant Portal**: [http://localhost:3003](http://localhost:3003)

You can also run them individually if preferred:
```bash
npm run dev:backend       # Start Backend
npm run dev:admin         # Start Admin Portal
npm run dev:driver        # Start Driver Portal
npm run dev:site-manager  # Start Site Manager Portal
npm run dev:accountant    # Start Accountant Portal
```

---

## End-to-End Test Workflow

1. **Setup Fleet & Users**:
   - Log in to the **Admin Portal** (`http://localhost:3000`) using `admin` / `admin123`.
   - Navigate to **Fleet Management** and add a vehicle (e.g. "Caterpillar 320 Excavator", Plate: `THA-EX-001`).
   - Navigate to **Team Members** and provision three accounts:
     - **Driver**: (e.g. `driver1`, assign them to the Caterpillar Excavator).
     - **Site Manager**: (e.g. `manager1`).
     - **Accountant**: (e.g. `accountant1`).
   
2. **Checkpoint A - Issue Reporting**:
   - Log in to the **Driver Portal** (`http://localhost:3001`) using `driver1`. Submit an Issue Report with a photo of the problem.
   - Log in to the **Site Manager Portal** (`http://localhost:3002`) using `manager1`. Submit an independent Issue Report for the same Caterpillar vehicle.
   - Log in to the **Admin Portal**. Go to **Issue Validation**. You will see both reports. Click **Group as Case**, enter notes, and validate the match.
   - Once validated, click **Create Spare Part Request**. Enter the part details, assign the request to `manager1` and `accountant1`.

3. **Checkpoint B - Purchase & Handover**:
   - Log in to the **Accountant Portal** (`http://localhost:3003`) using `accountant1`. Find the request, click **Buy Part**, and submit purchase details (price, vendor, receipt photo).
   - Log in to the **Site Manager Portal**. Go to **Spare Part Receipt**. Select the transaction, verify that you received the part from the Accountant, and upload a verification photo.
   - Log in to the **Admin Portal**. Navigate to **Handover Validation**. Inspect the Accountant's receipt vs the Site Manager's receipt. Click **Confirm Handover**.

4. **Checkpoint C - Installation & Final Verification**:
   - The Site Manager installs the part on-site.
   - Log in to the **Driver Portal** (`http://localhost:3001`). Go to **Confirm Repair**. Select the repair case, upload a photo of the working machine, and confirm.
   - Log in to the **Site Manager Portal** (`http://localhost:3002`). Go to **Verify Repair**. Select the case, upload a photo of the completed repair, and confirm.
   - Log in to the **Admin Portal** (`http://localhost:3000`). Under **Final Approvals** (or Dashboard), review both final verification reports. Click **Approve Repair** to close the case, return the machine's status to **Active**, and permanently record the maintenance details in the vehicle's **Chronological History** (Old Part removed → New Part installed).
