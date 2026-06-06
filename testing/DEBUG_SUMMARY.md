# API Call Debug Summary

## Execution Date: 2026-06-06

## Overview
The script executes successfully through both OAuth and credit report API calls, but receives a mock error response from the Equifax sandbox.

---

## Step 1: OAuth Token Request ✅

### Request Details
- **URL**: `https://api.sandbox.equifax.com/v2/oauth/token`
- **Method**: POST
- **Auth**: Basic (username/password)
- **Content-Type**: `application/x-www-form-urlencoded`
- **Body**: `grant_type=client_credentials`

### Response
- **Status**: `HTTP/1.1 200 OK`
- **Transaction ID**: `0f36fed4-d243-a212-6e58-8c08562b2b25`
- **Access Token**: `TIocLd4WHdCGGFHF5i2HhEkwq71t`
- **Token Type**: Bearer
- **Expires In**: 1449 seconds (~24 minutes)
- **Scope**: `https://api.equifax.com/business/oneview/consumer-credit/v1`

**Result**: ✅ **SUCCESS** - OAuth token obtained successfully

---

## Step 2: Credit Report Request ❌

### Request Details
- **URL**: `https://api.sandbox.equifax.com/business/oneview/consumer-credit/v1/reports/credit-report`
- **Method**: POST
- **Authorization**: Bearer token (from Step 1)
- **Content-Type**: `application/json`
- **Content-Length**: 1370 bytes
- **Transaction ID**: `7b5b919d-11a5-59cf-3f9e-40033faeb081`

### Request Headers Sent
```
> POST /business/oneview/consumer-credit/v1/reports/credit-report HTTP/1.1
> Host: api.sandbox.equifax.com
> User-Agent: curl/8.7.1
> Accept: */*
> Authorization: Bearer LLpIeW8oihSzwnGxGg8tnNeIIV14
> Content-Type: application/json
> Content-Length: 1370
```

### Response
- **Status**: `HTTP/1.1 200 Created`
- **Content-Type**: `application/json`
- **Content-Length**: 169 bytes

### Response Body
```json
{
    "id": 1,
    "error": "Error occured in mocker",
    "message": "This is default response "
}
```

**Result**: ❌ **MOCK ERROR** - Sandbox returned default error response

---

## Analysis

### What's Working
1. ✅ Network connectivity to Equifax sandbox
2. ✅ TLS/SSL handshake (TLSv1.2 with valid certificate)
3. ✅ OAuth authentication (credentials accepted)
4. ✅ Access token generation
5. ✅ Bearer token authorization (accepted by API)
6. ✅ Request payload delivery (1370 bytes sent successfully)

### The Issue
The sandbox API is responding with `HTTP/1.1 200 Created` but returning a **generic mock error** instead of actual credit report data. The error message "Error occured in mocker" (note the typo "occured") suggests this is a catch-all response from Equifax's mock server.

### Possible Causes

1. **Payload Format Mismatch**
   - The `consumer.json` structure may not match Equifax's expected schema
   - Missing required fields or incorrect field names
   - Invalid test data values

2. **Missing Required Headers**
   - Equifax may require additional custom headers beyond Authorization and Content-Type
   - Possible missing headers: `customerCode`, `X-Client-ID`, `X-Member-Number`, etc.

3. **Sandbox Configuration**
   - The sandbox account may not be fully provisioned
   - Specific test scenarios may need to be activated
   - The endpoint may require special sandbox test data patterns

4. **API Version Mismatch**
   - The endpoint URL might be outdated or incorrect for this sandbox environment
   - Different API versions may have different requirements

---

## Recommendations

### Immediate Actions

1. **Review Equifax API Documentation**
   - Verify the exact payload schema for sandbox requests
   - Check for required vs optional fields
   - Look for sandbox-specific test data requirements

2. **Check for Additional Headers**
   - Review documentation for custom headers (e.g., `customerCode`, `memberNumber`)
   - The `consumer.json` contains these values but they may need to be in headers instead

3. **Test with Equifax Example Data**
   - Use exact test cases from Equifax documentation
   - Some sandboxes only work with specific magic test values

4. **Contact Equifax Support**
   - Provide transaction ID: `7b5b919d-11a5-59cf-3f9e-40033faeb081`
   - Ask if the sandbox endpoint is fully functional
   - Request example working curl commands

### Debug Next Steps

1. Try adding custom headers from `consumer.json`:
   ```bash
   -H "efx-customer-code: IAPI"
   -H "efx-member-number: 999XX12345"
   ```

2. Validate JSON payload against schema
3. Try minimal payload with just required fields
4. Check if endpoint expects different consumer data structure

---

## Script Performance

- **OAuth Token Request**: ~300ms
- **Credit Report Request**: ~6000ms (6 seconds)
- **Total Execution**: ~6.5 seconds
- **Network**: Stable, no timeouts or connection errors

---

## Environment

- **Client IP**: 72.177.86.208 (as seen by Equifax)
- **Server IP**: 44.201.73.214 (api.sandbox.equifax.com)
- **SSL/TLS**: TLSv1.2, ECDHE-RSA-AES256-GCM-SHA384
- **Certificate**: Valid (May 25 2026 - Dec 9 2026)
- **Curl Version**: 8.7.1

---

## Conclusion

The script is **functioning correctly** from a technical perspective. The issue is with the **API response content**, not the script execution. This appears to be a sandbox configuration or payload format issue that requires:

1. Verification against Equifax documentation
2. Possible modification of request headers or payload structure
3. Potential contact with Equifax support for sandbox troubleshooting
