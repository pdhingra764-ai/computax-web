// Seed script to create a test user
// Run: node seed.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function seed() {
  // Connect to MongoDB
  const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://pdhingra764_db_user:PASSWORD@cluster0.5hlgviu.mongodb.net/computax?retryWrites=true&w=majority';
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('\nPlease update the MONGO_URI in this file or set MONGO_URI environment variable');
    process.exit(1);
  }

  // Create test users
  const testUsers = [
    {
      name: 'Demo CA',
      email: 'demo@computax.com',
      password: 'demo123',
      role: 'ca',
      firm: 'CompuTax Demo Firm',
      phone: '9999999999'
    },
    {
      name: 'Test User',
      email: 'test@test.com',
      password: 'test123',
      role: 'user',
      firm: 'My Business',
      phone: '8888888888'
    }
  ];

  for (const userData of testUsers) {
    try {
      // Check if user exists
      let user = await User.findOne({ email: userData.email });
      if (user) {
        console.log(`⚠️  User already exists: ${userData.email}`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user
      user = new User({ ...userData, password: hashedPassword });
      await user.save();
      console.log(`✅ Created user: ${userData.email} / ${userData.password}`);
    } catch (err) {
      console.error(`❌ Error creating ${userData.email}:`, err.message);
    }
  }

  console.log('\n📋 Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Email:    demo@computax.com');
  console.log('Password: demo123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nEmail:    test@test.com');
  console.log('Password: test123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  console.log('👋 Disconnected from MongoDB');
}

seed();
