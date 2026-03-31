# Event Engine: Modular Feature System Design

**Date**: 2026-01-21  
**Version**: 2.0 - Modular Architecture  
**Status**: 🎨 Design Proposal

---

## 🎯 Core Concept

Instead of hardcoding specific features (RSVP, payments, etc.) into the events table, we use a **feature toggle system** where event owners can selectively enable modules for each event.

### Benefits
✅ **Flexibility**: Event owners choose which features they need  
✅ **Scalability**: Easy to add new features without schema changes  
✅ **Clean UI**: Only show relevant settings based on enabled features  
✅ **Future-Proof**: Extensible architecture for upcoming features  

---

## 📊 Database Schema

### Events Table Extension

```sql
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS enabled_features JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rsvp_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ticketing_config JSONB DEFAULT '{}';
```

### Data Structures

#### `enabled_features` (Feature Toggles)
```json
{
  "rsvp": true,           // Enable RSVP/attendance tracking
  "ticketing": false,     // Enable ticket sales
  "waitlist": false,      // Enable waitlist (future)
  "seating": false        // Enable seat selection (future)
}
```

#### `rsvp_config` (RSVP Settings)
Only used when `enabled_features.rsvp = true`

```json
{
  "max_capacity": 20,
  "rsvp_deadline": "2026-01-25T18:00:00Z",
  "requires_confirmation": true,
  "allow_guest_plus_one": false,
  "confirmation_message": "We'll confirm your spot within 24 hours"
}
```

#### `ticketing_config` (Ticketing Settings)
Only used when `enabled_features.ticketing = true`

```json
{
  "price_per_ticket": 500.00,
  "currency": "THB",
  "payment_methods": ["bank_transfer", "promptpay"],
  "ticket_types": [
    {
      "id": "general",
      "name": "General Admission",
      "price": 500,
      "quantity": 20,
      "sold": 0
    },
    {
      "id": "vip",
      "name": "VIP Table",
      "price": 800,
      "quantity": 5,
      "sold": 0
    }
  ],
  "sales_start": "2026-01-15T00:00:00Z",
  "sales_end": "2026-01-25T18:00:00Z",
  "refund_policy": "No refunds within 48 hours of event"
}
```

---

## 🎨 UI/UX Design

### Event Creation/Edit Modal

```
┌─────────────────────────────────────────┐
│ Create Event                        [X] │
├─────────────────────────────────────────┤
│                                         │
│ [Basic Event Info...]                   │
│                                         │
├─────────────────────────────────────────┤
│ 📋 Event Features                       │
├─────────────────────────────────────────┤
│                                         │
│ ☐ Enable RSVP & Attendance Tracking    │
│   └─> [RSVP Settings Panel]            │
│                                         │
│ ☐ Enable Ticket Sales                  │
│   └─> [Ticketing Settings Panel]       │
│                                         │
│ ☐ Enable Waitlist (Coming Soon)        │
│                                         │
└─────────────────────────────────────────┘
```

### RSVP Settings Panel (Expandable)
Shows only when "Enable RSVP" is checked:

```
┌─────────────────────────────────────────┐
│ 📋 RSVP Settings                        │
├─────────────────────────────────────────┤
│ Max Capacity: [20      ] guests         │
│ RSVP Deadline: [2026-01-25 18:00]       │
│ ☑ Require host confirmation             │
│ ☐ Allow +1 guests                       │
└─────────────────────────────────────────┘
```

### Ticketing Settings Panel (Expandable)
Shows only when "Enable Ticket Sales" is checked:

```
┌─────────────────────────────────────────┐
│ 🎫 Ticketing Settings                   │
├─────────────────────────────────────────┤
│ Currency: [THB ▼]                       │
│ Payment Methods:                        │
│   ☑ Bank Transfer                       │
│   ☑ PromptPay                           │
│   ☐ Credit Card (Future)                │
│                                         │
│ Ticket Types:                           │
│ ┌───────────────────────────────────┐   │
│ │ General Admission  ฿500  Qty: 20  │   │
│ │ VIP Table          ฿800  Qty: 5   │   │
│ │ [+ Add Ticket Type]               │   │
│ └───────────────────────────────────┘   │
│                                         │
│ Sales Period:                           │
│   Start: [2026-01-15 00:00]             │
│   End:   [2026-01-25 18:00]             │
└─────────────────────────────────────────┘
```

---

## 🔄 User Flows

### Flow 1: Simple Event (No Features)
```
Event Owner:
1. Create event with basic info
2. Don't enable any features
3. Publish

Result: Informational event only (current behavior)
```

