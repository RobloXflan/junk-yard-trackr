

## Fix: Vehicle Data Being Cut Off in Tax Reports

### Problem Identified

The Tax View page is missing vehicle data for August through December because **Supabase has a default limit of 1,000 rows per query**.

**Root Cause:**
- The database contains **1,746 vehicles total**
- The current query fetches ALL vehicles without a row limit
- Supabase returns only the **first 1,000 rows** by default
- Since the query orders by `purchase_date ascending` (oldest first), newer vehicles from August 2025 onward are cut off

**Evidence:**
- August shows only 53 vehicles instead of 154 in the database
- September-December show "-" (no data at all)
- The first 1,000 rows cover vehicles up to approximately mid-August

---

### Solution

Modify the vehicle query to filter by year at the database level (much more efficient) instead of fetching all vehicles and filtering in JavaScript.

**Current Code:**
```javascript
const { data: vehicleData } = await supabase
  .from('vehicles')
  .select('*')
  .order('purchase_date', { ascending: true });

// Then filters in JavaScript - misses data beyond 1000 rows!
const filteredVehicles = vehicleData.filter(v => {
  return v.purchase_date?.startsWith(year);
});
```

**Fixed Code:**
```javascript
const { data: vehicleData } = await supabase
  .from('vehicles')
  .select('*')
  .gte('purchase_date', `${year}-01-01`)
  .lte('purchase_date', `${year}-12-31`)
  .order('purchase_date', { ascending: true });

// No JavaScript filter needed - database handles it efficiently
setVehicles(vehicleData || []);
```

---

### Files to Update

1. **`src/pages/TaxView.tsx`** - Fix the vehicle data query
2. **`src/pages/TaxReports.tsx`** - Apply the same fix for consistency

---

### Technical Changes

**TaxView.tsx (lines 78-90):**
- Add `.gte()` and `.lte()` filters for the year's date range
- Remove the JavaScript filter since it's no longer needed
- This reduces data transfer and ensures all vehicles for the year are included

**TaxReports.tsx:**
- Apply the same database-level filtering pattern
- Ensures both pages work correctly with large datasets

---

### Benefits

- All vehicles for the selected year will now appear (even with 10,000+ records)
- Faster page load (fetching ~1,000 for one year vs 1,746+ total)
- August-December 2025 will show the correct vehicle counts and totals

