-- Promocao das 36 sentinelas legado-site e migracao dos favoritos.
--
-- COMO USAR (NAO rodar fora destas condicoes):
--   1. Janela 05h-09h de Brasilia, logo depois do backup diario. Este arquivo
--      contem UPDATE de dado existente, entao a janela de migration destrutiva
--      do CLAUDE.md se aplica: RPO de ate 24h, PITR desabilitado.
--   2. Confirmar ANTES que o backup da noite esta COMPLETED (procedimento no
--      CLAUDE.md, secao "Janela de migration destrutiva").
--   3. Rodar o arquivo INTEIRO de uma vez no SQL Editor. Ele e uma transacao
--      unica: ou tudo entra, ou nada entra.
--   4. Conferir as duas contagens do fim ANTES de dar deploy do frontend.
--
-- ORDEM EM RELACAO AO DEPLOY: este SQL roda ANTES do merge. O bundle antigo
-- ignora o banco (le do array estatico), entao promover cedo nao quebra nada; o
-- bundle novo, ao contrario, precisa das 36 ja publicadas, senao a pagina perde
-- esses eventos no instante do corte do estatico.
--
-- COMO O CASAMENTO FOI PROVADO (nao e casamento por titulo em runtime):
--   Os 36 external_id foram cruzados com os 41 eventos do array estatico por
--   uma regra de subconjunto de tokens, mais uma tabela de 6 alias explicitos
--   para os casos que nenhuma normalizacao alcanca (gdg = google developer
--   groups, ms = mato grosso do sul, tdc, recnplay, backend/back-end, e o
--   dois-pontos de "Tech Talks: Rio"). O gerador ABORTA em qualquer sentinela
--   que nao resolva para exatamente um evento, e afirma os TOTAIS: 36
--   casamentos 1 para 1, e exatamente 5 eventos do array sem sentinela.
--   Os 5 sao, todos, vencidos antes de 2026-08-11 (data de criacao da tabela):
--   DevOpsDays Sao Paulo, Google Cloud Summit Brasil, AWS Summit Sao Paulo,
--   Amazon Dev Day Manaus e Rio Innovation Week. Eles somem da pagina no corte
--   do estatico, e e o desfecho correto: ja estavam vencidos.
--
-- calendar_url: construida do array estatico COM +1 no dia final (o Google trata
-- a data final de evento de dia inteiro como exclusiva). Duas guardas: so grava
-- onde o BANCO tem starts_on (o proprio banco decide quem tem data, e nao uma
-- inferencia minha por regex sobre o texto do estatico), e usa `coalesce` para
-- nunca sobrescrever uma calendar_url que a rotina ja tenha gravado.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) PROMOCAO: 36 sentinelas passam a publicadas.
-- ---------------------------------------------------------------------------

-- Acre Green Stack Sprint
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Acre%20Green%20Stack%20Sprint&dates=20270610/20270612&details=Hackathon%20amaz%C3%B4nico%20com%20foco%20energia%20distribu%C3%ADda%2C%20sensores%20soberanos%20e%20relat%C3%B3rios%20de%20carbono%20integrados%20a%20dashboards%20abertos%20estaduais.%0A%0AOrganizador%3A%20AC%20Green%20Developers%0AValor%3A%20Subven%C3%A7%C3%A3o%20institucional%0ALink%3A%20https%3A//www.sympla.com.br/&location=Rio%20Branco%2C%20Acre%20%28Presencial%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-acre-green-stack-sprint-2027';

-- Amapá Edge & Satélites Conectividade
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Amap%C3%A1%20Edge%20%26%20Sat%C3%A9lites%20Conectividade&dates=20270118/20270119&details=Hackathon%20norte%20sobre%20backhaul%20satelital%2C%20telemetrias%20florestais%20resilientes%20offline%20e%20seguran%C3%A7a%20de%20firmware%20em%20gateways%20edge.%0A%0AOrganizador%3A%20Edge%20Norte%20Lab%0AValor%3A%20Pago%20institucional%0ALink%3A%20https%3A//aws.amazon.com/pt/events/&location=Macap%C3%A1%2C%20Amap%C3%A1%20%28H%C3%ADbrido%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-amapa-edge-satelites-2027';

