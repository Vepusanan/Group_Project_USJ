# Startup Profile API - Postman Testing Guide

## Prerequisites
1. Server running on `http://localhost:5000` (or your configured port)
2. Postman installed
3. At least one startup user account created and verified

---

## Setup: Environment Variables (Optional but Recommended)

Create a Postman Environment with these variables:
- `BASE_URL`: `http://localhost:5000`
- `TOKEN`: (will be set after login)
- `PROFILE_ID`: (will be set after creating profile)

---

## Test Flow Overview

```
1. Register/Login as Startup User
2. Create Startup Profile (with files)
3. Get My Profile
4. Get Profile by ID (as owner)
5. Update Profile (with new files)
6. Upload Additional Documents
7. Delete a Document
8. Get Profile by ID (as public/other user)
```

---

## 1. Register a Startup User

**Method:** `POST`  
**URL:** `{{BASE_URL}}/api/auth/register`  
**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "startup@example.com",
  "password": "SecurePass123!",
  "user_type": "startup",
  "full_name": "John Doe"
}
```

**Expected Response (201):**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "uuid-here",
    "email": "startup@example.com",
    "user_type": "startup",
    "full_name": "John Doe"
  }
}
```

**Action:** Verify email (check console logs or email inbox)

---

## 2. Login as Startup User

**Method:** `POST`  
**URL:** `{{BASE_URL}}/api/auth/login`  
**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "startup@example.com",
  "password": "SecurePass123!"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "startup@example.com",
    "user_type": "startup",
    "full_name": "John Doe",
    "is_verified": true
  }
}
```

**Action:** Copy the `token` value and save it
- If using environment: Set `TOKEN` variable
- Otherwise: Use it in the next requests' Authorization header

---

## 3. Create Startup Profile (with Files)

**Method:** `POST`  
**URL:** `{{BASE_URL}}/api/startups/profile`  
**Headers:**
```
Authorization: Bearer {{TOKEN}}
```

**Body (form-data):**

### Required Fields:
| Key | Type | Value |
|-----|------|-------|
| `company_name` | Text | `TechVenture AI` |

### Optional Text Fields:
| Key | Type | Value (Example) |
|-----|------|-------|
| `city` | Text | `Colombo` |
| `country` | Text | `Sri Lanka` |
| `website` | Text | `https://techventure.ai` |
| `linkedin` | Text | `https://linkedin.com/company/techventure-ai` |
| `tagline` | Text | `Revolutionizing AI for businesses` |
| `description` | Text | `We build cutting-edge AI solutions for enterprise customers, focusing on automation and efficiency.` |
| `industry` | Text | `Artificial Intelligence` |
| `founded_date` | Text | `2024-01-15` |
| `stage` | Text | `Seed` |
| `contact_email` | Text | `contact@techventure.ai` |
| `contact_phone` | Text | `+94771234567` |

### JSON Fields (use Text type, paste JSON string):

**⚠️ IMPORTANT:** These must be valid JSON strings. Use Text type in form-data, NOT File type.

| Key | Type | Value (JSON String) |
|-----|------|-------|
| `founders` | Text | `[{"name":"John Doe","role":"CEO","linkedin":"https://linkedin.com/in/johndoe"},{"name":"Jane Smith","role":"CTO","linkedin":"https://linkedin.com/in/janesmith"}]` |
| `team` | Text | `[{"name":"Alice Brown","role":"Lead Developer"},{"name":"Bob Wilson","role":"Product Manager"}]` |
| `funding` | Text | `{"amount_raised":"500000","current_round":"Seed","valuation":"5000000","currency":"USD"}` |
| `traction` | Text | `{"revenue":"50000","users":"1000","growth_rate":"25%","key_metrics":"Monthly active users growing 25% MoM"}` |

**How to enter in Postman:**
1. Select **form-data** as body type
2. For each JSON field above, create a new row
3. Set type to **Text** (not File)
4. Paste the entire JSON string as-is (including brackets/braces)
5. Make sure the JSON is valid (no extra quotes, proper escaping)

