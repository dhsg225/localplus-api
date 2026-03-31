# 🎨 UI Specification: /ingestion "Data Cleaning Command Center"

This specification defines the UI/UX for the primary validation interface for ingested event data.

---

## 1. Grid Topology & Grouping
The grid MUST prioritize **Operational Clarity** over density.

### Grouping Layer (Venue-Day Persistence)
- **Primary Grouping:** Rows are grouped by `ingestion_group_id` (Same Venue + Same Day).
- **Group Header:** Displays the **Resolved Venue Name** (or "UNMATCHED Venue") and the **Global Date**.
- **Action on Group:** [Merge All], [Bulk Assign Venue], [Bulk Approve Group].

---

## 2. Row Actions & Data Manipulation

### [Split Row] (The "Multi-Act" Savior)
- **Problem:** AI occasionally groups "The Band & The DJ" into one line.
- **Action:** Clicking [Split] clones the current row and clears the `performer` field on both.
- **Validation:** Both split rows must be validated individually.

### [Merge Rows] (Dedupe Override)
- **Problem:** Same artist mentioned twice with slightly different names.
- **Action:** Selecting two rows and clicking [Merge] combines them into a single record.
- **Rule:** The user chooses the "Master" data for the merge.

---

## 3. Inline Validation & Warnings (STRICT)

The table cells must visually signal confidence and completeness.

| Field | Low Confidence / Missing | Hard Warning Signal |
| :--- | :--- | :--- |
| **Venue** | Confidence < 90% | **Red Border** + Dropdown list of closest 3 matches. |
| **Time** | Null or Invalid Format | **Pulsing Orange** background. Require edit before Approve. |
| **Performer** | Null | **Gray Out Row** Status. |
| **Duplicate** | `duplicate_warning` = TRUE | **Overlap Badge** (Yellow). Action: [Compare with Original]. |

---

## 4. Operational Controls (The Command Center)

### Command Toolbar (Top)
- **Filter Bar:** [Only Warnings] [Only Unmatched Venues] [By Source].
- **Batch Metadata:** Displays the `batch_id` and the `raw_content` breadcrumb link.

### Commitment Panel (Bottom)
- **Summary:** "42 Approved, 3 Pending, 0 Rejected."
- **Primary Action (COMMIT):** Only enabled when 0 Hard Warnings remain.
- **Action:** Moves all `Approved` rows to production `event_instances`.

---

## 5. Mobile Considerations
- **Table Collapse:** Force horizontal scroll for the table on mobile.
- **Context Modal:** On click, show a full-screen "Context Card" for easy mobile-friendly cleaning.

---

## 🎯 Implementation Rule (GIDE)
- **Standalone Module:** This UI exists in `/ingestion`. It does not touch the standard "Create Event" flow.
- **Write Policy:** Direct INSERT to `event_instances` with `source_type = 'ingested'`.
- **Reference:** Every instance created MUST link back to `ingestion_batch_id`.
