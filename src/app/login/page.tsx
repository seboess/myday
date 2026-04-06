"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError(null);
        // Show confirmation message for sign-up
        setIsSignUp(false);
        setError("Konto erstellt! Bitte melde dich jetzt an.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.";
      // Translate common Supabase error messages
      if (message.includes("Invalid login credentials")) {
        setError("Ungueltige Anmeldedaten. Bitte versuche es erneut.");
      } else if (message.includes("Email not confirmed")) {
        setError(
          "E-Mail noch nicht bestaetigt. Bitte pruefe dein Postfach."
        );
      } else if (message.includes("User already registered")) {
        setError(
          "Diese E-Mail ist bereits registriert. Bitte melde dich an."
        );
      } else if (
        message.includes("Password should be at least 6 characters")
      ) {
        setError("Das Passwort muss mindestens 6 Zeichen lang sein.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-2 text-4xl">🎓</div>
          <h1 className="text-2xl font-semibold text-stone-900">MyDay</h1>
          <p className="mt-1 text-sm text-stone-500">
            Dein persoenlicher Schulplaner
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
          <h2 className="mb-5 text-center text-lg font-medium text-stone-800">
            {isSignUp ? "Konto erstellen" : "Anmelden"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-stone-600"
              >
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.de"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:ring-1 focus:ring-stone-400"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-stone-600"
              >
                Passwort
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:ring-1 focus:ring-stone-400"
              />
            </div>

            {error && (
              <p
                className={`rounded-lg px-3 py-2 text-sm ${
                  error.includes("erstellt")
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : isSignUp ? (
                "Registrieren"
              ) : (
                "Anmelden"
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-sm text-stone-500 transition-colors hover:text-stone-700"
            >
              {isSignUp
                ? "Bereits ein Konto? Anmelden"
                : "Noch kein Konto? Registrieren"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