-- Aracaju QA & Test Craft
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Aracaju%20QA%20%26%20Test%20Craft&dates=20260611/20260612&details=S%C3%A9rie%20online%20Sergipe-Brasil%20sobre%20shift-left%20testing%2C%20mocks%20resilientes%20para%20APIs%20p%C3%BAblicas%20estaduais%20e%20observabilidade%20de%20testes%20flaky.%0A%0AOrganizador%3A%20Sergipe%20Test%20Guild%0AValor%3A%20Gratuito%0ALink%3A%20https%3A//discord.com/&location=Aracaju%2C%20Sergipe%20%28Online%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-aracaju-qa-test-craft';

-- BH Tech Meetup
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=BH%20Tech%20Meetup&dates=20260612/20260614&details=Encontro%20da%20comunidade%20de%20tecnologia%20mineira%20com%20debates%20sobre%20dados%2C%20IA%2C%20carreira%20em%20produto%20e%20engenharia.%0A%0AOrganizador%3A%20BH%20Tech%20Meetup%0AValor%3A%20Gratuito%0ALink%3A%20https%3A//www.sympla.com.br/&location=Belo%20Horizonte%2C%20Minas%20Gerais%20%28Presencial%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-bh-tech-meetup';

-- Brasília Web3 Builders
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Bras%C3%ADlia%20Web3%20Builders&dates=20260618/20260619&details=Oficinas%20introdut%C3%B3rias%20sobre%20smart%20contracts%20conscientes%20da%20Regula%C3%A7%C3%A3o%20LGPD%20aplicada%20ao%20ecossistema%20descentralizado.%0A%0AOrganizador%3A%20Bras%C3%ADlia%20Web3%20Builders%0AValor%3A%20Gratuito%0ALink%3A%20https%3A//discord.com/&location=Bras%C3%ADlia%2C%20Distrito%20Federal%20%28Online%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-brasilia-web3-builders';

-- Campus Party Brasil
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Campus%20Party%20Brasil&dates=20260701/20260706&details=Um%20dos%20maiores%20eventos%20de%20tecnologia%20e%20inova%C3%A7%C3%A3o%20do%20mundo.%20Palestras%2C%20workshops%2C%20hackathons%20e%20networking.%0A%0AOrganizador%3A%20Campus%20Party%0AValor%3A%20Gratuito%20e%20pago%0ALink%3A%20https%3A//brasil.campus-party.org&location=S%C3%A3o%20Paulo%2C%20S%C3%A3o%20Paulo%20%28Presencial%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-campus-party-brasil';

-- Conexão Informação Brasília: Dados públicos em prática
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Conex%C3%A3o%20Informa%C3%A7%C3%A3o%20Bras%C3%ADlia%3A%20Dados%20p%C3%BAblicos%20em%20pr%C3%A1tica&dates=20260912/20260914&details=Debates%20sobre%20transpar%C3%AAncia%2C%20dados%20p%C3%BAblicos%20federativos%20e%20ferramentas%20de%20an%C3%A1lise%20com%20foco%20na%20administra%C3%A7%C3%A3o%20p%C3%BAblica.%0A%0AOrganizador%3A%20Coletivo%20dados.gov.br%20advocates%0AValor%3A%20Gratuito%0ALink%3A%20https%3A//www.sympla.com.br/&location=Bras%C3%ADlia%2C%20Distrito%20Federal%20%28H%C3%ADbrido%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-conexao-informacao-brasilia-2026';

-- Data Hackers Meetup
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Data%20Hackers%20Meetup&dates=20260625/20260627&details=Encontro%20da%20comunidade%20de%20dados%20com%20talks%2C%20troca%20de%20experi%C3%AAncias%20e%20conte%C3%BAdo%20sobre%20an%C3%A1lise%2C%20engenharia%2C%20ci%C3%AAncia%20de%20dados%20e%20IA.%0A%0AOrganizador%3A%20Data%20Hackers%0AValor%3A%20Gratuito%0ALink%3A%20https%3A//www.meetup.com/data-hackers/&location=Online%2C%20None%20%28Online%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-data-hackers-meetup';

-- FEBRABAN TECH
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=FEBRABAN%20TECH&dates=20260824/20260827&details=O%20maior%20evento%20de%20tecnologia%20banc%C3%A1ria%20e%20financeira%20do%20pa%C3%ADs%2C%20debatendo%20IA%2C%20open%20finance%20e%20seguran%C3%A7a%20cibern%C3%A9tica.%0A%0AOrganizador%3A%20Federa%C3%A7%C3%A3o%20Brasileira%20de%20Bancos%0AValor%3A%20Pago%0ALink%3A%20https%3A//febrabantech.febraban.org.br/&location=S%C3%A3o%20Paulo%2C%20S%C3%A3o%20Paulo%20%28Presencial%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-febraban-tech-2026';