### File Fields:
| Key | Type | Value |
|-----|------|-------|
| `logo` | File | Select an image file (JPG/PNG, max 15MB) |
| `documents` | File | Select PDF file (e.g., pitch_deck.pdf) |
| `documents` | File | Select another file (e.g., business_plan.pdf) |

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "profile-uuid-here",
    "user_id": "user-uuid",
    "company_name": "TechVenture AI",
    "logo_url": "https://...supabase.co/storage/.../logo_xxx.jpg",
    "city": "Colombo",
    "country": "Sri Lanka",
    "tagline": "Revolutionizing AI for businesses",
    "documents": [
      {
        "name": "pitch_deck.pdf",
        "url": "https://...supabase.co/storage/.../doc_xxx.pdf",
        "size": 2048576
      }
    ],
    "created_at": "2025-12-02T...",
    "updated_at": "2025-12-02T..."
  }
}
```

**Action:** Copy the `id` from response and save as `PROFILE_ID`

---

## 4. Get My Startup Profile

**Method:** `GET`  
**URL:** `{{BASE_URL}}/api/startups/profile/me`  
**Headers:**
```
Authorization: Bearer {{TOKEN}}
```

**Body:** None

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "profile-uuid",
    "user_id": "user-uuid",
    "company_name": "TechVenture AI",
    "founders": [
      {
        "name": "John Doe",
        "role": "CEO",
        "linkedin": "https://linkedin.com/in/johndoe"
      }
    ],
    "logo_url": "https://...supabase.co/.../logo.jpg",
    "team": [...],
    "funding": {...},
    "documents": [...],
    "contact_email": "contact@techventure.ai",
    "contact_phone": "+94771234567",
    ...
  }
}
```

**Note:** Returns full profile including private fields (funding, contact info, documents)

---

## 5. Get Profile by ID (as Owner)

**Method:** `GET`  
**URL:** `{{BASE_URL}}/api/startups/profile/{{PROFILE_ID}}`  
**Headers:**
```
Authorization: Bearer {{TOKEN}}
```

**Body:** None

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "profile-uuid",
    "company_name": "TechVenture AI",
    "founders": [...],
    "funding": {...},
    "documents": [...],
    "contact_email": "contact@techventure.ai",
    ...
  }
}
```

**Note:** Owner sees all fields including private data

---

## 6. Update Startup Profile

**Method:** `PUT`  
**URL:** `{{BASE_URL}}/api/startups/profile/{{PROFILE_ID}}`  
**Headers:**
```
Authorization: Bearer {{TOKEN}}
```

**Body (form-data):**

### Update Any Field:
| Key | Type | Value |
|-----|------|-------|
| `tagline` | Text | `Leading the future of enterprise AI` |
| `stage` | Text | `Series A` |
| `website` | Text | `https://techventure.ai/new` |

### Update Logo (optional):
| Key | Type | Value |
|-----|------|-------|
| `logo` | File | Select new image file |

### Add More Documents (optional):
| Key | Type | Value |
|-----|------|-------|
| `documents` | File | Select new PDF file |

