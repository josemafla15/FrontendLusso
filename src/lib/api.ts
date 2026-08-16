export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Llama al backend a través del proxy /api/proxy/. Si la sesión expiró
 * (el proxy ya intentó el refresh y falló), redirige a /login.
 *
 * Si init.body es un FormData (subida de archivos), NO se fuerza
 * Content-Type: application/json -- el browser pone el boundary solo.
 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;

  const res = await fetch(`/api/proxy/${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 401) {
    window.location.href = "/login";
    throw new ApiError(401, "Sesión expirada");
  }

  if (!res.ok) {
    let detail = `Error ${res.status}`;
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") detail = data.detail;
    } catch {
      // cuerpo no-JSON, se deja el mensaje genérico
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Sube un archivo a POST /api/upload-imagen/ y devuelve la URL resultante */
export async function uploadImagen(file: File, carpeta?: string): Promise<{ url: string }> {
  const form = new FormData();
  form.append("archivo", file);
  if (carpeta) form.append("carpeta", carpeta);
  return api<{ url: string }>("upload-imagen", { method: "POST", body: form });
}