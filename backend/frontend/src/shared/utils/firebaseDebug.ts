import { 
  isFirebaseConfigured
} from '../lib/firebaseConfig';

// Debug utilities for Firebase troubleshooting
export const debugFirebaseConfig = () => {
  console.group('🔧 Firebase Debug Information');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('- VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('- VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
  console.log('- VITE_FIREBASE_APP_ID:', import.meta.env.VITE_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing');
  console.log('- VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '⚠️ Using default');
  console.log('- VITE_FIREBASE_STORAGE_BUCKET:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '⚠️ Using default');
  console.log('- VITE_FIREBASE_MESSAGING_SENDER_ID:', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '⚠️ Missing');
  
  // Check configuration status
  console.log('\nConfiguration Status:');
  console.log('- Firebase Configured:', isFirebaseConfigured ? '✅ Yes' : '❌ No');
  
  // Check domain
  console.log('\nDomain Information:');
  console.log('- Current Domain:', window.location.hostname);
  console.log('- Current Origin:', window.location.origin);
  console.log('- Protocol:', window.location.protocol);
  
  console.groupEnd();
};

export const testFirebaseSetup = async () => {
  console.group('🧪 Firebase Connection Test');
  
  try {
    console.log('Configuration Status:', isFirebaseConfigured ? '✅ Configured' : '❌ Not Configured');
    
    if (!isFirebaseConfigured) {
      console.log('\n💡 Troubleshooting Tips:');
      console.log('1. Check Firebase Console for authorized domains');
      console.log('2. Verify API keys are not restricted');
      console.log('3. Check browser console for CORS errors');
      console.log('4. Ensure Firebase project is active');
      console.log('5. Try refreshing Firebase token');
    }
  } catch (error) {
    console.error('❌ Connection test error:', error);
  }
  
  console.groupEnd();
};

// Check for common Firebase issues
export const diagnoseFirebaseIssues = () => {
  console.group('🩺 Firebase Issue Diagnosis');
  
  const issues: string[] = [];
  
  // Check environment variables
  if (!import.meta.env.VITE_FIREBASE_API_KEY) {
    issues.push('Missing VITE_FIREBASE_API_KEY environment variable');
  }
  
  if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    issues.push('Missing VITE_FIREBASE_PROJECT_ID environment variable');
  }
  
  if (!import.meta.env.VITE_FIREBASE_APP_ID) {
    issues.push('Missing VITE_FIREBASE_APP_ID environment variable');
  }
  
  // Check domain configuration
  const currentDomain = window.location.hostname;
  if (currentDomain !== 'localhost' && currentDomain.includes('.replit.dev')) {
    console.warn('⚠️ Using Replit domain - ensure it\'s added to Firebase authorized domains');
  }
  
  // Check protocol
  if (window.location.protocol !== 'https:' && currentDomain !== 'localhost') {
    issues.push('Firebase requires HTTPS for production domains');
  }
  
  // Check for ad blockers or privacy extensions
  if (navigator.userAgent.includes('AdBlock') || 
      document.querySelector('[id*="adblock"]') ||
      document.querySelector('[class*="adblock"]')) {
    console.warn('⚠️ Ad blocker detected - may interfere with Firebase');
  }
  
  if (issues.length > 0) {
    console.error('❌ Issues found:');
    issues.forEach((issue, index) => {
      console.error(`${index + 1}. ${issue}`);
    });
  } else {
    console.log('✅ No obvious configuration issues detected');
  }
  
  console.groupEnd();
  return issues;
};

// Auto-run debug on development
if (import.meta.env.DEV) {
  // Run debug after a short delay to ensure Firebase is initialized
  setTimeout(() => {
    debugFirebaseConfig();
    diagnoseFirebaseIssues();
  }, 1000);
}