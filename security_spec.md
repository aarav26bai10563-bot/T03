# GHOST SHORELINE — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Owner Isolation**: Every `waterbodies`, `monitoringObservations`, and `alerts` document must carry `ownerId == request.auth.uid` on creation and never change `ownerId` or `createdAt` after creation.
2. **Relational Integrity**: A `monitoringObservations` or `alerts` document cannot be created unless the referenced `waterbodyId` exists in `/waterbodies/{waterbodyId}` and belongs to the same `request.auth.uid`.
3. **PII Isolation**: `/userProfiles/{userId}` stores `email` and `displayName` and is strictly readable and writable only when `request.auth.uid == userId`; collection-wide listing is disabled.
4. **Temporal Integrity**: `createdAt` on create and `updatedAt` on create/update must equal `request.time`.
5. **Terminal State Locking**: A `DroughtAlert` with `status == "Resolved"` cannot be modified back to `"Active"` or `"Acknowledged"`.
6. **Verified Identity**: All write operations require `request.auth != null && request.auth.token.email_verified == true`.

## 2. "Dirty Dozen" Adversarial Payloads
1. Unauthenticated read/write to `/waterbodies/wb1`.
2. Creating a waterbody with `ownerId` spoofed to another user's UID.
3. Injecting an oversized 200-char document ID (`id` poisoning) into `/waterbodies/{id}`.
4. Shadow update adding an undocumented field `isOfficialDrought: true` to `/alerts/{id}`.
5. Spoofed `request.time` (`createdAt: "2020-01-01T00:00:00Z"`) on `/waterbodies/{id}`.
6. Creating a `/monitoringObservations/{id}` pointing to a non-existent or another user's `waterbodyId`.
7. Updating an alert from `"Resolved"` back to `"Active"`.
8. Reading another user's `/userProfiles/{otherUid}` document (PII leak).
9. Listing `/userProfiles` collection across all users.
10. Updating `ownerId` or `createdAt` on an existing waterbody.
11. Unverified email (`email_verified: false`) attempting a create on `/waterbodies/{id}`.
12. Value poisoning: setting `observedAreaHa` to negative (`-50`) or `name` to a 500-character string.
