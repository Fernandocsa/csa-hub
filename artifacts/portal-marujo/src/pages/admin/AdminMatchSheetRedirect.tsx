import { useEffect } from "react";
import { useLocation, useParams } from "wouter";

/** Legacy URL /admin/partidas/:id/ficha → /admin/partidas/:id */
export default function AdminMatchSheetRedirect() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (params.id) setLocation(`/admin/partidas/${params.id}`);
  }, [params.id, setLocation]);

  return <p className="text-sm text-gray-400">Redirecionando…</p>;
}
