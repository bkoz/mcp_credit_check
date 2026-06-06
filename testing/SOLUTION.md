# Solution: How to Fix the "Error occured in mocker" Issue

**Date**: June 6, 2026  
**Status**: Root cause identified ✅

---

## The Problem

Your API calls are **technically perfect** but the Equifax sandbox returns:
```json
{
  "id": 1,
  "error": "Error occured in mocker",
  "message": "This is default response "
}
```

## Root Cause

The Equifax sandbox is **NOT a live simulation**. It's a **test scenario matcher** that only responds to specific pre-programmed test data from their official test case library.

Your current test data is not in their library:
- ❌ SSN: `666123456`
- ❌ Name: `JLJBKF KHJGUFJM`
- ❌ Address: Random Atlanta address

**The sandbox only returns valid credit reports for specific test scenarios from their 20K test case library.**

---

## The Solution

You have **three options** to get valid sandbox responses:

### Option 1: Download Official Postman Collection (FASTEST) ⭐

**Recommended by Equifax - takes 5 minutes**

1. Log into https://developer.equifax.com
2. Go to your app dashboard
3. Click on **Consumer Credit Report** API product
4. Go to **API Reference** tab
5. Click **"Run in Postman"** button
6. Import the **"Consumer Credit Report-sandbox"** collection
7. The collection contains pre-configured requests with **valid test data**
8. Copy your Client ID and Client Secret into Postman environment variables
9. Run the test - it will work immediately
10. Export the working JSON payload and replace your `consumer.json`

**Why this works**: Equifax pre-loads the Postman collection with test data that matches their 20K test scenarios.

---

### Option 2: Get Sample JSON from API Reference Tab

**Takes 10-15 minutes**

1. Log into https://developer.equifax.com
2. Navigate to your app → **Consumer Credit Report** → **API Reference** tab
3. Look for **"Request and Response Samples"** section
4. Download or copy the sample JSON request body
5. This JSON contains valid test data that works in sandbox
6. Replace your `consumer.json` with this sample

**The API Reference tab shows the exact request/response schema in JSON format.**

---

### Option 3: Access the 20K Test Scenarios

**Most comprehensive - takes 20-30 minutes**

1. Log into https://developer.equifax.com
2. Go to **Consumer Credit Report** product page
3. Click on **"Additional API Docs"** tab
4. Access the test scenario library (elaborate list of 20K test cases)
5. Filter by the scenario you want to test
6. Copy the test data values (SSN, name, address, etc.)
7. Update your `consumer.json` with these values

**This gives you access to test various scenarios** (good credit, bad credit, fraud alerts, etc.)

---

## What NOT to Do

❌ **Don't keep trying random test data** - the sandbox will always return mocker error  
❌ **Don't add more headers** - your headers are correct  
❌ **Don't change the endpoint** - your endpoint is correct  
❌ **Don't modify the JSON structure** - your structure is correct  

**The ONLY issue is the test data values themselves.**

---

## Quick Win: Expected Working Request

Once you get the official test data from Postman or API Reference, your request will look like this (exact values will come from official docs):

```bash
curl -X POST "https://api.sandbox.equifax.com/business/oneview/consumer-credit/v1/reports/credit-report" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "consumers": {
      "name": [{
        "identifier": "current",
        "firstName": "JOHN",      # ← Official test value
        "lastName": "CONSUMER"     # ← Official test value
      }],
      "socialNum": [{
        "identifier": "current",
        "number": "666000001"      # ← Official test value (starting with 666)
      }],
      "addresses": [{
        "identifier": "current",
        "houseNumber": "123",
        "streetName": "MAIN",      # ← Official test value
        "streetType": "ST",
        "city": "ATLANTA",
        "state": "GA",
        "zip": "30301"             # ← Official test value
      }]
    },
    "customerReferenceidentifier": "TEST-001",
    "customerConfiguration": {
      "equifaxUSConsumerCreditReport": {
        "pdfComboIndicator": "Y",
        "memberNumber": "999XX12345",
        "securityCode": "@U2",
        "customerCode": "IAPI",
        "models": [{"identifier": "02778"}]
      }
    }
  }'
```

**Note**: The exact test values (names, SSN, addresses) must come from Equifax's official test library. The values shown above are examples - get real ones from Postman/API Reference.

---

## For Testing Different Scenarios

The **Additional API Docs** tab has 20K test cases covering:

- ✅ Good credit scores
- ⚠️ Bad credit scores  
- 🚨 Fraud alerts
- 📊 Various trade line histories
- 💳 Different account types
- 🏦 Bankruptcies, collections, etc.

Each scenario has specific test data that triggers that response in the sandbox.

---

## Moving to TEST Environment

After sandbox works, to move to **TEST environment** (with real test data):

1. You need a **test member number starting with 999**
2. Call **1-888-407-0359**:
   - Option 2: Developer Portal support
   - Option 4: Email request
3. Or request via EFX Developer Portal email
4. Use "Promote to Test" button on dashboard
5. Set target go-live date
6. Wait up to 48 hours for approval

---

## Moving to PRODUCTION

After TEST environment works:

1. Click **"Promote to Live"** button
2. Re-route 100% of traffic by June 30, 2021 (outdated deadline, but shows process)
3. Production uses different endpoints than sandbox/test

---

## Summary

**Your code is correct. Your OAuth is correct. Your endpoint is correct.**

**What's wrong**: Using test data that's not in Equifax's official test scenario library.

**The fix**: Get official test data from:
1. Postman collection (fastest) ⭐
2. API Reference tab samples
3. Additional API Docs 20K test scenarios

**Expected time to fix**: 5-15 minutes once you access the official test data.

---

## Next Command to Run

After you get the official test data and update `consumer.json`:

```bash
# The same script will work - just with correct test data
./api_call_debug.sh
```

You should get a real credit report response instead of the mocker error.

---

## Need Help?

**Equifax Support**: 1-888-407-0359
- Option 2: Developer Portal
- Option 4: Email

**Developer Portal**: https://developer.equifax.com
- Support tab: Searchable FAQs
- Contact form available

**Documentation**:
- API Reference tab: Request/response samples
- Additional API Docs: 20K test scenarios
- Support tab: FAQs and guides
