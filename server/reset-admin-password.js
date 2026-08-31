const bcrypt = require('bcryptjs');
const db = require('./database/database');

async function resetAdminPassword() {
  try {
    const newPassword = 'Admin1234';

    const newHash = await bcrypt.hash(newPassword, 10);

    const statement = db.prepare(`
      UPDATE users
      SET password_hash = ?
      WHERE username = ?
    `);

    const result = statement.run(
      newHash,
      'ADM001'
    );

    console.log('Admin password reset successfully.');
    console.log('Username: ADM001');
    console.log('Password: Admin1234');
    console.log('Rows updated:', result.changes);
  } catch (error) {
    console.error('Password reset error:', error);
  }
}

resetAdminPassword();