### Update JSON Fields:
| Key | Type | Value |
|-----|------|-------|
| `funding` | Text | `{"amount_raised":"2000000","current_round":"Series A","valuation":"20000000"}` |

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "profile-uuid",
    "company_name": "TechVenture AI",
    "tagline": "Leading the future of enterprise AI",
    "stage": "Series A",
    "logo_url": "https://...new_logo_url...",
    "documents": [
      {...old documents...},
      {...new documents...}
    ],
    "updated_at": "2025-12-02T..."
  }
}
```

**Note:** New logo replaces old one; documents are merged with existing

---

## 7. Upload Additional Documents

**Method:** `POST`  
**URL:** `{{BASE_URL}}/api/startups/profile/{{PROFILE_ID}}/documents`  
**Headers:**
```
Authorization: Bearer {{TOKEN}}
```

**Body (form-data):**
| Key | Type | Value |
|-----|------|-------|
| `documents` | File | Select file 1 (e.g., financial_report.pdf) |
| `documents` | File | Select file 2 (e.g., market_analysis.docx) |
| `documents` | File | Select file 3 (e.g., demo_video.mp4) |

**Expected Response (200):**
```json
{
  "success": true,
  "message": "3 documents uploaded successfully",
  "data": {
    "id": "profile-uuid",
    "documents": [
      {...existing documents...},
      {
        "name": "financial_report.pdf",
        "url": "https://...supabase.co/.../doc_xxx.pdf",
        "size": 1024000
      },
      {
        "name": "market_analysis.docx",
        "url": "https://...supabase.co/.../doc_xxx.docx",
        "size": 512000
      },
      {
        "name": "demo_video.mp4",
        "url": "https://...supabase.co/.../doc_xxx.mp4",
        "size": 5120000
      }
    ]
  },
  "newDocuments": [...]
}
```

---

## 8. Delete a Document

**Method:** `DELETE`  
**URL:** `{{BASE_URL}}/api/startups/profile/{{PROFILE_ID}}/documents/0`  
**Headers:**
```
Authorization: Bearer {{TOKEN}}
```

**Body:** None

**URL Parameters:**
- Replace `0` with the index of the document to delete
- Documents are indexed from 0 (first document is index 0)

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Document deleted successfully",
  "data": {
    "id": "profile-uuid",
    "documents": [
      {...remaining documents...}
    ]
  }
}
```

---

## 9. Get Profile by ID (as Public/Non-Owner)

**Test viewing profile as different user or without authentication**

### Option A: Without Authentication

