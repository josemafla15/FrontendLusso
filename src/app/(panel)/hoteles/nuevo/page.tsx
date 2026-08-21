"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import HotelForm, { HotelFormValues } from "@/components/catalogo/HotelForm";
import type { HotelPartner } from "@/lib/types";

export default function NuevoHotelPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: HotelFormValues) {
    setSaving(true);
    setError(null);
    try {
      const created = await api<HotelPartner>("hoteles", {
        method: "POST",
        body: JSON.stringify(values),
      });
      router.push(`/hoteles/${created.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo crear el hotel");
      setSaving(false);
    }
  }

  return (
    <div>
      <Link href="/hoteles" className="inline-flex items-center gap-1 text-sm text-charcoal/60 hover:text-charcoal">
        <ArrowLeft className="size-4" /> Volver a hoteles
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold">Nuevo hotel</h1>

      {error && (
        <p className="mt-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </p>
      )}

      <div className="mt-6">
        <HotelForm onSubmit={handleSubmit} saving={saving} submitLabel="Crear hotel" />
      </div>
    </div>
  );
}