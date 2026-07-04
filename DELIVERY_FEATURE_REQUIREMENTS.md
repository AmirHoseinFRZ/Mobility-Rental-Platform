# Vehicle Delivery to Client Location — Requirements

## 1. Overview

Today, when a client books a vehicle (e.g. `http://localhost:3000/booking/11`), the pickup
location is silently defaulted to the vehicle's current location and the client must travel
there to pick it up. This feature lets the client request that the **owner deliver the vehicle
to a location the client picks on a map**, for an additional distance-based fee.

On the booking-details page, a toggle ("Deliver to my location") turns the feature on/off.
When on, a Leaflet map appears, the client clicks to choose a delivery point, and the
distance-based delivery fee is added to the price summary.

## 2. Goals

- Allow clients to request vehicle delivery to a self-selected map location during booking.
- Let owners opt their vehicles in or out of delivery on a per-vehicle basis, with an optional
  maximum delivery radius.
- Charge a transparent, distance-based delivery fee that is visible to the client **before** they
  confirm the booking.
- Persist the delivery location on the booking so the owner sees where to drop the vehicle off.

## 3. Non-goals (out of scope)

- Real-time delivery tracking / live ETA.
- Routing or driver dispatch (owner drives the vehicle themselves).
- In-app messaging between client and owner about delivery.
- Return-delivery (client returning the vehicle to a chosen drop-off point) — current scope
  is **delivery to client only**; vehicle is returned to its original location by the client.
- Payment splits between platform and owner for the delivery component.

## 4. User stories

- **As a client**, I want to toggle "Deliver to my location" on the booking page so that I do not
  have to travel to the vehicle's current location.
- **As a client**, I want to pick the exact delivery point on a map so that the owner brings the
  vehicle to where I actually am.
- **As a client**, I want to see the delivery fee added to my total before paying, so there are
  no surprises.
- **As an owner**, I want to mark a vehicle as "available for delivery" (and optionally set a
  maximum radius) so I only have to deliver to locations I'm willing to reach.
- **As an owner**, I want to see the delivery address, coordinates, and distance in my booking
  view so I know where to bring the vehicle.

## 5. Functional requirements

### 5.1 Owner — per-vehicle opt-in

- `Vehicle` entity gains two fields:
  - `deliveryAvailable: Boolean` (default `false`).
  - `maxDeliveryRadiusKm: Integer` (nullable; if null while `deliveryAvailable=true`, treat as
    unlimited).
- `AddVehiclePage` and `EditVehiclePage` expose:
  - A "Offer delivery" checkbox.
  - A "Max delivery radius (km)" number input, shown only when the checkbox is on.
- Vehicle list and detail responses must include both new fields so the client knows whether to
  render the delivery toggle.

### 5.2 Client — booking page (`/booking/:vehicleId`)

- A toggle (Material UI `Switch`) labelled "تحویل در محل من" / "Deliver to my location" is
  shown **only if** `vehicle.deliveryAvailable === true`.
- Default state: **off**. When off, behavior is identical to today (pickup defaults to vehicle's
  current location, no delivery fee).
- When the toggle is turned on:
  - A `LocationSelector` map appears below the toggle (reusing
    `frontend/src/components/LocationSelector.js`).
  - The map initial center is the vehicle's current coordinates.
  - The client clicks a point on the map; the lat/lng is captured into state.
  - Below the map, show:
    - The selected coordinates (lat, lng).
    - The human-readable address (reverse-geocoded via OSM Nominatim — see §5.5).
    - The straight-line distance in km from the vehicle's location to the selected point.
    - The computed delivery fee, formatted in تومان with Persian digits (matches existing
      `formatPrice` helper).
- The "Continue to payment" button is **disabled** while the toggle is on and either:
  - no point has been selected, or
  - the selected point is outside `maxDeliveryRadiusKm` (when set).
- An inline error in Persian is shown when the selected point is outside the allowed radius:
  e.g. "این نقطه خارج از محدوده تحویل این خودرو است."
- The price summary card shows a new line "هزینه تحویل" / "Delivery fee" only when the toggle is
  on, between "قیمت پایه" and the surge/weekend lines.

### 5.3 Booking submission

`BookingRequest` (`backend/booking-service/.../dto/BookingRequest.java`) already supports the
required fields. The frontend, when delivery is enabled, must send:

| Field             | Value                                                                              |
|-------------------|------------------------------------------------------------------------------------|
| `pickupLocation`  | Reverse-geocoded human-readable address of the selected delivery point.            |
| `pickupLatitude`  | Latitude of the selected point.                                                    |
| `pickupLongitude` | Longitude of the selected point.                                                   |
| `vehiclePrice`    | Base price (unchanged).                                                            |
| `totalPrice`      | Base price **+ delivery fee** (server re-validates — see §5.4).                    |

