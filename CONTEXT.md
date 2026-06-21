# Costume Rental

The domain language for a costume rental business where customers request costumes, staff confirm availability, and stock availability follows rental operations rather than payment timing.

## Language

**Request**:
A customer's proposed rental before staff accepts or rejects it. A Request does not hold stock.
_Avoid_: Order, booking, reservation

**Rental**:
An accepted Request that staff is preparing, handing over, tracking while out, or closing after return. A Rental can hold stock until staff clears the items after inspection or cleaning.
_Avoid_: Order, transaction

**Stock Hold**:
The quantity of a Product Variant made unavailable because an accepted Rental is still operationally active. Stock Holds are derived from active Rentals, not stored as a separate source of truth.
_Avoid_: Manual hold, reserved stock

**Active Rental**:
A Rental whose items still count against available stock because they have not passed inspection or cleaning clearance.
_Avoid_: Open order, pending order

**Inspection Stage**:
The Rental lifecycle stage after the customer returns items and before staff grants Inspection Clearance. Rentals in the Inspection Stage still hold stock.
_Avoid_: Returned complete, payment pending

**Inspection Clearance**:
Staff confirmation that every returned item in a Rental has been inspected, cleaned when needed, and can be rented again. Inspection Clearance happens once for the whole Rental, releases the Rental's Stock Hold, and is independent of payment status.
_Avoid_: Payment completion, rental completion, item-by-item clearance

**Maintenance Block**:
A date range when a Product cannot be rented because it is unavailable for cleaning, repair, or other staff-controlled reasons.
_Avoid_: Calendar event, blackout

**Product Variant**:
A rentable size, package, or option under a Product with its own stock quantity.
_Avoid_: SKU, size row