-- Fortaleza UX Lab
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Fortaleza%20UX%20Lab&dates=20260621/20260622&details=Laborat%C3%B3rio%20aberto%20para%20testes%20de%20usabilidade%20com%20p%C3%BAblicos%20perif%C3%A9ricos%20e%20design%20system%20governamental%20simplificado.%0A%0AOrganizador%3A%20UX%20CE%20Coletiva%0AValor%3A%20Gratuito%0ALink%3A%20https%3A//www.sympla.com.br/&location=Fortaleza%2C%20Cear%C3%A1%20%28Presencial%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-fortaleza-ux-lab';

-- Front-End Floripa
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Front-End%20Floripa&dates=20260608/20260610&details=Encontro%20catarinense%20sobre%20HTML%2C%20CSS%2C%20JavaScript%20e%20ecossistema%20front-end%20na%20Ilha%20da%20Magia.%0A%0AOrganizador%3A%20Comunidade%20Front-end%20Floripa%0AValor%3A%20Gratuito%0ALink%3A%20https%3A//www.meetup.com/&location=Florian%C3%B3polis%2C%20Santa%20Catarina%20%28Presencial%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-front-end-floripa';

-- Front in Sampa
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Front%20in%20Sampa&dates=20261107/20261109&details=Evento%20brasileiro%20focado%20em%20front-end%2C%20JavaScript%2C%20acessibilidade%2C%20performance%2C%20design%20e%20carreira.%0A%0AOrganizador%3A%20Front%20in%20Sampa%0AValor%3A%20Pago%0ALink%3A%20https%3A//frontinsampa.com.br&location=S%C3%A3o%20Paulo%2C%20S%C3%A3o%20Paulo%20%28Presencial%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-front-in-sampa-2026';

-- Futurecom
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Futurecom&dates=20261006/20261009&details=Refer%C3%AAncia%20em%20conectividade%20e%20infraestrutura%20digital%20na%20Am%C3%A9rica%20Latina%2C%20no%20S%C3%A3o%20Paulo%20Expo.%20Debates%20sobre%20IA%2C%20cloud%2C%20ciberseguran%C3%A7a%20e%20dados.%0A%0AOrganizador%3A%20Futurecom%0AValor%3A%20Pago%0ALink%3A%20https%3A//www.futurecom.com.br/&location=S%C3%A3o%20Paulo%2C%20S%C3%A3o%20Paulo%20%28Presencial%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-futurecom-2026';

-- Google Developer Groups Meetup Curitiba
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Google%20Developer%20Groups%20Meetup%20Curitiba&dates=20260617/20260619&details=Comunidade%20paranaense%20com%20demos%20de%20Gemini%2C%20GCP%2C%20desenvolvimento%20web%20moderno%20e%20boas%20pr%C3%A1ticas%20de%20carreira.%0A%0AOrganizador%3A%20GDG%20Curitiba%0AValor%3A%20Gratuito%0ALink%3A%20https%3A//gdg.community.dev/&location=Curitiba%2C%20Paran%C3%A1%20%28H%C3%ADbrido%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-gdg-meetup-curitiba';

-- Google Developer Groups Tech Talks: Rio
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Google%20Developer%20Groups%20Tech%20Talks%3A%20Rio&dates=20260603/20260604&details=Meetups%20mensais%20sobre%20Android%2C%20Firebase%2C%20IA%20com%20ferramentas%20Google%20e%20tecnologias%20relacionadas.%0A%0AOrganizador%3A%20GDG%20Rio%20de%20Janeiro%0AValor%3A%20Gratuito%0ALink%3A%20https%3A//gdg.community.dev/gdg-rio-de-janeiro/&location=Rio%20de%20Janeiro%2C%20Rio%20de%20Janeiro%20%28H%C3%ADbrido%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-gdg-tech-talks-rio';

