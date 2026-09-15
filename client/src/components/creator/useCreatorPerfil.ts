import { useCallback, useEffect, useState } from "react";

import { contentFetch } from "@/lib/adminApi";
import type {
  CreatorPerfilDados,
  CreatorPixMascarada,
} from "@shared/creatorProfile";

// PERFIL DE CREATOR, BUSCADO UMA VEZ PELA PAGINA (lote 08b).
//
// Ate o lote 08 o proprio formulario buscava. Com as abas, o perfil e
// necessario em QUALQUER aba, porque a faixa do topo mostra o que falta
// preencher: se a busca morasse no formulario, a faixa so saberia das
// pendencias depois de a pessoa abrir a aba Perfil, que e justamente quando
// ela ja nao precisa mais do aviso.
//
// Uma busca so, e nao uma por cartao: duas leituras do mesmo GET podem voltar
// diferentes (alguem salva do outro lado no meio), e ai o cartao de redes e o
// de pagamento mostrariam perfis distintos na mesma tela.
//
// ERRO NAO VIRA PERFIL VAZIO: `erro` e um estado proprio. Um perfil em branco
// com 200 seria indistinguivel de "a pessoa nunca preencheu", e a faixa
// acusaria pendencia que talvez nao exista.

export type EstadoDoPerfil =
  | { tipo: "carregando" }
  | { tipo: "erro" }
  | { tipo: "ok"; perfil: CreatorPerfilDados };

/** Resposta do GET /creator/profile, conferida antes de virar estado. */
export function perfilDaResposta(json: unknown): CreatorPerfilDados | null {
  if (typeof json !== "object" || json === null) return null;
  const data = (json as { data?: unknown }).data;
  if (
    typeof data !== "object" ||
    data === null ||
    typeof (data as { visible_to_creators?: unknown }).visible_to_creators !==
      "boolean" ||
    !("pix" in data)
  ) {
    return null;
  }
  return data as CreatorPerfilDados;
}

export type PerfilDoCreator = {
  estado: EstadoDoPerfil;
  /** Refaz a busca. E o "tentar de novo" do bloco de erro. */
  recarregar: () => void;
  /** Perfil relido que o PUT /profile devolveu. */
  definirPerfil: (perfil: CreatorPerfilDados) => void;
  /** Chave mascarada que o PUT /pix devolveu, ou null depois do DELETE. */
  definirPix: (pix: CreatorPixMascarada | null) => void;
};

export function useCreatorPerfil(): PerfilDoCreator {
  const [tentativa, setTentativa] = useState(0);
  const [estado, setEstado] = useState<EstadoDoPerfil>({ tipo: "carregando" });

  useEffect(() => {
    let cancelado = false;
    setEstado({ tipo: "carregando" });
    contentFetch("/creator/profile")
      .then((json: unknown) => {
        if (cancelado) return;
        const perfil = perfilDaResposta(json);
        setEstado(perfil ? { tipo: "ok", perfil } : { tipo: "erro" });
      })
      .catch(() => {
        if (!cancelado) setEstado({ tipo: "erro" });
      });
    return () => {
      cancelado = true;
    };
  }, [tentativa]);

  const recarregar = useCallback(() => setTentativa((n) => n + 1), []);

  const definirPerfil = useCallback((perfil: CreatorPerfilDados) => {
    setEstado({ tipo: "ok", perfil });
  }, []);

  const definirPix = useCallback((pix: CreatorPixMascarada | null) => {
    setEstado((atual) =>
      atual.tipo === "ok"
        ? { tipo: "ok", perfil: { ...atual.perfil, pix } }
        : atual,
    );
  }, []);

  return { estado, recarregar, definirPerfil, definirPix };
}
