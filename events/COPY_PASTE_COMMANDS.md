# Copy-Paste Commands for SSH Session

## On WordPress Server (You're already there!)

Copy and paste these commands one by one:

```bash
# 1. Go to home directory (writable)
cd ~

# 2. Export WordPress terms
wp term list event_type --url=huahin.discovertoday.com --format=json --fields=term_id,name,slug > wp-term-mapping.json

# 3. Verify it worked
cat wp-term-mapping.json | head -30

# 4. Show file location
echo "File saved to: $(pwd)/wp-term-mapping.json"
```

## After Export

**Option 1: Copy file content and paste here**
```bash
# On server, display entire file
cat ~/wp-term-mapping.json
```
Then paste the JSON output here and I'll save it.

**Option 2: Use SCP from your local machine**
```bash
# From your local Mac terminal (new window)
scp -i ~/.ssh/id_ed25519 dhsg@64.176.84.217:~/wp-term-mapping.json /Users/admin/Dropbox/Development/localplus-api/events/
```

**Option 3: Display and copy manually**
Just run `cat ~/wp-term-mapping.json` on the server and copy the output.

