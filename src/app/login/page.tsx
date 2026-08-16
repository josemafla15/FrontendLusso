"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.detail ?? "Error al iniciar sesión");
        return;
      }
      router.push("/leads");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-charcoal p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-semibold text-cream">
            Lusso Travel
          </h1>
          <p className="mt-1 text-sm uppercase tracking-[0.25em] text-steel">
            Panel de asesores
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl bg-cream p-6 shadow-2xl sm:p-8"
        >
          <label className="block text-sm font-semibold" htmlFor="username">
            Usuario
          </label>
          <div className="relative mt-1.5">
            <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-charcoal/40" />
            <input
              id="username"
              autoComplete="username"
              autoFocus
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-charcoal/15 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-steel focus:ring-2 focus:ring-steel/40"
            />
          </div>

          <label
            className="mt-4 block text-sm font-semibold"
            htmlFor="password"
          >
            Contraseña
          </label>
          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-charcoal/40" />
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-charcoal/15 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-steel focus:ring-2 focus:ring-steel/40"
            />
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-charcoal py-2.5 text-sm font-semibold text-cream transition hover:bg-charcoal/85 disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
