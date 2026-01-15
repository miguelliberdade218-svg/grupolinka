require('dotenv').config();
console.log('Database:', process.env.DATABASE_URL);
console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
console.log('Private Key length:', process.env.FIREBASE_PRIVATE_KEY?.length);
