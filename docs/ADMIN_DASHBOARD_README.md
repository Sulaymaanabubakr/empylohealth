# Admin Dashboard Readme

## Overview
The Circles Admin Dashboard is operational for core moderation and content management tasks, but it is **not yet fully complete** for full-platform operations.

This document explains:
- what is currently implemented,
- what is partially implemented,
- what is still missing before calling it "full app management".

## Current Status
- Status: **Production-ready for core operations + V2 security controls**
- Completeness: **Advanced partial (RBAC + audit trail + safer deletes now live)**

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

### 6) Granular RBAC (Implemented)
- Permission-gated backend actions by module/action.
- Role permission templates added:
  - `admin`, `editor`, `viewer`, `moderator`, `support`, `finance`, `super_admin`.
- Frontend action controls now respect permissions:
  - user suspension/deletion,
  - employee creation,
  - moderation resolution,
  - content edit/delete.

### 7) Full Audit Trail (Implemented)
- Immutable admin audit logs now recorded in Firestore collection:
  - `adminAuditLogs`
- Logged fields include:
  - actor uid/email/role,
  - action,
  - target collection/id,
  - before/after snapshots,
  - metadata,
  - source IP and user agent,
  - timestamp.
- New admin API:
  - `getAdminAuditLogs`
- New admin UI page:
  - `Audit Logs` (`/audit-logs`)

### 8) Safer Destructive Flows + Bulk Operations (Implemented)
- Content deletion now defaults to soft-delete (`isDeleted`, `deletedAt`, `deletedBy`, `deletedReason`) instead of hard delete.
- Affirmation deletion in admin now uses soft-delete.
- New bulk content operation API:
  - `bulkUpdateContent`
  - supports `set_status` and `soft_delete` for circles/resources/affirmations.
- Content page now supports bulk approve/suspend/delete actions.

## What Is Partially Implemented
- Content workflows are present, but not fully standardized across all entities.
- Operational visibility exists, but lacks deeper diagnostics and audit UX.
- Recovery workflows (restore from soft-delete) are not exposed in UI yet.

## What Is Missing (To Be "Complete")

### 1) Full CRUD Coverage + Restore
- Consistent create/edit/delete flows for all entities and metadata.
- Restore workflow from soft-delete states.

### 2) Huddle and Notification Operations Console
- Live huddle/job monitoring.
- Push delivery diagnostics and retry visibility.
- Scheduler health and failure history in one admin page.

### 3) Bulk and Safety Tooling
- Bulk actions for users/reports/tickets (content bulk actions are already implemented).
- Stronger guardrails for high-risk actions.

## Recommendation
Treat current admin dashboard as **V1 production-ready for core operations**, not final.

## Suggested Next Milestone (Admin V2)
1. Add restore-from-soft-delete UI + APIs.
2. Add ops console (huddles, scheduler, notifications).
3. Add bulk tools for users/reports/support workflows.
4. Add export CSV for audit logs.
5. Standardize all entity CRUD and validation.

## Related Files
- Admin app: `web/admin`
- Admin backend APIs: `backend/src/api/admin.ts`
- Employee API: `backend/src/api/usermanagement.ts`
- Functions exports: `backend/src/index.ts`
- Store compliance notes: `docs/STORE_COMPLIANCE_README.md`
