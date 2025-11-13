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
  const PING_TIMEOUT = 90000; // 90 segundos
  
  // Monitorar inatividade do cliente
  const pingCheckInterval = setInterval(() => {
    const timeSincePing = Date.now() - lastPing;
    if (timeSincePing > PING_TIMEOUT) {
      console.log(`[Heartbeat] Cliente ${socket.id} inativo por ${timeSincePing}ms. Desconectando...`);
      socket.disconnect(true);
    }
  }, 30000); // Verificar a cada 30 segundos

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
  socket.on('criarSala', (nomeJogador) => {
    const codigo = gerarCodigoSala();
    const sala = {
      codigo,
      host: socket.id,
      jogadores: [{
        id: socket.id,
        nome: nomeJogador,
        isImpostor: false,
        palavra: null,
        votos: 0
      }],
      estado: 'aguardando', // aguardando, configurando, jogando, votando, resultado
      rodadaAtual: 0,
      quantidadeImpostores: 1,
      palavraAtual: null,
      votos: {},
      jogadoresQueVotaram: new Set()
    };
    
    salas.set(codigo, sala);
    socket.join(codigo);
    socket.emit('salaCriada', { codigo, isHost: true });
    socket.emit('atualizarJogadores', sala.jogadores);
    console.log(`Sala criada: ${codigo} por ${nomeJogador}`);
  });

  // Entrar em sala
  socket.on('entrarSala', ({ codigo, nomeJogador }) => {
    const sala = salas.get(codigo);
    
    if (!sala) {
      socket.emit('erro', { mensagem: 'Sala não encontrada!' });
      return;
    }

    if (sala.estado !== 'aguardando' && sala.estado !== 'configurando') {
      socket.emit('erro', { mensagem: 'A partida já começou!' });
      return;
    }

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
    socket.emit('entrouSala', { codigo, isHost: socket.id === sala.host });
    io.to(codigo).emit('atualizarJogadores', sala.jogadores);
    console.log(`${nomeJogador} entrou na sala ${codigo}`);
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

    // Selecionar impostores
    const impostores = selecionarImpostores(sala.jogadores, sala.quantidadeImpostores);
    const palavra = obterCartaAleatoria();
    sala.palavraAtual = palavra;

    // Distribuir palavras
    sala.jogadores.forEach((jogador, index) => {
      jogador.isImpostor = impostores.includes(index);
      jogador.palavra = jogador.isImpostor ? null : palavra;
      jogador.votos = 0;
    });

    // Notificar jogadores
    sala.jogadores.forEach((jogador) => {
      io.to(jogador.id).emit('rodadaIniciada', {
        rodada: sala.rodadaAtual,
        totalRodadas: sala.totalRodadas,
        palavra: jogador.palavra,
        isImpostor: jogador.isImpostor
      });
    });

    io.to(codigo).emit('atualizarJogadores', sala.jogadores);
    console.log(`Partida iniciada na sala ${codigo}, rodada ${sala.rodadaAtual}`);
  });

  // Iniciar votação
  socket.on('iniciarVotacao', (codigo) => {
    const sala = salas.get(codigo);
    if (!sala || socket.id !== sala.host) return;
    
    sala.estado = 'votando';
    sala.votos = {};
    sala.jogadoresQueVotaram = new Set();
    
    io.to(codigo).emit('votacaoIniciada', {
      jogadores: sala.jogadores.map(j => ({ id: j.id, nome: j.nome }))
    });
  });

  // Votar em jogador
  socket.on('votar', ({ codigo, jogadorVotadoId }) => {
    const sala = salas.get(codigo);
    if (!sala || sala.estado !== 'votando') return;
    if (sala.jogadoresQueVotaram.has(socket.id)) return;

    const jogadorVotado = sala.jogadores.find(j => j.id === jogadorVotadoId);
    if (!jogadorVotado) return;

    jogadorVotado.votos++;
    sala.jogadoresQueVotaram.add(socket.id);

    // Verificar se todos votaram
    if (sala.jogadoresQueVotaram.size === sala.jogadores.length) {
      // Determinar jogador mais votado
      const jogadoresOrdenados = [...sala.jogadores].sort((a, b) => b.votos - a.votos);
      const maisVotado = jogadoresOrdenados[0];
      const empate = jogadoresOrdenados[0].votos === jogadoresOrdenados[1]?.votos;

      const resultado = {
        maisVotado: maisVotado,
        empate: empate,
        palavraCorreta: sala.palavraAtual,
        votos: sala.jogadores.map(j => ({ nome: j.nome, votos: j.votos, isImpostor: j.isImpostor }))
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
      // Atualizar votos parciais
      io.to(codigo).emit('votosAtualizados', {
        votos: sala.jogadores.map(j => ({ nome: j.nome, votos: j.votos }))
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
    
    // Selecionar nova palavra e novos impostores
    const novaPalavra = obterCartaAleatoria();
    sala.palavraAtual = novaPalavra;
    const novosImpostores = selecionarImpostores(sala.jogadores, sala.quantidadeImpostores);
    
    sala.jogadores.forEach((jogador, index) => {
      jogador.isImpostor = novosImpostores.includes(index);
      jogador.palavra = jogador.isImpostor ? null : novaPalavra;
      jogador.votos = 0;
    });

    sala.jogadores.forEach((jogador) => {
      io.to(jogador.id).emit('rodadaIniciada', {
        rodada: sala.rodadaAtual,
        palavra: jogador.palavra,
        isImpostor: jogador.isImpostor
      });
    });

    io.to(codigo).emit('atualizarJogadores', sala.jogadores);
    console.log(`Rodada ${sala.rodadaAtual} iniciada na sala ${codigo}`);
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

