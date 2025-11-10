# Console Statement Removal for Production

## Overview
This project is configured to automatically remove all `console.*` statements and `debugger` statements from production builds.

## Configuration

### Vite Configuration
The [vite.config.ts](vite.config.ts) file includes esbuild settings that strip console statements:

```typescript
esbuild: {
  drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
}
```

This configuration:
- **Removes** all console statements (log, error, warn, info, debug) in production builds
- **Keeps** console statements in development for debugging
- **Removes** debugger statements in production

## How It Works

### Development Mode
When running the dev server with `pnpm dev` or `npm run dev`:
- All console statements work normally
- Debugger statements are active
- Full debugging capabilities available

### Production Build
When building for production with `pnpm build` or `npm run build`:
- All `console.*` statements are automatically removed
- All `debugger` statements are removed
- The bundle size is reduced
- No console output in production

## Testing

### Test Console Removal Locally
1. Build the project for production:
   ```bash
   pnpm build
   ```

2. Preview the production build:
   ```bash
   pnpm preview
   ```

3. Open browser DevTools console - you should see no console output from the application

### Verify in Development
```bash
pnpm dev
```
Console statements should work normally in development mode.

## Benefits

1. **Smaller Bundle Size**: Removing console statements reduces JavaScript bundle size
2. **Better Performance**: No console overhead in production
3. **Cleaner Production**: No debug messages visible to end users
4. **Security**: Prevents accidental exposure of sensitive debugging information
5. **Development Friendly**: Console statements still work during development

## Files Modified

- [vite.config.ts](vite.config.ts) - Added esbuild configuration
- [src/pages/SecurityPortalPage.tsx](src/pages/SecurityPortalPage.tsx) - Manually commented out console statements

## Notes

- This configuration uses Vite's built-in esbuild minifier
- No additional plugins required
- Works automatically based on `NODE_ENV`
- Compatible with TypeScript and JavaScript files
- Service Worker file ([src/sw.ts](src/sw.ts)) console statements are also removed in production

## Build Commands

```bash
# Development (console statements active)
pnpm dev

# Production build (console statements removed)
pnpm build

# Preview production build
pnpm preview
```