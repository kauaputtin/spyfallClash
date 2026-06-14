const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configurar Socket.io com CORS para produção
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, 'public')));

// Servir pasta de imagens das cartas
app.use('/imagens', express.static(path.join(__dirname, 'imagens')));

// Rota para servir a página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para verificar se o servidor está rodando
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Lista de cartas do Clash Royale
const CARTAS_CLASH_ROYALE = [
  'Flechas', 'Bombardeiro', 'Arqueiras', 'Cavaleiro', 'Bola de Fogo', 'Mini P.E.K.K.A',
  'Mosqueteira', 'Gigante', 'Príncipe', 'Dragão Bebê', 'Exército de Esqueletos', 'Bruxa',
  'Goblins Lanceiros', 'Goblins', 'Cabana de Goblins', 'Valquíria', 'Relâmpago', 'Barril de Goblins',
  'Esqueletos', 'Servos', 'Lápide', 'Torre de Bombas', 'Esqueleto Gigante', 'Balão',
  'Canhão', 'Bárbaros', 'Foguete', 'Cabana de Bárbaros', 'Fúria', 'X-Besta', 'Tesla',
  'Horda de Servos', 'Torre Inferno', 'Corredor', 'Feitiço de Gelo', 'P.E.K.K.A', 'Zap',
  'Mago', 'Espelho', 'Morteiro', 'Coletor de Elixir', 'Golem', 'Gigante Real',
  'Três Mosqueteiras', 'Príncipe das Trevas', 'Veneno', 'Mago de Gelo', 'Princesa',
  'Espírito de Fogo', 'Fornalha', 'Guardas', 'Lava Hound', 'Mineiro', 'Sparky',
  'Lançador', 'Espírito de Gelo', 'Lenhador', 'O Tronco', 'Megasservo', 'Dragão Infernal',
  'Golem de Gelo', 'Cemitério', 'Tornado', 'Bárbaros de Elite', 'Clone', 'Mago Elétrico',
  'Goblin com Dardo', 'Executor', 'Aríete de Batalha', 'Gangue de Goblins', 'Bandida',
  'Bruxa Sombria', 'Morcegos', 'Carrinho de Canhão', 'Máquina Voadora', 'Barril de Esqueletos',
  'Megacavaleiro', 'Eletrocutadores', 'Caçador', 'Fantasma Real', 'Arqueiro Mágico',
  'Barril de Bárbaro', 'Patifes', 'Porcos Reais', 'Bola de Neve', 'Recrutas Reais',
  'Goblin Gigante', 'Dragão Elétrico', 'Domadora de Carneiro', 'Destruidores de Muros',
  'Terremoto', 'Jaula de Goblin', 'Pescador', 'Golem de Elixir', 'Curadora Guerreira',
  'Pirotécnica', 'Encomenda Real', 'Espírito Curador', 'Dragões Esqueleto', 'Gigante Elétrico',
  'Espírito Elétrico', 'Bruxa Mãe', 'Escavadeira de Goblins', 'Cavaleiro Dourado',
  'Rainha Arqueira', 'Rei Esqueleto', 'Mineiro Bombado', 'Monge', 'Fênix', 'Pequeno Príncipe',
  'Feitiço de Vácuo', 'Goblin Demolidor', 'Máquina Goblin', 'Maldição Goblin', 'Arbusto Traiçoeiro',
  'Goblinstein', 'Gigante das Runas', 'Berserker', 'Imperatriz Espiritual', 'Vinhas',
  'Princesa (Torre)', 'Canhoneiro', 'Duquesa das Adagas', 'Cozinheiro Real'
];

// Armazenamento de salas
const salas = new Map();

