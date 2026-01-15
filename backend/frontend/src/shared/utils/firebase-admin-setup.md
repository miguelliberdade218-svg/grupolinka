# Firebase Admin Setup Guide for Link-A Platform

This guide explains how to set up Firebase custom claims for the dual-role authentication system.

## Overview

The Link-A platform uses Firebase Custom Claims to implement role-based access control with the following roles:
- `client` - Default role for all users
- `driver` - Users who can offer ride services
- `hotel_manager` - Users who can manage accommodations
- `admin` - Platform administrators

## Server-side Setup (Required)

### 1. Install Firebase Admin SDK

```bash
npm install firebase-admin
```

### 2. Service Account Setup

1. Go to Firebase Console > Project Settings > Service Accounts
2. Generate new private key
3. Download the JSON file
4. Set environment variable: `FIREBASE_SERVICE_ACCOUNT_KEY` with the JSON content

### 3. Admin Functions (server/firebase-admin.ts)

```typescript
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!)),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  });
}

export const adminAuth = getAuth();

// Function to set user roles
export async function setUserRoles(uid: string, roles: string[]) {
  try {
    await adminAuth.setCustomUserClaims(uid, { 
      roles,
      verified: false // Default to unverified
    });
    return true;
  } catch (error) {
    console.error('Error setting user roles:', error);
    return false;
  }
}

// Function to verify user
export async function verifyUser(uid: string) {
  try {
    const user = await adminAuth.getUser(uid);
    const currentClaims = user.customClaims || {};
    
    await adminAuth.setCustomUserClaims(uid, {
      ...currentClaims,
      verified: true,
      verifiedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error verifying user:', error);
    return false;
  }
}

// Function to add role to user
export async function addUserRole(uid: string, newRole: string) {
  try {
    const user = await adminAuth.getUser(uid);
    const currentClaims = user.customClaims || {};
    const currentRoles = currentClaims.roles || ['client'];
    
    if (!currentRoles.includes(newRole)) {
      const updatedRoles = [...currentRoles, newRole];
      await adminAuth.setCustomUserClaims(uid, {
        ...currentClaims,
        roles: updatedRoles
      });
    }
    return true;
  } catch (error) {
    console.error('Error adding user role:', error);
    return false;
  }
}
```

### 4. API Routes for Role Management

Add to your server routes:

```typescript
// Grant driver role after verification
app.post('/api/admin/grant-driver-role', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Verify admin permissions
    const adminUid = req.user?.uid; // From auth middleware
    const adminUser = await adminAuth.getUser(adminUid);
    if (!adminUser.customClaims?.roles?.includes('admin')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    await addUserRole(userId, 'driver');
    await verifyUser(userId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to grant role' });
  }
});

// Grant hotel manager role
app.post('/api/admin/grant-manager-role', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Verify admin permissions
    const adminUid = req.user?.uid;
    const adminUser = await adminAuth.getUser(adminUid);
    if (!adminUser.customClaims?.roles?.includes('admin')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    await addUserRole(userId, 'hotel_manager');
    await verifyUser(userId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to grant role' });
  }
});
```

## User Registration Flow

### 1. Enhanced Registration Process

When users complete the enhanced signup form:

1. **Firebase Auth Registration**: Create user account
2. **Document Upload**: Upload ID documents and photos to Firebase Storage
3. **Verification Request**: Submit for admin verification
4. **Role Assignment**: Admin reviews and assigns appropriate roles
5. **Account Activation**: User gains access to role-specific features

### 2. Verification Workflow

```typescript
// After user completes enhanced signup
export async function submitForVerification(userId: string, documents: {
  profilePhoto: string;
  idDocument: string;
  fullName: string;
  phoneNumber: string;
  city: string;
  idNumber: string;
}) {
  // Save verification request to Firestore
  await db.collection('verificationRequests').doc(userId).set({
    ...documents,
    status: 'pending',
    submittedAt: new Date(),
    reviewedBy: null,
    reviewedAt: null
  });
  
  // Set basic custom claims
  await setUserRoles(userId, ['client']);
}
```

## Role Switching Implementation

### 1. Client-side Role Switching

The `useUserRoles` hook handles role switching by:
1. Reading custom claims from Firebase token
2. Storing current active role in localStorage
3. Updating UI based on current role permissions

### 2. Security Considerations

- **Token Refresh**: Custom claims are updated on next token refresh
- **Force Refresh**: Call `user.getIdToken(true)` to force immediate refresh
- **Local Storage**: Current role stored locally for UI purposes only
- **Server Validation**: Always validate roles server-side using admin SDK

## Admin Panel Integration

### 1. User Management

```typescript
// Get users pending verification
export async function getPendingVerifications() {
  const snapshot = await db.collection('verificationRequests')
    .where('status', '==', 'pending')
    .get();
    
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Approve verification
export async function approveVerification(userId: string, roles: string[]) {
  // Update custom claims
  await setUserRoles(userId, roles);
  await verifyUser(userId);
  
  // Update verification request
  await db.collection('verificationRequests').doc(userId).update({
    status: 'approved',
    reviewedAt: new Date(),
    approvedRoles: roles
  });
}
```

## Testing the Setup

### 1. Create Test Admin User

```typescript
// Run once to create admin user
await setUserRoles('your-admin-uid', ['client', 'admin']);
await verifyUser('your-admin-uid');
```

### 2. Test Role Assignment

1. Create new user account
2. Complete enhanced signup
3. Admin approves and assigns roles
4. User refreshes token
5. Test role switching functionality

## Security Best Practices

1. **Always validate on server**: Never trust client-side role information
2. **Use HTTPS**: All authentication requests must use HTTPS
3. **Rate limiting**: Implement rate limiting for role-related APIs
4. **Audit logging**: Log all role changes and admin actions
5. **Regular reviews**: Periodically review user roles and permissions

## Deployment Checklist

- [ ] Firebase Security Rules deployed
- [ ] Admin SDK service account configured
- [ ] Custom claims functions implemented
- [ ] API routes for role management added
- [ ] Admin panel for user verification
- [ ] Testing completed with different roles
- [ ] Production environment variables set