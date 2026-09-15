# ADM-002-P1 - painel Atenção necessária

Data da implementação local: 12/09/2026.

## Estado e escopo

- Base: `1ac2ce35c398009805cfad1780f7aa185080a9e2`, ADM-001 aprovada.
- Branch local: `feat/adm-002-atencao-v1`.
- HEAD inicial e final: a base acima. Não houve commit.
- Checkout isolado: `/tmp/boranatech-adm002`.
- A fonte `/tmp/boranatech-adm001-integracao-local` permaneceu limpa e sem alteração.
- O ZIP P0 tinha SHA-256 `8da5b31fbff6238a992221314a4c8b399ee8f370cc1d509065d491d6e5bd958c`. Não havia caminho inseguro nem symlink e todos os hashes do manifesto conferiram.
- Os dois documentos P0 foram copiados sem mudança para o diff desta entrega.

Esta fase não cria operação financeira. Ela troca a origem e a linguagem da fila de atenção, adiciona navegação contextual e mantém as operações preexistentes das telas de destino fora do clique do alerta.

## Contrato `/admin/attention` v3

O contrato puro e compartilhado está em `shared/adminAttention.ts`. A rota exige `GET /admin/attention?contract=3`; outra versão recebe erro controlado `attention_contract_mismatch`. A chave de cache é `admincache:attention:v3`, TTL de 60 segundos. Somente uma computação que retorna contrato é armazenada. O `computedAt` do dado é preservado em cache.

Cada item contém `kind`, chave estável, severidade, título, detalhe, fonte, sujeito opaco e ação de uma união fechada. Instantes são opcionais porque nem todo fato os mantém. Valores opcionais carregam semântica, moeda e unidades menores. O cliente não aceita caminho fornecido pelo servidor; ele cria a URL a partir da ação tipada e valida UUIDs.

O envelope informa:

- `queryStartedAt` e `queryCompletedAt`;
- `computedAt`;
- consistência `multi_query_no_snapshot`;
- fontes `available`, `partial`, `unavailable` ou `not_collected`;
- cobertura histórica não comprovada e ausência de snapshot transacional.

`available` significa somente que a leitura local paginada terminou e passou pelas verificações implementadas. Não prova cobertura integral entre provedores nem uma fotografia única. `not_collected` é ausência deliberada do fato reconciliado, e não zero nem falha temporária.

## Fatos e famílias

| Família v3 | Afirmação possível | Fonte local | Ação |
| --- | --- | --- | --- |
| `subscription_local_past_due` | assinatura tem estado local atual `past_due` | `subscriptions` | usuário exato, ou seção Usuários sem vínculo válido |
| `subscription_scheduled_exit` | saída local agendada, com fim e motivo quando registrados | `subscriptions`, `subscription_cancellations` | usuário exato |
| `orphan_payment_open` | detector mantém caso órfão local aberto, inclusive charge-only | `billing_orphan_payments` | caso exato em Financeiro |
| `ai_cost_spike` | custo local estimado em USD acima do padrão, no dia parcial até o corte | `ai_usage_logs` | IA |
| `previous_month_without_expense` | nenhuma despesa local foi encontrada no mês civil anterior de Brasília | `expenses` | Financeiro |
| `influencer_active_access` | influencer também possui acesso local `active` | `influencers`, `subscriptions` | usuário exato |
| `influencer_trial_access` | influencer também possui trial local | `influencers`, `subscriptions` | usuário exato |
| `manual_subscription_ending` | acesso local active, manual e próximo do fim | `subscriptions` | usuário exato |

Os cards antigos de cobranças falhadas ao vivo e payout falho foram removidos. `failed_charges_reconciled` e `failed_payouts_reconciled` aparecem como `not_collected`. Nenhuma tentativa é chamada de dinheiro perdido, nenhum `past_due` é chamado de dívida e nenhum preço de catálogo é somado como risco. Pix, boleto e não identificado vêm apenas do campo local; ausência não vira boleto.

As leituras de assinaturas, motivos, órfãos, IA e influencers usam o coletor da ADM-001 com `count: exact` em todas as páginas, total constante, ID de linha obrigatório e sem repetição. Truncagem, mudança de total e ID repetido tornam a fonte `unavailable`; itens das demais fontes permanecem. A existência de despesa usa `limit(1)` deliberadamente. Não há N+1 de usuário nem provedor.

Não há chamada a Stripe ou Asaas no serviço ou no handler de atenção. O módulo não importa `getStripe`, e as consultas observadas nos testes são somente `subscriptions`, `subscription_cancellations`, `billing_orphan_payments`, `ai_usage_logs`, `expenses` e `influencers`.

## Interface e navegação

O painel agrupa por fato e ordena pela ordem do servidor: severidade, instante e chave. Valor de grupo só é somado se todos os itens tiverem a mesma semântica e moeda e tiverem valor. BRL e USD não se misturam.

O cliente valida o payload antes de renderizar, mostra erro controlado para versão ou forma incompatível, distingue estados das fontes e nunca converte falha em painel vazio. Com cobertura local monitorada concluída e nenhum item, exibe “Nenhuma pendência encontrada nas fontes locais monitoradas”. Também exibe o horário preservado de cálculo e a limitação de snapshot.

