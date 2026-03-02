# Remote Control Platform (Product Control Center) — Decision-Complete Implementation Plan

## Summary
Build a production-grade remote-control platform across backend, admin, mobile, and web so product behavior/content/navigation/policies can be changed without app rebuilds, with strict safety guardrails.  
Chosen decisions:
1. Environments: `dev`, `beta`, `prod`
2. Production publish: mandatory 2-person approval
3. Owner mode: content-only + simple analytics (no moderation/actions that can alter policy enforcement)

## Business Admin Expansion (Added)
Add a fully separated, non-technical Business Admin side for delegated operations, while preserving the technical Control Center.

### Two Admin Experiences
- Business Admin (non-technical): Owner, Content Manager, Community Manager, Support Agent, Analyst.
- Developer/Operator Control Center (technical): Developer, Operator/SRE, Super Admin.

### Business Roles and Delegation
- Owner:
  - Invites/manages non-technical team accounts.
  - Approves/publishes business content.
  - Views business analytics and business audit logs.
  - Cannot access technical control-center tools.
- Content Manager:
  - Creates/edits content drafts and submits for approval.
  - Cannot publish to production without approval policy.
- Community Manager:
  - Manages circle metadata/featured state.
  - Manages announcements and guidelines content.
- Support Agent:
  - Searches users and views safe account summary fields.
  - Triggers support actions (resend verification, revoke sessions, activate/deactivate).
  - Cannot view private chat/call content.
- Analyst:
  - Read-only business dashboards and lists.

### Business Admin Pages
- Business Overview Dashboard
- Content Studio (draft/review/approved/rejected/scheduled/published)
- Announcements & Banners
- Templates (copy-only, allowlisted fields)
- User Management (business-safe)
- Circles Management (business-safe metadata + feature toggle)
- Approvals & Workflow queue
- Business Activity Log
- Team & Roles

### Business Guardrails
- All writes go through callable functions with RBAC checks.
- Content sanitization on server for rich text and plain fields.
- Rate limiting for sensitive support actions.
- Required publish/change reason for publish-now and schedule operations.
- Immutable audit entries with before/after snapshots.
- Business roles blocked from technical routes and controls.

## Current Baseline (from repo grounding)
- Backend already has callable admin APIs and audit logging (`backend/src/api/admin.ts`) with role+permission claims.
- Admin dashboard has route/pages and role-aware auth context but no split Owner/Operator modes.
- Mobile and web have no unified remote config SDK yet; behavior is mostly static code + Firestore content.
- Firebase regions are standardized to europe-west1 stack, suitable for config APIs.

## Scope
- In scope: config control plane, schema governance, staged publish workflow, RBAC mode split, client config SDKs, server-driven nav/layout for key surfaces, policy enforcement hooks, incident controls, observability endpoints/panels.
- Out of scope: arbitrary code/HTML rendering, direct editing of security rules by dashboard users, runtime secret editing from client.

## Architecture
- Control Plane Service in Cloud Functions:
  - Draft store, schema validation, compatibility checks, version snapshots, staged promotion, rollback, audit.
  - Deterministic targeting/experiments engine on server.
  - Resolved config API for client bootstrap.
- Admin Product Control Center:
  - Owner Mode UI + permissions fence.
  - Developer/Operator Mode UI + incident/config tooling.
- Client Config SDK:
  - Last-known-good cache + TTL + stale-while-revalidate.
  - Integrity hash verification.
  - Typed accessors.
  - Safe fallback defaults bundled in app/web.
- Server-driven UI:
  - Registry of safe block types rendered by app/web.
  - Layout JSON validated server-side.

## Data Model (Firestore)
- `/config/{env}/current`  
  Fields: `currentVersionId`, `previousVersionId`, `updatedAt`, `updatedBy`, `summary`, `integrityHash`.