### Flow 2: RSVP-Only Event (Free)
```
Event Owner:
1. Create event
2. ☑ Enable RSVP
3. Set max_capacity = 20
4. Set rsvp_deadline
5. Publish

Consumer:
1. View event
2. Click "RSVP"
3. Enter name/email
4. Submit
5. Receive confirmation (if requires_confirmation = false)
   OR wait for host approval (if requires_confirmation = true)
```

### Flow 3: Paid Ticketed Event
```
Event Owner:
1. Create event
2. ☑ Enable Ticket Sales
3. Add ticket type: "General ฿500"
4. Set payment methods: Bank Transfer
5. Publish

Consumer:
1. View event
2. Click "Buy Tickets"
3. Select quantity
4. See total: ฿1000 (2 tickets)
5. Choose payment method
6. Upload payment proof
7. Wait for confirmation
8. Receive ticket confirmation
```

### Flow 4: Hybrid Event (RSVP + Optional Donation)
```
Event Owner:
1. Create event
2. ☑ Enable RSVP (free entry)
3. ☑ Enable Ticketing (optional donation tiers)
4. Add ticket types:
   - "Free RSVP" ฿0
   - "Supporter" ฿200
   - "Patron" ฿500
5. Publish

Consumer:
1. Choose tier
2. RSVP or purchase ticket
```

---

## 🔧 Implementation Strategy

### Option A: Full Refactor (Recommended)
**Pros**:
- Clean, modular architecture
- Easier to extend
- Better UX (progressive disclosure)

**Cons**:
- More work upfront
- Need to update all existing code

### Option B: Hybrid Approach (Backward Compatible)
Keep old fields for backward compatibility, add new modular system:

```sql
-- Keep existing (deprecated but functional)
max_capacity INTEGER,
requires_payment BOOLEAN,
price_per_seat DECIMAL,

-- Add new modular system
enabled_features JSONB,
rsvp_config JSONB,
ticketing_config JSONB
```

Migration path:
1. New events use modular system
2. Old events continue working
3. Gradual migration of old events
4. Eventually deprecate old fields

---

## 📋 Feature Modules (Roadmap)

### Phase 1: Core Modules (Now)
- ✅ RSVP Module
- ✅ Ticketing Module

### Phase 2: Enhanced Features
- ⏳ Waitlist Module
- ⏳ Seating/Floor Plan Module
- ⏳ Check-in/QR Code Module

### Phase 3: Advanced Features
- 🔮 Multi-session Events
- 🔮 Group Bookings
- 🔮 Early Bird Pricing
- 🔮 Promo Codes
- 🔮 Refund Management

---

## 🎯 Recommended Next Steps

### Immediate (This Session)
1. **Decision**: Full refactor vs. Hybrid approach?
2. **If Full Refactor**:
   - Update CreateEventModal with feature toggles
   - Update EditEventModal
   - Update API to handle new structure
3. **If Hybrid**:
   - Keep current UI working
   - Add new modular UI as "Advanced Mode"
   - Migrate gradually

### Short Term (Next Session)
1. Build Partner Attendance Management UI
2. Build Consumer RSVP/Ticketing UI
3. Test end-to-end flows

### Long Term
1. Add waitlist module
2. Add seating module
3. Integrate payment gateways

---

## 💡 Example Use Cases

### Use Case 1: Supper Club (Your Current Need)
```json
{
  "enabled_features": {
    "rsvp": false,
    "ticketing": true
  },
  "ticketing_config": {
    "price_per_ticket": 500,
    "currency": "THB",
    "payment_methods": ["bank_transfer"],
    "ticket_types": [
      {"name": "Seat", "price": 500, "quantity": 20}
    ]
  }
}
```

### Use Case 2: Free Community Meetup
```json
{
  "enabled_features": {
    "rsvp": true,
    "ticketing": false
  },
  "rsvp_config": {
    "max_capacity": 50,
    "requires_confirmation": false
  }
}
```

### Use Case 3: Workshop with Early Bird
```json
{
  "enabled_features": {
    "ticketing": true
  },
  "ticketing_config": {
    "ticket_types": [
      {
        "name": "Early Bird",
        "price": 800,
        "quantity": 10,
        "sales_end": "2026-01-15T23:59:59Z"
      },
      {
        "name": "Regular",
        "price": 1000,
        "quantity": 20,
        "sales_start": "2026-01-16T00:00:00Z"
      }
    ]
  }
}
```

---

## ❓ Decision Point

**Question for you**: Which approach do you prefer?

**A) Full Refactor** - Clean slate, modular from the start  
**B) Hybrid** - Keep current working, add modular as enhancement  
**C) Simplified** - Just add feature toggles, keep current field structure  

Let me know and I'll implement accordingly!
