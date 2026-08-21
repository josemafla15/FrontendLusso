"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import DestinoForm, { DestinoFormValues } from "@/components/catalogo/DestinoForm";
import type { DestinoContenido } from "@/lib/types";

export default function NuevoDestinoPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: DestinoFormValues) {
    setSaving(true);
    setError(null);
    try {
      const created = await api<DestinoContenido>("destinos", {
        method: "POST",
        body: JSON.stringify(values),
      });
      router.push(`/destinos/${created.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo crear el destino");
      setSaving(false);
    }
  }

  return (
    <div>
      <Link href="/destinos" className="inline-flex items-center gap-1 text-sm text-charcoal/60 hover:text-charcoal">
        <ArrowLeft className="size-4" /> Volver a destinos
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold">Nuevo destino</h1>

      {error && (
        <p className="mt-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </p>
      )}

      <div className="mt-6">
        <DestinoForm onSubmit={handleSubmit} saving={saving} submitLabel="Crear destino" />
      </div>
    </div>
  );
}