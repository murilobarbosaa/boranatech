#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera o bloco `.dark` da paleta escura curada de `client/src/index.css`.

CONTEXTO. O bloco sempre trouxe o comentario "GERADO por
scripts/gen-dark-palette.py ... Nao editar a mao", mas o script NUNCA existiu no
repositorio: nenhum arquivo `.py` foi versionado aqui em commit nenhum,
alcancavel por branch nenhuma (conferido com `git log --all --diff-filter=A`).
O comentario mandava a proxima pessoa nao editar a mao um bloco que so podia ser
editado a mao. Este arquivo existe para tornar o comentario verdadeiro.

ELE FOI RECONSTRUIDO A PARTIR DO BLOCO, NAO O CONTRARIO. As regras abaixo foram
derivadas por comparacao dos 242 valores do bloco com a paleta padrao do
tailwindcss, e o modo `--check` prova que a saida bate BYTE A BYTE com o que
esta em producao hoje. Nenhum valor foi "melhorado" no caminho.

    python3 scripts/gen-dark-palette.py --check     # falha se divergir do CSS
    python3 scripts/gen-dark-palette.py --write     # reescreve o bloco no CSS
    python3 scripts/gen-dark-palette.py             # imprime na saida padrao

AS REGRAS

Fonte: `node_modules/tailwindcss/theme.css`, a paleta clara do Tailwind, lida em
oklch. Em todos os casos a MATIZ e preservada exatamente; o que muda e L e C.

  NEUTROS (slate, gray, zinc, neutral, stone)
    Escala de L propria, a mesma para os cinco, e croma limitado a 0.020 para o
    cinza nao ganhar cor ao clarear:
        L = RAMPA_NEUTRA[tom]      C = min(C_claro, 0.020)      H = H_claro

  CROMATICAS NAO-ACENTO (15)
    Os tons 50/100/200 sao calculados, porque no escuro eles deixam de ser
    "quase branco" e viram superficie escura tingida:
        50  -> L 0.250  C 0.050        100 -> L 0.280  C 0.060
        200 -> L 0.330  C 0.080
    Os demais espelham a escala clara em torno do 500, o que troca papel de
    fundo e de tinta sem inventar cor nenhuma:
        300->300  400->400  500->500  600->500
        700->400  800->300  900->200  950->100

  ACENTO (amber, yellow)
    Amarelo e o acento da marca e nao pode apagar no escuro, entao a escala
    inteira anda um degrau em relacao as outras e o croma dos tons calculados
    e o da propria familia, nao o valor fixo:
        50  -> L 0.250  C = min(C_claro, 0.050)
        100 -> L 0.280  C = min(C_claro, 0.060)
        200->200  300->300  400->400  500->500  600->500
        700->300  800->200  900->100  950->50

LIMITE CONHECIDO DA RECONSTRUCAO. As duas regras de croma do ACENTO tem dois
pontos de amostra cada (amber e yellow), e so o tom 100 exerce o teto: yellow-100
tem C 0.071 no claro e sai 0.060 aqui, enquanto amber-100 (0.059) passa intacto.
No tom 50 as duas familias ficam abaixo de qualquer teto plausivel (0.022 e
0.026), entao o valor 0.050 escrito ali e uma ESCOLHA documentada, nao um fato
derivado: qualquer teto acima de 0.026 reproduz o bloco atual. Se um dia o
Tailwind subir o croma de amber-50 ou yellow-50, este script decide, e a decisao
esta aqui e nao na cabeca de ninguem.

