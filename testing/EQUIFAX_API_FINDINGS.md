# Equifax OneView API Investigation Findings

**Date**: June 6, 2026  
**API**: Equifax OneView Consumer Credit Report  
**Environment**: Sandbox

---

## Current Status

✅ **OAuth Authentication**: Working  
❌ **Credit Report Request**: Receiving mock error response

**Error Message**: `"Error occured in mocker"` with HTTP 200 Created status

---

## API Documentation Research

### Authentication Method

According to Equifax developer documentation:

- **Protocol**: OAuth 2.0 with JWT (JSON Web Tokens)
- **Token Type**: Bearer token
- **Special Requirement**: Consumer Engagement Suite products require **Type: B2B2C** authentication
- **Credentials**: API Client ID and API Client Secret

### Endpoint Structure

From official documentation:

1. **Token Endpoint**: `/v2/oauth/token` ✅ (Working)
2. **Credit Report Endpoints**:
   - `/v1/creditReport` (generic)
   - `/v1/creditReport/{reportId}` (specific report)
   - `/v1/creditReport/{reportId}/summary` (summary)
   - `/business/oneview/consumer-credit/v1/reports/credit-report` (current usage)

### Required Headers (Per Documentation)

Standard headers we're using:
- `Authorization: Bearer {token}` ✅
- `Content-Type: application/json` ✅

**Potentially Missing Custom Headers**:
- `efx-customer-code` (value: from customerConfiguration)
- `efx-member-number` (value: from customerConfiguration)
- Additional vendor-specific headers

### Authentication Flow

The documentation suggests a multi-step process:

1. First call: `/users/efx-config` to get user configuration
2. Second call: `/oauth/token` to get credentials
3. Final call: Credit report endpoint with token

**Current Issue**: We may be skipping step 1, which could cause the sandbox to return mock errors.

---

## Likely Causes of Mock Error

### 1. **Missing Custom Headers** (Most Likely)
The `customerCode` and `memberNumber` in `consumer.json` may need to be HTTP headers:
```bash
-H "efx-customer-code: IAPI"
-H "efx-member-number: 999XX12345"
```

### 2. **Incorrect Payload Structure**
The sandbox may expect a different JSON structure or field names. Current structure includes:
- `consumers` object ✅
- `customerReferenceidentifier` ✅
- `customerConfiguration` object with nested configs

The configuration object might need to be flattened or sent differently.

### 3. **Missing Initialization Call**
Per documentation, we may need to call `/users/efx-config` before requesting credit reports.

### 4. **Endpoint Path Variation**
Different API versions may use different paths:
- Current: `/business/oneview/consumer-credit/v1/reports/credit-report`
- Alternate: `/business/oneview/consumer-credit/v1/credit-report`
- Legacy: `/v1/creditReport`

### 5. **Sandbox-Specific Test Data**
Some sandbox APIs only work with specific "magic" test values. The current test data:
- SSN: `666123456`
- Name: `JLJBKF KHJGUFJM`
- Address: Atlanta, GA

These may need to match exact sandbox test cases from Equifax documentation.

---

## Testing Plan

### Phase 1: Header Variations ✅ (Enhanced Script Created)
- [x] Add `efx-customer-code` header
- [x] Add `efx-member-number` header
- [x] Try minimal payload
- [x] Try alternate endpoint path

### Phase 2: Payload Restructuring
- [ ] Flatten customerConfiguration to root level
- [ ] Try with only equifaxUSConsumerCreditReport config
- [ ] Remove optional fields (TWN, Datax configs)

### Phase 3: API Version Testing
- [ ] Try `/v1/creditReport` endpoint
- [ ] Check if different OAuth scope is needed

### Phase 4: Documentation Review
- [ ] Download official PDF: "Consumer Credit Report API Getting Started Guide"
- [ ] Review exact schema requirements
- [ ] Find sandbox-specific test data requirements
- [ ] Check for example curl commands

### Phase 5: Support Contact
- [ ] Contact Equifax developer support
- [ ] Provide transaction IDs and error details
- [ ] Request working example for sandbox environment

---

## Resources

### Official Documentation
- **Developer Portal**: https://developer.equifax.com/
- **OneView Product Page**: https://developer.equifax.com/products/apiproducts/oneview-consumer-credit-report
- **Getting Started Guide** (PDF): https://assets.equifax.com/acro-migration-kb/assets/consumer_credit_json_api_getting_started_guide.pdf
- **Authentication Guide**: https://api.consumer.equifax.com/saas/docs/api/how-to-authenticate.html

### API Endpoints
- **Sandbox Base URL**: `https://api.sandbox.equifax.com`
- **OAuth Token**: `/v2/oauth/token`
- **Credit Report**: `/business/oneview/consumer-credit/v1/reports/credit-report`

---

## Transaction IDs for Reference

When contacting Equifax support, provide:

- **OAuth Success**: `0f36fed4-d243-a212-6e58-8c08562b2b25`
- **Credit Report Mock Error**: `7b5b919d-11a5-59cf-3f9e-40033faeb081`

---

## Next Steps

1. **Run Enhanced Test Script** (`api_call_enhanced.sh`)
   - Tests 3 different approaches with headers and payload variations
   
2. **Review Official PDF Guide**
   - Download the Consumer Credit JSON API Getting Started Guide
   - Compare our payload with official examples
   
3. **Check Sandbox Account Settings**
   - Verify account is fully provisioned for OneView API
   - Check if specific test scenarios need activation
   
4. **Contact Equifax Support**
   - If enhanced tests still fail, escalate to support
   - Request clarification on sandbox requirements

---

## Technical Details

### Working OAuth Response
```json
{
  "access_token": "TIocLd4WHdCGGFHF5i2HhEkwq71t",
  "token_type": "Bearer",
  "expires_in": 1449,
  "scope": "https://api.equifax.com/business/oneview/consumer-credit/v1"
}
```

### Current Error Response
```json
{
  "id": 1,
  "error": "Error occured in mocker",
  "message": "This is default response "
}
```

Note the typo "occured" (should be "occurred") suggests this is a generic catch-all from Equifax's mock server, not a specific validation error.

---

## References

Based on search results from Equifax developer documentation as of June 2026.