Há atualização manual e polling de 60 segundos somente quando a Visão está ativa. Chamadas concorrentes são bloqueadas, o timer é limpo ao desmontar e voltar à Visão inicia nova leitura.

Deep links entregues:

- `/admin?section=usuarios&user=<uuid>` abre somente o usuário indicado. UUID inválido e usuário ausente têm erro controlado. F5, voltar, avançar e fechar sincronizam o modal; fechar remove apenas `user`.
- `/admin?section=financeiro&panel=orphans&orphan=<uuid>` destaca e rola até o caso depois da leitura. Não abre confirmação mutável. ID inválido, ausente ou já resolvido mantém a lista utilizável. Limpar remove apenas `panel` e `orphan`.
- Trocar de seção remove `user`, `panel` e `orphan`, preservando parâmetros da página, como `window`.

## Validação executada

### Aprovada

- Suíte focal sem socket, 18 arquivos: 294/294 testes.
- Negociação, cache v3 e handler real em memória: 3/3 testes focais aprovados; 27 testes do mesmo arquivo foram filtrados nesse comando.
- Guardas administrativas existentes: 10/10 testes.
- TypeScript principal: aprovado.
- TypeScript de scripts: aprovado.
- Equivalentes sem IPC de roadmap, projetos v2, sitemap, CSP, contagens, home data, paleta e auditoria de limiares: aprovados.
- Prettier nos arquivos TypeScript/TSX tocados: aprovado.
- `git diff --check` do diff rastreado: aprovado. O patch acumulado, que também
  inclui os documentos P0 ainda não rastreados, preserva dois espaços finais
  intencionais do Markdown aprovado em `2026-09-12-adm-002-p0-atencao-necessaria.md`.
  `git apply --check` aceita o patch e avisa exatamente sobre essas duas linhas.
- Inspeções estáticas: sem chamada a provedor no serviço de atenção, sem texto proibido no caminho novo e sem resto de conflito.

O comando focal de 294 casos cobre ADM-001, paginação, todas as famílias locais, payload runtime, estados de fonte, polling, usuários, órfãos e hierarquia da Visão. Os números acima são resultados por comando; não foram somados como casos únicos porque alguns arquivos importam harnesses compartilhados.

### Bloqueada ou limitada

- `pnpm check:all`: o TypeScript principal passou, mas a primeira CLI `tsx` falhou com `listen EPERM` ao criar `/tmp/tsx-1000/73.pipe`. O agregado não é declarado aprovado. Todos os seus subcomandos foram executados pela forma equivalente `node --import tsx`, além dos dois `tsc`, e passaram.
- HTTP com socket: a tentativa local encontrou o mesmo `listen EPERM`. No comando tentado, 23 testes de parser passaram, cinco testes HTTP expiraram e a suíte de cards foi interrompida para não repetir timeouts. A versão final possui teste do handler real em memória para negociação, resposta e cache, mas isso não é E2E nem confirmação HTTP.
- Browser e captura visual: não repetidos sob a restrição de socket já comprovada. Estados, hierarquia, rótulos, ações e responsividade estrutural foram cobertos em DOM com fixtures identificadas como sintéticas.
- Não houve consulta a banco nem provedor. Portanto não há conciliação ou contagem real nesta entrega.

## Casos de aceitação cobertos

- Ausência de chamadas a Stripe/Asaas e de N+1.
- Contrato e cache v3, versão incompatível e payload inválido.
- `past_due` sem dívida/retry inferidos; tentativas e payout como `not_collected`.
- Órfão por sessão e charge-only; foco válido, inválido e resolvido.
- Influencer `active` separado de `trialing`.
- Meio desconhecido sem inferência de boleto.
- Custo de IA com corte superior e dia parcial.
- Total mutante e ID repetido tornando a fonte indisponível.
- Fonte indisponível distinta de fila vazia.
- Deep link de usuário em F5, voltar/avançar, fechamento, UUID inválido e usuário ausente.
- Atualização manual, polling só na Visão, bloqueio de concorrência e cleanup.
- Bordas do mês civil em Brasília.
- Ausência das afirmações proibidas e preservação da autorização administrativa existente.

Durante a validação, o teste de voltar/avançar reproduziu uma lacuna: retirar `user` da URL mantinha o modal anterior. A sincronização foi corrigida e o teste passou. Um inventário antigo da Visão ainda esperava “Conversões Pro por dia”; a expectativa foi alinhada ao rótulo já aprovado da ADM-001, “Pagamentos registrados por dia”.

## Limitações preservadas

- Não existe snapshot transacional entre as consultas. Contagem e IDs detectam classes de inconsistência, não toda mutação concorrente.
- Cobertura histórica integral e reconciliação entre provedores não foram comprovadas.
- Falha de cobrança, obrigação aberta, próxima tentativa e payout reconciliado não são fatos coletados localmente.
- O estado local de acesso, entrega de webhook e caixa registrado continuam separados.
- O detector de órfãos local ainda tem limitações próprias registradas na P0.
- Não houve ampliação de RBAC. ADM-19 permanece requisito antes de qualquer nova ação mutável.

## Arquivos e ausência de publicação

O diff contém o contrato compartilhado, serviço/rota, painel/hook, deep links, testes, este relatório e os dois documentos P0. Não houve commit, push, PR, merge, deploy, migration, backfill, sync, replay nem alteração de dados.
