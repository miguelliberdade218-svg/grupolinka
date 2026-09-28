# Frontend Integration Guide - Reviews & Payment Policies System

## 📋 Overview

This guide explains how to integrate the new review and payment policy system across all frontend applications.

**New Services:**
- `rideReviewService.ts` - Ride review management
- `paymentPolicyService.ts` - Payment policy management

**New Components:**
- `RideReviewForm.tsx` - Review submission form
- `DriverRatingsDisplay.tsx` - Display driver ratings and reviews
- `PaymentPolicyDisplay.tsx` - Display payment policies

---

## 🚗 DRIVERS-APP Integration

### 1. Driver Dashboard - Show Personal Reviews

**File:** `src/apps/drivers-app/pages/dashboard.tsx`

```tsx
import { DriverRatingsDisplay } from '@/components/DriverRatingsDisplay';

export default function DriverDashboard() {
  const driverId = useAuth().user?.id;
  
  return (
    <div className="dashboard">
      {/* ... existing content ... */}
      
      {/* NEW: Display my ratings */}
      <section className="ratings-section">
        <h2>Meus Ratings</h2>
        <DriverRatingsDisplay 
          driverId={driverId} 
          driverName="Você"
          compact={false}
        />
      </section>
    </div>
  );
}
```

### 2. Payment Policy Management

**File:** `src/apps/drivers-app/pages/payment-settings.tsx` (NEW PAGE)

```tsx
import { paymentPolicyService } from '@/services/paymentPolicyService';
import { PaymentPolicyDisplay } from '@/components/PaymentPolicyDisplay';

// Show current policy and allow updates
```

### 3. Ride Completion Screen - Submit Rider Review

**File:** `src/apps/drivers-app/pages/ride-completion.tsx`

```tsx
import { RideReviewForm } from '@/components/RideReviewForm';

// After ride completed, show review form for passenger
<RideReviewForm
  rideId={rideId}
  currentUserId={driverId}
  targetUserId={passengerId}
  reviewType="driver"
  targetName={passengerName}
  onSuccess={() => { /* navigate or refresh */ }}
/>
```

---

## 👥 MAIN-APP Integration (Customers)

### 1. Ride Booking Details - Driver Profile Section

**File:** `src/apps/main-app/pages/Rides/RideDetails.tsx` (NEW or UPDATE)

```tsx
import { DriverRatingsDisplay } from '@/components/DriverRatingsDisplay';

// In ride details, show driver's ratings
<div className="driver-info">
  <DriverRatingsDisplay 
    driverId={ride.driverId}
    driverName={ride.driverName}
    compact={true}  // Show compact in list view
  />
</div>
```

### 2. Ride Completion Screen - Submit Driver Review

**File:** `src/apps/main-app/pages/Rides/RideCompletion.tsx` (NEW or UPDATE)

```tsx
import { RideReviewForm } from '@/components/RideReviewForm';

// After ride completed, show review form
<RideReviewForm
  rideId={rideId}
  currentUserId={passengerId}
  targetUserId={driverId}
  reviewType="passenger"
  targetName={driverName}
  onSuccess={handleReviewSubmitted}
/>
```

### 3. My Rides/Bookings - Show Avg Driver Rating

**File:** `src/apps/main-app/pages/bookings.tsx`

```tsx
import { DriverRatingsDisplay } from '@/components/DriverRatingsDisplay';

// In ride card preview
rides.map(ride => (
  <div key={ride.id} className="ride-card">
    <p>{ride.from} → {ride.to}</p>
    <DriverRatingsDisplay 
      driverId={ride.driverId}
      compact={true}
    />
  </div>
))
```

---

## 🏨 HOTELS-APP Integration

### 1. Hotel Dashboard - Show Guest Reviews

**File:** `src/apps/hotels-app/pages/hotel-management/HotelDashboard.tsx`

```tsx
// Use existing hotel reviews endpoint (already implemented in backend)
// Display using similar pattern to DriverRatingsDisplay

import hotelService from '@/services/hotelService';

const [reviews, setReviews] = useState([]);

useEffect(() => {
  hotelService.getHotelReviews(hotelId).then(setReviews);
}, [hotelId]);

// Display reviews grid similar to DriverRatingsDisplay
```

### 2. Payment Policy Management

**File:** `src/apps/hotels-app/pages/hotel-management/PaymentSettings.tsx` (NEW)

```tsx
import { PaymentPolicyDisplay } from '@/components/PaymentPolicyDisplay';
import { paymentPolicyService } from '@/services/paymentPolicyService';

// Show current policy and allow updates
const [policy, setPolicy] = useState(null);

useEffect(() => {
  paymentPolicyService.getHotelPolicy(hotelId).then(setPolicy);
}, [hotelId]);

// Form to update policy
const handleUpdatePolicy = async (updates) => {
  await paymentPolicyService.updateHotelPolicy(hotelId, updates);
};
```

### 3. Event Spaces - Guest Reviews

**File:** `src/apps/hotels-app/pages/events/EventDetails.tsx`

```tsx
// Use existing event space reviews endpoint
// Apply similar display logic
```

### 4. Hotel Booking - Show Payment Terms

**File:** `src/apps/hotels-app/pages/bookings/BookingDetails.tsx`

```tsx
import { PaymentPolicyDisplay } from '@/components/PaymentPolicyDisplay';

// Show hotel's payment policy before confirmation
<PaymentPolicyDisplay 
  providerId={hotelId}
  providerType="hotel"
  providerName={hotelName}
  compact={false}
/>
```

---

