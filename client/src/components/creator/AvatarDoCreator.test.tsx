import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * AvatarDoCreator (lote 11b): o avatar de um creator sai do MESMO componente
 * do cabecalho, com as MESMAS props que o Header montaria para o proprio
 * dono. O `UserAvatar` e dublado para capturar as props; o lado do Header e
 * calculado aqui com as mesmas funcoes que o Header usa.
 */

const capturadas = vi.hoisted(() => ({
  props: null as Record<string, unknown> | null,
}));

vi.mock("@/components/UserAvatar", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/components/UserAvatar")>();
  return {
    ...real,
    default: (props: Record<string, unknown>) => {
      capturadas.props = props;
      return <span data-testid="avatar" />;
    },
  };
});

import { effectiveOwnAvatar } from "@/components/UserAvatar";
import {
  normalizeAvatarBg,
  normalizeAvatarIcon,
  resolveEffectiveBorder,
} from "@/constants/avatarOptions";
import { AvatarDoCreator } from "./AvatarDoCreator";

afterEach(() => {
  cleanup();
  capturadas.props = null;
});

describe("AvatarDoCreator", () => {
  it("com avatar_mode de iniciais e avatar_bg definido, desenha o que o Header desenharia", () => {
    // O perfil como o Header o le (dono Pro, icone de iniciais, fundo roxo,
    // borda dourada) e o mesmo perfil como o servidor o manda resolvido.
    const perfil = {
      avatar_mode: "icon",
      avatar_url: null,
      avatar_moderation_status: "clean",
      avatar_icon: "initials",
      avatar_bg: "purple",
      avatar_border: "gold",
    };
    const doHeader = {
      border: resolveEffectiveBorder(perfil.avatar_border, true),
      icon: normalizeAvatarIcon(perfil.avatar_icon),
      bg: normalizeAvatarBg(perfil.avatar_bg),
      mode: effectiveOwnAvatar(perfil, true).mode,
      avatarUrl: effectiveOwnAvatar(perfil, true).avatarUrl,
    };

    render(
      <AvatarDoCreator
        name="Ana"
        avatar={{
          mode: "icon",
          avatar_url: null,
          icon: "initials",
          bg: "purple",
          border: "gold",
        }}
        size="sm"
      />,
    );
    expect(capturadas.props).toMatchObject({
      name: "Ana",
      size: "sm",
      ...doHeader,
    });
    expect(doHeader).toEqual({
      border: "gold",
      icon: "initials",
      bg: "purple",
      mode: "icon",
      avatarUrl: null,
    });
  });

  it("borda holografica: a MESMA classe de borda que o Header desenharia (lote 11d)", () => {
    // O Header, para o dono Pro com pro-holo, passa `border: "pro-holo"`.
    const doHeader = resolveEffectiveBorder("pro-holo", true);
    render(
      <AvatarDoCreator
        name="Lorena"
        avatar={{
          mode: "icon",
          avatar_url: null,
          icon: "star",
          bg: "cream",
          border: "pro-holo",
        }}
        size="lg"
      />,
    );
    expect(doHeader).toBe("pro-holo");
    expect(capturadas.props).toMatchObject({ border: "pro-holo" });
    // Nenhuma classe por cima do avatar: a borda e a da pessoa.
    expect(capturadas.props?.className).toBeUndefined();
  });

  it("foto resolvida pelo servidor vira modo foto com a url; id fora do catalogo cai no padrao", () => {
    render(
      <AvatarDoCreator
        name="Bia"
        avatar={{
          mode: "photo",
          avatar_url: "https://a/bia.png",
          icon: "nao-existe",
          bg: null,
          border: "pro-holo",
        }}
        size="lg"
      />,
    );
    expect(capturadas.props).toMatchObject({
      mode: "photo",
      avatarUrl: "https://a/bia.png",
      icon: normalizeAvatarIcon("nao-existe"),
      bg: normalizeAvatarBg(null),
      border: "pro-holo",
      size: "lg",
    });
  });

  it("sem `avatar` (backend anterior): foto se ha url, iniciais se nao ha, sem icone nem fundo", () => {
    render(
      <AvatarDoCreator name="Caio" avatarUrl="https://a/caio.png" size="md" />,
    );
    expect(capturadas.props).toMatchObject({
      mode: "photo",
      avatarUrl: "https://a/caio.png",
    });
    expect(capturadas.props).not.toHaveProperty("bg");

    cleanup();
    render(<AvatarDoCreator name="Caio" avatarUrl={null} size="md" />);
    expect(capturadas.props).toMatchObject({ mode: "icon", avatarUrl: null });
  });
});
