import { useBookings } from "../hooks/useBookings";
import { useAuth } from "../hooks/useAuth";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebaseConfig";
import { useState } from "react";

const TestBooking = () => {
  const { createBooking } = useBookings();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null); // ← ADDED FOR TESTING

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      // Check if auth is available
      if (!auth) {
        throw new Error("Firebase authentication not available");
      }

      await signInWithEmailAndPassword(auth, email, password);
      alert("Logged in successfully!");
      setEmail("");
      setPassword("");
      setTestResult(null); // Clear previous test results
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const testRideBooking = async () => {
    console.log("Testing booking system...");
    if (!user) {
      alert("Please log in to create bookings!");
      return;
    }

    try {
      const result = await createBooking("ride", {
        pickup: "Maputo City",
        destination: "Matola",
        date: new Date().toISOString(),
        passengers: 2,
      });

      console.log("Booking result:", result);
      setTestResult(result); // ← STORE RESULT FOR DISPLAY

      if (result.success) {
        alert("✅ Booking test successful! Check Firebase console.");
      } else {
        alert("❌ Booking failed: " + result.error?.message);
      }
    } catch (error) {
      console.error("Booking error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert("❌ Booking failed with error: " + errorMessage);
      setTestResult({ success: false, error: errorMessage }); // ← STORE ERROR
    }
  };

  // ← ADDED: SIMULATED TEST FOR DEMO PURPOSES
  const testSimulatedBooking = async () => {
    console.log("Testing SIMULATED booking system...");

    // Simulate API call delay
    setLoading(true);
    setTimeout(() => {
      const simulatedResult = {
        success: true,
        id: "simulated-booking-123",
        message: "This is a simulated success for demo purposes",
      };

      console.log("Simulated booking result:", simulatedResult);
      setTestResult(simulatedResult);
      alert("🎭 SIMULATED: Booking would be created if Firebase was connected");
      setLoading(false);
    }, 1000);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Test Booking System</h2>
      <p>User status: {user ? "Logged in" : "Not logged in"}</p>

      {!user ? (
        <div>
          <div style={{ marginBottom: "15px" }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: "8px",
                margin: "5px",
                width: "200px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            <br />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: "8px",
                margin: "5px",
                width: "200px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              padding: "10px 15px",
              backgroundColor: loading ? "#ccc" : "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "5px",
              marginRight: "10px",
            }}
          >
            {loading ? "Logging in..." : "🔐 Login"}
          </button>

          <p style={{ color: "red", marginTop: "10px" }}>
            ⚠️ Use the same credentials you created in Firebase Console
          </p>
        </div>
      ) : (
        <div>
          {/* REAL TEST BUTTON */}
          <button
            onClick={testRideBooking}
            disabled={loading}
            style={{
              padding: "10px 15px",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "5px",
              marginRight: "10px",
            }}
          >
            {loading ? "Testing..." : "🚗 Test Real Booking"}
          </button>

          {/* SIMULATED TEST BUTTON */}
          <button
            onClick={testSimulatedBooking}
            disabled={loading}
            style={{
              padding: "10px 15px",
              backgroundColor: "#FF9800",
              color: "white",
              border: "none",
              borderRadius: "5px",
            }}
          >
            {loading ? "Simulating..." : "🎭 Test Simulated Booking"}
          </button>

          {/* TEST RESULTS DISPLAY */}
          {testResult && (
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                border: "1px solid #ccc",
                borderRadius: "5px",
                backgroundColor: testResult.success ? "#e8f5e8" : "#ffe8e8",
              }}
            >
              <h4>Test Results:</h4>
              <pre style={{ fontSize: "12px", overflow: "auto" }}>
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}

          <p style={{ color: "gray", marginTop: "10px", fontSize: "12px" }}>
            💡 Use simulated test for demo purposes while Firebase issues are
            resolved
          </p>
        </div>
      )}
    </div>
  );
};

export default TestBooking;