## 👨‍💼 ADMIN-APP Integration

### 1. Admin Dashboard - New Statistics

**File:** `src/apps/admin-app/pages/dashboard-new.tsx`

```tsx
// Use existing adminService.getDashboardStats()
// Already has all stats, just ensure frontend is calling it
```

### 2. User Management - Verification Queue

**File:** `src/apps/admin-app/pages/capabilities.tsx`

```tsx
// Use adminService.getVerificationQueue()
// Show pending driver/hotel manager approvals with view/approve/reject actions
```

### 3. Fee Management

**File:** `src/apps/admin-app/pages/fees.tsx`

```tsx
// Use adminService.getCurrentFees()
// Use adminService.updateFee(service_type, percentage)
// Create form to update comissions for ride/hotel/event
```

### 4. Complaints Management

**File:** `src/apps/admin-app/pages/complaints.tsx`

```tsx
// Use adminService.listComplaints()
// Use adminService.updateComplaintStatus()
// Create detailed view with resolution form
```

### 5. Payment Management

**File:** `src/apps/admin-app/pages/payments.tsx`

```tsx
// Use adminService.getPaymentStats()
// Use adminService.listPaymentReferences()
// Use adminService.confirmPayment()
// Show pending payments with confirm button
```

---

## 📦 Service Usage Examples

### RideReviewService

```tsx
import rideReviewService from '@/services/rideReviewService';

// Create passport review
await rideReviewService.createPassengerReview({
  ride_id: '123',
  from_user_id: 'customer123',
  to_user_id: 'driver456',
  driver_rating: 5,
  cleanliness_rating: 4,
  communication_rating: 5,
  comment: 'Great ride!',
  pros: 'Polite and punctual',
  cons: 'Car could be cleaner'
});

// Get driver stats
const stats = await rideReviewService.getDriverStats('driver456');
// Returns: { totalReviews: 42, averageRating: 4.5, byRating: {5: 30, 4: 10, 3: 2...} }

// Get driver reviews
const reviews = await rideReviewService.getDriverReviews('driver456', 10);
```

### PaymentPolicyService

```tsx
import paymentPolicyService from '@/services/paymentPolicyService';

// Get policy
const hotelPolicy = await paymentPolicyService.getHotelPolicy(hotelId);

// Update policy
await paymentPolicyService.updateHotelPolicy(hotelId, {
  advance_payment_enabled: true,
  advance_payment_percentage: 20,
  deposit_percentage: 35
});

// Format for display
const terms = paymentPolicyService.formatPolicyDisplay(policy);
// Returns array of formatted strings: ['💰 Depósito: 30.00%', '⏳ Pagamento final: 7 dias', ...]
```

---

## 🔄 Component Usage Examples

### RideReviewForm

```tsx
import { RideReviewForm } from '@/components/RideReviewForm';

<RideReviewForm
  rideId="ride123"
  currentUserId="customer456"
  targetUserId="driver789"
  reviewType="passenger"
  targetName="João Silva"
  onSuccess={() => handleSuccess()}
  onCancel={() => handleCancel()}
/>
```

### DriverRatingsDisplay

```tsx
import { DriverRatingsDisplay } from '@/components/DriverRatingsDisplay';

// Compact mode (for listings)
<DriverRatingsDisplay 
  driverId="driver456"
  driverName="João Silva"
  compact={true}
/>

// Detailed mode (for profile)
<DriverRatingsDisplay 
  driverId="driver456"
  driverName="João Silva"
  compact={false}
/>
```

### PaymentPolicyDisplay

```tsx
import { PaymentPolicyDisplay } from '@/components/PaymentPolicyDisplay';

// Compact mode (for cards)
<PaymentPolicyDisplay 
  providerId="hotel123"
  providerType="hotel"
  providerName="Hotel Luxo"
  compact={true}
/>

// Detailed mode (for booking details)
<PaymentPolicyDisplay 
  providerId="hotel123"
  providerType="hotel"
  providerName="Hotel Luxo"
  compact={false}
/>
```

---

## 🎯 Implementation Checklist

### Drivers-App
- [ ] Show my ratings in dashboard
- [ ] Show payment policy settings
- [ ] Add ride completion with passenger review form
- [ ] Add payment policy edit page

### Main-App (Customers)
- [ ] Show driver ratings in ride search/list
- [ ] Show driver profile page with full ratings
- [ ] Add driver rating to booking details  
- [ ] Show ride completion with driver review form
- [ ] Display my bookings with driver ratings

### Hotels-App
- [ ] Show guest reviews in dashboard
- [ ] Add payment policy settings  
- [ ] Show payment policy on booking page
- [ ] Add event space reviews display
- [ ] Add event payment policy settings

### Admin-App
- [ ] Update dashboard with new stats
- [ ] Add verification queue management
- [ ] Add fee management page
- [ ] Add complaints management
- [ ] Add payment confirmation flow
- [ ] Add audit logs view

---

## 🚀 Deployment Checklist

1. ✅ Backend APIs tested and working
2. ✅ TypeScript compilation: 0 errors
3. ✅ Frontend services created
4. ✅ Components created and styled
5. ⏳ Integrate into each app (IN PROGRESS)
6. ⏳ Test end-to-end flows
7. ⏳ QA review
8. ⏳ Deploy

---

## 📞 Support

For issues or questions, refer to:
- Backend: `/backend/backend/src/modules/admin/SUMMARY.md`
- Backend: `/backend/backend/src/modules/reviews/QUICKSTART.md`
- API Docs already in backend comment headers
