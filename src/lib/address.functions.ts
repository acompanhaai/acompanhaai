import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type CepAddress = {
  cep: string;
  street: string;
  district: string;
  city: string;
  state: string;
};

/** Consulta o CEP nos Correios (ViaCEP) para validar e preencher o endereço. */
export const lookupCep = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ cep: z.string().trim().min(8).max(10) }).parse(data),
  )
  .handler(async ({ data }): Promise<CepAddress | null> => {
    const cep = data.cep.replace(/\D/g, "");
    if (cep.length !== 8) return null;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!res.ok) return null;
      const json = (await res.json()) as Record<string, unknown>;
      if (json["erro"]) return null;
      return {
        cep,
        street: String(json["logradouro"] ?? ""),
        district: String(json["bairro"] ?? ""),
        city: String(json["localidade"] ?? ""),
        state: String(json["uf"] ?? ""),
      };
    } catch {
      return null;
    }
  });

/** Geocodifica o endereço completo (sem exigir coordenadas do usuário). */
export const geocodeAddress = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        cep: z.string().trim().min(8).max(10),
        street: z.string().trim().min(2).max(200),
        number: z.string().trim().min(1).max(20),
        city: z.string().trim().min(2).max(120),
        state: z.string().trim().min(2).max(2),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ lat: number; lng: number } | null> => {
    const params = new URLSearchParams({
      format: "json",
      limit: "1",
      country: "Brasil",
      postalcode: data.cep.replace(/\D/g, ""),
      street: `${data.number} ${data.street}`,
      city: data.city,
      state: data.state,
    });
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: { "User-Agent": "AcompanhaAi/1.0 (contato@acompanhai.app)" },
      });
      if (!res.ok) return null;
      const rows = (await res.json()) as Array<{ lat: string; lon: string }>;
      const first = rows?.[0];
      if (!first) return null;
      const lat = Number(first.lat);
      const lng = Number(first.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    } catch {
      return null;
    }
  });