-- Goiás Back-end Nights
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Goi%C3%A1s%20Back-end%20Nights&dates=20260614/20260615&details=Pain%C3%A9is%20r%C3%A1pidos%20sobre%20performance%20de%20APIs%20serverless%20vs%20monolitos%20modulados%20e%20seguran%C3%A7a%20de%20integra%C3%A7%C3%B5es%20p%C3%BAblicas%20estaduais.%0A%0AOrganizador%3A%20Golang%20%26%20Node%20Goi%C3%A1s%0AValor%3A%20Gratuito%0ALink%3A%20https%3A//www.meetup.com/&location=Goi%C3%A2nia%2C%20Goi%C3%A1s%20%28H%C3%ADbrido%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-goias-backend-nights';

-- Hacktoberfest
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Hacktoberfest&dates=20261001/20261102&details=Evento%20global%20de%20contribui%C3%A7%C3%A3o%20para%20projetos%20open%20source.%20%C3%93timo%20para%20portf%C3%B3lio%20e%20networking.%0A%0AOrganizador%3A%20DigitalOcean%0AValor%3A%20Gratuito%0ALink%3A%20https%3A//hacktoberfest.com&location=Online%2C%20None%20%28Online%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-hacktoberfest-2026';

-- HackTown
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=HackTown&dates=20260903/20260908&details=Festival%20que%20transforma%20a%20cidade%20inteira%20em%20ambiente%20de%20aprendizado%2C%20com%20palestras%20e%20workshops%20de%20tecnologia%2C%20criatividade%20e%20carreira.%0A%0AOrganizador%3A%20HackTown%0AValor%3A%20Pago%0ALink%3A%20https%3A//hacktown.com.br/&location=Santa%20Rita%20do%20Sapuca%C3%AD%2C%20Minas%20Gerais%20%28Presencial%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-hacktown-2026';

-- João Pessoa LGPD Builders Forum
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Jo%C3%A3o%20Pessoa%20LGPD%20Builders%20Forum&dates=20270821/20270822&details=F%C3%B3rum%20com%20times%20jur%C3%ADdico-t%C3%A9cnicos%20estaduais%20praticando%20DPIA%20colaborativo%2C%20DPIA%20p%C3%BAblico%20estadual%20LGPD-compliant%20e%20playbook%20multil%C3%ADngue.%0A%0AOrganizador%3A%20PB%20Builders%20Privacy%0AValor%3A%20Pago%20institucional%0ALink%3A%20https%3A//www.gov.br/planalto/&location=Jo%C3%A3o%20Pessoa%2C%20Para%C3%ADba%20%28H%C3%ADbrido%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-joao-pessoa-lgpd-builders-2027';

-- Maranhão Makers & Inclusion Fair
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Maranh%C3%A3o%20Makers%20%26%20Inclusion%20Fair&dates=20270917/20270918&details=Feira%20norte%20com%20zonas%20t%C3%A1teis/braille%20em%20hardware%20aberto%20e%20laborat%C3%B3rio%20de%20audiodescri%C3%A7%C3%A3o%20em%20apps%20governamentais%20maranhenses.%0A%0AOrganizador%3A%20MA%20Inclusion%20Makers%0AValor%3A%20Entrada%20gratuita%20projetos%20estudantis%0ALink%3A%20https%3A//www.sympla.com.br/&location=S%C3%A3o%20Lu%C3%ADs%2C%20Maranh%C3%A3o%20%28Presencial%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-maranhao-makers-inclusion-2027';

-- Mind The Sec
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Mind%20The%20Sec&dates=20260915/20260918&details=O%20maior%20evento%20de%20seguran%C3%A7a%20da%20informa%C3%A7%C3%A3o%20do%20Hemisf%C3%A9rio%20Sul%2C%20no%20Transam%C3%A9rica%20Expo%20Center.%20Trilhas%20de%20ciberseguran%C3%A7a%2C%20privacidade%20e%20compliance.%0A%0AOrganizador%3A%20Mind%20The%20Sec%0AValor%3A%20Pago%0ALink%3A%20https%3A//www.mindthesec.com.br/&location=S%C3%A3o%20Paulo%2C%20S%C3%A3o%20Paulo%20%28Presencial%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-mind-the-sec-2026';

-- Mato Grosso do Sul Responsible AI Sandbox
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Mato%20Grosso%20do%20Sul%20Responsible%20AI%20Sandbox&dates=20261202/20261204&details=Laborat%C3%B3rio%20com%20governan%C3%A7a%20de%20modelos%20aplicados%20ao%20Pantanal%20Sul%20e%20estudos%20reproduc%C3%ADveis%20sob%20%C3%A9tica%20territorial.%0A%0AOrganizador%3A%20Parque%20Tec%20Bio%20MS%0AValor%3A%20Pago%20institucional%0ALink%3A%20https%3A//aws.amazon.com/pt/events/&location=Campo%20Grande%2C%20Mato%20Grosso%20do%20Sul%20%28Presencial%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-ms-responsible-ai-sandbox-2026';