- `/config_versions/{env}/{versionId}` immutable  
  Fields: `schemaVersion`, `minSupportedAppVersion`, `maxSupportedAppVersion`, `domains`, `publishedAt`, `publishedBy`, `changeReason`, `sourceDraftId`, `integrityHash`, `status`.
- `/config_drafts/{env}/{draftId}`  
  Fields: `domains`, `validation`, `createdBy`, `updatedBy`, `state`, `review`.
- `/config_reviews/{env}/{reviewId}`  
  Fields: `draftId`, `requestedBy`, `approverUid`, `status`, `notes`.
- `/audit_logs/{env}/{logId}`  
  Fields: `actor`, `action`, `target`, `before`, `after`, `diff`, `requestMeta`, `createdAt`.
- `/layouts/{env}/{screenId}` active resolved view projection for fast reads.
- `/content/{env}/{collection}/{id}` content records (affirmations/articles/copy/announcements).
- `/templates/{env}/{type}/{id}` push/email templates metadata.
- `/policies/{env}/rules`
- `/experiments/{env}/defs`
- `/segments/{env}/definitions`
- `/metrics/{env}/health`

## Schemas and Governance
Create JSON schemas in backend:
- `backend/src/config/schemas/featureFlags.schema.json`
- `backend/src/config/schemas/experiments.schema.json`
- `backend/src/config/schemas/navigation.schema.json`
- `backend/src/config/schemas/policies.schema.json`
- `backend/src/config/schemas/templates.schema.json`
- `backend/src/config/schemas/layouts.schema.json`
- `backend/src/config/schemas/content.schema.json`
- `backend/src/config/schemas/rootConfig.schema.json`

Validation rules:
- Domain schema validation via AJV.
- Compatibility gate:
  - Required: `minSupportedAppVersion`
  - Optional: `maxSupportedAppVersion`
  - Rejected if incompatible with target environment active client version policy.
- Size limits:
  - Max payload bytes per domain.
  - Max total resolved config bytes.
- Forbidden keys/unsafe actions blocked by schema.
- Circuit breaker:
  - Any invalid draft/version cannot publish.
  - Any invalid runtime resolved config rejected; clients keep last-good.

## Backend Implementation Plan

### 1) New backend modules
Add:
- `backend/src/config/types.ts`
- `backend/src/config/constants.ts`
- `backend/src/config/hash.ts`
- `backend/src/config/semver.ts`
- `backend/src/config/validator.ts`
- `backend/src/config/targeting.ts`
- `backend/src/config/experiments.ts`
- `backend/src/config/resolver.ts`
- `backend/src/config/audit.ts`
- `backend/src/api/config.ts`

### 2) New callable functions (server-enforced)
Export from `backend/src/index.ts`:
- `getResolvedConfig`
- `createConfigDraft`
- `updateConfigDraft`
- `validateConfigDraft`
- `requestConfigReview`
- `approveConfigDraft`
- `publishConfigDraftToBeta`
- `promoteBetaToProd`
- `rollbackConfigVersion`
- `getConfigCurrent`
- `listConfigVersions`
- `getConfigDiff`
- `setIncidentState`
- `getIncidentState`
- `getConfigAuditLogs`

### 3) RBAC/permissions (server-side)
Extend permission matrix in `backend/src/api/admin.ts` and shared RBAC utility:
- New roles:
  - `owner`
  - `content_manager`
  - `moderator`
  - `support_agent`
  - `developer`
  - `operator_sre`
  - `super_admin`
- Owner permissions exclude:
  - flags/experiments/layouts/policies/incident controls/rollback/publish to prod.
- 2-person prod rule:
  - `promoteBetaToProd` must verify `approverUid != draftAuthorUid`.

### 4) Policy enforcement hooks
Refactor existing function checks to use policy accessor:
- Limits:
  - circles per user
  - members per circle
  - message length
  - call timeout values
  - OTP cooldown/attempts/expiry
- Enforcement remains in functions/rules; client only displays policy-derived UX copy.

