# Export WordPress Terms via SSH

## On WordPress Server (SSH)

Run these commands:

```bash
# Change to home directory (writable)
cd ~

# Export WordPress terms
wp term list event_type --format=json --fields=term_id,name,slug > wp-term-mapping.json

# Check if it worked
cat wp-term-mapping.json | head -20
```

## Transfer File to Local Machine

**Option 1: Copy content manually**
```bash
# On server, display the file
cat ~/wp-term-mapping.json

# Copy the entire JSON output
# Then on your local machine, save it to:
# /Users/admin/Dropbox/Development/localplus-api/events/wp-term-mapping.json
```

**Option 2: Use SCP (if you have SSH access)**
```bash
# From your local machine
scp user@ldp-server:~/wp-term-mapping.json /Users/admin/Dropbox/Development/localplus-api/events/
```

**Option 3: Use the file content directly**
If you can't transfer the file, you can paste the JSON content and I'll help you save it.

## After File is in Place

Run the import:
```bash
cd /Users/admin/Dropbox/Development/localplus-api/events
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY1MjcxMCwiZXhwIjoyMDY1MjI4NzEwfQ.8Esm5KMfVJAQxHoKrEV9exsMASEFTnHfKOdqSt5cDFk"
node create-and-import-mapping.js wp-term-mapping.json
```