-- Natal.js
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Natal.js&dates=20260620/20260622&details=Meetup%20nordestino%20de%20JavaScript%20e%20ecossistema%20web%3A%20projetos%20livres%2C%20vagas%20remotas%20e%20oficinas%20colaborativas.%0A%0AOrganizador%3A%20Natal.js%0AValor%3A%20Gratuito%0ALink%3A%20https%3A//nataljs.github.io/&location=Natal%2C%20Rio%20Grande%20do%20Norte%20%28Presencial%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-natal-js';

-- Pará Geek Connect
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Par%C3%A1%20Geek%20Connect&dates=20261003/20261004&details=Mostra%20amaz%C3%B4nica%20de%20makers%2C%20projetos%20indie%20e%20tecnologia%20inclusiva%20com%20vagas%20paralelas%20para%20periferias%20metropolitanas.%0A%0AOrganizador%3A%20Coletivos%20Par%C3%A1%20Tech%0AValor%3A%20Gratuito%20na%20comunidade%0ALink%3A%20https%3A//www.sympla.com.br/&location=Bel%C3%A9m%2C%20Par%C3%A1%20%28Presencial%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-para-geek-connect-2026';

-- Piauí Makers & IA
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Piau%C3%AD%20Makers%20%26%20IA&dates=20270312/20270314&details=Feira%20com%20laborat%C3%B3rio%20de%20rob%C3%B3tica%20l%C3%B3gica%20usando%20sucata%20eletr%C3%B4nica%20e%20oficinas%20de%20IA%20generativa%20acess%C3%ADvel%20em%20escolas%20estaduais.%0A%0AOrganizador%3A%20Rede%20Makers%20Piau%C3%AD%0AValor%3A%20Gratuito%20p%C3%BAblico%20estudantil%0ALink%3A%20https%3A//www.sympla.com.br/&location=Teresina%2C%20Piau%C3%AD%20%28H%C3%ADbrido%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-piaui-makers-ia-2027';

-- Python Brasil
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Python%20Brasil&dates=20261014/20261020&details=Maior%20confer%C3%AAncia%20de%20Python%20da%20Am%C3%A9rica%20Latina.%20Palestras%2C%20tutoriais%20e%20sprints%20de%20c%C3%B3digo.%0A%0AOrganizador%3A%20Associa%C3%A7%C3%A3o%20Python%20Brasil%0AValor%3A%20Pago%0ALink%3A%20https%3A//pythonbrasil.org.br&location=Florian%C3%B3polis%2C%20Santa%20Catarina%20%28H%C3%ADbrido%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-python-brasil-2026';

-- Python Nordeste: Trilhas em Salvador
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Python%20Nordeste%3A%20Trilhas%20em%20Salvador&dates=20261106/20261108&details=Encontros%20regionais%20alinhados%20%C3%A0%20comunidade%20Python%20Brasil%3A%20tutoriais%2C%20mesas%20LGBTQIA%2B%20em%20tech%20e%20mostra%20de%20projetos%20baianos.%0A%0AOrganizador%3A%20Python%20Nordeste%20%2B%20Afiliadas%0AValor%3A%20Pago%20solid%C3%A1rio%0ALink%3A%20https%3A//python.org.br/&location=Salvador%2C%20Bahia%20%28H%C3%ADbrido%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-python-nordeste-salvador-2026';

-- QCon São Paulo
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=QCon%20S%C3%A3o%20Paulo&dates=20260914/20260919&details=Evento%20para%20pessoas%20desenvolvedoras%2C%20arquitetas%20e%20lideran%C3%A7as%20t%C3%A9cnicas%20com%20foco%20em%20sistemas%20em%20escala%20e%20engenharia%20moderna.%0A%0AOrganizador%3A%20InfoQ%20/%20QCon%0AValor%3A%20Pago%0ALink%3A%20https%3A//qconsf.com/sao-paulo&location=S%C3%A3o%20Paulo%2C%20S%C3%A3o%20Paulo%20%28Presencial%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-qcon-sao-paulo-2026';

