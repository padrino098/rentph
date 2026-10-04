# RentPH — Student Housing & Urban Rental Marketplace
## System Architecture, Database ERD, and API Specification

---

### 1. Executive Summary & Domain Scope

RentPH is a dedicated, location-first housing marketplace engineered specifically for:
1. **Student Dormitories & Bed Spaces** (by bed, by room, gender-segregated, curfew-managed)
2. **Private & Shared Rooms for Rent**
3. **Apartments & Condominiums**
4. **Houses & Townhouses**
5. **Short-Term (Transient/Daily) & Long-Term (Semester/Annual) Rentals**

Unlike generic vacation-rental platforms, RentPH prioritizes:
- **Location-First Proximity Engine**: Haversine distance, estimated walking and driving times to universities (UST, UP Diliman, DLSU, Ateneo, PUP, FEU) and business districts (BGC, Makati, Ortigas).
- **Dorm Hierarchy Model**: Property $\to$ Rooms $\to$ Beds with individual occupancy statuses (`available`, `occupied`, `reserved`, `maintenance`).
- **Student Onboarding & Matching Wizard**: Guided discovery matching budget, university, gender restrictions, room sharing preferences, and commute limits.
- **Side-by-Side Property Comparison Matrix**: Comparing up to 3 listings across rent, distance, utilities, and safety amenities.
- **Formal Rental Application Workflow**: Lease applications with guardian info, school verification, approval pipeline, security deposits, and move-in passes.

---

### 2. Database ERD & Relational Schema

```
+--------------------+        +---------------------+        +--------------------+
|       users        |        |       schools       |        |     locations      |
+--------------------+        +---------------------+        +--------------------+
| id (PK)            |        | id (PK)             |        | id (PK)            |
| name               |        | name                |        | name               |
| email (unique)     |        | short_name          |        | city               |
| phone              |        | city                |        | province           |
| role (enum)        |        | address             |        | latitude           |
| account_type (enum)|        | latitude            |        | longitude          |
| school_id (FK)     |----+   | longitude           |        | transit_hub        |
| student_id_number  |    |   +---------------------+        +--------------------+
| course_year        |    |              ^
| guardian_contact   |    |              | (M:N via property_schools)
| status (enum)      |    |              |
+--------------------+    |   +---------------------+
                          +-->|     properties      |
                              +---------------------+
                              | id (PK)             |
                              | owner_id (FK)       |
                              | category_id (FK)    |
                              | title               |
                              | slug                |
                              | property_type (enum)|
                              | gender_policy (enum)|
                              | address             |
                              | barangay            |
                              | city                |
                              | latitude, longitude |
                              | monthly_rent        |
                              | daily_rent          |
                              | semester_rent       |
                              | security_deposit    |
                              | utility_estimate    |
                              | curfew_time         |
                              | visitors_allowed    |
                              | status (enum)       |
                              +---------------------+
                                         | 1
                                         |
                                         | M
                              +---------------------+
                              |        rooms        |
                              +---------------------+
                              | id (PK)             |
                              | property_id (FK)    |
                              | room_number         |
                              | floor               |
                              | room_type (enum)    |
                              | capacity            |
                              | price_per_bed       |
                              | price_entire_room   |
                              | aircon (bool)       |
                              | private_bath (bool) |
                              +---------------------+
                                         | 1
                                         |
                                         | M
                              +---------------------+
                              |        beds         |
                              +---------------------+
                              | id (PK)             |
                              | room_id (FK)        |
                              | bed_label (A, B...) |
                              | deck_level (top/bot)|
                              | status (enum)       |
                              | current_tenant_id   |
                              | monthly_rate        |
                              +---------------------+

+---------------------+        +---------------------+        +--------------------+
|    applications     |        |      bookings       |        |      payments      |
+---------------------+        +---------------------+        +--------------------+
| id (PK)             |        | id (PK)             |        | id (PK)            |
| property_id (FK)    |        | booking_code        |        | booking_id (FK)    |
| room_id (FK)        |        | property_id (FK)    |        | application_id (FK)|
| bed_id (FK)         |        | room_id (FK)        |        | provider (enum)    |
| applicant_id (FK)   |        | bed_id (FK)         |        | amount             |
| term (semester/year)|        | renter_id (FK)      |        | status             |
| move_in_date        |        | check_in, check_out |        | reference_number   |
| emergency_contact   |        | total_amount        |        +--------------------+
| status (enum)       |        | payment_status      |
+---------------------+        +---------------------+
```

---

### 3. API Architecture (`/api/v1`)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/auth/register` | POST | Public | User registration with student/renter/owner roles |
| `/api/v1/auth/login` | POST | Public | Authenticate user & issue session token |
| `/api/v1/schools` | GET | Public | List all universities with geolocations |
| `/api/v1/properties` | GET | Public | Multi-filter search (distance to school, budget, gender, beds) |
| `/api/v1/properties/:id` | GET | Public | Detailed property view with rooms and bed availability |
| `/api/v1/properties/:id/rooms` | GET | Public | Room & bed matrix with real-time occupancy status |
| `/api/v1/applications` | POST | Student/Renter | Submit formal rental application for bed/room |
| `/api/v1/applications/:id` | PATCH | Owner/Admin | Review application (Approve, Reject, Request Docs) |
| `/api/v1/bookings` | POST | Student/Renter | Reserve bed / transient booking with deposit calculation |
| `/api/v1/bookings/:id/pay` | POST | Student/Renter | Process reservation deposit via GCash / Maya / Card |
| `/api/v1/owner/properties` | GET/POST| Owner | Manage listings, add rooms, and configure beds |
| `/api/v1/owner/beds/:id/status`| PATCH | Owner | Toggle bed status (Available, Maintenance, Occupied) |
| `/api/v1/admin/moderation` | POST | Admin | Verification audit: approve/reject dorm listings |

---

### 4. User Personas & Core Workflows

1. **Student Persona (e.g. Keneth Jassal — UST Architecture)**:
   - Uses the **Student Housing Matcher** to specify UST, ₱6,000 budget, 4-person female/male room, aircon, and study area.
   - Searches with `< 1km` distance filter and views properties on the interactive split map.
   - Compares 3 dorms side-by-side.
   - Selects Room 204, Bed B, and submits a rental application with move-in date.

2. **Landlord / Owner Persona (e.g. Maria Santos — UST Dormitory Owner)**:
   - Sets up property with multiple rooms and beds.
   - Reviews incoming student applications.
   - Approves qualified tenants and tracks occupancy (e.g. 18 / 24 beds occupied = 75% occupancy).

3. **Platform Administrator**:
   - Oversees listing approvals, permits, student reports, and school directory coordinates.

---

### 5. UI/UX Design System Specification

- **Brand Typography**: `Plus Jakarta Sans` for clean, highly legible UI + tabular figures (`tabular-nums`) for currency and distances.
- **Palette**:
  - Dominant Canvas: Warm slate `#f8fafc` & pure white `#ffffff` (60%)
  - Structural Borders & Surfaces: Subtle hairline borders `#e2e8f0` (30%)
  - High-Intent Accents: Deep Navy `#0f172a` with Vibrant Philippine Ember `#ea580c` / Forest `#059669` (10%)
- **Zero-Pill Metadata**: Distance, rent, room capacity, and availability rendered with typographic dot separators (`·`).
- **Interactive Dual-Mode**: Seamless toggle between Split Map + List and Full Grid view.