function gerarIdJogador() {
  return `jogador_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function obterPlayerId(socket, playerIdInformado) {
  const playerId = playerIdInformado || socket.data.playerId || socket.handshake.auth?.playerId || gerarIdJogador();
  socket.data.playerId = playerId;
  socket.join(playerId);
  return playerId;
}

function encontrarSalaDoJogador(playerId) {
  for (const [codigo, sala] of salas.entries()) {
    const jogador = sala.jogadores.find(j => j.id === playerId);
    if (jogador) {
      return { codigo, sala, jogador };
    }
  }
  return null;
}

function jogadoresPublicos(sala) {
  return sala.jogadores.map(jogador => ({
    id: jogador.id,
    nome: jogador.nome,
    online: jogador.online !== false
  }));
}

function atualizarJogadoresSala(codigo, sala) {
  io.to(codigo).emit('atualizarJogadores', jogadoresPublicos(sala));
}

function emitirParaJogador(jogadorId, evento, payload) {
  io.to(jogadorId).emit(evento, payload);
}

function montarPayloadRodada(sala, jogadorPartida) {
  const imagemCarta = jogadorPartida.isImpostor ? null : obterImagemCarta(sala.palavraAtual);

  return {
    rodada: sala.rodadaAtual,
    totalRodadas: 3,
    palavra: jogadorPartida.palavra,
    isImpostor: jogadorPartida.isImpostor,
    imagemCarta,
    carta: jogadorPartida.isImpostor ? null : {
      nome: sala.palavraAtual,
      imagem: imagemCarta
    },
    modoJogo: sala.modoJogo
  };
}

function enviarTurnoAtual(codigo, sala) {
  if (sala.modoJogo !== 'online' || sala.estado !== 'jogando') return;
  const jogadorAtual = sala.jogadoresNaPartida[sala.turnoAtual];
  if (!jogadorAtual) return;

  io.to(codigo).emit('atualizarTurno', {
    jogadorId: jogadorAtual.id,
    jogadorNome: jogadorAtual.nome,
    turnoIndex: sala.turnoAtual,
    rodadaAtual: sala.turnoRodadaAtual
  });
}

function restaurarEstadoParaSocket(socket, codigo, sala, jogador, evento = 'sessaoRestaurada') {
  socket.join(codigo);
  const isHost = jogador.id === sala.host;

  socket.emit(evento, {
    codigo,
    playerId: jogador.id,
    nomeJogador: jogador.nome,
    isHost,
    estadoSala: sala.estado,
    modoJogo: sala.modoJogo,
    quantidadeImpostores: sala.quantidadeImpostores
  });
  socket.emit('atualizarJogadores', jogadoresPublicos(sala));
  socket.emit('configuracaoAtualizada', { quantidadeImpostores: sala.quantidadeImpostores });

  const jogadorPartida = sala.jogadoresNaPartida.find(j => j.id === jogador.id);

  if (sala.estado === 'jogando' && jogadorPartida) {
    socket.emit('rodadaIniciada', montarPayloadRodada(sala, jogadorPartida));
    if (sala.modoJogo === 'online') {
      socket.emit('dicasRestauradas', { todasDicas: sala.dicas });
      enviarTurnoAtual(codigo, sala);
      if (sala.turnoRodadaAtual >= 3) {
        socket.emit('todasDicasEnviadas', {
          mostrarBotaoVotacao: true,
          hostId: sala.host
        });
      }
    }
  } else if (sala.estado === 'votando' && jogadorPartida) {
    socket.emit('votacaoIniciada', {
      jogadores: sala.jogadoresNaPartida.map(j => ({ id: j.id, nome: j.nome }))
    });
    socket.emit('votosAtualizados', {
      votos: sala.jogadoresNaPartida.map(j => ({ nome: j.nome, votos: j.votos }))
    });
  } else if (sala.estado === 'resultado' && sala.ultimoResultado) {
    socket.emit('resultadoVotacao', sala.ultimoResultado);
    socket.emit('aguardandoProximaRodada', {
      rodadaAtual: sala.rodadaAtual
    });
  }
}

// Função para gerar código único de 6 caracteres
function gerarCodigoSala() {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 6; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return codigo;
}

// Função para obter uma carta aleatória
function obterCartaAleatoria() {
  return CARTAS_CLASH_ROYALE[Math.floor(Math.random() * CARTAS_CLASH_ROYALE.length)];
}

// Função para obter o caminho da imagem da carta
function obterImagemCarta(nomeCarta) {
  // Mapeamento de nomes de cartas para arquivos de imagem
  const mapeamento = {
    'Flechas': 'flechas-arrows-clash-royale.png',
    'Bombardeiro': 'bombardeiro-wiki-da-carta.png',
    'Arqueiras': 'arqueiras-clash-royale.png',
    'Cavaleiro': 'cavaleiro-clash-royale-carta.png',
    'Bola de Fogo': 'bola-de-fogo-clash-royale-fireball.png',
    'Mini P.E.K.K.A': 'mini_PEKKA-clash-royale.png',
    'Mosqueteira': 'mosqueteira-clash-royale-rara-carta.png',
    'Gigante': 'gigante-clash-royale-card.png',
    'Príncipe': 'principe-clash-royale-carta-epica.png',
    'Dragão Bebê': 'dragao-bebe-baby_dragon-clash-royale.png',
    'Exército de Esqueletos': 'exercito-de-esqueletos-clash-royale.png',
    'Bruxa': 'bruxa-clash-royale.png',
    'Goblins Lanceiros': 'goblins-com-lancas-clash-royale.png',
    'Goblins': 'goblins-clash-royale-card.png',
    'Cabana de Goblins': 'cabana-de-goblins-clash-royale.png',
    'Valquíria': 'valquiria-clash-royale.png',
    'Relâmpago': 'relampago-clash-royale-carta-epica.png',
    'Barril de Goblins': 'barril-de-goblins-clash-royale.png',
    'Esqueletos': 'esqueletos-clash-royale.png',
    'Servos': 'servos-clash-royale-dicas.png',
    'Lápide': 'lapide-tombstone-clash-royale.png',
    'Torre de Bombas': 'torre-de-bombas-clash-royale.png',
    'Esqueleto Gigante': 'esqueleto-gigante-clash-royale-card-epic.png',
    'Balão': 'balao-clash-royale-balloon.png',
    'Canhão': 'canhao-clash-royale-cannon.png',
    'Bárbaros': 'barbaro-clash-royale.png',
    'Foguete': 'foguete-clash-royale-card-rocket-foquete.png',
    'Cabana de Bárbaros': 'cabana-de-barbaros-wiki-da-carta.png',
    'Fúria': 'furia-clash-royale-card-epica.png',
    'X-Besta': 'x-besta-clash-royale.png',
    'Tesla': 'tesla-clash-royale.png',
    'Horda de Servos': 'horda-de-servos-clash-royale.png',
    'Torre Inferno': 'torre-inferno-clash-royale.png',
    'Corredor': 'corredor-clash-royale-carta-rara.png',
    'Feitiço de Gelo': 'feitico-de-gelo-clash-royale-card.png',
    'P.E.K.K.A': 'PEKKA-clash-royale-carta-epica.png',
    'Zap': 'zap-clash-royale-zap.png',
    'Mago': 'mago-clash-royale.png',
    'Espelho': 'espelho-clash-royale-mirror-card.png',
    'Morteiro': 'morteiro-clash-royale.png',
    'Coletor de Elixir': 'coletor-de-elixir-clash-royale.png',
    'Golem': 'golem-clash-royale.png',
    'Gigante Real': 'gigante-real-wiki-da-carta.png',
    'Três Mosqueteiras': 'tres-mosqueteiras-clash-royale.png',
    'Príncipe das Trevas': 'principe-das-trevas-clash-royale.png',
    'Veneno': 'veneno-clash-royale-rara-epica.png',
    'Mago de Gelo': 'mago-de-gelo-wiki-da-carta.png',
    'Princesa': 'princesa-wiki-da-carta.png',
    'Espírito de Fogo': 'espirito-de-fogo-clash-royale.png',
    'Fornalha': 'fornalha-clash-royale-zsIYES-250x300.png',
    'Guardas': 'guardas-clash-royale.png',
    'Lava Hound': 'lava-hound-clash-royale.png',
    'Mineiro': 'mineiro-clash-royale.png',
    'Sparky': 'sparky-clash-royale.png',
    'Lançador': 'lancador-clash-royale.png',
    'Espírito de Gelo': 'espirito-de-gelo-clash-royale.png',
    'Lenhador': 'lenhador-clash-royale-carta-lendaria.png',
    'O Tronco': 'tronco-clash-royale.png',
    'Megasservo': 'megasservo.png',
    'Dragão Infernal': 'dragao-infernal-clash-royale.png',
    'Golem de Gelo': 'golem-de-gelo-clash-royale.png',
    'Cemitério': 'cemiterio-clash-royale.png',
    'Tornado': 'tornado-clash-royale.png',
    'Bárbaros de Elite': 'barbaros-de-elite-clash-royale.png',
    'Clone': 'clone-clash-royale.png',
    'Mago Elétrico': 'mago-eletrico-clash-royale-eletric-wizard.png',
    'Goblin com Dardo': 'goblin-com-dardos-clash-royale.png',
    'Executor': 'executor-clash-royale.png',
    'Aríete de Batalha': 'ariete-de-batalha-clash-royale-batle-ram.png',
    'Gangue de Goblins': 'gangue-de-goblins-clash-royale.png',
    'Bandida': 'bandida-clash-royale-wiki.png',
    'Bruxa Sombria': 'bruxa-sombria-clash-royale-wiki.png',
    'Morcegos': 'morcego-clash-royale-wiki.png',
    'Carrinho de Canhão': 'carrinho-de-canhao-clash-royale.png',
    'Máquina Voadora': 'maquina-voadora-clash-royale.png',
    'Barril de Esqueletos': 'barril-de-goblins-clash-royale-carta-epica.png',
    'Megacavaleiro': 'megacavaleiro-clash-royale.png',
    'Eletrocutadores': 'eletrocutadores-clash-royale.png',
    'Caçador': 'cacador-clash-royale.png',
    'Fantasma Real': 'fantasma-real-carta-lendaria-wiki-clash-royale.png',
    'Arqueiro Mágico': 'arqueiro-magico-clash-royale.png',
    'Barril de Bárbaro': 'barril-de-barbaro-do-clash-royale.png',
    'Patifes': 'patifes-clash-royale.png',
    'Porcos Reais': 'porcos-reais-no-clash-royale.png',
    'Bola de Neve': 'bola-de-neve-no-clash-royale.png',
    'Recrutas Reais': 'recrutas-reais.png',
    'Goblin Gigante': 'goblin-gigante-no-clash-royale.png',
    'Dragão Elétrico': 'dragao-eletrico-no-clash-royale.png',
    'Domadora de Carneiro': 'domadora-de-carneiro-clash-royale.png',
    'Destruidores de Muros': 'destruidores-de-muros-clash-royale.png',
    'Terremoto': 'terremoto-clash-royale.png',
    'Jaula de Goblin': 'jaula-de-goblin-clash-royale-250x300.png',
    'Pescador': 'pescador-clash-royale.png',
    'Golem de Elixir': 'golem-de-elixir-clash-royale-250x300.png',
    'Curadora Guerreira': 'curadora-guerreira-clash-royale.png',
    'Pirotécnica': 'pirotecnica-clash-royale.png',
    'Encomenda Real': 'encomenda-real-clash-royale.png',
    'Espírito Curador': 'espirito-curador-clash-royale.png',
    'Dragões Esqueleto': 'dragoes-esqueleto-clash-royale.png',
    'Gigante Elétrico': '-gigante-eletrico-clash-royale.png',
    'Espírito Elétrico': 'espirito-eletrico-clash-royale.png',
    'Bruxa Mãe': 'bruxa-mae-wiki-da-carta.png',
    'Escavadeira de Goblins': 'goblin-com-broca-wiki-da-carta.png',
    'Cavaleiro Dourado': 'cavaleiro-dourado-clash-royale-golden-knight-214x300.png',
    'Rainha Arqueira': 'rainha-arqueira-clash-royale-archer-queen-214x300.png',
    'Rei Esqueleto': 'rei-esqueleto-clash-royale-skeleton-king-214x300.png',
    'Mineiro Bombado': 'mineiro-bombado-clash-royale-mighty-miner-214x300.png',
    'Monge': 'monge-clash-royale-monk-214x300.png',
    'Fênix': 'fenix-clash-royale-phoenix-269x300.png',
    'Pequeno Príncipe': 'pequeno-principe-clash-royale-little-prince.png',
    'Feitiço de Vácuo': 'vacuo-wiki-da-carta-249x300.png',
    'Goblin Demolidor': 'goblin-demolidor-clash-royale-goblin-demolisher-243x300.png',
    'Máquina Goblin': 'maquina-goblin-clash-royale-goblin-mecha-268x300.png',
    'Maldição Goblin': 'maldicao-goblin-wiki-da-carta-249x300.png',
    'Arbusto Traiçoeiro': 'arbusto-traicoeiro.png',
    'Goblinstein': 'goblinstein-clash-royale-goblinstein-214x300.png',
    'Gigante das Runas': 'gigante-das-runas-wiki-da-carta-igY4T9-250x300.png',
    'Berserker': 'berserker-clash-royale-243x300.png',
    'Imperatriz Espiritual': 'imperatriz-espiritual-terrestre-wiki-da-carta-B5pHAk-230x300.png',
    'Vinhas': 'vinhas-wiki-da-carta-h6W5vu-250x300.png',
    'Princesa (Torre)': 'princesa-wiki-da-carta.png',
    'Canhoneiro': 'canhoneiro-clash-royale-cannoneer-214x300.png',
    'Duquesa das Adagas': 'duquesa-das-adagas-clash-royale-dagger-duchess-214x300.png',
    'Cozinheiro Real': 'cozinheiro-real-clash-royale-royal-chef-95JeAD-214x300.png'
  };

  return mapeamento[nomeCarta] || null;
}

// Função para selecionar impostores aleatórios
function selecionarImpostores(jogadores, quantidade) {
  const indices = Array.from({ length: jogadores.length }, (_, i) => i);
  const impostores = [];
  for (let i = 0; i < quantidade; i++) {
    const randomIndex = Math.floor(Math.random() * indices.length);
    impostores.push(indices.splice(randomIndex, 1)[0]);
  }
  return impostores;
}

io.on('connection', (socket) => {
  const playerId = obterPlayerId(socket);
  console.log('Novo socket conectado:', socket.id, 'playerId:', playerId);

  let lastPing = Date.now();
  const PING_TIMEOUT = 300000;

  const pingCheckInterval = setInterval(() => {
    const timeSincePing = Date.now() - lastPing;
    if (timeSincePing > PING_TIMEOUT) {
      console.log(`[Heartbeat] Cliente ${playerId} inativo por ${timeSincePing}ms. Desconectando socket...`);
      socket.disconnect(true);
    }
  }, 60000);

  socket.on('ping', () => {
    lastPing = Date.now();
    socket.emit('pong');
  });

  socket.on('retomarSessao', ({ codigo, playerId: playerIdInformado }) => {
    const id = obterPlayerId(socket, playerIdInformado);
    const sala = salas.get(codigo);
    if (!sala) {
      socket.emit('sessaoNaoEncontrada');
      return;
    }

    const jogador = sala.jogadores.find(j => j.id === id);
    if (!jogador) {
      socket.emit('sessaoNaoEncontrada');
      return;
    }

    jogador.online = true;
    jogador.socketId = socket.id;
    restaurarEstadoParaSocket(socket, codigo, sala, jogador);
    atualizarJogadoresSala(codigo, sala);
    console.log(`${jogador.nome} restaurou sessao na sala ${codigo}`);
  });

  socket.on('criarSala', ({ nomeJogador, modoJogo, playerId: playerIdInformado }) => {
    const id = obterPlayerId(socket, playerIdInformado);
    const codigo = gerarCodigoSala();
    const sala = {
      codigo,
      host: id,
      modoJogo: modoJogo || 'presencial',
      jogadores: [{
        id,
        socketId: socket.id,
        nome: nomeJogador,
        online: true,
        isImpostor: false,
        palavra: null,
        votos: 0
      }],
      jogadoresNaPartida: [],
      estado: 'aguardando',
      rodadaAtual: 0,
      quantidadeImpostores: 1,
      palavraAtual: null,
      votos: {},
      ultimoResultado: null,
      jogadoresQueVotaram: new Set(),
      dicas: [],
      turnoAtual: 0,
      turnoRodadaAtual: 0,
      jogadoresQueEnviaramDica: new Set()
    };

    salas.set(codigo, sala);
    socket.join(codigo);
    socket.emit('salaCriada', { codigo, playerId: id, nomeJogador, isHost: true, modoJogo: sala.modoJogo });
    socket.emit('atualizarJogadores', jogadoresPublicos(sala));
    console.log(`Sala criada: ${codigo} por ${nomeJogador} (modo: ${sala.modoJogo})`);
  });

  socket.on('entrarSala', ({ codigo, nomeJogador, playerId: playerIdInformado }) => {
    const id = obterPlayerId(socket, playerIdInformado);
    const sala = salas.get(codigo);

    if (!sala) {
      socket.emit('erro', { mensagem: 'Sala nao encontrada!' });
      return;
    }

    const jogadorExistente = sala.jogadores.find(j => j.id === id);
    if (jogadorExistente) {
      jogadorExistente.nome = nomeJogador || jogadorExistente.nome;
      jogadorExistente.online = true;
      jogadorExistente.socketId = socket.id;
      restaurarEstadoParaSocket(socket, codigo, sala, jogadorExistente, 'entrouSala');
      atualizarJogadoresSala(codigo, sala);
      return;
    }

    if (sala.jogadores.length >= 10) {
      socket.emit('erro', { mensagem: 'Sala cheia! Maximo de 10 jogadores.' });
      return;
    }

    sala.jogadores.push({
      id,
      socketId: socket.id,
      nome: nomeJogador,
      online: true,
      isImpostor: false,
      palavra: null,
      votos: 0
    });

    socket.join(codigo);
    socket.emit('entrouSala', {
      codigo,
      playerId: id,
      nomeJogador,
      isHost: id === sala.host,
      estadoSala: sala.estado,
      modoJogo: sala.modoJogo
    });
    atualizarJogadoresSala(codigo, sala);
    console.log(`${nomeJogador} entrou na sala ${codigo} (estado: ${sala.estado})`);
  });

  socket.on('sairDaSala', (codigo) => {
    const id = obterPlayerId(socket);
    const sala = salas.get(codigo);
    if (!sala) return;

    const jogadorIndex = sala.jogadores.findIndex(j => j.id === id);
    if (jogadorIndex === -1) return;

    const jogador = sala.jogadores[jogadorIndex];
    sala.jogadores.splice(jogadorIndex, 1);
    sala.jogadoresNaPartida = sala.jogadoresNaPartida.filter(j => j.id !== id);
    socket.leave(codigo);

    if (id === sala.host) {
      if (sala.jogadores.length > 0) {
        sala.host = sala.jogadores[0].id;
        io.to(codigo).emit('novoHost', { novoHostId: sala.host });
        emitirParaJogador(sala.host, 'tornouHost', true);
        console.log(`Host transferido para ${sala.jogadores[0].nome} na sala ${codigo}`);
      } else {
        salas.delete(codigo);
        console.log(`Sala ${codigo} deletada (sem jogadores)`);
        return;
      }
    }

    atualizarJogadoresSala(codigo, sala);
    console.log(`${jogador.nome} saiu da sala ${codigo}`);
  });

  socket.on('configurarImpostores', ({ codigo, quantidade }) => {
    const id = obterPlayerId(socket);
    const sala = salas.get(codigo);
    if (!sala || id !== sala.host) return;

    sala.quantidadeImpostores = quantidade;
    sala.estado = 'configurando';
    io.to(codigo).emit('configuracaoAtualizada', { quantidadeImpostores: quantidade });
  });

  socket.on('iniciarPartida', (codigo) => {
    const id = obterPlayerId(socket);
    const sala = salas.get(codigo);
    if (!sala || id !== sala.host) return;

    if (sala.jogadores.length < 3) {
      socket.emit('erro', { mensagem: 'E necessario pelo menos 3 jogadores para comecar!' });
      return;
    }

    sala.rodadaAtual = 1;
    sala.estado = 'jogando';
    sala.votos = {};
    sala.ultimoResultado = null;
    sala.jogadoresQueVotaram = new Set();
    sala.dicas = [];
    sala.turnoAtual = 0;
    sala.turnoRodadaAtual = 0;
    sala.jogadoresQueEnviaramDica = new Set();
    sala.jogadoresNaPartida = sala.jogadores.map(jogador => ({
      id: jogador.id,
      nome: jogador.nome,
      isImpostor: false,
      palavra: null,
      votos: 0
    }));

    const impostores = selecionarImpostores(sala.jogadoresNaPartida, sala.quantidadeImpostores);
    const palavra = obterCartaAleatoria();
    sala.palavraAtual = palavra;

    sala.jogadoresNaPartida.forEach((jogador, index) => {
      jogador.isImpostor = impostores.includes(index);
      jogador.palavra = jogador.isImpostor ? null : palavra;
      jogador.votos = 0;
      emitirParaJogador(jogador.id, 'rodadaIniciada', montarPayloadRodada(sala, jogador));
    });

    enviarTurnoAtual(codigo, sala);
    atualizarJogadoresSala(codigo, sala);
    console.log(`Partida iniciada na sala ${codigo}, rodada ${sala.rodadaAtual} com ${sala.jogadoresNaPartida.length} jogadores`);
  });

  socket.on('enviarDica', ({ codigo, dica }) => {
    const id = obterPlayerId(socket);
    const sala = salas.get(codigo);
    if (!sala || sala.modoJogo !== 'online' || sala.estado !== 'jogando') return;

    const jogadorAtual = sala.jogadoresNaPartida[sala.turnoAtual];
    if (!jogadorAtual || jogadorAtual.id !== id) {
      socket.emit('erro', { mensagem: 'Nao e seu turno!' });
      return;
    }

    if (sala.jogadoresQueEnviaramDica.has(id)) {
      socket.emit('erro', { mensagem: 'Voce ja enviou sua dica!' });
      return;
    }

    const dicaNormalizada = dica.trim().toLowerCase();
    const dicaDuplicada = sala.dicas.find(d => d.dica.trim().toLowerCase() === dicaNormalizada);

    if (dicaDuplicada) {
      socket.emit('dicaDuplicada', {
        mensagem: `Esta dica ja foi dita por ${dicaDuplicada.jogadorNome}! Escolha outra dica.`
      });
      return;
    }

    sala.dicas.push({
      jogadorId: id,
      jogadorNome: jogadorAtual.nome,
      dica
    });
    sala.jogadoresQueEnviaramDica.add(id);

    io.to(codigo).emit('novaDica', {
      jogadorNome: jogadorAtual.nome,
      dica,
      todasDicas: sala.dicas
    });

    sala.turnoAtual++;

    if (sala.turnoAtual >= sala.jogadoresNaPartida.length) {
      sala.turnoRodadaAtual++;
      sala.turnoAtual = 0;
      sala.jogadoresQueEnviaramDica.clear();

      if (sala.turnoRodadaAtual >= 3) {
        io.to(codigo).emit('todasDicasEnviadas', {
          mostrarBotaoVotacao: true,
          hostId: sala.host
        });
      } else {
        io.to(codigo).emit('rodadaDicasCompleta', {
          rodadaAtual: sala.turnoRodadaAtual,
          totalRodadas: 3
        });
        enviarTurnoAtual(codigo, sala);
      }
    } else {
      enviarTurnoAtual(codigo, sala);
    }
  });

  socket.on('iniciarVotacao', (codigo) => {
    const id = obterPlayerId(socket);
    const sala = salas.get(codigo);
    if (!sala || id !== sala.host) return;

    sala.estado = 'votando';
    sala.votos = {};
    sala.jogadoresQueVotaram = new Set();

    io.to(codigo).emit('votacaoIniciada', {
      jogadores: sala.jogadoresNaPartida.map(j => ({ id: j.id, nome: j.nome }))
    });
  });

  socket.on('encerrarPartida', (codigo) => {
    const id = obterPlayerId(socket);
    const sala = salas.get(codigo);
    if (!sala || id !== sala.host) return;

    sala.estado = 'aguardando';
    sala.rodadaAtual = 0;
    sala.palavraAtual = null;
    sala.votos = {};
    sala.ultimoResultado = null;
    sala.jogadoresQueVotaram = new Set();
    sala.jogadoresNaPartida = [];
    sala.dicas = [];
    sala.turnoAtual = 0;
    sala.turnoRodadaAtual = 0;
    sala.jogadoresQueEnviaramDica = new Set();

    sala.jogadores.forEach(jogador => {
      jogador.isImpostor = false;
      jogador.palavra = null;
      jogador.votos = 0;
    });

    io.to(codigo).emit('partidaEncerrada');
    setTimeout(() => atualizarJogadoresSala(codigo, sala), 3000);
  });

  socket.on('votar', ({ codigo, jogadorVotadoId }) => {
    const id = obterPlayerId(socket);
    const sala = salas.get(codigo);
    if (!sala || sala.estado !== 'votando') return;
    if (sala.jogadoresQueVotaram.has(id)) return;
    if (!sala.jogadoresNaPartida.some(j => j.id === id)) return;

    const jogadorVotado = sala.jogadoresNaPartida.find(j => j.id === jogadorVotadoId);
    if (!jogadorVotado) return;

    jogadorVotado.votos++;
    sala.jogadoresQueVotaram.add(id);

    if (sala.jogadoresQueVotaram.size === sala.jogadoresNaPartida.length) {
      const jogadoresOrdenados = [...sala.jogadoresNaPartida].sort((a, b) => b.votos - a.votos);
      const maisVotado = jogadoresOrdenados[0];
      const empate = jogadoresOrdenados[0].votos === jogadoresOrdenados[1]?.votos;

      const resultado = {
        maisVotado,
        empate,
        palavraCorreta: sala.palavraAtual,
        imagemCarta: obterImagemCarta(sala.palavraAtual),
        votos: sala.jogadoresNaPartida.map(j => ({ nome: j.nome, votos: j.votos, isImpostor: j.isImpostor }))
      };

      sala.ultimoResultado = resultado;
      io.to(codigo).emit('resultadoVotacao', resultado);

      setTimeout(() => {
        sala.estado = 'resultado';
        io.to(codigo).emit('aguardandoProximaRodada', {
          rodadaAtual: sala.rodadaAtual
        });
      }, 5000);
    } else {
      io.to(codigo).emit('votosAtualizados', {
        votos: sala.jogadoresNaPartida.map(j => ({ nome: j.nome, votos: j.votos }))
      });
    }
  });

  socket.on('iniciarNovaRodada', (codigo) => {
    const id = obterPlayerId(socket);
    const sala = salas.get(codigo);
    if (!sala || id !== sala.host || sala.estado !== 'resultado') return;

    sala.rodadaAtual++;
    sala.estado = 'jogando';
    sala.ultimoResultado = null;
    sala.dicas = [];
    sala.turnoAtual = 0;
    sala.turnoRodadaAtual = 0;
    sala.jogadoresQueEnviaramDica = new Set();
    sala.jogadoresQueVotaram = new Set();
    sala.jogadoresNaPartida = sala.jogadores.map(jogador => ({
      id: jogador.id,
      nome: jogador.nome,
      isImpostor: false,
      palavra: null,
      votos: 0
    }));

    const novaPalavra = obterCartaAleatoria();
    sala.palavraAtual = novaPalavra;
    const novosImpostores = selecionarImpostores(sala.jogadoresNaPartida, sala.quantidadeImpostores);

    sala.jogadoresNaPartida.forEach((jogador, index) => {
      jogador.isImpostor = novosImpostores.includes(index);
      jogador.palavra = jogador.isImpostor ? null : novaPalavra;
      jogador.votos = 0;
      emitirParaJogador(jogador.id, 'rodadaIniciada', montarPayloadRodada(sala, jogador));
    });

    enviarTurnoAtual(codigo, sala);
    atualizarJogadoresSala(codigo, sala);
    console.log(`Nova rodada ${sala.rodadaAtual} iniciada na sala ${codigo} com ${sala.jogadoresNaPartida.length} jogadores`);
  });

  socket.on('disconnect', () => {
    clearInterval(pingCheckInterval);
    const id = socket.data.playerId;
    console.log('Socket desconectado:', socket.id, 'playerId:', id);
    if (!id) return;

    const registro = encontrarSalaDoJogador(id);
    if (!registro) return;
    if (registro.jogador.socketId && registro.jogador.socketId !== socket.id) return;

    registro.jogador.online = false;
    registro.jogador.socketId = null;
    atualizarJogadoresSala(registro.codigo, registro.sala);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});