-- React SP Meetup
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=React%20SP%20Meetup&dates=20260610/20260612&details=Encontro%20mensal%20da%20comunidade%20React%20de%20S%C3%A3o%20Paulo.%20Palestras%20t%C3%A9cnicas%20e%20networking.%0A%0AOrganizador%3A%20Comunidade%20React%20SP%0AValor%3A%20Gratuito%0ALink%3A%20https%3A//www.meetup.com/pt-BR/reactjs-sao-paulo/&location=S%C3%A3o%20Paulo%2C%20S%C3%A3o%20Paulo%20%28H%C3%ADbrido%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-react-sp-meetup';

-- Rec'n'Play
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Rec%27n%27Play&dates=20261111/20261115&details=O%20maior%20festival%20gratuito%20de%20tecnologia%20e%20inova%C3%A7%C3%A3o%20do%20Brasil%2C%20no%20centro%20hist%C3%B3rico%20do%20Recife.%20Palestras%2C%20workshops%2C%20oficinas%20e%20atra%C3%A7%C3%B5es%20culturais%2C%20com%20inscri%C3%A7%C3%A3o%20gratuita.%0A%0AOrganizador%3A%20Porto%20Digital%20e%20Sebrae%20Pernambuco%0AValor%3A%20Gratuito%0ALink%3A%20https%3A//recnplay.pe/&location=Recife%2C%20Pernambuco%20%28Presencial%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-recnplay-2026';

-- Startup Summit
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Startup%20Summit&dates=20260826/20260829&details=Principal%20encontro%20brasileiro%20de%20startups%2C%20no%20Centrosul.%20Tr%C3%AAs%20dias%20de%20palestras%2C%20investidores%20e%20trilhas%20sobre%20produto%20digital%20e%20tecnologia.%0A%0AOrganizador%3A%20Sebrae%20SC%20e%20Acate%0AValor%3A%20Pago%0ALink%3A%20https%3A//www.startupsummit.com.br/&location=Florian%C3%B3polis%2C%20Santa%20Catarina%20%28Presencial%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-startup-summit-2026';

-- Tchelinux Porto Alegre
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Tchelinux%20Porto%20Alegre&dates=20260705/20260707&details=Eventos%20gratuitos%20sobre%20software%20livre%20e%20cultura%20hacker%20no%20Rio%20Grande%20do%20Sul%3A%20palestras%20t%C3%A9cnicas%20e%20troca%20entre%20comunidades.%0A%0AOrganizador%3A%20Tchelinux%0AValor%3A%20Gratuito%0ALink%3A%20https%3A//tchelinux.org/&location=Porto%20Alegre%2C%20Rio%20Grande%20do%20Sul%20%28Presencial%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-tchelinux-porto-alegre';

-- The Developer's Conference (TDC)
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=The%20Developer%27s%20Conference%20%28TDC%29&dates=20260820/20260825&details=Confer%C3%AAncia%20brasileira%20com%20trilhas%20t%C3%A9cnicas%20para%20desenvolvimento%2C%20dados%2C%20produto%2C%20arquitetura%2C%20carreira%20e%20lideran%C3%A7a.%0A%0AOrganizador%3A%20TDC%0AValor%3A%20Pago%0ALink%3A%20https%3A//thedevconf.com&location=S%C3%A3o%20Paulo%20/%20Online%2C%20S%C3%A3o%20Paulo%20%28H%C3%ADbrido%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-tdc-sao-paulo-2026';

-- Tocantins Code & Cidades
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Tocantins%20Code%20%26%20Cidades&dates=20270721/20270722&details=Marathon%20c%C3%ADvico%20usando%20APIs%20estaduais%3A%20mobilidade%20ciclovi%C3%A1ria%20inteligente%2C%20energia%20distribu%C3%ADda%20e%20telemedicina%20territorial.%0A%0AOrganizador%3A%20Secretaria%20Parceira%20TI%20Tocantins%0AValor%3A%20Gratuito%0ALink%3A%20https%3A//gov.br/pt-br/&location=Palmas%2C%20Tocantins%20%28H%C3%ADbrido%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-tocantins-code-cidades-2027';

-- UX Conf BR
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=UX%20Conf%20BR&dates=20260901/20260903&details=Maior%20confer%C3%AAncia%20de%20UX%20do%20Brasil.%20Palestras%20com%20profissionais%20nacionais%20e%20internacionais.%0A%0AOrganizador%3A%20UX%20Conf%0AValor%3A%20Pago%0ALink%3A%20https%3A//uxconf.com.br&location=S%C3%A3o%20Paulo%2C%20S%C3%A3o%20Paulo%20%28Presencial%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-ux-conf-br-2026';

