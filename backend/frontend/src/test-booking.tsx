import { useBookings } from './hooks/useBookings';

// Simple test to see if everything works
const TestBooking = () => {
  const { createBooking } = useBookings();

  const testRideBooking = async () => {
    const result = await createBooking('ride', {
      pickup: 'Test Location',
      destination: 'Test Destination',
      date: new Date().toISOString(),
      passengers: 2
    });

    console.log('Test booking result:', result);
  };

  return (
    <button onClick={testRideBooking}>
      Test Booking System
    </button>
  );
};