**Method:** `GET`  
**URL:** `{{BASE_URL}}/api/startups/profile/{{PROFILE_ID}}`  
**Headers:** None (remove Authorization header)

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "profile-uuid",
    "company_name": "TechVenture AI",
    "tagline": "Leading the future of enterprise AI",
    "description": "We build cutting-edge AI solutions...",
    "industry": "Artificial Intelligence",
    "logo_url": "https://...logo.jpg",
    "city": "Colombo",
    "country": "Sri Lanka",
    "website": "https://techventure.ai",
    "linkedin": "https://linkedin.com/company/techventure-ai",
    "stage": "Series A",
    "traction": {...}
  }
}
```

**Note:** Only public fields returned (no founders, team, funding, documents, contact info)

### Option B: As Different User (Investor)

1. Register/Login as investor user
2. Get new token
3. Use investor token in Authorization header
4. Make same GET request

**Expected Response:** Same as public view (only public fields)

---

## 10. Error Test Cases

### Test 1: Create Profile without Authentication
**Method:** `POST`  
**URL:** `{{BASE_URL}}/api/startups/profile`  
**Headers:** None  
**Expected:** `401 Unauthorized`

### Test 2: Create Profile as Investor User
**Method:** `POST`  
**URL:** `{{BASE_URL}}/api/startups/profile`  
**Headers:** `Authorization: Bearer <investor-token>`  
**Body:** Valid profile data  
**Expected:** `403 Forbidden` - "Only startup users can create startup profiles"

### Test 3: Create Profile without Company Name
**Method:** `POST`  
**URL:** `{{BASE_URL}}/api/startups/profile`  
**Headers:** `Authorization: Bearer {{TOKEN}}`  
**Body (form-data):** Only optional fields  
**Expected:** `400 Bad Request` - "company_name is required"

### Test 4: Update Another User's Profile
1. Create profile with User A
2. Login as User B (different startup user)
3. Try to update User A's profile  
**Expected:** `404 Not Found` - "Profile not found or not owned by user"

### Test 5: Upload Invalid File Type
**Method:** `POST`  
**URL:** `{{BASE_URL}}/api/startups/profile`  
**Body:** Include .exe or .zip file  
**Expected:** `400 Bad Request` - "Invalid file type"

### Test 6: Upload File Too Large
**Method:** `POST`  
**URL:** `{{BASE_URL}}/api/startups/profile`  
**Body:** Include file > 15MB  
**Expected:** `400 Bad Request` - File size limit error

### Test 7: Delete Document with Invalid Index
**Method:** `DELETE`  
**URL:** `{{BASE_URL}}/api/startups/profile/{{PROFILE_ID}}/documents/999`  
**Expected:** `400 Bad Request` - "Invalid document index"

### Test 8: Get Non-Existent Profile
**Method:** `GET`  
**URL:** `{{BASE_URL}}/api/startups/profile/invalid-uuid-123`  
**Expected:** `404 Not Found` - "Profile not found"

---

## Quick Reference: Postman Form-Data Setup

### How to set up form-data correctly:

1. **Select Body Type:**
   - Click on **Body** tab
   - Select **form-data** radio button

2. **Add Text Fields:**
   ```
   Key: company_name    | Type: Text | Value: TechVenture AI
   Key: city            | Type: Text | Value: Colombo
   Key: country         | Type: Text | Value: Sri Lanka
   Key: tagline         | Type: Text | Value: Revolutionizing AI
   ```

3. **Add JSON Fields (as Text):**
   ```
   Key: founders
   Type: Text (NOT File!)
   Value: [{"name":"John Doe","role":"CEO","linkedin":"https://linkedin.com/in/johndoe"}]
   
   Key: team
   Type: Text (NOT File!)
   Value: [{"name":"Alice Brown","role":"Lead Developer"}]
   
   Key: funding
   Type: Text (NOT File!)
   Value: {"amount_raised":"500000","current_round":"Seed","valuation":"5000000"}
   ```

4. **Add File Fields:**
   ```
   Key: logo       | Type: File | Value: [Select file]
   Key: documents  | Type: File | Value: [Select file]
   Key: documents  | Type: File | Value: [Select file]
   ```

**⚠️ Common Mistakes:**
- ❌ Setting JSON fields to "File" type
- ❌ Wrapping JSON in extra quotes: `"[{...}]"`
- ❌ Using escaped quotes when not needed: `\"`
- ✅ Use raw JSON strings for text fields
- ✅ Multiple files with same key name is OK

---

## Sample Test Files

### Prepare these test files:

1. **Logo Image:**
   - `company_logo.png` or `logo.jpg`
   - Recommended: 400x400px or larger
   - Max size: 15MB

2. **Documents:**
   - `pitch_deck.pdf` - Sample pitch deck
   - `business_plan.pdf` - Business plan document
   - `financial_report.xlsx` - Financial data
   - `demo_video.mp4` - Product demo
   - `market_analysis.docx` - Market research

---

## Postman Collection Structure

Organize your Postman collection like this:

```
📁 Startup Platform API
  📁 Auth
    → Register Startup User
    → Login Startup User
    → Register Investor User
    → Login Investor User
  📁 Startup Profile
    📁 Create & Read
      → Create Profile (with files)
      → Get My Profile
      → Get Profile by ID (as owner)
      → Get Profile by ID (as public)
    📁 Update
      → Update Profile (text fields)
      → Update Profile (with new logo)
      → Update Profile (with new documents)
    📁 Document Management
      → Upload Additional Documents
      → Delete Document by Index
    📁 Error Cases
      → Create without auth (401)
      → Create as investor (403)
      → Create without company name (400)
      → Update other's profile (404)
      → Upload invalid file (400)
```

---

## Environment Setup in Postman

1. Click **Environments** in Postman
2. Click **Create Environment**
3. Name it: `Startup Platform - Local`
4. Add variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `BASE_URL` | `http://localhost:5000` | `http://localhost:5000` |
| `TOKEN` | (empty) | (will be set by tests) |
| `PROFILE_ID` | (empty) | (will be set by tests) |
| `INVESTOR_TOKEN` | (empty) | (will be set by tests) |

