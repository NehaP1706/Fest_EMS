**Test Case 2.4: Preferences Influence Event Ordering**
- **Steps:**
  1. Set preferences: Follow "CodeClub"
  2. Browse events page
- **Expected Result:**
  - CodeClub events shown first/prioritized
  - Or separate "Recommended" section

#### 5.3 Browse Events Page [5 Marks]

**Test Case 5.3.1: Search - Partial Match**
- **Steps:**
  1. Search: "hack"
  2. Submit
- **Expected Result:**
  - Returns: "Hackathon 2024", "Hack the Night"
  - Partial matching works

**Test Case 5.3.2: Search - Fuzzy Match**
- **Steps:**
  1. Search: "workshp" (typo)
- **Expected Result:**
  - Returns: "Workshop: Web Dev"
  - Fuzzy matching works

**Test Case 5.3.7: Filter - Followed Clubs**
- **Steps:**
  1. Follow "CodeClub"
  2. Apply filter: "Followed Clubs Only"
- **Expected Result:**
  - Only CodeClub events shown

**Test Case B1.6: Pin Message**
- **Steps:**
  1. As organizer
  2. Click "Pin" on participant message
- **Expected Result:**
  - Message pinned to top
  - Shows pin icon

**Test Case B1.10: Notification for New Messages**
- **Steps:**
  1. New message posted in forum
  2. Check for notification
- **Expected Result:**
  - Notification badge on Discussion tab
  - Unread count shown