# 🤖 AI Prompt Prototype: /data-ingest/parse

This prompt is designed for **Claude 3.5 Sonnet** to handle "extremely messy" daily event listings.

---

## System Prompt Description
You are an expert event data extraction agent. Your task is to take unstructured text—often with poor formatting, typos, and mixed dates—and convert it into a structured JSON array of event objects.

### 🎯 Extraction Objectives:
-   **Exact Performers:** Identify bands, DJs, or performers.
-   **Venue Names:** Identify where the event is happening.
-   **Date & Time:** Extract the specific date and start/end times.
-   **Context Snippet:** Include the exact line or chunk of text from the input that provided this information.

---

## 📝 The Prompt Template

```markdown
User: 
Ingest the following raw text for events.
Global Context Date: Tuesday, March 31, 2026.

Text:
"""
[INPUT_MESSY_TEXT_HERE]
"""

Output JSON ONLY in the following format:
{
  "events": [
    {
      "raw_title": "Full descriptive title",
      "raw_performer": "Artist/Performer name (Individual act)",
      "raw_venue": "Venue name",
      "raw_date": "Specific date string for this act (use Global Context Date if not overridden)",
      "raw_time": "Start time string (e.g. 7pm or 19:00)",
      "raw_snippet": "The exact line/substring from the input text",
      "act_type": "music | dj | workshop | sports | general",
      "extrapolation_notes": "Brief notes on data assumptions"
    }
  ]
}

Strict Rules:
1. MULTI-ACT SUPPORT: If a venue has multiple performers at different times, CREATE SEPARATE OBJECTS for each timeslot.
2. INDIVIDUAL ACTS: Do NOT comma-separate performers in one object.
3. DATE INHERITANCE: If no date is found for a specific line, default to the Global Context Date.
4. SOURCE FIDELITY: raw_snippet MUST be an exact quote from the text.
5. JSON ONLY: No markdown formatting or explanation.
```

---

## 🧪 Example Input/Output Test

### Input:
```text
Terry's April 5th Update:
Sivana @ 7pm: The Silver Tones playing classic rock.
Meanwhile at Father Teds, 8:30pm: DJ Mike is back in the house.
Don't forget The Beach Club's Sunday session with acoustic sets from 2pm.
```

### Output:
```json
{
  "events": [
    {
      "raw_title": "The Silver Tones classic rock",
      "raw_performer": "The Silver Tones",
      "raw_venue": "Sivana",
      "raw_date": "April 5th",
      "raw_time": "7pm",
      "raw_snippet": "Sivana @ 7pm: The Silver Tones playing classic rock.",
      "extrapolation_notes": "Extracted Silvertone as performer."
    },
    {
      "raw_title": "DJ Mike",
      "raw_performer": "DJ Mike",
      "raw_venue": "Father Teds",
      "raw_date": "April 5th",
      "raw_time": "8:30pm",
      "raw_snippet": "Meanwhile at Father Teds, 8:30pm: DJ Mike is back in the house.",
      "extrapolation_notes": null
    },
    {
      "raw_title": "Sunday session acoustic sets",
      "raw_performer": "Acoustic sets (various)",
      "raw_venue": "The Beach Club",
      "raw_date": "April 5th",
      "raw_time": "2pm",
      "raw_snippet": "The Beach Club's Sunday session with acoustic sets from 2pm.",
      "extrapolation_notes": "Mapped 'Sunday session' to date context."
    }
  ]
}
```
