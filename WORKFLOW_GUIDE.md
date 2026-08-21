# EAMS - Complete Three-Role Workflow

## 🎯 System Overview
The EAMS system is now fully implemented with **separate, role-based dashboards** for Admin, Manager, and Employee users.

---

## 📋 ROLE #1: EMPLOYEE

### **Access Point**
- Login: `om@example.com` / `Eams@123`
- Dashboard Route: `/employee`

### **Employee Dashboard Features**

#### **What Employees See:**
```
┌─────────────────────────────────────────────────────────┐
│  EAMS EMPLOYEE PORTAL - Leave & Attendance Management   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  STATISTICS CARDS:                                      │
│  ├─ Pending Requests (count of pending leave)          │
│  ├─ Approved Leaves (count of approved)                │
│  ├─ Rejected Leaves (count of rejected)                │
│  └─ Notifications (unread count)                       │
│                                                         │
│  NOTIFICATIONS SECTION:                                 │
│  ├─ Show manager decisions on leave requests           │
│  ├─ Display approval/rejection with timestamp          │
│  └─ Mark read/unread status                            │
│                                                         │
│  MY LEAVE REQUESTS SECTION:                             │
│  ├─ List of all leave requests                         │
│  ├─ Status: Pending/Approved/Rejected (color-coded)    │
│  ├─ Leave Type badge (Sick/Casual/Personal)            │
│  ├─ Dates of leave period                              │
│  ├─ Reason provided                                    │
│  └─ "Apply for Leave" button                           │
│                                                         │
│  APPLY FOR LEAVE MODAL:                                │
│  ├─ Leave Type dropdown                                │
│  ├─ Start Date picker                                  │
│  ├─ End Date picker                                    │
│  ├─ Reason textarea                                    │
│  └─ Submit button                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### **Employee Workflow**

#### **Step 1: Submit Leave Request**
```
Employee clicks "Apply for Leave"
    ↓
Fills form (Type, Dates, Reason)
    ↓
Clicks Submit
    ↓
POST /LeaveRequests
    ↓
Backend creates notification for Manager
    ↓
Employee sees request in "Pending" status
```

#### **Step 2: Manager Reviews**
```
Manager sees notification
    ↓
Goes to Manager Dashboard
    ↓
Sees pending leave request
    ↓
Clicks "Approve" or "Reject"
    ↓
PUT /LeaveRequests/{id}/approve or reject
    ↓
Backend creates notification for Employee
```

#### **Step 3: Employee Gets Notification**
```
Employee Dashboard shows Notification
    ↓
Leave request status changed to "Approved" or "Rejected"
    ↓
