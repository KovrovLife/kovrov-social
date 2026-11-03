import { loginAction } from '../actions';

export default function Login({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="max-w-md mx-auto bg-white border rounded p-6">
      <h1 className="text-xl font-bold mb-4">Вход</h1>
      {searchParams.error && <p className="text-red-600 text-sm mb-3">{searchParams.error}</p>}
      <form action={loginAction} className="space-y-3">
        <input name="name" placeholder="Имя" required className="w-full border rounded px-3 py-2" />
        <input name="password" type="password" placeholder="Пароль" required className="w-full border rounded px-3 py-2" />
        <button className="w-full bg-blue-600 text-white rounded px-3 py-2">Войти</button>
      </form>
    </div>
  );
}