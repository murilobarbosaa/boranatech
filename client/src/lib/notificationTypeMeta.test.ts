import { describe, expect, it } from "vitest";

import {
  UNKNOWN_TYPE_BADGE,
  notificationTypeMetaOf,
} from "@/lib/notificationTypeMeta";

// Fonte única de fallback do type, usada pelo admin (NotificationsManager) e
// pelo usuário (NotificationDetail). Regressão do crash de produção: um `type`
// vindo do servidor fora do enum conhecido (deploy defasado / enum novo) fazia
// NOTIFICATION_TYPE_META[type].label estourar. O resolver nunca devolve undefined.
describe("notificationTypeMetaOf", () => {
  it("type conhecido usa o meta real", () => {
    expect(notificationTypeMetaOf("coupon").label).toBe("Cupom");
    expect(notificationTypeMetaOf("announcement").label).toBe("Anúncio");
    expect(notificationTypeMetaOf("system").label).toBe("Sistema");
    expect(notificationTypeMetaOf("optin").label).toBe("Opt-in");
  });

  it("type DESCONHECIDO cai no fallback com o valor cru, sem estourar", () => {
    const meta = notificationTypeMetaOf("tipo_futuro_do_servidor");
    expect(meta.label).toBe("tipo_futuro_do_servidor");
    expect(meta.badge).toBe(UNKNOWN_TYPE_BADGE);
  });

  it("string vazia também é tratada (nunca undefined.label)", () => {
    const meta = notificationTypeMetaOf("");
    expect(meta.label).toBe("");
    expect(typeof meta.badge).toBe("string");
  });
});
