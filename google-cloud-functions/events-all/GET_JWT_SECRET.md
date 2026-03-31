# How to Get Supabase JWT Secret

## Step-by-Step Instructions

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `joknprahhqdhvdhzmuwl` (LocalPlus)
3. **Navigate to Settings**:
   - Click on the gear icon (⚙️) in the left sidebar
   - Or go to: Project Settings
4. **Go to API section**:
   - Click on "API" in the settings menu
5. **Find JWT Settings**:
   - Scroll down to the "JWT Settings" section
   - You'll see:
     - **JWT Secret**: A long string (this is what we need!)
     - JWT URL
     - JWT Expiry
6. **Copy the JWT Secret**:
   - Click the "Copy" button next to the JWT Secret
   - Or manually select and copy the entire string

## What It Looks Like

The JWT Secret is a long string that looks like:
```
your-super-secret-jwt-token-with-at-least-32-characters-long
```

It's typically 32+ characters and is used to sign and verify JWT tokens.

## Set Environment Variable

Once you have the JWT Secret, set it as an environment variable:

```bash
export SUPABASE_JWT_SECRET="your-jwt-secret-here"
```

## Important Notes

- ⚠️ **Keep this secret secure!** Never commit it to git or share it publicly
- The JWT Secret is different from:
  - `SUPABASE_ANON_KEY` (public key)
  - `SUPABASE_SERVICE_ROLE_KEY` (service role key)
- This secret is used to verify that JWT tokens were actually issued by your Supabase instance
- Without this secret, we cannot verify token signatures (security risk!)

## Alternative: Extract from Service Role Key

If you can't find the JWT Secret in the dashboard, you can extract it from the service role key:

1. Decode the service role key JWT (it's a JWT itself)
2. The JWT Secret is the signing key used by Supabase
3. However, it's easier to just get it from the dashboard

## Verification

After setting the environment variable, you can verify it's set:

```bash
echo $SUPABASE_JWT_SECRET
```

If it prints the secret, you're good to go!