### 5) Audit logging everywhere
Centralized writer used by all new config mutations plus sensitive existing admin mutations:
- Include actor, before/after snapshots, normalized JSON diff, env, reason, request id, IP/UA.

## Admin Dashboard Rebuild Plan (`web/admin`)

### 1) Core mode split
- Add mode-aware app shell:
  - `OwnerModeLayout`
  - `OperatorModeLayout`
- Routing guard:
  - Owner routes whitelist only.
  - Operator/developer routes for advanced tools.
- Update `AuthContext` to expose:
  - `mode`, `role`, `permissions`, `can(permission)`.

### 2) Owner Mode pages
- Content Manager page:
  - affirmations/resources/articles/copy/announcements CRUD.
- Publish page:
  - submit draft for review (not direct prod).
- Simple analytics page:
  - read-only KPIs.

### 3) Developer/Operator Mode pages
- Flags & Rollouts page.
- Experiments page.
- Navigation Config page.
- Policies page.
- Layout Editor + Preview/Simulation page.
- Templates page (push/email).
- Versioning page:
  - draft validation
  - diff viewer
  - beta publish
  - prod promote (with approval check)
  - rollback
- Incident Console page:
  - global kill switch
  - feature kill switches
  - screen kill switches
  - read-only mode
  - emergency banner config.
- Health/Observability page.

### 4) Admin API client layer
- Add `web/admin/src/lib/configApi.ts` typed wrappers around callable endpoints.
- Add optimistic UI with immutable server truth refresh.

## Client Config SDK Plan

### Mobile (`frontend/src/services/config`)
Add:
- `ConfigClient.ts` or `.js`
- `configTypes.ts`/`.js`
- `configDefaults.ts`
- `configCache.ts` (AsyncStorage)
- `configIntegrity.ts`
- `configSelectors.ts`
- `configContext.tsx` + provider bootstrap

Behavior:
- Load last-good from cache at app start.
- Verify integrity hash.
- Render with defaults+cache immediately.
- Background fetch resolved config (`getResolvedConfig`).
- On success update cache+in-memory.
- On failure keep last-good and emit metric.

### Web landing (`web/landing/src/config`)
Add equivalent lightweight SDK:
- localStorage cache
- TTL
- fallback defaults
- resolved config fetch endpoint.

## Server-driven Navigation Plan

### Mobile
- Add `navigationConfig` accessor:
  - tab visibility/order
  - settings menu visibility/order
  - route allowlist by role/segment/platform/version.
- Integrate into:
  - `frontend/src/navigation/MainTabs.js`
  - profile/settings menus.
- Backward compatibility:
  - if config missing, use current static nav as default.

### Web admin/landing
- Same pattern for menu sections where applicable.

## Server-driven UI Blocks Plan

### Block registry
- Introduce block renderer for key surfaces:
  - Home
  - Explore
  - Profile/Settings sections
  - Resources list/detail
  - Dashboard sections
- Allowed block types:
  - `BannerBlock`, `HeaderBlock`, `CardListBlock`, `CTAButtonBlock`, `TabsBlock`, `StatsBlock`, `ListRowBlock`, `CarouselBlock`, `DividerBlock`, `SpacerBlock`.
- Each block has strict schema and known prop contract.
- CTA supports only whitelisted action types:
  - internal route
  - deep link
  - external URL allowlist.

### Safety
- Unknown block types ignored.
- Invalid block payload ignored per-block; rest of layout still renders.

## Incident Controls and Safe Degradation
- Runtime incident state domain in config:
  - `globalEnabled`
  - `readOnlyMode`
  - `featureKillSwitches`
  - `endpointKillSwitches`
  - `screenKillSwitches`
  - `maintenanceBanner`
- Backend checks endpoint kill-switch before sensitive callable operations.
- Client checks screen/feature switches before rendering flows and shows fallback UX.

## Observability and Metrics
- Add backend metric writer utilities:
  - config fetch success/failure
  - validation failures
  - publish/rollback actions
  - callable kill-switch rejections
