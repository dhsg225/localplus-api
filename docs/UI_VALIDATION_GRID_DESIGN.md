# 🎨 UI Design: /ingestion Validation Grid

The validation grid allows human operators to audit, edit, and approve parsed event data before it's committed to production.

---

## 🏗️ UI Layout Highlights
1.  **Status Bar:** Overview showing "Total Items," "Matched (Green)," "Yellow (Review)," and "Unmatched (Red)."
2.  **Interactive Data Table:** A spreadsheet-like view with inline editing capabilities.
3.  **Entity Mapping Toolbar:** Tools to bulk-assign venues or categories to multiple rows.
4.  **Raw Context Panel:** A slide-out panel that highlights the source text for the currently selected row.

---

## 🧩 Key UI Components

### 🖥️ IngestionTable.tsx
A robust table (using a tool like `TanStack Table` or `AG Grid`) with the following columns:
-   **Status Indicator:** (✅, ⚠️, ❌).
-   **Original Text Snippet:** Clipped view of the raw line—with hover to expand.
-   **Title/Performer:** Editable text input.
-   **Target Venue:** A custom **Venue Picker** with autocomplete.
-   **Temporal Data:** Editable Date/Time fields with validation tooltips.
-   **Dedupe Badge:** A "Possible Duplicate" alert that, when clicked, opens a comparison modal with the existing record.
-   **Action:** [Approve] | [Reject].

---

## 🔄 State Management Logic (React)

### Workflow State:
```typescript
interface IngestionQueueItem {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'error';
  rawSnippet: string;
  matchedVenueId: string | null;
  confidence: number;
  duplicateWarning: boolean;
  // ... other fields
}

// 1. Initial State: Load all pending rows for the batch_id
const [queue, setQueue] = useState<IngestionQueueItem[]>([]);

// 2. Editing Logic: Update state locally
const handleUpdateRow = (id: string, updates: Partial<IngestionQueueItem>) => {
  setQueue(prev => prev.map(row => row.id === id ? { ...row, ...updates } : row));
}

// 3. Approval Flow: Atomic or Bulk updates
const handleApprove = async (id: string) => {
    // API call to move row from ingestion_queues -> event_instances
    // Updates status to 'approved'
}
```

---

## 🚦 Interactive Validation Scenarios

### Scenario A: High Confidence Match
The system maps "Sivana" to "Sivana Restaurant." The venue cell shows **Sivana Restaurant** in green with a "98.5%" badge. User clicks [Approve] after a quick scan.

### Scenario B: Multiple Matches Found
The system identifies "Soi 126" in the raw text and finds two matching venues nearby. The cell shows **"2 Matches found"** in yellow. Clicking opens a selection menu.

### Scenario C: Potential Duplicate
The system finds a "Live Jazz" event already exists at the same venue and date. A red **DUPLICATE** badge appears. User investigates the snippets and clicks [Reject] for the redundant entry.
