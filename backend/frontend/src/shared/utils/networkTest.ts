export const testNetworkConnectivity = async () => {
  const testUrls = [
    "https://firestore.googleapis.com",
    "https://identitytoolkit.googleapis.com",
    "https://1:1058402037541:web:9ca4e189a375426e3b34cc.<firebaseio.com", // Replace with your actual project ID
  ];

  for (const url of testUrls) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      console.log(`✅ ${url}: ${response.status}`);
    } catch (error) {
      console.error(`❌ ${url}: ${error.message}`);
    }
  }
};