- Admin health page reads aggregated docs:
  - `/metrics/{env}/health`.
- Keep existing crash sources (store/TestFlight/Play) linked in operator docs; aggregate app-side operational counters in Firestore for now.

## Security Rules and Access Controls
- Firestore rules update:
  - deny direct write to config/version/audit collections from client SDKs.
  - allow reads only where required by admin app and only for authorized claims.
- All mutations via callable functions with permission checks.
- Non-developer users cannot modify policies/flags/layouts/incidents/rules.

## Public APIs / Interfaces Added

### Callable request shape: `getResolvedConfig`
- Input:
  - `env`, `appVersion`, `platform`, `deviceClass`, optional `country`, optional `roleHint`.
- Output:
  - `versionId`, `integrityHash`, `ttlSeconds`, `resolvedConfig`, `compatibility`, `incidentState`.

### Draft lifecycle callables
- `createConfigDraft`: `{ env, domains, reason }`
- `updateConfigDraft`: `{ env, draftId, patch, reason }`
- `validateConfigDraft`: `{ env, draftId }`
- `requestConfigReview`: `{ env, draftId, comment }`
- `approveConfigDraft`: `{ env, draftId, comment }`
- `publishConfigDraftToBeta`: `{ env:'beta', draftId, reason }`
- `promoteBetaToProd`: `{ sourceVersionId, reason }`
- `rollbackConfigVersion`: `{ env, targetVersionId, reason }`

## Testing and Verification Plan

### Backend
- Unit tests:
  - schema validation pass/fail per domain.
  - semver compatibility gates.
  - deterministic experiment bucketing.
  - permission matrix enforcement.
- Integration tests:
  - draft→validate→approve→publish beta→promote prod.
  - rollback updates current pointer and logs audit.
  - invalid draft blocked.

### Mobile/Web SDK
- Cache tests:
  - cold start without network uses defaults+last-good.
  - corrupted cache hash rejected and falls back.
  - stale-while-revalidate behavior.
- Compatibility tests:
  - old app version receives compatible config subset or fallback.
- UI tests:
  - hidden tabs/settings entries respond to remote config.
  - kill switch disables targeted modules/screens.

### Admin
- RBAC tests:
  - Owner cannot see operator routes/actions.
  - Operator can manage advanced controls.
  - prod promotion requires second approver.
- Audit tests:
  - every mutation generates audit entry with diff and actor.

## Rollout Plan
1. Ship backend config service behind internal feature flag.
2. Ship admin mode split + config pages in beta only.
3. Enable mobile/web SDK read-only consumption from `dev`.
4. Enable selected features to read from config:
   - navigation
   - banners/copy
   - policy display.
5. Enable server-enforced policy reads in critical endpoints.
6. Activate beta publish workflow; test rollback drills.
7. Promote to prod with 2-person approval.
8. Turn on incident console controls for on-call.

## What will be configurable vs non-configurable

### Configurable
- Feature flags, rollouts, experiments, kill switches.
- Content/copy/templates/announcements/URLs.
- Navigation/menu visibility and order.
- Safe block-based layout for key screens.
- Policy values (enforced server-side).

### Not configurable
- Security rules source code and deployment.
- Secret values from client-side interfaces.
- Arbitrary JS/HTML execution.
- Direct database mutation bypassing callable enforcement.
- Core cryptographic/integrity verification logic itself.

## Assumptions and defaults chosen
- Environment flow is fixed: `dev → beta → prod`.
- Production promotion requires mandatory second approver.
- Owner mode limited to content and simple analytics only.
- Config integrity uses SHA-256 hash (stored with version and verified on client).
- Client fetch TTL default: 300s, with immediate last-good boot.
- Unknown/invalid blocks are ignored, not fatal.
- Existing admin claims (`admin`, `role`, `permissions`, `superAdmin`) are source of truth for migration.
