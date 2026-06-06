# How to Export Working Request from Postman

## Option 1: Export as cURL (BEST for debugging) ⭐

This shows EXACTLY what Postman is sending:

1. In Postman, open the working request
2. Click the **"Code"** button (top right, next to Send button - looks like `</>`  or `</>`)
3. In the dropdown, select **"cURL"**
4. Copy the entire cURL command
5. Save it to a file: `postman_working_curl.txt`

**This will show:**
- Exact URL
- All headers Postman is sending
- Exact request body
- Any authentication details

---

## Option 2: Export Request Body (JSON)

1. In Postman, go to the **Body** tab of the working request
2. Copy the entire JSON payload
3. Save it to a file: `postman_working_payload.json`

---

## Option 3: View Console Log

1. In Postman, click **View** → **Show Postman Console** (or Ctrl+Alt+C / Cmd+Alt+C)
2. Run the successful request again
3. In the console, you'll see the full HTTP request and response
4. Copy the **Request Headers** section
5. Copy the **Request Body** section
6. Save both to a file: `postman_console_output.txt`

---

## Option 4: Export the Collection

1. In Postman Collections sidebar, find the "Consumer Credit Report" collection
2. Right-click → **Export**
3. Choose **Collection v2.1** format
4. Save as: `postman_collection.json`

---

## What I Need Most

**Priority 1** (MOST IMPORTANT):
- [ ] cURL export from the "Code" button → `postman_working_curl.txt`

**Priority 2**:
- [ ] Working JSON payload from Body tab → `postman_working_payload.json`
- [ ] Console output showing request headers → `postman_console_output.txt`

**Priority 3** (if time permits):
- [ ] Full collection export → `postman_collection.json`
- [ ] Screenshot of the successful response

---

## Where to Save Files

Save them in: `/Users/bkozdemb/github/mcp_credit_check/testing/`

Then I can compare:
- Your working Postman request
- vs our failing curl/fetch request
- and identify the exact difference
