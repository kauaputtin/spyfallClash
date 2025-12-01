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
  console.log('Novo jogador conectado:', socket.id);

  // Variáveis de heartbeat para este socket
  let lastPing = Date.now();
  const PING_TIMEOUT = 300000; // 5 minutos - permite tela desligada/app minimizado
  
  // Monitorar inatividade do cliente
  const pingCheckInterval = setInterval(() => {
    const timeSincePing = Date.now() - lastPing;
    if (timeSincePing > PING_TIMEOUT) {
      console.log(`[Heartbeat] Cliente ${socket.id} inativo por ${timeSincePing}ms. Desconectando...`);
      socket.disconnect(true);
    }
  }, 60000); // Verificar a cada 60 segundos

  // Listener para ping do cliente
  socket.on('ping', (data) => {
    lastPing = Date.now();
    // Responder com pong
    socket.emit('pong');
  });

  // Limpar interval ao desconectar
  socket.on('disconnect', () => {
    clearInterval(pingCheckInterval);
  });

  // Criar sala
  socket.on('criarSala', ({ nomeJogador, modoJogo }) => {
    const codigo = gerarCodigoSala();
    const sala = {
      codigo,
      host: socket.id,
      modoJogo: modoJogo || 'presencial', // 'presencial' ou 'online'
      jogadores: [{
        id: socket.id,
        nome: nomeJogador,
        isImpostor: false,
        palavra: null,
        votos: 0
      }],
      jogadoresNaPartida: [], // Jogadores que estão ativamente na partida atual
      estado: 'aguardando', // aguardando, configurando, jogando, votando, resultado
      rodadaAtual: 0,
      quantidadeImpostores: 1,
      palavraAtual: null,
      votos: {},
      jogadoresQueVotaram: new Set(),
      // Campos específicos do modo online
      dicas: [], // { jogadorId, jogadorNome, dica }
      turnoAtual: 0, // Índice do jogador que pode enviar dica
      turnoRodadaAtual: 0, // Quantas rodadas de dicas foram completadas (0-2, total 3)
      jogadoresQueEnviaramDica: new Set()
    };
    
    salas.set(codigo, sala);
    socket.join(codigo);
    socket.emit('salaCriada', { codigo, isHost: true, modoJogo: sala.modoJogo });
    socket.emit('atualizarJogadores', sala.jogadores);
    console.log(`Sala criada: ${codigo} por ${nomeJogador} (modo: ${sala.modoJogo})`);
  });

  // Entrar em sala
  socket.on('entrarSala', ({ codigo, nomeJogador }) => {
    const sala = salas.get(codigo);
    
    if (!sala) {
      socket.emit('erro', { mensagem: 'Sala não encontrada!' });
      return;
    }

    // Removido a restrição de estado - jogador pode entrar durante partida
    // Ele ficará no lobby até a próxima rodada

    if (sala.jogadores.length >= 10) {
      socket.emit('erro', { mensagem: 'Sala cheia! Máximo de 10 jogadores.' });
      return;
    }

    sala.jogadores.push({
      id: socket.id,
      nome: nomeJogador,
      isImpostor: false,
      palavra: null,
      votos: 0
    });

    socket.join(codigo);
    socket.emit('entrouSala', { 
      codigo, 
      isHost: socket.id === sala.host,
      estadoSala: sala.estado, // Informar o estado atual da sala
      modoJogo: sala.modoJogo // Informar o modo de jogo
    });
    io.to(codigo).emit('atualizarJogadores', sala.jogadores);
    console.log(`${nomeJogador} entrou na sala ${codigo} (estado: ${sala.estado})`);
  });

  // Sair da sala
  socket.on('sairDaSala', (codigo) => {
    const sala = salas.get(codigo);
    if (!sala) return;

    const jogadorIndex = sala.jogadores.findIndex(j => j.id === socket.id);
    if (jogadorIndex !== -1) {
      const jogador = sala.jogadores[jogadorIndex];
      sala.jogadores.splice(jogadorIndex, 1);
      socket.leave(codigo);
      
      // Se era o host, transferir para outro jogador ou deletar sala
      if (socket.id === sala.host) {
        if (sala.jogadores.length > 0) {
          sala.host = sala.jogadores[0].id;
          io.to(codigo).emit('novoHost', { novoHostId: sala.host });
          console.log(`Host transferido para ${sala.jogadores[0].nome} na sala ${codigo}`);
        } else {
          salas.delete(codigo);
          console.log(`Sala ${codigo} deletada (sem jogadores)`);
          return;
        }
      }
      
      io.to(codigo).emit('atualizarJogadores', sala.jogadores);
      console.log(`${jogador.nome} saiu da sala ${codigo}`);
    }
  });

  // Configurar quantidade de impostores (apenas host)
  socket.on('configurarImpostores', ({ codigo, quantidade }) => {
    const sala = salas.get(codigo);
    if (!sala || socket.id !== sala.host) return;
    
    sala.quantidadeImpostores = quantidade;
    sala.estado = 'configurando';
    io.to(codigo).emit('configuracaoAtualizada', { quantidadeImpostores: quantidade });
  });

  // Iniciar partida (apenas host)
  socket.on('iniciarPartida', (codigo) => {
    const sala = salas.get(codigo);
    if (!sala || socket.id !== sala.host) return;
    
    if (sala.jogadores.length < 3) {
      socket.emit('erro', { mensagem: 'É necessário pelo menos 3 jogadores para começar!' });
      return;
    }

    // Reiniciar estado da partida
    sala.rodadaAtual = 1;
    sala.estado = 'jogando';
    sala.votos = {};
    sala.jogadoresQueVotaram = new Set();

    // Resetar dicas e turnos (modo online)
    sala.dicas = [];
    sala.turnoAtual = 0;
    sala.turnoRodadaAtual = 0;
    sala.jogadoresQueEnviaramDica = new Set();

    // Copiar jogadores atuais para jogadoresNaPartida (apenas esses jogam esta rodada)
    sala.jogadoresNaPartida = JSON.parse(JSON.stringify(sala.jogadores));

    // Selecionar impostores APENAS entre jogadores na partida
    const impostores = selecionarImpostores(sala.jogadoresNaPartida, sala.quantidadeImpostores);
    const palavra = obterCartaAleatoria();
    sala.palavraAtual = palavra;

    // Distribuir palavras APENAS para jogadores na partida
    sala.jogadoresNaPartida.forEach((jogador, index) => {
      jogador.isImpostor = impostores.includes(index);
      jogador.palavra = jogador.isImpostor ? null : palavra;
      jogador.votos = 0;
    });

    // Notificar APENAS jogadores na partida
    sala.jogadoresNaPartida.forEach((jogador) => {
      io.to(jogador.id).emit('rodadaIniciada', {
        rodada: sala.rodadaAtual,
        totalRodadas: sala.totalRodadas,
        palavra: jogador.palavra,
        isImpostor: jogador.isImpostor,
        imagemCarta: jogador.isImpostor ? null : obterImagemCarta(palavra), // Impostor não recebe imagem
        modoJogo: sala.modoJogo // Informar modo de jogo
      });
    });

    // Se modo online, notificar quem é o primeiro a dar dica
    if (sala.modoJogo === 'online') {
      const primeiroJogador = sala.jogadoresNaPartida[0];
      io.to(codigo).emit('atualizarTurno', {
        jogadorId: primeiroJogador.id,
        jogadorNome: primeiroJogador.nome,
        turnoIndex: 0
      });
    }

    io.to(codigo).emit('atualizarJogadores', sala.jogadores);
    console.log(`Partida iniciada na sala ${codigo}, rodada ${sala.rodadaAtual} com ${sala.jogadoresNaPartida.length} jogadores`);
  });

  // Enviar dica (modo online)
  socket.on('enviarDica', ({ codigo, dica }) => {
    const sala = salas.get(codigo);
    if (!sala || sala.modoJogo !== 'online' || sala.estado !== 'jogando') return;

    // Verificar se é o turno do jogador
    const jogadorAtual = sala.jogadoresNaPartida[sala.turnoAtual];
    if (!jogadorAtual || jogadorAtual.id !== socket.id) {
      socket.emit('erro', { mensagem: 'Não é seu turno!' });
      return;
    }

    // Verificar se já enviou dica
    if (sala.jogadoresQueEnviaramDica.has(socket.id)) {
      socket.emit('erro', { mensagem: 'Você já enviou sua dica!' });
      return;
    }

    // Verificar se a dica já foi dita por outro jogador
    const dicaNormalizada = dica.trim().toLowerCase();
    const dicaDuplicada = sala.dicas.find(d => d.dica.trim().toLowerCase() === dicaNormalizada);
    
    if (dicaDuplicada) {
      socket.emit('dicaDuplicada', { 
        mensagem: `Esta dica já foi dita por ${dicaDuplicada.jogadorNome}! Escolha outra dica.` 
      });
      console.log(`[Sala ${codigo}] ${jogadorAtual.nome} tentou enviar dica duplicada: "${dica}"`);
      return;
    }

    // Adicionar dica
    sala.dicas.push({
      jogadorId: socket.id,
      jogadorNome: jogadorAtual.nome,
      dica: dica
    });
    sala.jogadoresQueEnviaramDica.add(socket.id);

    // Notificar todos sobre a nova dica
    io.to(codigo).emit('novaDica', {
      jogadorNome: jogadorAtual.nome,
      dica: dica,
      todasDicas: sala.dicas
    });

    // Avançar para próximo turno
    sala.turnoAtual++;

    // Verificar se todos já enviaram dicas nesta rodada
    if (sala.turnoAtual >= sala.jogadoresNaPartida.length) {
      // Rodada de dicas completada
      sala.turnoRodadaAtual++;
      sala.turnoAtual = 0;
      sala.jogadoresQueEnviaramDica.clear();
      
      // Verificar se completou os 3 turnos
      if (sala.turnoRodadaAtual >= 3) {
        // Todas as 3 rodadas foram enviadas - mostrar botão de votação para host
        const host = sala.jogadores[0];
        io.to(codigo).emit('todasDicasEnviadas', { 
          mostrarBotaoVotacao: true,
          hostId: host.id 
        });
        console.log(`Todas as 3 rodadas de dicas enviadas na sala ${codigo}`);
      } else {
        // Notificar que rodada foi completada e iniciar próxima
        io.to(codigo).emit('rodadaDicasCompleta', { 
          rodadaAtual: sala.turnoRodadaAtual,
          totalRodadas: 3 
        });
        
        // Notificar primeiro jogador da próxima rodada
        const proximoJogador = sala.jogadoresNaPartida[0];
        io.to(codigo).emit('atualizarTurno', {
          jogadorId: proximoJogador.id,
          jogadorNome: proximoJogador.nome,
          turnoIndex: 0,
          rodadaAtual: sala.turnoRodadaAtual
        });
      }
    } else {
      // Notificar próximo jogador na mesma rodada
      const proximoJogador = sala.jogadoresNaPartida[sala.turnoAtual];
      io.to(codigo).emit('atualizarTurno', {
        jogadorId: proximoJogador.id,
        jogadorNome: proximoJogador.nome,
        turnoIndex: sala.turnoAtual,
        rodadaAtual: sala.turnoRodadaAtual
      });
    }
  });

  // Iniciar votação
  socket.on('iniciarVotacao', (codigo) => {
    const sala = salas.get(codigo);
    if (!sala || socket.id !== sala.host) return;
    
    sala.estado = 'votando';
    sala.votos = {};
    sala.jogadoresQueVotaram = new Set();
    
    // Enviar apenas jogadores que estão NA PARTIDA para votação
    io.to(codigo).emit('votacaoIniciada', {
      jogadores: sala.jogadoresNaPartida.map(j => ({ id: j.id, nome: j.nome }))
    });
  });

  // Encerrar partida (apenas host)
  socket.on('encerrarPartida', (codigo) => {
    const sala = salas.get(codigo);
    if (!sala || socket.id !== sala.host) return;
    
    console.log(`Host encerrou a partida na sala ${codigo}`);
    
    // Resetar estado da sala para lobby
    sala.estado = 'aguardando';
    sala.rodadaAtual = 0;
    sala.palavraAtual = null;
    sala.votos = {};
    sala.jogadoresQueVotaram = new Set();
    sala.jogadoresNaPartida = []; // Limpar jogadores da partida
    sala.dicas = []; // Limpar dicas
    sala.turnoAtual = 0;
    sala.turnoRodadaAtual = 0;
    sala.jogadoresQueEnviaramDica = new Set();
    
    // Resetar dados dos jogadores
    sala.jogadores.forEach(jogador => {
      jogador.isImpostor = false;
      jogador.palavra = null;
      jogador.votos = 0;
    });
    
    // Notificar todos os jogadores
    io.to(codigo).emit('partidaEncerrada');
    
    // Atualizar lista de jogadores no lobby
    setTimeout(() => {
      io.to(codigo).emit('atualizarJogadores', sala.jogadores);
    }, 3000); // 3 segundos para mostrar mensagem de encerramento
  });

  // Votar em jogador
  socket.on('votar', ({ codigo, jogadorVotadoId }) => {
    const sala = salas.get(codigo);
    if (!sala || sala.estado !== 'votando') return;
    if (sala.jogadoresQueVotaram.has(socket.id)) return;

    // Buscar jogador votado APENAS entre jogadores na partida
    const jogadorVotado = sala.jogadoresNaPartida.find(j => j.id === jogadorVotadoId);
    if (!jogadorVotado) return;

    jogadorVotado.votos++;
    sala.jogadoresQueVotaram.add(socket.id);

    // Verificar se todos os jogadores NA PARTIDA votaram
    if (sala.jogadoresQueVotaram.size === sala.jogadoresNaPartida.length) {
      // Determinar jogador mais votado (apenas entre jogadores na partida)
      const jogadoresOrdenados = [...sala.jogadoresNaPartida].sort((a, b) => b.votos - a.votos);
      const maisVotado = jogadoresOrdenados[0];
      const empate = jogadoresOrdenados[0].votos === jogadoresOrdenados[1]?.votos;

      const resultado = {
        maisVotado: maisVotado,
        empate: empate,
        palavraCorreta: sala.palavraAtual,
        imagemCarta: obterImagemCarta(sala.palavraAtual), // Todos veem a imagem no resultado
        votos: sala.jogadoresNaPartida.map(j => ({ nome: j.nome, votos: j.votos, isImpostor: j.isImpostor }))
      };

      io.to(codigo).emit('resultadoVotacao', resultado);

      // Aguardar host iniciar próxima rodada
      setTimeout(() => {
        sala.estado = 'resultado';
        io.to(codigo).emit('aguardandoProximaRodada', {
          rodadaAtual: sala.rodadaAtual
        });
      }, 5000);
    } else {
      // Atualizar votos parciais (apenas jogadores na partida)
      io.to(codigo).emit('votosAtualizados', {
        votos: sala.jogadoresNaPartida.map(j => ({ nome: j.nome, votos: j.votos }))
      });
    }
  });

  // Iniciar nova rodada (apenas host)
  socket.on('iniciarNovaRodada', (codigo) => {
    const sala = salas.get(codigo);
    if (!sala || socket.id !== sala.host) return;
    
    if (sala.estado !== 'resultado') return;
    
    // Incrementar rodada
    sala.rodadaAtual++;
    sala.estado = 'jogando';
    
    // Resetar dicas (modo online)
    sala.dicas = [];
    sala.turnoAtual = 0;
    sala.turnoRodadaAtual = 0;
    sala.jogadoresQueEnviaramDica = new Set();
    
    // Atualizar jogadoresNaPartida com TODOS os jogadores atuais (incluindo os que entraram durante a partida anterior)
    sala.jogadoresNaPartida = JSON.parse(JSON.stringify(sala.jogadores));
    
    // Selecionar nova palavra e novos impostores
    const novaPalavra = obterCartaAleatoria();
    sala.palavraAtual = novaPalavra;
    const novosImpostores = selecionarImpostores(sala.jogadoresNaPartida, sala.quantidadeImpostores);
    
    sala.jogadoresNaPartida.forEach((jogador, index) => {
      jogador.isImpostor = novosImpostores.includes(index);
      jogador.palavra = jogador.isImpostor ? null : novaPalavra;
      jogador.votos = 0;
    });

    sala.jogadoresNaPartida.forEach((jogador) => {
      io.to(jogador.id).emit('rodadaIniciada', {
        rodada: sala.rodadaAtual,
        palavra: jogador.palavra,
        isImpostor: jogador.isImpostor,
        imagemCarta: jogador.isImpostor ? null : obterImagemCarta(novaPalavra),
        modoJogo: sala.modoJogo
      });
    });

    // Se modo online, notificar quem é o primeiro a dar dica
    if (sala.modoJogo === 'online') {
      const primeiroJogador = sala.jogadoresNaPartida[0];
      io.to(codigo).emit('atualizarTurno', {
        jogadorId: primeiroJogador.id,
        jogadorNome: primeiroJogador.nome,
        turnoIndex: 0
      });
    }

    io.to(codigo).emit('atualizarJogadores', sala.jogadores);
    console.log(`Nova rodada ${sala.rodadaAtual} iniciada na sala ${codigo} com ${sala.jogadoresNaPartida.length} jogadores`);
  });

  // Desconexão
  socket.on('disconnect', () => {
    console.log('Jogador desconectado:', socket.id);
    
    // Remover jogador de todas as salas
    for (const [codigo, sala] of salas.entries()) {
      const index = sala.jogadores.findIndex(j => j.id === socket.id);
      if (index !== -1) {
        sala.jogadores.splice(index, 1);
        
        // Se era o host, transferir host para próximo jogador ou deletar sala
        if (sala.host === socket.id) {
          if (sala.jogadores.length > 0) {
            sala.host = sala.jogadores[0].id;
            io.to(sala.host).emit('tornouHost', true);
          } else {
            salas.delete(codigo);
            continue;
          }
        }
        
        io.to(codigo).emit('atualizarJogadores', sala.jogadores);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});

