export interface GameTech {
  game: string;
  engine: string;
  language: string;
  made: string;
  source: string;
  year?: number;
}

export const gamesTech: GameTech[] = [
  {
    "game": "Among Us",
    "engine": "Unity",
    "language": "C#",
    "made": "Feito na Unity em C# pela InnerSloth, virou fenomeno so dois anos depois do lancamento.",
    "source": "https://en.wikipedia.org/wiki/Among_Us",
    "year": 2018
  },
  {
    "game": "Angry Birds",
    "engine": "Box2D (SDL)",
    "language": "C++",
    "made": "A Rovio usou a biblioteca de fisica Box2D com SDL para a fisica das aves, e remakes depois migraram para Unity.",
    "source": "https://en.wikipedia.org/wiki/Angry_Birds_(video_game)",
    "year": 2009
  },
  {
    "game": "Apex Legends",
    "engine": "Source (modified)",
    "language": "C++",
    "made": "A Respawn adaptou uma versao modificada do motor Source (em C++) para mapas grandes e longas distancias de visao.",
    "source": "https://en.wikipedia.org/wiki/Apex_Legends",
    "year": 2019
  },
  {
    "game": "Baba Is You",
    "engine": "Multimedia Fusion 2",
    "language": "Lua",
    "made": "Arvi Teikari fez o puzzle na Multimedia Fusion 2, com a logica de regras escrita em Lua.",
    "source": "https://en.wikipedia.org/wiki/Baba_Is_You",
    "year": 2019
  },
  {
    "game": "Battlefield 1",
    "engine": "Frostbite 3",
    "language": "C++",
    "made": "A DICE usou o motor Frostbite 3 (escrito em C++) para a destruicao de cenarios e a escala da Primeira Guerra.",
    "source": "https://en.wikipedia.org/wiki/Battlefield_1",
    "year": 2016
  },
  {
    "game": "Beat Saber",
    "engine": "Unity",
    "language": "C#",
    "made": "A Beat Games construiu na Unity (C#) este sucesso de VR onde voce corta blocos no ritmo da musica.",
    "source": "https://en.wikipedia.org/wiki/Beat_Saber",
    "year": 2019
  },
  {
    "game": "Celeste",
    "engine": "Microsoft XNA",
    "language": "C#",
    "made": "Construido sobre o framework Microsoft XNA em C#, com fisica de plataforma super precisa.",
    "source": "https://en.wikipedia.org/wiki/Celeste_(video_game)",
    "year": 2018
  },
  {
    "game": "Cities: Skylines",
    "engine": "Unity",
    "language": "C#",
    "made": "A finlandesa Colossal Order fez na Unity (C#) este simulador de cidades aberto a mods da comunidade.",
    "source": "https://en.wikipedia.org/wiki/Cities:_Skylines",
    "year": 2015
  },
  {
    "game": "Counter-Strike: Global Offensive",
    "engine": "Source",
    "language": "C++",
    "made": "A Valve desenvolveu o FPS competitivo no seu motor Source, escrito em C++.",
    "source": "https://en.wikipedia.org/wiki/Counter-Strike:_Global_Offensive",
    "year": 2012
  },
  {
    "game": "Cuphead",
    "engine": "Unity",
    "language": "C#",
    "made": "Comecou no XNA e migrou para a Unity (C#), com animacao desenhada a mao quadro a quadro.",
    "source": "https://en.wikipedia.org/wiki/Cuphead",
    "year": 2017
  },
  {
    "game": "Cyberpunk 2077",
    "engine": "REDengine 4",
    "language": "C++",
    "made": "A CD Projekt Red desenvolveu o RPG futurista no REDengine 4, a quarta versao do seu motor proprio em C++.",
    "source": "https://en.wikipedia.org/wiki/Cyberpunk_2077",
    "year": 2020
  },
  {
    "game": "Dead Cells",
    "engine": "Heaps",
    "language": "Haxe",
    "made": "A Motion Twin usou a engine Heaps e a propria linguagem Haxe, criada por eles para rodar em qualquer plataforma.",
    "source": "https://mcvuk.com/development-news/when-we-made-dead-cells/",
    "year": 2018
  },
  {
    "game": "Disco Elysium",
    "engine": "Unity",
    "language": "C#",
    "made": "RPG de muito texto construido na Unity (C#), com dialogos escritos como um romance.",
    "source": "https://en.wikipedia.org/wiki/Disco_Elysium",
    "year": 2019
  },
  {
    "game": "Doom",
    "engine": "id Tech 6",
    "language": "C++",
    "made": "A id Software criou o reboot no seu motor proprio id Tech 6 (escrito em C++), com a API Vulkan para alto desempenho.",
    "source": "https://en.wikipedia.org/wiki/Doom_(2016_video_game)",
    "year": 2016
  },
  {
    "game": "Dota 2",
    "engine": "Source 2",
    "language": "C++",
    "made": "A Valve lancou o MOBA no motor Source e, em 2015, o portou para o Source 2 (em C++), sendo o primeiro a usa-lo.",
    "source": "https://en.wikipedia.org/wiki/Dota_2",
    "year": 2013
  },
  {
    "game": "EA Sports FC 24",
    "engine": "Frostbite 3",
    "language": "C++",
    "made": "A EA Sports construiu o jogo de futebol no motor Frostbite 3, escrito em C++.",
    "source": "https://en.wikipedia.org/wiki/EA_Sports_FC_24",
    "year": 2023
  },
  {
    "game": "Enter the Gungeon",
    "engine": "Unity",
    "language": "C#",
    "made": "Bullet hell roguelike feito na Unity em C# pelo estudio Dodge Roll.",
    "source": "https://en.wikipedia.org/wiki/Enter_the_Gungeon",
    "year": 2016
  },
  {
    "game": "Factorio",
    "engine": "Custom engine",
    "language": "C++",
    "made": "A Wube Software construiu uma engine propria em C++ em Praga, com a biblioteca Allegro e Lua para os mods.",
    "source": "https://forums.factorio.com/viewtopic.php?t=46670",
    "year": 2020
  },
  {
    "game": "Final Fantasy VII Remake",
    "engine": "Unreal Engine 4",
    "language": "C++",
    "made": "Em vez de criar um motor novo, a Square Enix licenciou a Unreal Engine 4 (em C++) para recriar o classico de 1997.",
    "source": "https://en.wikipedia.org/wiki/Final_Fantasy_VII_Remake",
    "year": 2020
  },
  {
    "game": "Fortnite",
    "engine": "Unreal Engine 4",
    "language": "C++",
    "made": "A Epic Games construiu o jogo na Unreal Engine 4 (criada por ela mesma em C++), com partes de logica usando Blueprints e, depois, Verse.",
    "source": "https://en.wikipedia.org/wiki/Fortnite",
    "year": 2017
  },
  {
    "game": "Gears of War",
    "engine": "Unreal Engine 3",
    "language": "C++",
    "made": "A Epic Games construiu o tiro em terceira pessoa na sua propria Unreal Engine 3, escrita em C++.",
    "source": "https://en.wikipedia.org/wiki/Gears_of_War_(video_game)",
    "year": 2006
  },
  {
    "game": "Genshin Impact",
    "engine": "Unity",
    "language": "C#",
    "made": "A miHoYo desenvolveu na Unity, programando em C#, para rodar o mesmo mundo aberto em celular, console e PC.",
    "source": "https://en.wikipedia.org/wiki/Genshin_Impact",
    "year": 2020
  },
  {
    "game": "Grand Theft Auto V",
    "engine": "RAGE (Rockstar Advanced Game Engine)",
    "language": "C++",
    "made": "A Rockstar usou seu motor proprio RAGE (em C++), combinado com a fisica Euphoria e a biblioteca Bullet.",
    "source": "https://en.wikipedia.org/wiki/Grand_Theft_Auto_V",
    "year": 2013
  },
  {
    "game": "Half-Life 2",
    "engine": "Source",
    "language": "C++",
    "made": "A Valve criou o jogo junto com seu motor Source (escrito em C++), pioneiro em fisica realista na epoca.",
    "source": "https://en.wikipedia.org/wiki/Half-Life_2",
    "year": 2004
  },
  {
    "game": "Hearthstone",
    "engine": "Unity",
    "language": "C#",
    "made": "A Blizzard usou a Unity (C#) para que o jogo de cartas rodasse tanto no PC quanto em celulares.",
    "source": "https://en.wikipedia.org/wiki/Hearthstone",
    "year": 2014
  },
  {
    "game": "Hellblade: Senua's Sacrifice",
    "engine": "Unreal Engine 4",
    "language": "C++",
    "made": "A Ninja Theory criou o jogo na Unreal Engine 4 (base em C++), com captura de movimento e atuacao em tempo real.",
    "source": "https://en.wikipedia.org/wiki/Hellblade:_Senua%27s_Sacrifice",
    "year": 2017
  },
  {
    "game": "Hollow Knight",
    "engine": "Unity",
    "language": "C#",
    "made": "Trocou a Stencyl pela Unity durante o desenvolvimento, sendo programado em C#.",
    "source": "https://en.wikipedia.org/wiki/Hollow_Knight",
    "year": 2017
  },
  {
    "game": "Hotline Miami",
    "engine": "GameMaker",
    "language": "GameMaker Language (GML)",
    "made": "Foi feito na GameMaker em cerca de nove meses, usando GameMaker Language (GML) para o caos top-down.",
    "source": "https://en.wikipedia.org/wiki/Hotline_Miami",
    "year": 2012
  },
  {
    "game": "Hyper Light Drifter",
    "engine": "GameMaker Studio",
    "language": "GameMaker Language (GML)",
    "made": "O visual pixelado nasceu na GameMaker Studio, programado em GameMaker Language (GML).",
    "source": "https://en.wikipedia.org/wiki/Hyper_Light_Drifter",
    "year": 2016
  },
  {
    "game": "Katana Zero",
    "engine": "GameMaker Studio 2",
    "language": "GameMaker Language (GML)",
    "made": "Justin Stander levou seis anos fazendo na GameMaker Studio 2, com logica em GameMaker Language (GML).",
    "source": "https://en.wikipedia.org/wiki/Katana_Zero",
    "year": 2019
  },
  {
    "game": "Kerbal Space Program",
    "engine": "Unity",
    "language": "C#",
    "made": "O estudio mexicano Squad construiu na Unity (C#) este simulador de foguetes com fisica orbital.",
    "source": "https://en.wikipedia.org/wiki/Kerbal_Space_Program",
    "year": 2015
  },
  {
    "game": "Minecraft: Java Edition",
    "engine": "Custom engine (LWJGL)",
    "language": "Java",
    "made": "Markus (Notch) Persson criou em Java, e a versao 1.0 saiu em 2011 depois de anos em desenvolvimento aberto.",
    "source": "https://en.wikipedia.org/wiki/Minecraft",
    "year": 2011
  },
  {
    "game": "Monument Valley",
    "engine": "Unity",
    "language": "C#",
    "made": "A Ustwo Games usou a Unity (C#) para criar os quebra-cabecas de ilusoes de otica inspirados em Escher.",
    "source": "https://en.wikipedia.org/wiki/Monument_Valley_(video_game)",
    "year": 2014
  },
  {
    "game": "Ori and the Blind Forest",
    "engine": "Unity",
    "language": "C#",
    "made": "A Moon Studios, espalhada por varios paises, construiu na Unity (C#) este metroidvania de visual pintado a mao.",
    "source": "https://en.wikipedia.org/wiki/Ori_and_the_Blind_Forest",
    "year": 2015
  },
  {
    "game": "Papers, Please",
    "engine": "Haxe (NME framework)",
    "language": "Haxe",
    "made": "Lucas Pope usou a linguagem Haxe com o framework NME para o tenso simulador de fiscal de fronteira.",
    "source": "https://en.wikipedia.org/wiki/Papers,_Please",
    "year": 2013
  },
  {
    "game": "Pokemon Go",
    "engine": "Unity",
    "language": "C#",
    "made": "A Niantic fez na Unity (C#), unindo mapas e realidade aumentada para colocar Pokemon no mundo real.",
    "source": "https://en.wikipedia.org/wiki/Pok%C3%A9mon_Go",
    "year": 2016
  },
  {
    "game": "Portal 2",
    "engine": "Source",
    "language": "C++",
    "made": "A Valve construiu o quebra-cabeca de portais no seu motor Source, escrito em C++.",
    "source": "https://en.wikipedia.org/wiki/Portal_2",
    "year": 2011
  },
  {
    "game": "PUBG: Battlegrounds",
    "engine": "Unreal Engine 4",
    "language": "C++",
    "made": "Em vez de um motor proprio, a equipe licenciou a Unreal Engine 4 (escrita em C++) para acelerar o desenvolvimento do battle royale.",
    "source": "https://en.wikipedia.org/wiki/PUBG:_Battlegrounds",
    "year": 2017
  },
  {
    "game": "Quake",
    "engine": "Quake engine",
    "language": "C",
    "made": "Feito pela id Software em C (com Assembly para renderizacao), trouxe 3D real e o modding via QuakeC para a comunidade.",
    "source": "https://en.wikipedia.org/wiki/Quake_engine",
    "year": 1996
  },
  {
    "game": "Red Dead Redemption 2",
    "engine": "RAGE (Rockstar Advanced Game Engine)",
    "language": "C++",
    "made": "A Rockstar construiu o faroeste de mundo aberto no seu motor proprio RAGE, escrito em C++.",
    "source": "https://en.wikipedia.org/wiki/Red_Dead_Redemption_2",
    "year": 2018
  },
  {
    "game": "RimWorld",
    "engine": "Unity",
    "language": "C#",
    "made": "Tynan Sylvester e a Ludeon Studios fizeram na Unity (C#) este simulador de colonia movido a historias.",
    "source": "https://en.wikipedia.org/wiki/RimWorld",
    "year": 2018
  },
  {
    "game": "Risk of Rain",
    "engine": "GameMaker: Studio",
    "language": "GameMaker Language (GML)",
    "made": "Dois estudantes criaram o roguelike na GameMaker: Studio, usando GameMaker Language (GML).",
    "source": "https://en.wikipedia.org/wiki/Risk_of_Rain",
    "year": 2013
  },
  {
    "game": "Rocket League",
    "engine": "Unreal Engine 3",
    "language": "C++",
    "made": "A Psyonix usou a Unreal Engine 3 (escrita em C++) para juntar fisica de carros e futebol em partidas online.",
    "source": "https://en.wikipedia.org/wiki/Rocket_League",
    "year": 2015
  },
  {
    "game": "RollerCoaster Tycoon",
    "engine": "Custom engine",
    "language": "Assembly",
    "made": "Chris Sawyer escreveu sozinho 99 por cento do codigo em Assembly x86, e so 1 por cento em C, um feito raro ate para a epoca.",
    "source": "https://en.wikipedia.org/wiki/RollerCoaster_Tycoon_(video_game)",
    "year": 1999
  },
  {
    "game": "Sea of Thieves",
    "engine": "Unreal Engine 4",
    "language": "C++",
    "made": "A Rare deixou seu motor proprio e adotou a Unreal Engine 4 (em C++) para o mundo de pirataria multiplayer.",
    "source": "https://en.wikipedia.org/wiki/Sea_of_Thieves",
    "year": 2018
  },
  {
    "game": "Slay the Spire",
    "engine": "libGDX",
    "language": "Java",
    "made": "Feito no framework libGDX em Java, escolhido por rodar em Windows, macOS e Linux.",
    "source": "https://en.wikipedia.org/wiki/Slay_the_Spire",
    "year": 2019
  },
  {
    "game": "Spelunky",
    "engine": "GameMaker",
    "language": "GameMaker Language (GML)",
    "made": "Derek Yu fez a versao original na GameMaker, em GameMaker Language (GML), com fases geradas aleatoriamente.",
    "source": "https://en.wikipedia.org/wiki/Spelunky",
    "year": 2008
  },
  {
    "game": "Stardew Valley",
    "engine": "MonoGame (XNA)",
    "language": "C#",
    "made": "Eric Barone programou tudo sozinho em C# no framework XNA (depois migrado para MonoGame).",
    "source": "https://en.wikipedia.org/wiki/Stardew_Valley",
    "year": 2016
  },
  {
    "game": "Street Fighter 6",
    "engine": "RE Engine",
    "language": "C#",
    "made": "A Capcom usou seu motor proprio RE Engine, que roda a logica de jogo em C# sobre uma maquina virtual interna.",
    "source": "https://en.wikipedia.org/wiki/Street_Fighter_6",
    "year": 2023
  },
  {
    "game": "Subnautica",
    "engine": "Unity",
    "language": "C#",
    "made": "A Unknown Worlds trocou sua engine antiga pela Unity (C#) para criar o oceano alienigena do jogo.",
    "source": "https://en.wikipedia.org/wiki/Subnautica",
    "year": 2018
  },
  {
    "game": "Super Mario 64",
    "engine": "Custom engine",
    "language": "C",
    "made": "A Nintendo EAD escreveu quase tudo em C, compilado com ferramentas da Silicon Graphics para o Nintendo 64.",
    "source": "https://github.com/n64decomp/sm64",
    "year": 1996
  },
  {
    "game": "Team Fortress 2",
    "engine": "Source",
    "language": "C++",
    "made": "A Valve usou seu motor Source (em C++) para o estilo cartunesco e as classes do shooter por times.",
    "source": "https://en.wikipedia.org/wiki/Team_Fortress_2",
    "year": 2007
  },
  {
    "game": "Terraria",
    "engine": "Microsoft XNA",
    "language": "C#",
    "made": "Andrew Spinks construiu o sandbox 2D sobre o framework Microsoft XNA, em C#.",
    "source": "https://en.wikipedia.org/wiki/Terraria",
    "year": 2011
  },
  {
    "game": "The Witcher 3: Wild Hunt",
    "engine": "REDengine 3",
    "language": "C++",
    "made": "A CD Projekt Red usou seu motor proprio REDengine 3 (escrito em C++) para criar o mundo aberto do jogo.",
    "source": "https://en.wikipedia.org/wiki/The_Witcher_3:_Wild_Hunt",
    "year": 2015
  },
  {
    "game": "Undertale",
    "engine": "GameMaker Studio",
    "language": "GameMaker Language (GML)",
    "made": "Toby Fox criou quase tudo sozinho na GameMaker Studio, escrevendo a logica em GameMaker Language (GML).",
    "source": "https://en.wikipedia.org/wiki/Undertale",
    "year": 2015
  },
  {
    "game": "Valorant",
    "engine": "Unreal Engine 4",
    "language": "C++",
    "made": "A Riot Games desenvolveu o FPS tatico na Unreal Engine 4 (base em C++), buscando rodar bem ate em PCs modestos.",
    "source": "https://en.wikipedia.org/wiki/Valorant",
    "year": 2020
  },
  {
    "game": "Vampire Survivors",
    "engine": "Phaser",
    "language": "JavaScript",
    "made": "Nasceu no framework Phaser em JavaScript (depois portado para Unity), prova que simples vicia.",
    "source": "https://en.wikipedia.org/wiki/Vampire_Survivors",
    "year": 2022
  },
  {
    "game": "Wolfenstein 3D",
    "engine": "Custom engine (ray casting)",
    "language": "C",
    "made": "A id Software programou em C (com Assembly no ray casting), e Carmack escreveu o nucleo da engine em cerca de um mes.",
    "source": "https://en.wikipedia.org/wiki/Wolfenstein_3D",
    "year": 1992
  }
];