5. **Save** the environment
6. Select it from the dropdown

---

## Tips for Testing

### 1. Save Tokens Automatically
Add this to your Login request's **Tests** tab:
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("TOKEN", response.token);
}
```

### 2. Save Profile ID Automatically
Add this to your Create Profile request's **Tests** tab:
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("PROFILE_ID", response.data.id);
}
```

### 3. Test File Uploads
When testing file uploads:
- Use form-data body type
- Select files from your local machine
- Verify files appear in Supabase Storage buckets
- Check the returned URLs are accessible

### 4. Verify Responses
Add basic assertions in Tests tab:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    const json = pm.response.json();
    pm.expect(json).to.have.property("success");
});
```

---

## Common Issues & Solutions

### Issue 1: "Token expired" error
**Solution:** Login again to get a fresh token

### Issue 2: File upload fails
**Solution:** 
- Check file size < 15MB
- Verify file type is allowed
- Ensure Supabase credentials are correct in `.env`

### Issue 3: "Profile not found"
**Solution:** 
- Verify PROFILE_ID is correct
- Check if profile was actually created
- Use correct UUID format

### Issue 4: Cannot see private fields
**Solution:** 
- Ensure you're using the owner's token
- Check Authorization header is present
- Verify token hasn't expired

### Issue 5: Images not loading
**Solution:** 
- Check Supabase Storage bucket permissions
- Verify bucket is public
- Test URL directly in browser

### Issue 6: "invalid input syntax for type integer" OR "[object Object] is not valid JSON" error

**Error Messages:** 
- `invalid input syntax for type integer: ""{\"name\":\"Alice Brown\"..."`
- `"[object Object]" is not valid JSON`

**Cause:** JSON fields are being improperly formatted in Postman

**Solution:**
1. **In Postman form-data:**
   - Make sure JSON fields use **Text** type, NOT File type
   - Paste raw JSON string without extra quotes
   - Example: `[{"name":"Alice","role":"Developer"}]`
   - NOT: `"[{\"name\":\"Alice\",\"role\":\"Developer\"}]"`

2. **Verify JSON is valid:**
   - Use a JSON validator before pasting
   - No trailing commas
   - Proper quote escaping
   - Complete brackets/braces

3. **Check you're not sending:**
   - Double-quoted strings
   - Escaped JSON that's already a string
   - Stringified JSON as a string

**Good Example:**
```
Key: team
Type: Text
Value: [{"name":"Alice Brown","role":"Lead Developer"}]
```

**Bad Example (causes error):**
```
Key: team  
Type: Text
Value: "[{\"name\":\"Alice Brown\",\"role\":\"Lead Developer\"}]"
```

---

## Expected Test Results Summary

| Test Case | Expected Status | Response Contains |
|-----------|----------------|-------------------|
| Create Profile | 201 | `success: true`, profile with id |
| Get My Profile | 200 | Full profile with private fields |
| Get by ID (owner) | 200 | Full profile with private fields |
| Get by ID (public) | 200 | Public fields only |
| Update Profile | 200 | Updated profile data |
| Upload Documents | 200 | Profile with new documents |
| Delete Document | 200 | Profile without deleted doc |
| No Auth | 401 | Error message |
| Wrong User Type | 403 | Error message |
| Missing Required | 400 | Error message |
| Not Owner | 404 | Error message |

---

## Next Steps After Testing

1. ✅ Verify all endpoints work correctly
2. ✅ Test file uploads to Supabase Storage
3. ✅ Confirm public vs private field visibility
4. ⚠️ Implement connection logic for investor access
5. 📝 Document any bugs found
6. 🚀 Deploy to staging environment

---

## VISUAL GUIDE: How to Enter Data in Postman

### Step-by-Step Screenshot Guide

#### 1️⃣ **Open Request and Set Method**
- Method: **POST**
- URL: `http://localhost:5000/api/startups/profile`

#### 2️⃣ **Add Authorization**
- Tab: **Authorization**
- Type: Select **Bearer Token**
- Token: Paste your JWT token (from login response)

#### 3️⃣ **Set Body Type**
- Tab: **Body**
- Select: **form-data** (radio button, NOT raw or JSON)

#### 4️⃣ **Add Text Fields One by One**

**For simple text fields, just type normally:**

```
Row 1:  KEY: company_name     | TYPE: Text | VALUE: TechVenture AI
Row 2:  KEY: city             | TYPE: Text | VALUE: Colombo
Row 3:  KEY: tagline          | TYPE: Text | VALUE: Revolutionizing AI
Row 4:  KEY: industry         | TYPE: Text | VALUE: Artificial Intelligence
Row 5:  KEY: stage            | TYPE: Text | VALUE: Seed
```

#### 5️⃣ **Add JSON Fields (CRITICAL!)**

**⚠️ For JSON fields, paste the ENTIRE JSON string including brackets:**

**FOUNDERS Field:**
```
KEY: founders
TYPE: Text (keep as Text, don't change to File!)
VALUE: [{"name":"John Doe","role":"CEO","linkedin":"https://linkedin.com/in/johndoe"}]
```

**Copy exactly this for founders:**
```
[{"name":"John Doe","role":"CEO","linkedin":"https://linkedin.com/in/johndoe"},{"name":"Jane Smith","role":"CTO","linkedin":"https://linkedin.com/in/janesmith"}]
```

**TEAM Field:**
```
KEY: team
TYPE: Text
VALUE: [{"name":"Alice Brown","role":"Lead Developer"},{"name":"Bob Wilson","role":"Product Manager"}]
```

**FUNDING Field:**
```
KEY: funding
TYPE: Text
VALUE: {"amount_raised":"500000","current_round":"Seed","valuation":"5000000","currency":"USD"}
```

**TRACTION Field:**
```
KEY: traction
TYPE: Text
VALUE: {"revenue":"50000","users":"1000","growth_rate":"25%","key_metrics":"Monthly active users growing 25% MoM"}
```

#### 6️⃣ **Add File Fields**

**For logo (single file):**
```
KEY: logo
TYPE: Change to "File" (click dropdown)
VALUE: Click "Select Files" and choose your image
```

**For documents (multiple files with SAME key name):**
```
Row 1: KEY: documents | TYPE: File | VALUE: [Select pitch_deck.pdf]
Row 2: KEY: documents | TYPE: File | VALUE: [Select business_plan.pdf]
Row 3: KEY: documents | TYPE: File | VALUE: [Select financial_report.pdf]
```

#### 7️⃣ **Double-Check Before Sending**

✅ **Checklist:**
- [ ] Method is POST
- [ ] Authorization has Bearer token
- [ ] Body type is form-data (not raw)
- [ ] company_name is present
- [ ] JSON fields (founders, team, funding, traction) are type TEXT
- [ ] JSON values have NO extra quotes around them
- [ ] JSON values include the opening `[` or `{` and closing `]` or `}`
- [ ] File fields (logo, documents) are type FILE
- [ ] Files are selected and show filename

#### 8️⃣ **Send and Check Response**

Click **Send** button and expect `201 Created` status.

---

## ❌ WRONG vs ✅ RIGHT Examples

### **Example 1: Founders Field**

#### ❌ WRONG (will cause error):
```
KEY: founders
TYPE: File  ← WRONG TYPE!
VALUE: [{"name":"John Doe"}]
```

#### ❌ WRONG (extra quotes):
```
KEY: founders
TYPE: Text
VALUE: "[{\"name\":\"John Doe\"}]"  ← Extra quotes!
```

#### ✅ RIGHT:
```
KEY: founders
TYPE: Text
VALUE: [{"name":"John Doe","role":"CEO"}]
```

### **Example 2: Team Field**

#### ❌ WRONG (incomplete JSON):
```
KEY: team
TYPE: Text
VALUE: {"name":"Alice"}  ← Should be an array!
```

#### ✅ RIGHT:
```
KEY: team
TYPE: Text
VALUE: [{"name":"Alice Brown","role":"Lead Developer"}]
```

### **Example 3: Documents (Multiple Files)**

#### ❌ WRONG (different key names):
```
KEY: documents1  ← WRONG!
KEY: documents2  ← WRONG!
```

#### ✅ RIGHT (same key name):
```
KEY: documents  ← CORRECT!
KEY: documents  ← Same name again!
KEY: documents  ← Same name again!
```

---

## 🔧 TROUBLESHOOTING SPECIFIC ERRORS

### Error: `"[object Object] is not valid JSON"` (500 Internal Server Error)

**What it means:** The server is trying to JSON.parse() something that's already an object

**Common scenarios:**
1. **When creating profile:** JSON fields in Postman are improperly formatted
2. **When viewing profile:** Database returned JSON as object instead of string

**Fix for Creating Profile:**
1. Make sure JSON fields in Postman are type **Text**, not File
2. Check that you copied the ENTIRE JSON string including brackets
3. Verify the JSON is valid at jsonlint.com
4. Don't add any quotes around the JSON

**Fix for Viewing Profile (500 error):**
- This was a bug that has been fixed in the code
- Restart your server: `npm start` in the server directory
- The code now handles both string and object types from database

**Example - What you should paste for `founders`:**
```
[{"name":"John Doe","role":"CEO","linkedin":"https://linkedin.com/in/johndoe"}]
```
**NOT:**
```
"[{"name":"John Doe","role":"CEO"}]"
```

**If error persists after server restart:**
1. Stop the server (Ctrl+C)
2. Clear any caches: Delete `node_modules/.cache` if exists
3. Restart: `npm start`
4. Test with GET `/api/startups/profile/:id` without Authorization header

### Error: `"Invalid JSON format for team"`

**Fix:**
- Copy this exact string for team field:
```
[{"name":"Alice Brown","role":"Lead Developer"},{"name":"Bob Wilson","role":"Product Manager"}]
```
- Make sure there are NO extra spaces before or after
- Make sure TYPE is Text
- Validate at jsonlint.com before pasting

### Error: `"company_name is required"`

**Fix:** Add this row:
```
KEY: company_name
TYPE: Text
VALUE: TechVenture AI
```

### Error: `"Route not found"` when calling `/api/startups/profile/me`

**What it means:** The route is not being matched correctly

**Cause:** This was a route ordering bug - the `/:id` route was defined before `/me`, so "me" was being treated as a profile ID

**Fix:**
- This has been fixed in the code
- Restart your server: Stop (Ctrl+C) and run `npm start`
- The `/me` route is now defined BEFORE the `/:id` route
- Try the request again after server restart

**Route order (correct):**
```
GET /api/startups/profile/me      ← Specific route first
GET /api/startups/profile/:id     ← Dynamic route after
```

---

## 📋 READY-TO-COPY VALUES

Copy these exact values to test quickly:

### **company_name:**
```
TechVenture AI
```

### **founders:**
```
[{"name":"John Doe","role":"CEO","linkedin":"https://linkedin.com/in/johndoe"},{"name":"Jane Smith","role":"CTO","linkedin":"https://linkedin.com/in/janesmith"}]
```

### **team:**
```
[{"name":"Alice Brown","role":"Lead Developer"},{"name":"Bob Wilson","role":"Product Manager"}]
```

### **funding:**
```
{"amount_raised":"500000","current_round":"Seed","valuation":"5000000","currency":"USD"}
```

### **traction:**
```
{"revenue":"50000","users":"1000","growth_rate":"25%","key_metrics":"Monthly active users growing 25% MoM"}
```

### **tagline:**
```
Revolutionizing AI for businesses
```

### **description:**
```
We build cutting-edge AI solutions for enterprise customers, focusing on automation and efficiency.
```

---

**Testing Complete! 🎉**

If all tests pass, your Startup Profile API is working correctly!
