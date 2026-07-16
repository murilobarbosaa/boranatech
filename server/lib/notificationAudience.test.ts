import { describe, expect, it } from "vitest";

import {
  rowVisibleInContext,
  type NotificationAudienceContext,
} from "./notificationAudience";

// rowVisibleInContext e o predicado canonico de visibilidade: a query das
// listas (visibleQuery) implementa a mesma tabela em SQL. Estes testes fixam
// a semantica, com foco na audience 'custom'.

const NOTIF_ID = "aaaaaaaa-0000-0000-0000-000000000001";
const OTHER_ID = "aaaaaaaa-0000-0000-0000-000000000002";

function ctx(
  overrides: Partial<NotificationAudienceContext> = {},
): NotificationAudienceContext {
  return {
    allowedAudiences: ["all", "never_pro"],
    includePromotional: false,
    recipientNotificationIds: [],
    ...overrides,
  };
}

describe("rowVisibleInContext", () => {
  it("custom: destinatario na lista ve", () => {
    expect(
      rowVisibleInContext(
        { id: NOTIF_ID, audience: "custom", category: "product" },
        ctx({ recipientNotificationIds: [NOTIF_ID] }),
      ),
    ).toBe(true);
  });

  it("custom: fora da lista nao ve, mesmo com audience all liberada", () => {
    expect(
      rowVisibleInContext(
        { id: NOTIF_ID, audience: "custom", category: "product" },
        ctx({ recipientNotificationIds: [OTHER_ID] }),
      ),
    ).toBe(false);
    expect(
      rowVisibleInContext(
        { id: NOTIF_ID, audience: "custom", category: "product" },
        ctx(),
      ),
    ).toBe(false);
  });

  it("custom promotional: estar na lista NAO dispensa o opt-in (LGPD)", () => {
    expect(
      rowVisibleInContext(
        { id: NOTIF_ID, audience: "custom", category: "promotional" },
        ctx({ recipientNotificationIds: [NOTIF_ID] }),
      ),
    ).toBe(false);
  });

  it("custom promotional: com opt-in e na lista, ve", () => {
    expect(
      rowVisibleInContext(
        { id: NOTIF_ID, audience: "custom", category: "promotional" },
        ctx({
          recipientNotificationIds: [NOTIF_ID],
          includePromotional: true,
        }),
      ),
    ).toBe(true);
  });

  it("segmento: audience permitida ve, nao permitida nao ve", () => {
    expect(
      rowVisibleInContext(
        { id: NOTIF_ID, audience: "all", category: "product" },
        ctx(),
      ),
    ).toBe(true);
    expect(
      rowVisibleInContext(
        { id: NOTIF_ID, audience: "active_pro", category: "product" },
        ctx(),
      ),
    ).toBe(false);
  });

  it("segmento promotional sem opt-in nao ve", () => {
    expect(
      rowVisibleInContext(
        { id: NOTIF_ID, audience: "all", category: "promotional" },
        ctx(),
      ),
    ).toBe(false);
  });
});
