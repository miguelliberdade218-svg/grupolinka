import { collection } from "firebase/firestore";
import { db } from "./firebaseConfig";

export const getBookingsRef = () => {
  if (!db) throw new Error('Firebase not configured');
  return collection(db, "bookings");
};

export const getRidesRef = () => {
  if (!db) throw new Error('Firebase not configured');
  return collection(db, "rides");
};

export const getHotelsRef = () => {
  if (!db) throw new Error('Firebase not configured');
  return collection(db, "hotels");
};

export const getEventsRef = () => {
  if (!db) throw new Error('Firebase not configured');
  return collection(db, "events");
};

export const getUsersRef = () => {
  if (!db) throw new Error('Firebase not configured');
  return collection(db, "users");
};

export const getUserBookingsRef = (userId: string) => {
  if (!db) throw new Error('Firebase not configured');
  return collection(db, "users", userId, "bookings");
};
