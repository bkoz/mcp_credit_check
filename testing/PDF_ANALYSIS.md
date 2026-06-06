# Equifax PDF Guide Analysis

## Critical Findings from Official Documentation

### 1. Partner Product Access Code (Page 3)
**IMPORTANT**: The guide mentions using a specific Partner Product Access Code:
```
10d45ed9546401a4f69c46c966f2add0
```

This code is used to unlock the Consumer Credit Report API when creating your app in the developer portal.

### 2. Setup Process (Pages 3-5)

#### Step 1: Create App on Developer Portal
1. Go to Dashboard and create new app
2. Enter **Application Name** and **Description**
3. Click **Next**

#### Step 2: Add API Product
1. Click **Add API Product** to connect the **Consumer Credit Report API**
2. Scroll through alphabetized list and select **Consumer Credit Report**
3. Scroll to bottom and select **Add** button

#### Step 3: Get Credentials
- View **Credentials & Details** (Auto & Manually Generated Tokens)
- Click **API Reference** link for technical specifications
- Look for the **API Reference** section which shows:
  - Endpoint: `Consumer Credit Report`
  - Scope value
  - **Manually Generated Token** section with API Reference URL

#### Step 4: Postman Collection (Recommended Method)
The guide **strongly recommends** using Postman:
1. Click **Run in Postman** from API Reference page
2. Import the official **Consumer Credit Report-sandbox** collection
3. Collection includes two POST requests:
   - **Consumer Credit File** 
   - **Token** request

### 3. Authentication Details (Page 4-5)

**OAuth 2.0 Requirements**:
- Authorization header format: `Bearer {token}` (word "Bearer" before token is required)
- 2-step Authentication process shown in Postman
- Token request message structure is pre-configured in Postman collection

### 4. API Reference Tab (Page 5)

**CRITICAL**: The API Reference tab contains:
- Request and response samples for the body schema in JSON data format
- Exact schema requirements
- Example payloads

**New Error Codes** (as of publication):
- Check the API Reference tab for newly published error codes
- Previous ACRO error codes are still valid but new ones have been added

### 5. Testing Environment (Page 6)

**Sandbox → Test → Production Flow**:

1. **Sandbox**: Familiarizes you with Credit Report JSON format structure
2. **Test Environment**: Enables working with real data to meet your needs
   - Requires **Test member number starting with 999**
   - Need to call **1-888-407-0359** for test member number
   - Or request via EFX Developer Portal (option 2 when prompted) or email

3. **Promote to Test**: 
   - Navigate to Dashboard
   - Click **Promote to Test** button
   - Enter target **Targeted Go-Live** date
   - Approval may take up to 48 hours

### 6. Test Scenarios (Page 6)

**Additional API Docs Tab**:
- Contains elaborate list of **20K test cases**
- Provides wide range of test scenarios
- Test bed enables filtering by various conditions
- **You must use these specific test scenarios for sandbox testing**

### 7. Different Environments Have Different Endpoints

**As you progress through environments, be aware of endpoint variations**:
- Sandbox environment
- UAT environment  
- Production environment

---

## Why Your API Call Is Failing

### Root Cause: Not Using Official Test Scenarios

The "Error occured in mocker" message indicates the sandbox doesn't recognize your test data. The sandbox is **NOT a live testing environment** - it only responds to **specific pre-programmed test scenarios** from the 20K test case library.

### What You Need To Do

1. **Log into developer.equifax.com**
2. **Navigate to your app → API Reference tab**
3. **Download the exact request/response samples** in JSON format
4. **Check Additional API Docs tab** for the 20K test scenarios
5. **Use ONLY test data from these scenarios** in sandbox

Your current test data (SSN: 666123456, Name: JLJBKF KHJGUFJM) is **NOT** in the official test scenario library, which is why the mocker returns the default error.

### Alternative: Use Postman Collection

**RECOMMENDED BY EQUIFAX**:
1. Download the official Postman collection from the API Reference page
2. Import into Postman
3. Use the pre-configured "Consumer Credit Report-sandbox" collection
4. The collection has the correct request format and test data already configured

---

## Immediate Next Steps

### Option 1: Find Official Test Data (Best)
1. Log into https://developer.equifax.com
2. Go to your app's API Reference tab
3. Look for sample JSON request bodies with valid test data
4. Copy the exact JSON structure and test values
5. Replace your `consumer.json` with official test data

### Option 2: Use Postman (Easiest)
1. From API Reference page, click "Run in Postman"
2. Import the collection
3. Copy credentials from your app into Postman
4. Run the pre-configured sandbox test
5. Export the working request to use in your code

### Option 3: Contact Support
Call **1-888-407-0359** (option 2 for developer portal, then option 4 for email)
- Ask for sandbox test data examples
- Request access to the 20K test scenario documentation
- Verify your app is properly configured for sandbox access

---

## Key Documentation Resources

From the PDF guide:

1. **ACRO Credit Report JSON API Walk-through** (video)
2. **Support tab** - searchable FAQs
3. **API Version Comparison Guide** - for detailed field mapping
4. **Additional API Docs** - 20K test cases

---

## Important Notes

- **Test Member Number**: For TEST environment (not sandbox), you need a member number starting with 999
- **Production Migration Deadline**: The guide mentions June 30, 2021 deadline (outdated, but shows urgency to migrate)
- **Collaborators**: Use the Collaborators Tab in EFX Developer Portal to add team members
- **Different endpoints for different environments**: Sandbox/UAT/Production use different base URLs

---

## Summary

Your API call is **technically correct** but using **wrong test data**. The Equifax sandbox is not a full simulation - it's a **test scenario matcher**. You must use test data from their official 20K test case library, which is available in:

1. The API Reference tab (JSON samples)
2. The Additional API Docs tab (20K test cases)
3. The official Postman collection (pre-configured)

The fastest path forward is to **download the Postman collection** or **get the JSON samples from the API Reference tab** on the developer portal.
