import axios from 'axios';

const API_URL = 'http://localhost:4001';

// Helper — creates a user and prints result; skips gracefully if already exists
async function create({ email, password = 'password123', role, type, category, label }) {
  try {
    const res = await axios.post(`${API_URL}/user/signup`, { email, password, role, type, category });
    console.log(`✅ ${label}`);
    console.log(`   Email    : ${email}`);
    console.log(`   Password : ${password}`);
    console.log(`   Role     : ${role}`);
    console.log(`   _id      : ${res.data.user._id}`);
    console.log('');
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    if (msg === 'User already exists') {
      console.log(`⚠️  ${label} already exists (${email}) — skipped`);
      console.log('');
    } else {
      console.error(`❌ Failed to create ${label}: ${msg}`);
      console.log('');
    }
  }
}

async function createTestUsers() {
  console.log('='.repeat(55));
  console.log('  InstituteForms Test User Seeder');
  console.log('  All passwords: password123');
  console.log('  All emails:    mc24bt017@iitdh.ac.in (TEST_EMAIL)');
  console.log('='.repeat(55));
  console.log('');

  // ── EVENT PORTAL USERS ─────────────────────────────────────────
  console.log('── Event Portal ──────────────────────────────────────');
  await create({ label: 'Club Secretary (Technical)', email: 'secretary@iitdh.ac.in',      role: 'club-secretary',    type: 'Technical', category: 'Technical' });
  await create({ label: 'General Secretary',          email: 'gstech@iitdh.ac.in',          role: 'general-secretary', type: 'Technical', category: 'Technical' });
  await create({ label: 'Treasurer',                  email: 'treasurer@iitdh.ac.in',       role: 'treasurer' });
  await create({ label: 'President',                  email: 'president@iitdh.ac.in',       role: 'president' });
  await create({ label: 'ARSW',                       email: 'arsw@iitdh.ac.in',            role: 'ARSW' });
  await create({ label: 'Dean',                       email: 'dean@iitdh.ac.in',            role: 'dean' });

  // ── WELFARE PORTAL USERS ───────────────────────────────────────
  console.log('── Welfare Portal ────────────────────────────────────');

  // Secretaries → /welfare-staff
  await create({ label: 'Mess Secretary',      email: 'mess.secretary@iitdh.ac.in',    role: 'mess-secretary' });
  await create({ label: 'Canteen Secretary',   email: 'canteen.secretary@iitdh.ac.in', role: 'canteen-secretary' });
  await create({ label: 'Gen Sec Hostel (GSHA)', email: 'gsha@iitdh.ac.in', role: 'gen-sec-hostel' });
  await create({ label: 'Gen Sec Hostel (PGHA)', email: 'pgha@iitdh.ac.in', role: 'gen-sec-hostel' });

  // FIC + Hostel flow + Associate Dean → /staff (welfare sections)
  await create({ label: 'FIC – Mess & Canteen', email: 'fic.mess@iitdh.ac.in',          role: 'fic-mess-canteen' });
  await create({ label: 'Hostel Manager',       email: 'hostel.manager@iitdh.ac.in', role: 'hostel-manager' });
  await create({ label: 'Warden',               email: 'warden@iitdh.ac.in',         role: 'warden' });
  await create({ label: 'ADean Hostel',         email: 'adean.hostel@iitdh.ac.in',   role: 'adean-hostel' });
  await create({ label: 'Transit Facility',     email: 'transit.facility@iitdh.ac.in', role: 'transit-facility' });
  await create({ label: 'Associate Dean',       email: 'adean@iitdh.ac.in',            role: 'associate-dean' });

  // SW Office → /staff (read-only fine-flagged view)
  await create({ label: 'SW Office',           email: 'sw.office@iitdh.ac.in',         role: 'sw-office' });

  // ── STUDENT ────────────────────────────────────────────────────
  console.log('── Student Portal ────────────────────────────────────');
  await create({ label: 'Student (test)',      email: 'mc24bt017@iitdh.ac.in',         role: 'student' });

  console.log('='.repeat(55));
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('Welfare test flow:');
  console.log('  1. Login as student          → submit mess/canteen/hostel complaint');
  console.log('  2. Login as mess.secretary   → Action Needed → resolve / escalate / query');
  console.log('  3. Login as fic.mess         → appears after escalation from secretary');
  console.log('  4. Login as adean            → appears after FIC escalates; can mark fine');
  console.log('  5. Login as sw.office        → sees fine-flagged complaints (read-only)');
  console.log('  6. Login as gsha/pgha        → first action for hostel complaints');
  console.log('  7. Login as hostel.manager   → next step after Gen Sec Hostel');
  console.log('  8. Login as warden           → next step after Hostel Manager');
  console.log('  9. Login as adean.hostel     → final hostel action (resolve/query + purchase ticker)');
  console.log(' 10. Booking flow              → transit.facility → adean → dean');
  console.log('');
  console.log('Login endpoint: POST http://localhost:4001/user/login');
  console.log('Body: { "email": "...", "password": "password123" }');
  console.log('='.repeat(55));
}

createTestUsers();
