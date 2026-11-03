const Database = require('better-sqlite3');
const db = new Database('app.db');

// Делаем пользователя admin снова администратором
const result = db.prepare("UPDATE users SET is_admin = 1 WHERE name = 'admin'").run();

if (result.changes > 0) {
  console.log('✅ Успех! Аккаунту admin возвращены права администратора.');
} else {
  console.log('❌ Пользователь с ником "admin" не найден. Зарегистрируйтесь с этим ником!');
}