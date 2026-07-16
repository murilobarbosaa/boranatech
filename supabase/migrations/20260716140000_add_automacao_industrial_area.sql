-- Adiciona a area Automacao Industrial ao catalogo na tabela `areas`,
-- alinhando com o fallback `areasTI` (client/src/lib/data.ts). Cobre a
-- automacao de fabrica/OT (CLP, SCADA, sensores); a area complementar
-- "Automacao e RPA" segue existindo e cobre automacao de software.
--
-- Salarios pesquisados no mercado BR: CAGED/Novo CAGED via salario.com.br
-- (2026) e Glassdoor. Cursos gratuitos sao recursos reais (SENAI EAD,
-- OpenPLC Project).
--
-- Ordem: a area entra no fim (sort_order 23), sem precisar de shift, pois o
-- maximo atual e 22 (iot). ON CONFLICT (slug) DO NOTHING garante
-- idempotencia: rodar a migration mais de uma vez nao duplica nem altera.

BEGIN;

INSERT INTO public.areas (
  slug, name, short_description, full_description, daily_tasks, profile_indicated,
  skills, tools, average_salary, free_courses, initial_roadmap, projects,
  essential_terms, initial_tips, roles, tag, tag_class, icon, color,
  is_pro, is_published, sort_order
) VALUES
(
  'automacao-industrial',
  'Automação Industrial',
  'Programa e mantém as máquinas e sistemas que fazem as fábricas funcionarem sozinhas.',
  'O profissional de automação industrial faz a ponte entre o mundo físico das fábricas e a tecnologia. Ele programa CLPs (controladores lógicos programáveis), configura sensores, robôs e sistemas de supervisão que controlam linhas de produção inteiras. É uma área que mistura elétrica, eletrônica e programação, e está no coração da indústria 4.0.',
  '["Programar e ajustar lógica de CLPs (ladder, por exemplo)","Configurar telas de supervisão (SCADA e IHM)","Instalar e calibrar sensores e atuadores","Diagnosticar falhas em máquinas e painéis elétricos","Documentar projetos e diagramas elétricos"]'::jsonb,
  'Gosta de ver a tecnologia funcionando no mundo físico, curte resolver problemas práticos e tem interesse por elétrica, eletrônica e lógica. Ideal para quem prefere chão de fábrica a escritório.',
  '["Programação de CLP (ladder e texto estruturado)","Elétrica e eletrônica básica","Redes industriais (Profinet, Modbus)","Sistemas SCADA e IHM","Leitura de diagramas elétricos","Instrumentação e sensores"]'::jsonb,
  '["TIA Portal (Siemens)","CoDeSys","OpenPLC (gratuito)","Elipse SCADA","AutoCAD Electrical","Multímetro e osciloscópio"]'::jsonb,
  '{"label":"R$ 2.800 a R$ 4.200 (técnico júnior)","difficulty":3}'::jsonb,
  '["SENAI EAD: Lógica de Programação (gratuito)","SENAI EAD: Metrologia (gratuito)","OpenPLC Project: simulador gratuito de CLP para praticar"]'::jsonb,
  '["Aprender elétrica e eletrônica básica","Estudar lógica de programação","Aprender programação de CLP em ladder","Praticar com simulador (OpenPLC ou CoDeSys)","Estudar redes industriais e sensores","Montar projetos práticos e buscar curso técnico ou estágio"]'::jsonb,
  '["Semáforo automatizado em simulador de CLP","Esteira transportadora simulada com sensores","Painel de supervisão simples em SCADA gratuito"]'::jsonb,
  '["CLP","SCADA","IHM","Ladder","Sensor e atuador","Indústria 4.0"]'::jsonb,
  'Diferente das áreas puramente de software, aqui um curso técnico (SENAI, IFs) pesa muito na contratação. Comece pela lógica e pelo simulador gratuito, mas planeje uma formação técnica ou tecnóloga.',
  '["Técnico em Automação Industrial","Tecnólogo em Automação Industrial","Programador de CLP","Técnico em Mecatrônica","Engenheiro de Controle e Automação"]'::jsonb,
  'Automação Industrial',
  'tag-automacao-industrial',
  '🏭',
  NULL,
  false,
  true,
  23
)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