-- Women in Tech Summit
update public.external_events
   set is_published = true,
       published_at = coalesce(published_at, now()),
       calendar_url = case
         when starts_on is null then null
         else coalesce(calendar_url, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Women%20in%20Tech%20Summit&dates=20260615/20260617&details=Eventos%20focados%20em%20empoderar%20mulheres%20na%20tecnologia.%20Palestras%2C%20mentorias%20e%20networking.%0A%0AOrganizador%3A%20Diversas%20organiza%C3%A7%C3%B5es%0AValor%3A%20Gratuito%20e%20pago%0ALink%3A%20https%3A//www.linkedin.com/search/results/events/%3Fkeywords%3Dwomen%2Bin%2Btech&location=S%C3%A3o%20Paulo%20/%20Online%2C%20S%C3%A3o%20Paulo%20%28H%C3%ADbrido%29')
       end
 where source = 'legado-site'
   and external_id = 'legado-women-in-tech-summit';

-- ---------------------------------------------------------------------------
-- 2) FAVORITOS: a chave do card muda de id estatico para external_id.
-- ---------------------------------------------------------------------------
-- Favorito de evento e SERVER-SIDE (public.user_bookmarks, resource_type
-- 'evento', resource_id = id do card), nao localStorage: o cache local existe,
-- mas e reconstruido de /api/bookmarks. Sem esta migracao, todo favorito de
-- evento ja salvo apontaria para um id que deixou de existir, e o coracao
-- apareceria vazio para quem favoritou.
--
-- Os 5 eventos sem sentinela nao entram aqui: nao ha destino para eles. Quem
-- favoritou um dos 5 fica com uma linha orfa, que a UI ignora.

update public.user_bookmarks set resource_id = 'legado-aracaju-qa-test-craft'
 where resource_type = 'evento' and resource_id = 'aracaju-qa-nights';
update public.user_bookmarks set resource_id = 'legado-para-geek-connect-2026'
 where resource_type = 'evento' and resource_id = 'belem-geek-festival';
update public.user_bookmarks set resource_id = 'legado-bh-tech-meetup'
 where resource_type = 'evento' and resource_id = 'bh-tech-talks';
update public.user_bookmarks set resource_id = 'legado-brasilia-web3-builders'
 where resource_type = 'evento' and resource_id = 'brasilia-blocks';
update public.user_bookmarks set resource_id = 'legado-campus-party-brasil'
 where resource_type = 'evento' and resource_id = 'campus-party';
update public.user_bookmarks set resource_id = 'legado-conexao-informacao-brasilia-2026'
 where resource_type = 'evento' and resource_id = 'conexao-dados-df';
update public.user_bookmarks set resource_id = 'legado-data-hackers-meetup'
 where resource_type = 'evento' and resource_id = 'data-hackers-meetup';
update public.user_bookmarks set resource_id = 'legado-febraban-tech-2026'
 where resource_type = 'evento' and resource_id = 'febraban-tech';
update public.user_bookmarks set resource_id = 'legado-fortaleza-ux-lab'
 where resource_type = 'evento' and resource_id = 'fortaleza-ux-lab';
update public.user_bookmarks set resource_id = 'legado-front-end-floripa'
 where resource_type = 'evento' and resource_id = 'front-floripa-meet';
update public.user_bookmarks set resource_id = 'legado-front-in-sampa-2026'
 where resource_type = 'evento' and resource_id = 'front-in-sampa';
update public.user_bookmarks set resource_id = 'legado-futurecom-2026'
 where resource_type = 'evento' and resource_id = 'futurecom';
update public.user_bookmarks set resource_id = 'legado-gdg-meetup-curitiba'
 where resource_type = 'evento' and resource_id = 'gdg-curitiba';
update public.user_bookmarks set resource_id = 'legado-gdg-tech-talks-rio'
 where resource_type = 'evento' and resource_id = 'gdg-rio-tech-talks';
update public.user_bookmarks set resource_id = 'legado-goias-backend-nights'
 where resource_type = 'evento' and resource_id = 'goiania-backend';
update public.user_bookmarks set resource_id = 'legado-hacktoberfest-2026'
 where resource_type = 'evento' and resource_id = 'hacktoberfest';