FAMILIAS. A lista e explicita, e nao "tudo que o theme.css tiver", porque o
tailwindcss 4.2.4 ja traz `mauve`, `olive`, `mist` e `taupe`, que o bloco nao
tem. Nenhuma delas e usada no projeto (conferido na fonte e no CSS compilado),
entao a ausencia e inofensiva hoje. Acrescentar familia aqui e ato deliberado: o
`--check` quebra no mesmo commit, que e o comportamento desejado.
"""

import argparse
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMA = os.path.join(RAIZ, "node_modules", "tailwindcss", "theme.css")
CSS = os.path.join(RAIZ, "client", "src", "index.css")

ABERTURA = "/* ==== GERADO por scripts/gen-dark-palette.py"

TONS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"]

NEUTROS = ["slate", "gray", "zinc", "neutral", "stone"]
ACENTOS = ["amber", "yellow"]
CROMATICAS = [
    "red", "orange", "lime", "green", "emerald", "teal", "cyan", "sky",
    "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose",
]
# A ordem de saida agrupa por regra: neutros, acento, resto. Nao e a ordem do
# theme.css, e e por isso que ela mora aqui.
ORDEM = NEUTROS + ACENTOS + CROMATICAS

RAMPA_NEUTRA = {
    "50": 0.210, "100": 0.245, "200": 0.300, "300": 0.380, "400": 0.580,
    "500": 0.680, "600": 0.760, "700": 0.830, "800": 0.880, "900": 0.930,
    "950": 0.960,
}
TETO_CROMA_NEUTRO = 0.020

# tom de destino -> tom de ORIGEM na escala clara (espelho em torno do 500)
ESPELHO_CROMATICA = {
    "300": "300", "400": "400", "500": "500", "600": "500",
    "700": "400", "800": "300", "900": "200", "950": "100",
}
CALCULADO_CROMATICA = {"50": (0.250, 0.050), "100": (0.280, 0.060), "200": (0.330, 0.080)}

ESPELHO_ACENTO = {
    "200": "200", "300": "300", "400": "400", "500": "500", "600": "500",
    "700": "300", "800": "200", "900": "100", "950": "50",
}
CALCULADO_ACENTO = {"50": (0.250, 0.050), "100": (0.280, 0.060)}


def ler_paleta_clara():
    """{(familia, tom): (L, C, H)} a partir do theme.css do tailwindcss."""
    if not os.path.exists(TEMA):
        sys.exit("nao achei %s (rode `pnpm install` antes)" % TEMA)
    with open(TEMA, encoding="utf-8") as fh:
        texto = fh.read()
    fora = {}
    # O `%` do L e opcional e NAO e decorativo: o theme.css escreve
    # `oklch(98.7% ...)`, e sem dividir por 100 o valor sai 100x maior. O grupo
    # existe so para essa conversao.
    padrao = r"--color-([a-z]+)-(\d+):\s*oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)"
    for m in re.finditer(padrao, texto):
        l = float(m.group(3))
        if m.group(4):
            l /= 100.0
        fora[(m.group(1), m.group(2))] = (l, float(m.group(5)), float(m.group(6)))
    return fora


def cor(familia, tom, claro):
    """(L, C, H) do tom escuro, pelas regras acima."""
    def origem(t):
        v = claro.get((familia, t))
        if v is None:
            sys.exit("tailwindcss nao tem --color-%s-%s" % (familia, t))
        return v

    if familia in NEUTROS:
        _, c, h = origem(tom)
        return RAMPA_NEUTRA[tom], min(c, TETO_CROMA_NEUTRO), h

    calculado = CALCULADO_ACENTO if familia in ACENTOS else CALCULADO_CROMATICA
    espelho = ESPELHO_ACENTO if familia in ACENTOS else ESPELHO_CROMATICA

    if tom in calculado:
        alvo_l, alvo_c = calculado[tom]
        _, c, h = origem(tom)
        # Acento preserva o croma da familia ate o teto; nao-acento usa o fixo.
        return alvo_l, (min(c, alvo_c) if familia in ACENTOS else alvo_c), h
    l, c, h = origem(espelho[tom])
    return l, c, h


def gerar():
    claro = ler_paleta_clara()
    linhas = [".dark {", "  --color-white: var(--bnt-surface);"]
    for familia in ORDEM:
        for tom in TONS:
            l, c, h = cor(familia, tom, claro)
            linhas.append(
                "  --color-%s-%s: oklch(%.3f %.3f %.3f);" % (familia, tom, l, c, h)
            )
    linhas.append("}")
    return "\n".join(linhas)


def bloco_atual(texto):
    """Recorta o `.dark { ... }` que vem logo depois do comentario de abertura."""
    i = texto.find(ABERTURA)
    if i < 0:
        sys.exit("nao achei o comentario de abertura em client/src/index.css")
    ini = texto.index(".dark {", i)
    fim = texto.index("\n}", ini) + 2
    return ini, fim, texto[ini:fim]


def main():
    p = argparse.ArgumentParser(description="Gera o bloco .dark da paleta escura.")
    p.add_argument("--check", action="store_true", help="falha se divergir do CSS")
    p.add_argument("--write", action="store_true", help="reescreve o bloco no CSS")
    args = p.parse_args()

    novo = gerar()
    if not (args.check or args.write):
        print(novo)
        return 0

    with open(CSS, encoding="utf-8") as fh:
        texto = fh.read()
    ini, fim, atual = bloco_atual(texto)

    if args.check:
        if atual == novo:
            n = len(ORDEM) * len(TONS)
            print("[gen-dark-palette] bloco .dark em sincronia (%d familias, %d variaveis)."
                  % (len(ORDEM), n))
            return 0
        a, b = atual.split("\n"), novo.split("\n")
        print("[gen-dark-palette] DIVERGIU do bloco em client/src/index.css:", file=sys.stderr)
        if len(a) != len(b):
            print("  numero de linhas: CSS %d, gerado %d" % (len(a), len(b)), file=sys.stderr)
        divergentes = [(i, x, y) for i, (x, y) in enumerate(zip(a, b)) if x != y]
        for i, x, y in divergentes[:20]:
            print("  linha %d\n    CSS    : %s\n    gerado : %s" % (i, x, y), file=sys.stderr)
        if len(divergentes) > 20:
            print("  ... e mais %d linha(s)" % (len(divergentes) - 20), file=sys.stderr)
        return 1

    with open(CSS, "w", encoding="utf-8") as fh:
        fh.write(texto[:ini] + novo + texto[fim:])
    print("[gen-dark-palette] bloco .dark reescrito em client/src/index.css.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