When delivery is **off**, the request is built exactly as it is today — the vehicle's own
location is used for `pickupLocation`/`pickupLatitude`/`pickupLongitude`.

To distinguish the two cases server-side without inferring from coordinates, add one field:

- `BookingRequest.deliveryRequested: Boolean` (default `false`).
- `Booking` entity gains:
  - `deliveryRequested: Boolean` (default `false`).
  - `deliveryFee: BigDecimal` (nullable; null when no delivery).
  - `deliveryDistanceKm: Double` (nullable).

### 5.4 Server-side validation & pricing

The booking service must, on create, when `deliveryRequested = true`:

1. Load the vehicle and reject the request if `vehicle.deliveryAvailable` is false
   (HTTP 400, message: "این خودرو امکان تحویل در محل را ندارد.").
2. Recompute the straight-line (Haversine) distance from the vehicle's current location to
   `(pickupLatitude, pickupLongitude)`. Reject if it exceeds `maxDeliveryRadiusKm`.
3. Recompute the delivery fee via the pricing service (see §5.6) and overwrite whatever the
   client sent for `deliveryFee` and `totalPrice`. **Never trust the client's price.**
4. Persist `deliveryRequested`, `deliveryFee`, `deliveryDistanceKm` on the booking.

### 5.5 Reverse geocoding

- Use OpenStreetMap Nominatim (no API key) from the frontend:
  `https://nominatim.openstreetmap.org/reverse?format=json&lat=<lat>&lon=<lng>&accept-language=fa`.
- Respect Nominatim usage policy: debounce (≥ 1 request/sec), include a `User-Agent` /
  `Referer`, and gracefully fall back to displaying raw lat/lng when the call fails.
- The address is for display + persistence only — it is **not** used for fee calculation.

### 5.6 Pricing — distance-based delivery fee

- Pricing service gets a new endpoint:

  `POST /api/v1/pricing/delivery-fee`

  Request:
  ```json
  {
    "vehicleType": "CAR",
    "distanceKm": 4.3
  }
  ```
  Response:
  ```json
  { "distanceKm": 4.3, "ratePerKm": 15000, "deliveryFee": 64500 }
  ```

