# Availability and Stock Hold Implementation Handoff

## Goal

Deepen the Availability module so stock availability is derived from Products and active Rentals, not from mutable `variant.held` fields. Requests must not hold stock. Payment status must not control stock release.

## Domain Decisions

Recorded in `CONTEXT.md`.

- A `Request` does not hold stock.
- A `Rental` holds stock only while operationally active.
- A `Stock Hold` is derived from active Rentals.
- `variant.held` should stop being a source of truth.
- Returning items does not release stock immediately.
- Add a `returned` stage after customer return.
- `inspected` means staff finished inspection/cleaning once for the whole Rental, not per item.
- Moving to `inspected` releases stock.
- Payment can remain missing/delayed after stock is released.

## Recommended Lifecycle Shape

Current relevant lifecycle:

```ts
'confirmed' | 'preparing' | 'ready_pickup' | 'out_delivery' | 'on_rent' | 'returned' | 'completed'
```

Recommended lifecycle:

```ts
'confirmed'
| 'preparing'
| 'ready_pickup'
| 'out_delivery'
| 'on_rent'
| 'returned'
| 'inspected'
| 'completed'
```

Implementation note: legacy stored `inspection` should be migrated to `returned`. The live domain terms are `returned` for "back, waiting inspection" and `inspected` for "inspection/cleaning done, stock released".

## Deep Module Target

Create or reshape an Availability module around one deep interface. Do not expose the stock model to callers.

Suggested file:

```txt
frontend/src/lib/availability.ts
```

Responsibilities:

- Determine whether a Rental lifecycle is stock-holding.
- Calculate booked/held quantity from active Rentals.
- Calculate Product and Product Variant availability for date ranges.
- Calculate day-level availability rows for calendars.
- Apply Maintenance Blocks.
- Provide sorting/ranking helpers if catalogue availability sorting needs them.

Avoid:

- Mutating `ProductVariant.held`.
- Requiring callers to choose between `variant.held` and `rentals`.
- Releasing stock from payment status.
- Per-item inspection clearance.

## Main Code Changes

### 1. Domain Types

File: `frontend/src/types/domain.ts`

- Add `inspected` to `RentalLifecycle`.
- Keep `returned` as the stock-holding return stage.
- Treat legacy `inspection` only as persisted input at the storage migration boundary.
- Eventually remove or deprecate `ProductVariant.held` as source of truth.

### 2. Availability Logic

Current file: `frontend/src/lib/rental-utils.ts`

Move or replace:

- `BLOCKING_LIFECYCLES`
- `RELEASED_LIFECYCLES`
- `getProductAvailability`
- `getVariantAvailability`
- `getVariantBookedQuantity`
- `getProductDayAvailability`
- `findNextAvailableWindow`
- `applyItemHoldDelta`
- `shouldReleaseHold`

New stock-holding lifecycle set should include:

```ts
['confirmed', 'preparing', 'ready_pickup', 'out_delivery', 'on_rent', 'returned']
```

Stock release happens when moving from `returned` to `inspected`.

### 3. Request Acceptance

File: `frontend/src/lib/request-intake.ts`

Current issue:

- `acceptRequestIntoRental` checks both held availability and date availability.
- It currently uses `getVariantAvailability(product, item.variantId, request)` without rentals, which relies on `variant.held`.

Change:

- Validate accepted items against the new Availability module using Products + active Rentals.
- Do not mutate product holds after acceptance.

### 4. Local Data Adapter

File: `frontend/src/lib/data-adapter.ts`

Current issue:

- Accepting a Request calls `applyItemHoldDelta(current, rental.items, 1)`.
- Availability cache invalidation is mixed with stock mutation.

Change:

- Stop mutating product `held` on accept.
- Keep cache invalidation.
- Derive availability from Rentals.
- Add migration for stored rentals with legacy lifecycle `inspection` if needed.

### 5. Rental Workflow

Files:

- `frontend/src/lib/rental-workflow.ts`
- `frontend/src/components/admin/rentals/useRentalsAdminController.ts`
- `frontend/src/components/admin/rentals/RentalWorkflowDetail.tsx`
- `frontend/src/components/admin/rentals/RentalDialogs.tsx`
- `frontend/src/components/admin/rentals/rentalWorkflowTypes.ts`

Current issue:

- Transition to `returned` releases hold.
- Completion is payment-gated.

Change:

- Return action moves lifecycle to `returned`.
- Inspection clearance action moves lifecycle to `inspected`.
- Payment verification must not block inspection clearance or stock release.
- Completion closes the Rental administratively after payment proof is valid when the setting requires it.
- Admin filters should expose both returned-needs-inspection and inspected-awaiting-closure buckets.

### 6. Admin Catalogue Stock UI

Files:

- `frontend/src/components/admin/catalogue/CatalogueStockFraction.tsx`
- `frontend/src/components/admin/catalogue/VariantsTab.tsx`
- `frontend/src/components/admin/catalogue/catalogueAdminUtils.ts`
- `frontend/src/components/admin/catalogue/useCatalogueAdminController.ts`

Current issue:

- UI displays and validates against `variant.held`.

Change:

- Show derived held quantity from active Rentals.
- Prevent lowering `total` below derived held quantity.
- Avoid saving derived held values back into Product Variants.

### 7. Customer Catalogue/Product UI

Files:

- `frontend/src/components/customer/catalogue/*`
- `frontend/src/components/customer/product/*`
- `frontend/src/pages/customer/ProductDetailPage.tsx`
- `frontend/src/pages/customer/RequestIntakePage.tsx`

Change:

- Read availability through the new Availability module.
- Ensure pending Requests never reduce availability.
- Ensure returned Rentals still reduce availability.
- Ensure inspected Rentals release availability.

### 8. Copy Updates

File: `frontend/src/copy.ts`

Fix copy that says pending/stale orders hold stock. The domain rule is:

- Requests wait for staff decision and do not hold stock.
- Accepted Rentals hold stock until the Rental moves to `inspected`.

Add copy for:

- Inspection Stage
- Inspection Clearance
- Payment still pending after clearance, if needed

## Tests To Add

No test suite currently exists, so add focused tests for the new Availability module first.

Recommended test cases:

- Pending Request does not reduce availability.
- Accepted Rental reduces availability.
- Returned Rental still reduces availability.
- Inspected Rental releases availability.
- Payment missing does not keep stock held after inspection clearance.
- Maintenance Block makes the Product unavailable regardless of Rental state.
- Quantity availability handles overlapping date ranges.
- Product Variant total cannot be lowered below derived active Rental quantity.

## Migration Notes

Browser localStorage already stores demo state.

Add migration behavior in `useRentalAppState` or a new storage module:

- Existing Rentals with legacy lifecycle `inspection` should become `returned`.
- Existing Product Variants may have stale `held`; ignore for availability after migration.
- If keeping `held` for compatibility, treat it as display-only legacy data until removed.

## Suggested Implementation Order

1. Add Availability module and tests.
2. Add `inspected` lifecycle and map old `inspection` state to `returned`.
3. Update Request acceptance to stop mutating `variant.held`.
4. Update Rental workflow transitions and copy.
5. Update catalogue/admin stock displays to use derived hold quantities.
6. Update customer catalogue/product/detail availability calls.
7. Remove or quarantine remaining `variant.held` usage.

## Acceptance Criteria

- A pending Request never changes customer-visible availability.
- Accepting a Request creates a Rental that reduces availability.
- Returning a Rental moves it to `returned` and stock remains unavailable.
- Moving a Rental to `inspected` releases stock even if payment is still missing.
- Payment verification no longer gates stock release.
- Availability calculations are testable through one module interface.
