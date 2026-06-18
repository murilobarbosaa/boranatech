export interface TechnologyCuriosity {
  curiosity: string;
  source: string;
}

export const technologyCuriosities: Record<string, TechnologyCuriosity> = {
  "HTML": {
    "curiosity": "Foi criado por Tim Berners-Lee no CERN, em 1990, o mesmo laboratorio de fisica de particulas que ajudou a inventar a web.",
    "source": "https://en.wikipedia.org/wiki/HTML"
  },
  "CSS": {
    "curiosity": "Comecou como Cascading HTML Style Sheets, mas o H foi removido do nome porque os estilos serviam para outras linguagens, nao so HTML.",
    "source": "https://en.wikipedia.org/wiki/CSS"
  },
  "JavaScript": {
    "curiosity": "Brendan Eich a criou na Netscape em 1995, e ela nasceu chamada LiveScript antes de ganhar o nome JavaScript numa jogada de marketing.",
    "source": "https://en.wikipedia.org/wiki/JavaScript"
  },
  "TypeScript": {
    "curiosity": "Criada pela Microsoft e lancada em 2012, foi desenhada por Anders Hejlsberg, o mesmo arquiteto por tras do Turbo Pascal e do C#.",
    "source": "https://en.wikipedia.org/wiki/TypeScript"
  },
  "Python": {
    "curiosity": "O nome nao vem da cobra, e sim do grupo de humor britanico Monty Python, que Guido van Rossum adorava na epoca em que criou a linguagem.",
    "source": "https://en.wikipedia.org/wiki/Python_(programming_language)"
  },
  "Java": {
    "curiosity": "Comecou em 1991 com o nome Oak (um carvalho que ficava em frente ao escritorio de James Gosling) antes de virar Java, como o cafe.",
    "source": "https://en.wikipedia.org/wiki/Java_(programming_language)"
  },
  "PHP": {
    "curiosity": "Rasmus Lerdorf a criou em 1993 so para cuidar da sua pagina pessoal (Personal Home Page), sem nunca planejar fazer uma linguagem.",
    "source": "https://en.wikipedia.org/wiki/PHP"
  },
  "Go": {
    "curiosity": "Criada no Google em 2007 por veteranos como Ken Thompson, ela tem como mascote um simpatico gopher desenhado por Renee French.",
    "source": "https://en.wikipedia.org/wiki/Go_(programming_language)"
  },
  "Rust": {
    "curiosity": "Graydon Hoare a batizou com o nome de um grupo de fungos (a ferrugem) por serem super resistentes, otimizados para a sobrevivencia.",
    "source": "https://en.wikipedia.org/wiki/Rust_(programming_language)"
  },
  "C#": {
    "curiosity": "O nome se inspira na musica: o sustenido (sharp) eleva a nota em meio tom, sugerindo um C (linguagem C) elevado a outro nivel.",
    "source": "https://en.wikipedia.org/wiki/C_Sharp_(programming_language)"
  },
  "SQL": {
    "curiosity": "Nasceu na IBM nos anos 1970 com o nome SEQUEL, mas teve que ser encurtada por causa de uma disputa de marca registrada.",
    "source": "https://en.wikipedia.org/wiki/SQL"
  },
  "Swift": {
    "curiosity": "Chris Lattner comecou a desenvolver a Swift na Apple em 2010, e ela foi apresentada ao mundo na WWDC de 2014.",
    "source": "https://en.wikipedia.org/wiki/Swift_(programming_language)"
  },
  "Kotlin": {
    "curiosity": "Criada pela JetBrains, leva o nome da ilha russa de Kotlin, perto de Sao Petersburgo, numa homenagem ao estilo de nome do Java.",
    "source": "https://en.wikipedia.org/wiki/Kotlin_(programming_language)"
  },
  "R": {
    "curiosity": "O R foi criado por Ross Ihaka e Robert Gentleman na Universidade de Auckland, e o nome vem da inicial dos dois e de ser sucessor da linguagem S.",
    "source": "https://en.wikipedia.org/wiki/R_(programming_language)"
  },
  "C++": {
    "curiosity": "Bjarne Stroustrup comecou a linguagem em 1979 como C with Classes, e o nome C++ vem do operador de incremento (++) do C, indicando uma versao evoluida.",
    "source": "https://en.wikipedia.org/wiki/C%2B%2B"
  },
  "C": {
    "curiosity": "Dennis Ritchie criou o C no Bell Labs entre 1972 e 1973, sucessor da linguagem B, e ele foi usado para reescrever o nucleo do sistema Unix.",
    "source": "https://en.wikipedia.org/wiki/C_(programming_language)"
  },
  "Lua": {
    "curiosity": "A Lua nasceu em 1993 na PUC-Rio, no Brasil, e seu nome significa Lua em portugues, fazendo par com sua antecessora SOL (Sol).",
    "source": "https://en.wikipedia.org/wiki/Lua_(programming_language)"
  },
  "Solidity": {
    "curiosity": "A Solidity foi proposta em agosto de 2014 por Gavin Wood e serve para escrever contratos inteligentes, principalmente na blockchain Ethereum.",
    "source": "https://en.wikipedia.org/wiki/Solidity"
  },
  "Ruby": {
    "curiosity": "Yukihiro Matsumoto criou a Ruby no Japao, com primeira versao em 1995, e o nome foi escolhido por ser a pedra de nascimento de um colega.",
    "source": "https://en.wikipedia.org/wiki/Ruby_(programming_language)"
  },
  "Dart": {
    "curiosity": "A Dart foi criada por Lars Bak e Kasper Lund no Google e apresentada em 2011 na conferencia GOTO, em Aarhus, na Dinamarca.",
    "source": "https://en.wikipedia.org/wiki/Dart_(programming_language)"
  },
  "Scala": {
    "curiosity": "Martin Odersky criou a Scala na EPFL, na Suica, e o nome e a juncao de scalable e language, ou seja, uma linguagem feita para crescer.",
    "source": "https://en.wikipedia.org/wiki/Scala_(programming_language)"
  },
  "Julia": {
    "curiosity": "A Julia foi anunciada em 2012 por seus quatro criadores com o desejo de juntar a velocidade do C com o dinamismo do Ruby e a matematica do MATLAB.",
    "source": "https://en.wikipedia.org/wiki/Julia_(programming_language)"
  },
  "MATLAB": {
    "curiosity": "Cleve Moler criou o MATLAB no fim dos anos 1970 para seus alunos, e o nome vem de Matrix Laboratory (Laboratorio de Matrizes).",
    "source": "https://en.wikipedia.org/wiki/MATLAB"
  },
  "COBOL": {
    "curiosity": "O COBOL teve sua especificacao publicada em 1960, e o nome significa Common Business-Oriented Language, ou seja, linguagem voltada para negocios.",
    "source": "https://en.wikipedia.org/wiki/COBOL"
  },
  "Fortran": {
    "curiosity": "John Backus liderou a criacao do Fortran na IBM, com o primeiro compilador em 1957, e o nome vem de Formula Translation (traducao de formulas).",
    "source": "https://en.wikipedia.org/wiki/Fortran"
  },
  "Assembly": {
    "curiosity": "Kathleen Booth e creditada por inventar a linguagem assembly, a partir de trabalhos iniciados em 1947 na Universidade de Londres.",
    "source": "https://en.wikipedia.org/wiki/Assembly_language"
  },
  "Ada": {
    "curiosity": "Ada foi batizada em homenagem a Ada Lovelace, considerada a primeira programadora da historia, e seu padrao militar (MIL-STD-1815) cita o ano de nascimento dela.",
    "source": "https://en.wikipedia.org/wiki/Ada_(programming_language)"
  },
  "Visual Basic": {
    "curiosity": "Lancado pela Microsoft em 1991, o Visual Basic nasceu unindo um gerador visual de telas de codinome Ruby a um motor BASIC chamado EB.",
    "source": "https://en.wikipedia.org/wiki/Visual_Basic_(classic)"
  },
  "Objective-C": {
    "curiosity": "Criado por Brad Cox e Tom Love nos anos 1980, o Objective-C virou a linguagem do NeXT de Steve Jobs e, depois, do macOS e do iPhone na Apple.",
    "source": "https://en.wikipedia.org/wiki/Objective-C"
  },
  "Elixir": {
    "curiosity": "Criada pelo brasileiro Jose Valim em 2012, a Elixir roda sobre a maquina virtual BEAM, a mesma usada pela linguagem Erlang.",
    "source": "https://en.wikipedia.org/wiki/Elixir_(programming_language)"
  },
  "Erlang": {
    "curiosity": "Criada na Ericsson em 1986 para telefonia, a Erlang faz um trocadilho duplo, homenageando o matematico Agner Krarup Erlang e abreviando Ericsson Language.",
    "source": "https://en.wikipedia.org/wiki/Erlang_(programming_language)"
  },
  "Haskell": {
    "curiosity": "Definida em 1990, a Haskell leva o nome do logico Haskell Curry, especialista em logica matematica.",
    "source": "https://en.wikipedia.org/wiki/Haskell"
  },
  "Clojure": {
    "curiosity": "Criada por Rich Hickey e lancada em 2007, a Clojure e um dialeto moderno do Lisp que roda sobre a plataforma Java (JVM).",
    "source": "https://en.wikipedia.org/wiki/Clojure"
  },
  "F#": {
    "curiosity": "Criada por Don Syme na Microsoft Research e surgida em 2005, a F# tem um nome divertido, segundo o time o F e de Fun (diversao).",
    "source": "https://en.wikipedia.org/wiki/F_Sharp_(programming_language)"
  },
  "Groovy": {
    "curiosity": "Idealizada por James Strachan e lancada em 2007, a Groovy roda sobre a JVM e foi pensada para ser facil para quem ja programa em Java.",
    "source": "https://en.wikipedia.org/wiki/Apache_Groovy"
  },
  "Bash": {
    "curiosity": "Escrita por Brian Fox em 1989 para o projeto GNU, a Bash tem nome de trocadilho, Bourne Again SHell, uma piada com a antiga shell Bourne (sh).",
    "source": "https://en.wikipedia.org/wiki/Bash_(Unix_shell)"
  },
  "PowerShell": {
    "curiosity": "Lancada pela Microsoft em 2006 com Jeffrey Snover como arquiteto chefe, a PowerShell teve um codinome curioso durante o desenvolvimento, Monad.",
    "source": "https://en.wikipedia.org/wiki/PowerShell"
  },
  "Perl": {
    "curiosity": "Criada por Larry Wall em 1987, a Perl quase se chamou Pearl, mas ele tirou o a ao descobrir outra linguagem chamada PEARL.",
    "source": "https://en.wikipedia.org/wiki/Perl"
  }
};
