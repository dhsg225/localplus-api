# Multisite Support

The LocalPlus Event Engine plugin is fully compatible with WordPress Multisite.

## Network Activation

**Recommended:** Activate the plugin at the network level for centralized management.

### Benefits of Network Activation:
- Single configuration for all sites
- Easier maintenance and updates
- Consistent API settings across network
- Network admin can control all sites

## Configuration Options

### Option 1: Network-Wide Settings (Recommended)

1. **Network Activate** the plugin
2. Go to **Network Admin > LocalPlus Events**
3. Configure API settings:
   - API URL
   - API Key
   - Cache settings
4. Enable **"Use Network Settings"** checkbox
5. All sites will use these settings

### Option 2: Per-Site Settings

1. **Network Activate** the plugin (or activate per-site)
2. Go to **Network Admin > LocalPlus Events**
3. **Disable** "Use Network Settings"
4. Each site can configure its own settings:
   - Go to **LocalPlus Events > Settings** on each site
   - Configure site-specific API settings

## How It Works

### Network Settings Mode
- All sites use the same API URL and key
- Settings stored in `wp_sitemeta` table
- Individual sites cannot override
- Best for: Single API instance serving all sites

### Per-Site Settings Mode
- Each site has its own API configuration
- Settings stored in `wp_options` table (per site)
- Sites can use different API endpoints
- Best for: Different API instances per site

## Cache Management

- **Cache is always per-site** (uses WordPress transients)
- Each site caches its own events independently
- Network settings only control cache duration/enablement
- Clearing cache affects only the current site

## Admin Interface

- **Network Admin**: Configure network-wide settings
- **Site Admin**: View/edit events, configure per-site settings (if enabled)
- Each site has its own event list and management interface

## Migration

### From Single Site to Multisite:
1. Network activate plugin
2. Network settings will use existing site settings as defaults
3. Enable "Use Network Settings" to apply to all sites

### From Network to Per-Site:
1. Disable "Use Network Settings" in Network Admin
2. Each site can then configure its own settings
3. Existing network settings become defaults for new configurations

## Best Practices

1. **Use Network Settings** for most cases (simpler management)
2. **Per-Site Settings** only if sites need different API endpoints
3. **Network Activate** the plugin for easier updates
4. **Test on one site** before enabling network-wide

