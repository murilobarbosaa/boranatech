import { describe, expect, it } from "vitest";

import {
  audienceMetaOf,
  statusMetaOf,
  typeMetaOf,
} from "@/components/admin/NotificationsManager";

// Regressão do crash de produção (admin quebrava com "Cannot read properties of
// undefined (reading 'label')" dentro do items.map): um valor de enum vindo do
// server que o front ainda não conhecia (deploy defasado do backend/db:push que
// já produzia 'scheduled'/'custom') fazia STATUS_META[valor] === undefined e o
// .label estourava. Os resolvers precisam sempre devolver { label, badge/description },
// nunca undefined — valor conhecido usa o meta real, desconhecido cai no fallback
// com o valor cru (sem throw).

describe("resolvers de meta (fallback anti-crash)", () => {
  it("status conhecido usa o rótulo real", () => {
    expect(statusMetaOf("scheduled").label).toBe("Agendada");
    expect(statusMetaOf("published").label).toBe("Publicada");
  });

  it("status DESCONHECIDO cai no fallback com o valor cru (não estoura)", () => {
    const meta = statusMetaOf("um_status_futuro");
    expect(meta.label).toBe("um_status_futuro");
    expect(typeof meta.badge).toBe("string");
  });

  it("type conhecido e desconhecido", () => {
    expect(typeMetaOf("coupon").label).toBe("Cupom");
    const unknown = typeMetaOf("tipo_novo");
    expect(unknown.label).toBe("tipo_novo");
    expect(typeof unknown.badge).toBe("string");
  });

  it("audience conhecida e desconhecida", () => {
    expect(audienceMetaOf("custom").label).toBe("Emails específicos");
    const unknown = audienceMetaOf("segmento_novo");
    expect(unknown.label).toBe("segmento_novo");
    expect(typeof unknown.description).toBe("string");
  });
});
