

## Playwright DMV Autofill via Supabase Edge Function

### The Idea

Your site sends vehicle data to a Supabase Edge Function → that function triggers a Playwright script (via a remote service like Browserless, which you already have a `BROWSERLESS_API_KEY` for) → Playwright opens the DMV NRL page and fills in the form → reports back success.

### Flow

```text
Pending Releases page
  → Click "Auto-Release" on a vehicle card
  → Calls Supabase Edge Function with vehicle/buyer data
  → Edge Function connects to Browserless (cloud Playwright/Puppeteer)
  → Browserless opens DMV NRL page, fills form fields
  → Returns screenshot or success status
  → UI shows confirmation, optionally marks vehicle as released
```

### What I'll Build

**1. Supabase Edge Function: `dmv-autofill`**
- Receives vehicle data (VIN, plate, buyer name, address, sale date)
- Connects to Browserless using your existing `BROWSERLESS_API_KEY`
- Uses Puppeteer (Browserless exposes a Puppeteer-compatible API) to:
  - Navigate to `https://www.dmv.ca.gov/wasapp/nrl/nrlApplication.do`
  - Fill in form fields (VIN, license plate, buyer first/last name, address, city, state, zip, sale date)
  - Take a screenshot of the filled form for review
  - Upload screenshot to Supabase storage so you can verify before manually submitting
- Returns success/failure status and screenshot URL

**2. Update Pending Releases page (`src/pages/PendingReleases.tsx`)**
- Add an "Auto-Fill DMV" button on each vehicle card
- When clicked, calls the `dmv-autofill` edge function with that vehicle's data
- Shows a loading state while Browserless processes
- On success, displays the screenshot of the filled DMV form in a dialog so you can verify it looks right
- Optionally opens the DMV page link for manual submission

**3. Important caveat: DMV form submission**
- The script will FILL the form but NOT submit it — Browserless sessions are ephemeral, so you'd review the screenshot and then go submit manually
- Alternatively, if you want full automation (fill + submit), the script can do that too, but you should verify the field mapping is correct first

### Technical Details

- **Browserless** is a headless browser service — your `BROWSERLESS_API_KEY` is already set up
- The edge function will use Browserless's Puppeteer-compatible API to control a Chrome instance
- DMV form field IDs will need to be inspected and mapped (I'll do this during implementation)
- Screenshots stored in the existing `vehicle-documents` storage bucket

### Files

| File | Action |
|------|--------|
| `supabase/functions/dmv-autofill/index.ts` | Create — Browserless automation |
| `src/pages/PendingReleases.tsx` | Update — Add "Auto-Fill DMV" button + screenshot preview |

