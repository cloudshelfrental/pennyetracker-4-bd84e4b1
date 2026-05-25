## Goal

After staff login, route delivery staff to a new Delivery Partner Dashboard. Admin/super_admin behavior stays unchanged.

## 1. Login routing fix (`src/routes/staff.login.tsx`)

Current code already routes admin → `/landing`, delivery → `/delivery-partners`, pending → `/staff/pending`. Change the `delivery` branch to navigate to the new `/delivery/dashboard` route instead of the public partners directory.

No change for admin/super_admin.

## 2. New route: `/delivery/dashboard`

File: `src/routes/delivery.dashboard.tsx` (protected — redirect to `/staff/login` if not signed in or not a `delivery` role).

Loads the current user's `delivery_staff` row (by `user_id`) and renders the dashboard.

### Dashboard sections

1. **Profile card**
   - Name, phone, alt phone, email
   - Assigned panchayath(s) — from `delivery_staff_panchayaths` join `panchayaths`
   - Assigned ward(s) — from `delivery_staff_wards` join `wards` (name + ward_number)
   - Address
   - Location: lat/lng with "Update my location" button (uses browser geolocation → updates `delivery_staff.latitude/longitude/location_updated_at`)
   - Small embedded Google Map showing the saved point (uses existing `useGoogleMapsKey` hook + `LeafletMap`/Google JS API already in project)

2. **Stats row (4 cards)**
   - **Pending orders** — count from `delivery_orders` where `staff_id = me` AND `status = 'pending'`
   - **Delivered orders** — count where `status = 'delivered'`
   - **Collected cash** — sum of `amount` on delivered orders where `cash_submission_id IS NULL` (held by staff)
   - **Wallet balance** — sum of `wallet_transactions.amount` (credit positive, debit negative) for this staff

3. **Submitted cash card**
   - Total of `cash_submissions.amount` for this staff
   - Recent 5 submissions list (date, amount, verified status)

4. **Pending orders list**
   - Table: order_number, customer_name, phone, address, amount, "Mark delivered" button
   - Mark delivered → update row `status='delivered'`, `delivered_at=now()` (allowed by existing "Staff update own orders" RLS)

5. **Delivered orders list (recent 10)**
   - order_number, customer, amount, delivered_at, cash submitted? badge

### Sign out button in header.

## 3. Data access

All reads/writes go through the browser Supabase client. Existing RLS already supports:
- staff self-select on `delivery_staff`, `delivery_staff_wards`, `delivery_staff_panchayaths`
- staff select/update on own `delivery_orders`
- staff select on own `cash_submissions` and `wallet_transactions`

No DB migration needed.

## 4. Guard

Use `useAuth()` from `src/hooks/use-auth.tsx`: if `loading` show spinner; if no user → redirect `/staff/login`; if user but roles include `admin`/`super_admin` → redirect `/landing`; if roles include `delivery` → render; if only `pending` → redirect `/staff/pending`.

## Files touched

- `src/routes/staff.login.tsx` — change one navigate target
- `src/routes/delivery.dashboard.tsx` — new
- (optional) small helpers in `src/lib/` for queries — kept inline for now

## Out of scope

- No changes to admin flows, landing page, or `/delivery-partners` directory page
- No new tables, no schema changes
