import { db } from '@/lib/db';
import { registerAction } from '../actions';

export default function Register({ searchParams }: { searchParams: { error?: string } }) {
  const dists = db.prepare('SELECT * FROM districts').all() as { id: number; name: string }[];
  return (
    <div className="max-w-md mx-auto bg-white border rounded-lg p-6 shadow-sm">
      <h1 className="text-xl font-bold mb-4">Регистрация</h1>
      {searchParams.error && <p className="text-red-600 text-sm mb-3">{searchParams.error}</p>}
      <form action={registerAction} className="space-y-4">
        <input name="name" placeholder="Имя" required className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
        <input name="password" type="password" placeholder="Пароль (от 6 символов)" required className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
        <select name="district_id" required className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none">
          <option value="">Выберите район</option>
          {dists.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button className="w-full bg-emerald-600 text-white rounded-md px-3 py-2 font-medium hover:bg-emerald-700 transition">Создать аккаунт</button>
      </form>
    </div>
  );
}