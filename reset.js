const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// Подключаемся к вашей базе
const db = new Database('app.db');

// Придумываем новый пароль (можете изменить 'admin123' на свой)
const newPassword = 'admin123'; 
const hash = bcrypt.hashSync(newPassword, 10);

// Обновляем пароль пользователя admin
const result = db.prepare('UPDATE users SET password_hash = ? WHERE name = ?').run(hash, 'admin');

if (result.changes > 0) {
  console.log(`✅ Успех! Пароль для пользователя admin изменен на: ${newPassword}`);
} else {
  console.log(`❌ Пользователь с ником admin не найден в базе.`);
}