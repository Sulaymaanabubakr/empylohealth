# Admin Dashboard Readme

## Overview
The Circles Admin Dashboard is operational for core moderation and content management tasks, but it is **not yet fully complete** for full-platform operations.

This document explains:
- what is currently implemented,
- what is partially implemented,
- what is still missing before calling it "full app management".

## Current Status
- Status: **Usable in production for core admin workflows**
- Completeness: **Partial (not full control plane yet)**

## What Is Implemented

### 1) Authentication and Admin Access
- Firebase email/password sign-in for admin web.
- Admin access check via:
  - `admin` custom claim, or
  - super-admin allowlist fallback.
- Improved login error handling for invalid credentials.
- Password visibility toggle (eye icon) on login.

### 2) User and Employee Management
- Fetch users.
- Toggle user status (active/suspended).
- Employee/admin listing and role-related actions in dashboard UI.

### 3) Content Management
- View and filter:
  - circles,
  - resources,
  - affirmations.
- Moderate content status (approve/suspend/reject where applicable).
- Delete content.
- Create affirmations.
- Edit content in dashboard (newly added):
  - circles: `name`, `description`, `image`, `type`, `category`, `status`
  - resources: `title`, `description`, `content`, `image`, `category`, `tag`, `time`, `status`
  - affirmations: `content`, `scheduledDate`, `status`

### 4) Moderation / Safety Operations
- Reports listing and resolution actions.
- Support tickets listing and status updates.

### 5) Analytics / Finance Pages
- Dashboard stats and transaction views are available.

## What Is Partially Implemented
- Role model exists, but permissions are still broad in practice.
- Content workflows are present, but not fully standardized across all entities.
- Operational visibility exists, but lacks deeper diagnostics and audit UX.

## What Is Missing (To Be "Complete")

### 1) Granular RBAC
- Fine-grained permissions by module/action:
  - view/edit/delete/publish per feature,
  - role templates (support, moderator, content editor, finance).

### 2) Full Audit Trail
- Immutable audit logs for every admin action:
  - who changed what,
  - before/after values,
  - timestamp,
  - source IP/session.
- Admin UI for searching/filtering/exporting audit records.

### 3) Full CRUD Coverage
- Consistent create/edit/delete flows for all entities and metadata.
- Safer destructive flows with confirmations and optional soft-delete.

### 4) Huddle and Notification Operations Console
- Live huddle/job monitoring.
- Push delivery diagnostics and retry visibility.
- Scheduler health and failure history in one admin page.

### 5) Bulk and Safety Tooling
- Bulk actions (approve/suspend/delete).
- Recovery workflows (restore from soft-delete where applicable).
- Stronger guardrails for high-risk actions.

## Recommendation
Treat current admin dashboard as **V1 production-ready for core operations**, not final.

## Suggested Next Milestone (Admin V2)
1. Implement granular RBAC.
2. Add full audit trail + audit UI.
3. Add ops console (huddles, scheduler, notifications).
4. Add bulk tools and safer delete/recovery workflows.
5. Standardize all entity CRUD and validation.

## Related Files
- Admin app: `web/admin`
- Admin backend APIs: `backend/src/api/admin.ts`
- Functions exports: `backend/src/index.ts`
- Store compliance notes: `docs/STORE_COMPLIANCE_README.md`
