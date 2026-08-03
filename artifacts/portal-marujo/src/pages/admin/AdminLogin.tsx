import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useAdminTheme } from "@/hooks/useSiteTheme";
import "./admin-theme.css";

interface Props {
  onLogin: (password: string) => Promise<string | null>;
}

export default function AdminLogin({ onLogin }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme, isDark } = useAdminTheme();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const err = await onLogin(password);
    if (err) setError(err);
    setLoading(false);
  }

  return (
    <div
      className={`admin-shell min-h-screen bg-[#1B3A6B] flex items-center justify-center relative ${isDark ? "dark" : ""}`}
      data-admin-theme={theme}
    >
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-4 right-4 inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-2.5 py-1.5 rounded border border-white/20 hover:border-white/40"
        title={isDark ? "Tema claro" : "Tema escuro"}
      >
        {isDark ? <Sun size={13} /> : <Moon size={13} />}
        {isDark ? "Claro" : "Escuro"}
      </button>
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-2xl font-black tracking-tight">
            <span className="text-[#1B3A6B]">PORTAL</span>
            <span className="text-[#F5A623] ml-1">MARUJO</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Painel de Administração</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
              Senha
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-[#1B3A6B] hover:bg-[#1B3A6B]/90"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
