import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  OnboardingCoordinatorProvider,
  useOnboardingCoordinator,
  type OverlayDecision,
} from "@/lib/onboarding/coordinator";
import SuperInterstitial from "./SuperInterstitial";

// O guard do SuperInterstitial que le o coordenador. Testado aqui, e nao so
// pelo lado do host: guarda que ninguem exercita carrega a mesma informacao
// que uma que sempre passa, zero.

vi.mock("./SuperModal", () => ({
  default: () => <div data-testid="super-modal" />,
}));

vi.mock("./NotificationsPanel", () => ({
  ctaTarget: () => ({ internal: true, href: "/" }),
}));

const notifications = {
  superModalOpen: true,
  superModalItem: { id: "n1", super_cta_url: "/" },
  superModalSource: "auto" as "auto" | "manual",
  dismissSuper: vi.fn(),
  closeSuperModal: vi.fn(),
  markAsRead: vi.fn(),
};

vi.mock("@/contexts/NotificationsContext", () => ({
  useNotifications: () => notifications,
}));

/**
 * Leva o provider REAL ate a decisao desejada pelos metodos publicos, em vez de
 * injetar um valor de contexto fabricado: assim o teste nao pode passar sobre
 * um estado que o provider nunca produziria.
 */
function Driver({ decision }: { decision: OverlayDecision }) {
  const { claimForOnboarding, releaseToOthers } = useOnboardingCoordinator();
  useEffect(() => {
    if (decision === "onboarding") claimForOnboarding();
    if (decision === "free") releaseToOthers();
  }, [decision, claimForOnboarding, releaseToOthers]);
  return null;
}

function montar(decision: OverlayDecision, children: ReactNode) {
  return render(
    <OnboardingCoordinatorProvider>
      <Driver decision={decision} />
      <Router hook={memoryLocation({ path: "/" }).hook}>{children}</Router>
    </OnboardingCoordinatorProvider>,
  );
}

afterEach(() => {
  notifications.superModalSource = "auto";
  cleanup();
});

describe("SuperInterstitial x coordenador de onboarding", () => {
  it("nao abre enquanto o host esta decidindo", () => {
    montar("deciding", <SuperInterstitial />);
    expect(screen.queryByTestId("super-modal")).toBeNull();
  });

  it("nao abre quando o onboarding reivindicou a carga", async () => {
    montar("onboarding", <SuperInterstitial />);
    await waitFor(() => expect(screen.queryByTestId("super-modal")).toBeNull());
  });

  it("abre quando o host liberou", async () => {
    montar("free", <SuperInterstitial />);
    await waitFor(() =>
      expect(screen.getByTestId("super-modal")).toBeInstanceOf(HTMLElement),
    );
  });

  it("abertura MANUAL pelo sino ignora o coordenador", async () => {
    notifications.superModalSource = "manual";
    montar("onboarding", <SuperInterstitial />);
    await waitFor(() =>
      expect(screen.getByTestId("super-modal")).toBeInstanceOf(HTMLElement),
    );
  });
});
