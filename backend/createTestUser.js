import axios from 'axios';

const API_URL = 'http://localhost:4001';

async function createTestUser() {
  try {
    console.log('Creating test users...\n');

    // Create Club Secretary
    const secretary = await axios.post(`${API_URL}/user/signup`, {
      email: 'secretary@iitdh.ac.in',
      password: 'password123',
      role: 'club-secretary',
      type: 'Technical',
      category: 'Technical'
    });
    console.log('✅ Club Secretary created:');
    console.log('   Email: secretary@iitdh.ac.in');
    console.log('   Password: password123');
    console.log('   Token:', secretary.data.token);
    console.log('');

    // Create General Secretary
    const generalSecretary = await axios.post(`${API_URL}/user/signup`, {
      email: 'gstech@iitdh.ac.in',
      password: 'password123',
      role: 'general-secretary',
      type: 'Technical',
      category: 'Technical'
    });
    console.log('✅ General Secretary created:');
    console.log('   Email: gstech@iitdh.ac.in');
    console.log('   Password: password123');
    console.log('');

    // Create Treasurer
    const treasurer = await axios.post(`${API_URL}/user/signup`, {
      email: 'treasurer@iitdh.ac.in',
      password: 'password123',
      role: 'treasurer',
      category: 'Technical'
    });
    console.log('✅ Treasurer created:');
    console.log('   Email: treasurer@iitdh.ac.in');
    console.log('   Password: password123');
    console.log('');

    console.log('🎉 All test users created successfully!');
    console.log('\nYou can now login with any of these credentials.');
    console.log('\nTo test login:');
    console.log('POST http://localhost:4001/user/login');
    console.log('Body: { "email": "secretary@iitdh.ac.in", "password": "password123" }');

  } catch (error) {
    if (error.response) {
      console.error('❌ Error:', error.response.data.message);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

createTestUser();
