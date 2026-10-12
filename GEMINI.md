# AMDEMIS Project Guidelines & Deployment Rules

## Expo Go & Mobile Synchronization Workflow
Whenever any update or modification is made to the AMDEMIS application:
1. **Always Synchronize Expo**:
   - Verify TypeScript compilation in the mobile folder (`npx tsc --noEmit` in `mobile/`).
   - Publish Over-The-Air (OTA) updates using EAS Update across the active branches:
     - `npx eas update --auto --message "<description>"`
     - `npx eas update --branch production --message "<description>"`
     - `npx eas update --branch preview --message "<description>"`
   - Ensure the Expo development server (`npx expo start`) remains running in the background so local devices on Expo Go automatically live-reload without re-scanning QR codes.

2. **Always Push to GitHub**:
   - Stage, commit, and push all changes directly to the remote repository on `origin main`.