- `ratePerKm` is configured per `vehicleType` in a new `delivery_pricing_rules` table (or as
  rows in the existing `PricingRule` table, depending on which fits best — see "Open
  decisions"). Initial seed values (تومان/km), to be confirmed:
  - CAR: 15,000
  - BIKE: 8,000
  - SCOOTER: 8,000
  - BICYCLE: 5,000
- Frontend calls this endpoint on every change to the selected delivery point (debounced
  ~300 ms) to refresh the displayed fee.

### 5.7 Showing delivery info post-booking

- `MyBookingsPage` (client view): show "تحویل در محل" badge on bookings where
  `deliveryRequested=true`, plus the delivery address and fee in the detail expansion.
- `MyVehiclesPage` / owner booking views: prominently display the delivery address,
  coordinates (with a link that opens OSM map at those coords), and the distance — this is the
  owner's primary instruction for where to bring the vehicle.

## 6. UI / UX requirements

- The toggle, when off, must not push the price summary or other layout — reserve no vertical
  space for the map until the toggle is on (use conditional render, not `display:none`).
- The map height should be 320–400 px on desktop and full-width 280 px on mobile.
- Mirror the existing RTL Persian style of `BookingPage.js`. New labels:
  - Toggle: "تحویل در محل من"
  - Map helper: "روی نقشه کلیک کنید تا نقطه تحویل را انتخاب کنید"
  - Selected address label: "آدرس انتخاب‌شده"
  - Distance label: "فاصله از محل خودرو"
  - Delivery fee label: "هزینه تحویل"
  - Out-of-radius error: "این نقطه خارج از محدوده تحویل این خودرو است."
- The selected marker should be draggable as well as click-to-set (nice-to-have, not required
  for v1).

## 7. Data model summary

### `vehicles` table
- `delivery_available BOOLEAN NOT NULL DEFAULT FALSE`
- `max_delivery_radius_km INT NULL`

### `bookings` table
- `delivery_requested BOOLEAN NOT NULL DEFAULT FALSE`
- `delivery_fee NUMERIC(12,2) NULL`
- `delivery_distance_km DOUBLE PRECISION NULL`

No backfill needed for existing rows — defaults cover them.

### Pricing rules
- New table `delivery_pricing_rules (id, vehicle_type, rate_per_km, active)` **or** extend
  `pricing_rules` with a `rule_type` column. Decide during implementation (see §10).

## 8. API contract changes

| Service          | Endpoint                              | Change                                                                 |
|------------------|---------------------------------------|------------------------------------------------------------------------|
| vehicle-service  | `POST/PUT /api/v1/vehicles`           | Accept `deliveryAvailable`, `maxDeliveryRadiusKm`.                     |
| vehicle-service  | `GET  /api/v1/vehicles/{id}`          | Return `deliveryAvailable`, `maxDeliveryRadiusKm`.                     |
| pricing-service  | `POST /api/v1/pricing/delivery-fee`   | New endpoint, request/response per §5.6.                               |
| booking-service  | `POST /api/v1/bookings`               | Accept `deliveryRequested`; persist and recompute fee/distance.        |
| booking-service  | `GET  /api/v1/bookings/{id}`          | Return `deliveryRequested`, `deliveryFee`, `deliveryDistanceKm`.       |

## 9. Edge cases & validation

- Vehicle has no `latitude`/`longitude` set → delivery toggle must be hidden, even if
  `deliveryAvailable=true`. Log a warning (data integrity issue).
- Client selects the vehicle's own location (distance ≈ 0) → fee is 0 but still record
  `deliveryRequested=true`. (Edge case; harmless.)
- Client toggles delivery off after selecting a point → clear selected point and revert
  `pickupLocation` to the vehicle's default. Total price recalculates.
- Nominatim reverse geocoding fails or times out → store the address as
  `"موقعیت انتخاب‌شده (lat, lng)"`, do **not** block the booking.
- Pricing-service is unavailable → frontend computes a fallback fee using a hard-coded
  per-type rate (same as the existing local price-calc fallback pattern). Server still
  re-validates on submit.
- Owner edits the vehicle to set `deliveryAvailable=false` while a delivery booking is pending
  → already-created bookings keep their delivery (no retroactive cancellation in v1).

## 10. Open decisions (confirm during implementation)

1. New `delivery_pricing_rules` table vs. extending `pricing_rules` with a discriminator.
2. Whether the delivery fee goes entirely to the owner, the platform, or is split. (Affects
   future payment-split logic, not v1 UI.)
3. Whether the owner needs to **accept** a delivery booking (extra approval step) or it is
   auto-confirmed as today.
4. Whether to add Persian-localized reverse geocoding fallback (e.g. a city-level lookup) when
   Nominatim returns an English address.

## 11. Acceptance criteria

The feature is considered done when **all** of the following hold:

1. An owner can add or edit a vehicle with "Offer delivery" on and a max radius of, say,
   10 km. The change persists to the DB and is visible in the vehicle detail response.
2. A client opening `/booking/<eligible-vehicle-id>` sees the "Deliver to my location" toggle.
   For an ineligible vehicle, the toggle is **not** rendered.
3. Turning the toggle on shows the Leaflet map centered on the vehicle's location, with no
   marker. Clicking the map places a marker at the click.
4. After selecting a point inside the radius, the reverse-geocoded address, distance in km,
   and delivery fee in تومان are all shown within ~1 second.
5. Selecting a point outside the radius shows the out-of-radius error and disables
   "Continue to payment".
6. The price summary shows a "هزینه تحویل" line and the total reflects base + delivery fee.
7. Submitting the booking persists `deliveryRequested=true`, `deliveryFee`,
   `deliveryDistanceKm`, and the chosen `pickupLocation`/`pickupLatitude`/`pickupLongitude`.
8. The owner sees the delivery address + distance on their booking view.
9. Server rejects a tampered booking where the client sent a delivery fee that doesn't match
   the server's recomputation.
10. Turning the toggle off restores the original (vehicle-location) pickup behavior and total.

## 12. Implementation order (suggested)

1. **vehicle-service**: schema + DTO + endpoints for `deliveryAvailable`,
   `maxDeliveryRadiusKm`.
2. **pricing-service**: `delivery_pricing_rules` table + seed data + `/delivery-fee` endpoint.
3. **booking-service**: schema migration, request/response DTO, validation, persistence.
4. **frontend — owner forms**: surface the new vehicle fields in Add/Edit pages.
5. **frontend — BookingPage**: toggle, map, address/fee panel, request wiring.
6. **frontend — read views**: delivery badges and details in client and owner booking lists.
7. **End-to-end test**: book a vehicle with delivery, verify owner view, verify total in the
   payment gateway.