Employee can see manager name & time in notification
```

#### **What Employees Can Only See:**
- ✅ Their own leave requests
- ✅ Their own notifications
- ✅ Leave approval status and dates
- ❌ Cannot see other employees' data
- ❌ Cannot see team information
- ❌ Cannot approve/reject leaves
- ❌ Cannot see system admin features

---

## 👔 ROLE #2: MANAGER

### **Access Point**
- Login: `rahul@eams.com` / `Eams@123`
- Dashboard Route: `/manager`

### **Manager Dashboard Features**

#### **What Managers See:**
```
┌──────────────────────────────────────────────────────────┐
│  EAMS MANAGER PORTAL - Leave Request Management          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  STATISTICS CARDS:                                       │
│  ├─ Pending Requests (team's pending leaves)            │
│  ├─ Approvals Today (approved today)                    │
│  ├─ Team Members (direct reports)                       │
│  └─ Notifications (manager's own)                       │
│                                                          │
│  PENDING LEAVE REQUESTS:                                 │
│  ├─ List of all team member requests                    │
│  ├─ Employee name & avatar                              │
│  ├─ Employee email                                      │
│  ├─ Leave type badge                                    │
│  ├─ Date range                                          │
│  ├─ Reason provided                                     │
│  ├─ "Approve" button                                    │
│  ├─ "Reject" button                                     │
│  └─ Confirmation modal before action                    │
│                                                          │
│  CONFIRMATION MODAL:                                     │
│  ├─ Shows: Employee name, dates, reason                 │
│  ├─ "Cancel" option                                     │
│  ├─ "Approve/Reject" action button                      │
│  └─ Loading state during submission                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### **Manager Workflow**

#### **Step 1: See Pending Requests**
```
Manager logs in
    ↓
Dashboard loads
    ↓
Fetch /LeaveRequests/manager/{managerId}/pending
    ↓
Shows all direct reports' pending leave requests
```

#### **Step 2: Review & Decide**
```
Manager sees list of pending requests
    ↓
Clicks "Approve" or "Reject" button
    ↓
Modal appears with confirmation
    ↓
Shows: Employee name, dates, reason
    ↓
Manager clicks "Approve" or "Reject" again
```

#### **Step 3: Action Taken**
```
PUT /LeaveRequests/{id}/approve
    ↓
Status changes to "Approved"
    ↓
Notification sent to Employee
    ↓
Request removed from Manager's pending list
    ↓
Success message shown
```

#### **What Managers Can Only See:**
- ✅ Direct reports (employees)
- ✅ Team's leave requests
- ✅ Approve/reject with confirmation
- ✅ Statistics on team approvals
- ❌ Cannot see other teams' data
- ❌ Cannot see system-wide employee list
- ❌ Cannot see system admin features
- ❌ Cannot access admin controls

---

## 🛡️ ROLE #3: ADMIN

### **Access Point**
- Login: `admin@eams.com` / `Admin123!`
- Dashboard Route: `/admin`

### **Admin Dashboard Features**

#### **What Admins See:**
```
┌────────────────────────────────────────────────────────────┐
│  EAMS ADMIN DASHBOARD - System Administration & Control    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  SYSTEM STATISTICS:                                        │
│  ├─ Total Employees (all users)                           │
│  ├─ Managers (count)                                      │
│  ├─ Regular Employees (count)                             │
│  ├─ Pending Leaves (system-wide)                          │
│  ├─ Approved Leaves (count)                               │
│  ├─ Rejected Leaves (count)                               │
│  └─ Departments (count)                                   │
│                                                            │
│  ALL EMPLOYEES TABLE:                                      │
│  ├─ ID, Name, Email                                       │
│  ├─ Department (assigned)                                 │
│  ├─ Role (Admin/Manager/Employee)                         │
│  ├─ Manager (who they report to)                          │
│  └─ View all system users                                 │
│                                                            │
│  ALL LEAVE REQUESTS TABLE:                                 │
│  ├─ Employee name                                         │
│  ├─ Leave type                                            │
│  ├─ Date range                                            │
│  ├─ Reason                                                │
│  ├─ Status (with color coding)                            │
│  ├─ When applied                                          │
│  └─ Complete history of all leave requests                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### **Admin Capabilities**

#### **What Admins Can Do:**
- ✅ View ALL employees across the system
- ✅ View ALL leave requests (any status)
- ✅ See complete system statistics
- ✅ See department information
- ✅ Monitor manager approvals
- ✅ View audit trail of all actions
- ✅ System-wide reporting
- ✅ Can access manager & employee data

#### **Admin Workflow:**

```
Admin logs in
    ↓
Loads complete system overview
    ↓
Can analyze:
  ├─ Employee distribution
  ├─ Leave patterns
  ├─ Manager activity
  ├─ Department metrics
  └─ System health
    ↓
Can generate reports & audits
```

---

## 🔐 Role-Based Access Control

### **Route Protection**

| Route | Admin | Manager | Employee |
|-------|:-----:|:-------:|:--------:|
| `/admin` | ✅ | ❌ | ❌ |
| `/manager` | ❌ | ✅ | ❌ |
| `/employee` | ❌ | ❌ | ✅ |
| `/login` | ✅ | ✅ | ✅ |

### **Data Access Control**

| Feature | Admin | Manager | Employee |
|---------|:-----:|:-------:|:--------:|
| View all employees | ✅ | ❌ | ❌ |
| View team | ❌ | ✅ | ❌ |
| View own profile | ✅ | ✅ | ✅ |
| View all leaves | ✅ | ❌ | ❌ |
| View team leaves | ❌ | ✅ | ❌ |
| View own leaves | ✅ | ✅ | ✅ |
| Approve leaves | ❌ | ✅ | ❌ |
| View system stats | ✅ | ❌ | ❌ |
| View notifications | ✅ | ✅ | ✅ |

---

## 📱 Complete Leave Request Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEAVE REQUEST WORKFLOW                       │
└─────────────────────────────────────────────────────────────────┘

   EMPLOYEE                          MANAGER                    ADMIN
       │                                 │                        │
       │  1. Apply for Leave            │                        │
       │     (Fill form & submit)       │                        │
       │         │                      │                        │
       │         ▼                      │                        │
       │    POST /LeaveRequests         │                        │
       │         │                      │                        │
       │         ├─► Creates Notification for Manager            │
       │         │                      │                        │
       │         └─► Status = "Pending" │                        │
       │                                │                        │
       │                     2. See Pending │                    │
       │                        Request │                        │
       │                                │◄─ Can view all requests
       │                                │                        │
       │                                ▼                        │
       │                    GET /LeaveRequests/                  │
       │                    manager/{id}/pending                 │
       │                                │                        │
       │                     3. Approve/Reject                   │
       │                        & Confirm                        │
       │                                │                        │
       │                                ▼                        │
       │                    PUT /LeaveRequests/                  │
       │                    {id}/approve                         │
       │                                │                        │
       │                                ├─► Status = "Approved"  │
       │                                │                        │
       │                                ├─► Create Notification  │
       │                                │    for Employee        │
       │                                │                        │
       │  4. Receive Notification       │                        │
       │◄───────────────────────────────┘                        │
       │                                                          │
       │  5. See Updated Status                                  │
       │  & Manager Details                                      │
       │     (Approved/Rejected)                                 │
       │                                                          │
       │                     Admin can see entire history throughout
       │                                                          │

```

---

## 🔄 Complete End-to-End Workflow Example

### **Scenario: Employee "Om" requests leave**

#### **1. Monday 9:00 AM - Employee Applies**
```
Om logs in at /login
  → Clicks "Employee Role" demo button
  → Login: om@example.com / Eams@123
  → Redirected to /employee (Employee Dashboard)
  → Clicks "Apply for Leave" button
  → Modal opens
  → Fills: Type="Sick Leave", 
           Start="2026-08-20",
           End="2026-08-21",
           Reason="Medical appointment"
  → Clicks "Submit"
  → API: POST /LeaveRequests
  → Backend creates notification for manager (Rahul)
  → Om sees request in "Pending" status on dashboard
```

#### **2. Monday 10:30 AM - Manager Reviews**
```
Rahul logs in at /login
  → Clicks "Team Manager Role" demo button
  → Login: rahul@eams.com / Eams@123
  → Redirected to /manager (Manager Dashboard)
  → Sees "1 Pending Request" stat card
  → Sees Om's leave request in list:
     - Name: Om
     - Type: Sick Leave (purple badge)
     - Dates: 20 Aug - 21 Aug 2026
     - Reason: Medical appointment
  → Clicks "Approve" button
  → Modal appears showing full details
  → Rahul confirms: "Approve"
  → API: PUT /LeaveRequests/{id}/approve
  → Backend sets Status = "Approved"
  → Backend creates notification for Om
  → Request removed from Rahul's pending list
  → Success message shown
```

#### **3. Monday 11:00 AM - Employee Notified**
```
Om's Dashboard automatically updates:
  → Notification appears at top:
     "Leave Approved"
     "Your Sick Leave request from 20 Aug 2026 
      to 21 Aug 2026 has been approved."
     [Timestamp: Aug 13, 2026]
  → Leave request status changes to "Approved" (green badge)
  → "Pending Requests" stat card decreases to 0
  → "Approved" stat card increases to 1
```

#### **4. Admin Auditing**
```
Admin (System Administrator) logs in:
  → Admin@eams.com / Admin123!
  → Goes to /admin (Admin Dashboard)
  → Sees complete statistics:
     - Total Employees: [count]
     - Managers: [count]
     - Pending Leaves: 0
     - Approved Leaves: 1 (includes Om's)
  → Scrolls to "All Employees" table
  → Sees Om's record:
     ID: [id]
     Name: Om
     Email: om@example.com
     Department: Engineering
     Role: Employee
     Manager: Rahul
  → Scrolls to "All Leave Requests" table
  → Sees Om's complete request:
     Employee: Om
     Type: Sick Leave
     Dates: Aug 20-21, 2026
     Reason: Medical appointment
     Status: Approved
     Applied: Aug 13, 2026
```

---

## 🎓 Test Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | admin@eams.com | Admin123! | /admin |
| **Manager** | rahul@eams.com | Eams@123 | /manager |
| **Employee** | om@example.com | Eams@123 | /employee |

---

## ✅ Verification Checklist

- [x] **Employee Dashboard** - Shows only employee's data
- [x] **Manager Dashboard** - Shows only team's data, with approve/reject
- [x] **Admin Dashboard** - Shows all system data
- [x] **Role-based Routing** - Login redirects to correct dashboard
- [x] **Role-based Access Control** - Cannot access other roles' pages
- [x] **Leave Approval Workflow** - Employee submit → Manager approve → Employee notified
- [x] **Manager Name & Time** - Notifications show who approved and when
- [x] **Separated Sections** - No cross-role data leakage
- [x] **Proper Authentication** - JWT token validation on all requests
- [x] **Status Tracking** - Pending/Approved/Rejected with color coding

---

## 🚀 Running the System

### Backend
```bash
cd d:\EAMS\backend\EAMS.Api
dotnet run --launch-profile http
# Runs on http://localhost:5000
```

### Frontend
```bash
cd d:\EAMS\frontend
npm run dev
# Runs on http://localhost:3000
```

### Test the Workflow
1. Open http://localhost:3000
2. Click "Employee Role" → Login as Om
3. Click "Apply for Leave" → Submit request
4. New tab: Click "Team Manager Role" → Login as Rahul
5. Click "Approve" on Om's request
6. Back to Employee tab: See approval notification
7. Admin tab: View complete audit trail

---

## 📊 Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                   EAMS THREE-TIER SYSTEM                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  LAYER 1: FRONTEND (Next.js - Role-Based UI)               │
│  ├─ /login                 (All users)                     │
│  ├─ /admin                 (Admin only) ✅                 │
│  ├─ /manager               (Manager only) ✅               │
│  └─ /employee              (Employee only) ✅              │
│                                                             │
│  LAYER 2: BACKEND (ASP.NET Core - JWT Auth)                │
│  ├─ POST   /Auth/login              (Auth service)         │
│  ├─ GET    /Employees               (All users)            │
│  ├─ GET    /LeaveRequests           (All, admin only)      │
│  ├─ GET    /LeaveRequests/{id}      (Own only)             │
│  ├─ GET    /LeaveRequests/manager/{id}/pending (Manager)   │
│  ├─ POST   /LeaveRequests           (Submit new)           │
│  ├─ PUT    /LeaveRequests/{id}/approve   (Manager)         │
│  ├─ PUT    /LeaveRequests/{id}/reject    (Manager)         │
│  └─ GET    /Notifications/employee/{id}  (Own only)        │
│                                                             │
│  LAYER 3: DATABASE (SQL Server)                            │
│  ├─ Employees  (all user records)                          │
│  ├─ LeaveRequests (leave history)                          │
│  ├─ Notifications (system messages)                        │
│  └─ Departments (organization structure)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features Implemented

✅ **Complete Separation of Concerns**
- Each role sees only relevant data
- No cross-role data leakage
- Proper authentication & authorization

✅ **Full Leave Workflow**
- Employee submit → Manager approve/reject → Notification
- Manager name & timestamp included
- Status tracking with color-coding

✅ **Real-time Notifications**
- Manager notified when leave requested
- Employee notified when decision made
- Unread count tracking

✅ **Admin Oversight**
- View all employees
- Complete leave history
- System statistics
- Audit trail

✅ **Professional UI**
- Modern Tailwind CSS styling
- Responsive design
- Consistent color scheme
- Clear status indicators

---

All systems are ready for testing! 🎉