update public.user_bookmarks set resource_id = 'legado-hacktown-2026'
 where resource_type = 'evento' and resource_id = 'hacktown';
update public.user_bookmarks set resource_id = 'legado-joao-pessoa-lgpd-builders-2027'
 where resource_type = 'evento' and resource_id = 'joao-pessoa-privacy-forum-pb';
update public.user_bookmarks set resource_id = 'legado-amapa-edge-satelites-2027'
 where resource_type = 'evento' and resource_id = 'macapa-edge-lab';
update public.user_bookmarks set resource_id = 'legado-react-sp-meetup'
 where resource_type = 'evento' and resource_id = 'meetup-react';
update public.user_bookmarks set resource_id = 'legado-mind-the-sec-2026'
 where resource_type = 'evento' and resource_id = 'mindthesec-sp';
update public.user_bookmarks set resource_id = 'legado-natal-js'
 where resource_type = 'evento' and resource_id = 'natal-js';
update public.user_bookmarks set resource_id = 'legado-tocantins-code-cidades-2027'
 where resource_type = 'evento' and resource_id = 'palmas-hack-city';
update public.user_bookmarks set resource_id = 'legado-ms-responsible-ai-sandbox-2026'
 where resource_type = 'evento' and resource_id = 'pantanal-ai-lab-ms';
update public.user_bookmarks set resource_id = 'legado-python-brasil-2026'
 where resource_type = 'evento' and resource_id = 'python-brasil';
update public.user_bookmarks set resource_id = 'legado-qcon-sao-paulo-2026'
 where resource_type = 'evento' and resource_id = 'qcon-sao-paulo';
update public.user_bookmarks set resource_id = 'legado-recnplay-2026'
 where resource_type = 'evento' and resource_id = 'rec-n-play';
update public.user_bookmarks set resource_id = 'legado-acre-green-stack-sprint-2027'
 where resource_type = 'evento' and resource_id = 'rio-branco-green-stack';
update public.user_bookmarks set resource_id = 'legado-python-nordeste-salvador-2026'
 where resource_type = 'evento' and resource_id = 'salvador-python';
update public.user_bookmarks set resource_id = 'legado-maranhao-makers-inclusion-2027'
 where resource_type = 'evento' and resource_id = 'sao-luis-maker-fair-ma';
update public.user_bookmarks set resource_id = 'legado-startup-summit-2026'
 where resource_type = 'evento' and resource_id = 'startup-summit';
update public.user_bookmarks set resource_id = 'legado-tchelinux-porto-alegre'
 where resource_type = 'evento' and resource_id = 'tchelinux-poa';
update public.user_bookmarks set resource_id = 'legado-tdc-sao-paulo-2026'
 where resource_type = 'evento' and resource_id = 'tdc';
update public.user_bookmarks set resource_id = 'legado-piaui-makers-ia-2027'
 where resource_type = 'evento' and resource_id = 'teresina-ai-fair';
update public.user_bookmarks set resource_id = 'legado-ux-conf-br-2026'
 where resource_type = 'evento' and resource_id = 'ux-conf-br';
update public.user_bookmarks set resource_id = 'legado-women-in-tech-summit'
 where resource_type = 'evento' and resource_id = 'women-in-tech';

COMMIT;

-- ---------------------------------------------------------------------------
-- VERIFICACOES. Rodar DEPOIS do COMMIT e conferir os numeros.
-- ---------------------------------------------------------------------------

-- Esperado: 36. Menos que isso significa que algum external_id nao casou, e a
-- pagina vai perder esses eventos no corte do estatico.
select count(*) as sentinelas_publicadas
  from public.external_events
 where source = 'legado-site' and is_published = true;

-- Esperado: 0. Qualquer linha aqui e sentinela que ficou para tras.
select external_id, title
  from public.external_events
 where source = 'legado-site' and is_published = false
 order by external_id;

-- Total que a pagina passa a exibir (mesmo predicado da rota
-- /api/content/eventos). Serve de linha de base para o smoke pos-deploy.
select count(*) as exibiveis_total
  from public.external_events
 where is_published = true
   and deleted_at is null
   and (starts_on >= current_date or starts_on is null);

-- Quantas das 36 ficaram sem calendar_url (esperado: as que nao tem starts_on).
select count(*) as sentinelas_sem_calendar_url
  from public.external_events
 where source = 'legado-site' and calendar_url is null;
