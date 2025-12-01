const socket = io();

let codigoSalaAtual = null;
let isHost = false;
let nomeJogador = '';
let jogadores = [];
let modoJogo = 'presencial'; // 'presencial' ou 'online'

// Gerenciadores de Conectividade
let heartbeatManager = null;
let connectivityManager = null;

// Inicializar gerenciadores de conectividade
function inicializarGerenciadores() {
    // Criar ConnectivityManager para gerenciar Service Worker e detecção de fechamento
    connectivityManager = new ConnectivityManager({
        socket: socket, // Passar socket para detectar fechamento de janela
        statusCallback: (status, mensagem) => {
            console.log(`[Conectividade] ${status}: ${mensagem}`);
            // Poderia usar isso para debug, mas não será mostrado por padrão
        }
    });

    // Criar HeartbeatManager para manter ping com servidor
    heartbeatManager = new HeartbeatManager(socket, {
        pingInterval: 15000,      // Ping a cada 15 segundos
        pongTimeout: 240000,      // Timeout após 4 minutos sem pong
        maxReconnectAttempts: 10,
        reconnectDelay: 3000,
        statusCallback: (status, mensagem) => {
            atualizarStatusConexao(status, mensagem);
        }
    });
}

// Elementos da interface
const telas = {
    inicial: document.getElementById('telaInicial'),
    criarSala: document.getElementById('telaCriarSala'),
    entrarSala: document.getElementById('telaEntrarSala'),
    sala: document.getElementById('telaSala'),
    rodada: document.getElementById('telaRodada'),
    votacao: document.getElementById('telaVotacao'),
    resultado: document.getElementById('telaResultado'),
    fimJogo: document.getElementById('telaFimJogo'),
    partidaEncerrada: document.getElementById('telaPartidaEncerrada')
};

// Função para mudar de tela
function mostrarTela(tela) {
    Object.values(telas).forEach(t => t.classList.remove('ativa'));
    telas[tela].classList.add('ativa');
    
    // Adicionar classe especial ao container quando estiver na tela de rodada
    const container = document.querySelector('.container');
    if (tela === 'rodada') {
        container.classList.add('rodada-ativa');
    } else {
        container.classList.remove('rodada-ativa');
    }
}

// Event Listeners - Tela Inicial
document.getElementById('btnCriarSala').addEventListener('click', () => {
    mostrarTela('criarSala');
});

document.getElementById('btnEntrarSala').addEventListener('click', () => {
    mostrarTela('entrarSala');
});

// Event Listeners - Criar Sala
document.getElementById('btnConfirmarCriar').addEventListener('click', () => {
    const nome = document.getElementById('nomeCriar').value.trim();
    const modoSelecionado = document.querySelector('input[name="modoJogo"]:checked').value;
    
    if (nome) {
        nomeJogador = nome;
        modoJogo = modoSelecionado;
        socket.emit('criarSala', { nomeJogador: nome, modoJogo: modoSelecionado });
    }
});

document.getElementById('btnVoltarCriar').addEventListener('click', () => {
    mostrarTela('inicial');
});

// Event Listeners - Entrar em Sala
document.getElementById('btnConfirmarEntrar').addEventListener('click', () => {
    const codigo = document.getElementById('codigoSala').value.trim().toUpperCase();
    const nome = document.getElementById('nomeEntrar').value.trim();
    
    if (codigo && nome) {
        nomeJogador = nome;
        socket.emit('entrarSala', { codigo, nomeJogador: nome });
    }
});

document.getElementById('btnVoltarEntrar').addEventListener('click', () => {
    mostrarTela('inicial');
});

// Event Listeners - Sala
document.getElementById('btnCopiarCodigo').addEventListener('click', () => {
    const codigo = document.getElementById('codigoSalaDisplay').textContent;
    navigator.clipboard.writeText(codigo).then(() => {
        const btn = document.getElementById('btnCopiarCodigo');
        const textoOriginal = btn.textContent;
        btn.textContent = '✅ Copiado!';
        setTimeout(() => {
            btn.textContent = textoOriginal;
        }, 2000);
    });
});

document.getElementById('btnIniciarPartida').addEventListener('click', () => {
    if (jogadores.length < 3) {
        alert('É necessário pelo menos 3 jogadores para começar!');
        return;
    }
    socket.emit('iniciarPartida', codigoSalaAtual);
});

// Event Listeners - Configuração de Impostores
document.querySelectorAll('input[name="impostores"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (isHost) {
            socket.emit('configurarImpostores', {
                codigo: codigoSalaAtual,
                quantidade: parseInt(e.target.value)
            });
        }
    });
});

// Event Listeners - Rodada
document.getElementById('btnIniciarVotacao').addEventListener('click', () => {
    socket.emit('iniciarVotacao', codigoSalaAtual);
});

// Event Listeners - Encerrar Partida
document.getElementById('btnEncerrarPartidaRodada').addEventListener('click', () => {
    if (confirm('Tem certeza que deseja encerrar a partida? Todos voltarão ao lobby.')) {
        socket.emit('encerrarPartida', codigoSalaAtual);
    }
});

document.getElementById('btnEncerrarPartidaVotacao').addEventListener('click', () => {
    if (confirm('Tem certeza que deseja encerrar a partida? Todos voltarão ao lobby.')) {
        socket.emit('encerrarPartida', codigoSalaAtual);
    }
});

document.getElementById('btnEncerrarPartidaResultado').addEventListener('click', () => {
    if (confirm('Tem certeza que deseja encerrar a partida? Todos voltarão ao lobby.')) {
        socket.emit('encerrarPartida', codigoSalaAtual);
    }
});

// Event Listeners - Enviar Dica (Modo Online) - Desktop
document.getElementById('btnEnviarDica').addEventListener('click', () => {
    const dica = document.getElementById('inputDica').value.trim();
    if (dica) {
        socket.emit('enviarDica', { codigo: codigoSalaAtual, dica });
        document.getElementById('inputDica').value = '';
    }
});

// Pressionar Enter para enviar dica - Desktop
document.getElementById('inputDica').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('btnEnviarDica').click();
    }
});

// Event Listeners - Enviar Dica (Modo Online) - Mobile
document.getElementById('btnEnviarDicaMobile').addEventListener('click', () => {
    const dica = document.getElementById('inputDicaMobile').value.trim();
    if (dica) {
        socket.emit('enviarDica', { codigo: codigoSalaAtual, dica });
        document.getElementById('inputDicaMobile').value = '';
        document.getElementById('modalDicaMobile').style.display = 'none';
    }
});

// Pressionar Enter para enviar dica - Mobile
document.getElementById('inputDicaMobile').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('btnEnviarDicaMobile').click();
    }
});

// Event Listeners - Fechar Modal de Dica Mobile
document.getElementById('btnFecharModalDica').addEventListener('click', () => {
    document.getElementById('modalDicaMobile').style.display = 'none';
});

// Event Listeners - Abrir Modal de Dica Mobile
document.getElementById('btnAbrirModalDica').addEventListener('click', () => {
    document.getElementById('modalDicaMobile').style.display = 'flex';
    setTimeout(() => {
        document.getElementById('inputDicaMobile').focus();
    }, 100);
});

// Event Listeners - Nova Rodada
document.getElementById('btnNovaRodada').addEventListener('click', () => {
    socket.emit('iniciarNovaRodada', codigoSalaAtual);
});

// Event Listeners - Fim de Jogo
document.getElementById('btnNovaPartida').addEventListener('click', () => {
    location.reload();
});

document.getElementById('btnVoltarMenu').addEventListener('click', () => {
    location.reload();
});

// Event Listeners - Sair da Sala
document.getElementById('btnSairSala').addEventListener('click', () => {
    if (confirm('Tem certeza que deseja sair da sala?')) {
        socket.emit('sairDaSala', codigoSalaAtual);
        location.reload();
    }
});

// Socket Events - Sala Criada
socket.on('salaCriada', (data) => {
    codigoSalaAtual = data.codigo;
    isHost = data.isHost;
    modoJogo = data.modoJogo || 'presencial';
    document.getElementById('codigoSalaDisplay').textContent = data.codigo;
    mostrarTela('sala');
    atualizarConfigHost();
});

// Socket Events - Entrou na Sala
socket.on('entrouSala', (data) => {
    codigoSalaAtual = data.codigo;
    isHost = data.isHost;
    modoJogo = data.modoJogo || 'presencial';
    document.getElementById('codigoSalaDisplay').textContent = data.codigo;
    
    // Se partida já está em andamento, mostrar mensagem
    if (data.estadoSala && data.estadoSala !== 'aguardando' && data.estadoSala !== 'configurando') {
        mostrarTela('sala');
        alert('Partida já em andamento. Você entrará na próxima rodada!');
    } else {
        mostrarTela('sala');
    }
    
    atualizarConfigHost();
    document.getElementById('erroMensagem').classList.remove('ativo');
});

// Socket Events - Erro
socket.on('erro', (data) => {
    const erroDiv = document.getElementById('erroMensagem');
    erroDiv.textContent = data.mensagem;
    erroDiv.classList.add('ativo');
});

// Socket Events - Dica Duplicada
socket.on('dicaDuplicada', (data) => {
    alert(data.mensagem);
    console.log(`[Dica Duplicada] ${data.mensagem}`);
    // Input fica disponível para jogador tentar novamente
});

// Socket Events - Atualizar Jogadores
socket.on('atualizarJogadores', (listaJogadores) => {
    jogadores = listaJogadores;
    atualizarListaJogadores();
    atualizarConfigHost();
});

// Socket Events - Novo Host
socket.on('novoHost', (data) => {
    isHost = (socket.id === data.novoHostId);
    atualizarConfigHost();
    if (isHost) {
        alert('Você agora é o host da sala!');
    }
});

function atualizarListaJogadores() {
    const lista = document.getElementById('listaJogadores');
    const quantidade = document.getElementById('quantidadeJogadores');
    const listaRodada = document.getElementById('listaJogadoresRodada');
    const listaRodadaMobile = document.getElementById('listaJogadoresMobile');
    
    lista.innerHTML = '';
    if (listaRodada) listaRodada.innerHTML = '';
    if (listaRodadaMobile) listaRodadaMobile.innerHTML = '';
    
    quantidade.textContent = jogadores.length;
    
    jogadores.forEach(jogador => {
        const li = document.createElement('li');
        li.textContent = jogador.nome;
        if (jogador.id === socket.id && isHost) {
            li.classList.add('host');
        }
        lista.appendChild(li);
        
        // Desktop
        if (listaRodada) {
            const liRodada = document.createElement('li');
            liRodada.textContent = jogador.nome;
            if (jogador.id === socket.id && isHost) {
                liRodada.classList.add('host');
            }
            listaRodada.appendChild(liRodada);
        }

        // Mobile
        if (listaRodadaMobile) {
            const liMobile = document.createElement('li');
            liMobile.textContent = jogador.nome;
            if (jogador.id === socket.id && isHost) {
                liMobile.classList.add('host');
            }
            listaRodadaMobile.appendChild(liMobile);
        }
    });
    
    // Mostrar/ocultar mensagem de aguardo
    const aguardando = document.getElementById('aguardandoJogadores');
    if (aguardando) {
        if (jogadores.length < 3) {
            aguardando.style.display = 'block';
        } else {
            aguardando.style.display = 'none';
        }
    }
}

function atualizarConfigHost() {
    const configHost = document.getElementById('configHost');
    if (configHost) {
        configHost.style.display = isHost ? 'block' : 'none';
    }
    
    const controlesHost = document.getElementById('controlesHost');
    if (controlesHost) {
        controlesHost.style.display = isHost ? 'block' : 'none';
    }

    const controlesHostVotacao = document.getElementById('controlesHostVotacao');
    if (controlesHostVotacao) {
        controlesHostVotacao.style.display = isHost ? 'block' : 'none';
    }
}

// Socket Events - Configuração Atualizada
socket.on('configuracaoAtualizada', (data) => {
    const radio = document.querySelector(`input[name="impostores"][value="${data.quantidadeImpostores}"]`);
    if (radio) {
        radio.checked = true;
    }
});

// Socket Events - Rodada Iniciada
socket.on('rodadaIniciada', (data) => {
    document.getElementById('rodadaAtual').textContent = data.rodada;
    
    const imagemCarta = document.getElementById('imagemCarta');
    const secaoDicasOnline = document.getElementById('secaoDicasOnline');
    const secaoDicasMobile = document.getElementById('secaoDicasMobile');
    
    // Atualizar modoJogo se recebido
    if (data.modoJogo) {
        modoJogo = data.modoJogo;
    }
    
    if (data.isImpostor) {
        document.getElementById('infoNormal').style.display = 'none';
        document.getElementById('infoImpostor').style.display = 'block';
        document.getElementById('palavraSecreta').textContent = '';
        imagemCarta.style.display = 'none'; // Impostor não vê imagem
    } else {
        document.getElementById('infoNormal').style.display = 'block';
        document.getElementById('infoImpostor').style.display = 'none';
        document.getElementById('palavraSecreta').textContent = data.palavra;
        
        // Exibir imagem da carta se disponível
        if (data.imagemCarta) {
            imagemCarta.src = `/imagens/cartas/${data.imagemCarta}`;
            imagemCarta.alt = data.palavra;
            imagemCarta.style.display = 'block';
        } else {
            imagemCarta.style.display = 'none';
        }
    }
    
    // Mostrar seção de dicas se modo online
    if (modoJogo === 'online') {
        if (secaoDicasOnline) secaoDicasOnline.style.display = 'block';
        if (secaoDicasMobile) secaoDicasMobile.style.display = 'block';
        
        document.getElementById('listaDicas').innerHTML = '';
        const listaDicasMobile = document.getElementById('listaDicasMobile');
        if (listaDicasMobile) listaDicasMobile.innerHTML = '';
        
        document.getElementById('campoEnviarDica').style.display = 'none';
        document.getElementById('aguardandoTurno').style.display = 'none';
        document.getElementById('modalDicaMobile').style.display = 'none';
        
        // Ocultar botão de votação até completar 3 turnos
        document.getElementById('btnIniciarVotacao').style.display = 'none';
    } else {
        if (secaoDicasOnline) secaoDicasOnline.style.display = 'none';
        if (secaoDicasMobile) secaoDicasMobile.style.display = 'none';
        
        // Mostrar botão de votação no modo presencial
        if (isHost) {
            document.getElementById('btnIniciarVotacao').style.display = 'inline-block';
        }
    }
    
    mostrarTela('rodada');
    atualizarListaJogadores();
});

// Socket Events - Votação Iniciada
socket.on('votacaoIniciada', (data) => {
    const lista = document.getElementById('listaVotacao');
    lista.innerHTML = '';
    
    data.jogadores.forEach(jogador => {
        if (jogador.id !== socket.id) {
            const li = document.createElement('li');
            li.textContent = jogador.nome;
            li.dataset.id = jogador.id;
            li.addEventListener('click', () => {
                // Remover seleção anterior
                lista.querySelectorAll('li').forEach(item => {
                    item.classList.remove('votado');
                });
                
                // Marcar como votado
                li.classList.add('votado');
                
                // Enviar voto
                socket.emit('votar', {
                    codigo: codigoSalaAtual,
                    jogadorVotadoId: jogador.id
                });
            });
            lista.appendChild(li);
        }
    });
    
    mostrarTela('votacao');
});

// Socket Events - Votos Atualizados
socket.on('votosAtualizados', (data) => {
    const lista = document.getElementById('listaVotosParciais');
    if (!lista) return;
    
    lista.innerHTML = '';
    data.votos.forEach(voto => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${voto.nome}</span> <span>${voto.votos} voto(s)</span>`;
        lista.appendChild(li);
    });
});

// Socket Events - Resultado da Votação
socket.on('resultadoVotacao', (data) => {
    const resultadoDiv = document.getElementById('resultadoConteudo');
    const palavraDiv = document.getElementById('resultadoPalavra');
    const votosDiv = document.getElementById('resultadoVotos');
    const imagemCartaResultado = document.getElementById('imagemCartaResultado');
    
    resultadoDiv.innerHTML = '';
    
    if (data.empate) {
        resultadoDiv.innerHTML = '<h3>🤝 Empate na votação!</h3>';
    } else {
        const maisVotado = data.maisVotado;
        resultadoDiv.innerHTML = `
            <h3>${maisVotado.isImpostor ? '✅ Correto!' : '❌ Errado!'}</h3>
            <p><strong>${maisVotado.nome}</strong> foi o mais votado.</p>
            <p>${maisVotado.isImpostor ? 'Era realmente o impostor!' : 'Não era o impostor!'}</p>
        `;
    }
    
    // Exibir imagem da carta no resultado (todos veem)
    if (data.imagemCarta) {
        imagemCartaResultado.src = `/imagens/cartas/${data.imagemCarta}`;
        imagemCartaResultado.alt = data.palavraCorreta;
        imagemCartaResultado.style.display = 'block';
    } else {
        imagemCartaResultado.style.display = 'none';
    }
    
    palavraDiv.innerHTML = `<p><strong>Palavra correta:</strong> ${data.palavraCorreta}</p>`;
    
    votosDiv.innerHTML = '<h3>Votos Recebidos:</h3><ul></ul>';
    const votosLista = votosDiv.querySelector('ul');
    
    data.votos.forEach(voto => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${voto.nome}</span> <span>${voto.votos} voto(s)</span>`;
        if (voto.isImpostor) {
            li.classList.add('impostor');
        }
        votosLista.appendChild(li);
    });
    
    mostrarTela('resultado');
});

// Socket Events - Aguardando Próxima Rodada
socket.on('aguardandoProximaRodada', (data) => {
    // Mostrar botão de nova rodada apenas para o host
    const controlesNovaRodada = document.getElementById('controlesNovaRodada');
    if (controlesNovaRodada && isHost) {
        controlesNovaRodada.style.display = 'block';
    }
});

// Socket Events - Partida Encerrada
socket.on('partidaEncerrada', () => {
    console.log('Partida encerrada pelo host');
    
    // Mostrar tela de partida encerrada
    mostrarTela('partidaEncerrada');
    
    // Após 3 segundos, voltar ao lobby
    setTimeout(() => {
        mostrarTela('sala');
        atualizarConfigHost();
    }, 3000);
});

// Socket Events - Modo Online: Atualizar Turno
socket.on('atualizarTurno', (data) => {
    const campoEnviarDica = document.getElementById('campoEnviarDica');
    const aguardandoTurno = document.getElementById('aguardandoTurno');
    const turnoAtual = document.getElementById('turnoAtual');
    const turnoAtualMobile = document.getElementById('turnoAtualMobile');
    const modalDicaMobile = document.getElementById('modalDicaMobile');
    const btnAbrirModalDica = document.getElementById('btnAbrirModalDica');
    
    // Atualizar texto do turno
    if (turnoAtual) turnoAtual.textContent = `Turno de: ${data.jogadorNome}`;
    if (turnoAtualMobile) turnoAtualMobile.textContent = `Turno: ${data.jogadorNome}`;
    
    if (data.jogadorId === socket.id) {
        // É meu turno
        if (window.innerWidth <= 600) {
            // Mobile: Mostrar modal e botão
            if (modalDicaMobile) modalDicaMobile.style.display = 'flex';
            if (btnAbrirModalDica) btnAbrirModalDica.style.display = 'block';
            setTimeout(() => {
                document.getElementById('inputDicaMobile').focus();
            }, 100);
        } else {
            // Desktop: Mostrar campo inline
            if (campoEnviarDica) campoEnviarDica.style.display = 'block';
            if (aguardandoTurno) aguardandoTurno.style.display = 'none';
            document.getElementById('inputDica').focus();
        }
    } else {
        // Não é meu turno
        if (campoEnviarDica) campoEnviarDica.style.display = 'none';
        if (aguardandoTurno) aguardandoTurno.style.display = 'block';
        if (modalDicaMobile) modalDicaMobile.style.display = 'none';
        if (btnAbrirModalDica) btnAbrirModalDica.style.display = 'none';
    }
});

// Socket Events - Modo Online: Nova Dica Enviada
socket.on('novaDica', (data) => {
    const listaDicas = document.getElementById('listaDicas');
    const listaDicasMobile = document.getElementById('listaDicasMobile');
    
    const dicaElement = document.createElement('div');
    dicaElement.className = 'dica-item';
    dicaElement.innerHTML = `
        <strong>${data.jogadorNome}:</strong>
        <span>${data.dica}</span>
    `;
    
    // Desktop
    if (listaDicas) {
        listaDicas.appendChild(dicaElement.cloneNode(true));
        listaDicas.scrollTop = listaDicas.scrollHeight;
    }

    // Mobile
    if (listaDicasMobile) {
        listaDicasMobile.appendChild(dicaElement);
        listaDicasMobile.scrollTop = listaDicasMobile.scrollHeight;
    }
});

// Socket Events - Modo Online: Todas Dicas Enviadas
socket.on('todasDicasEnviadas', (data) => {
    document.getElementById('campoEnviarDica').style.display = 'none';
    document.getElementById('aguardandoTurno').style.display = 'none';
    
    const turnoAtual = document.getElementById('turnoAtual');
    const turnoAtualMobile = document.getElementById('turnoAtualMobile');
    
    if (turnoAtual) turnoAtual.textContent = '✅ Todas as 3 rodadas de dicas foram enviadas!';
    if (turnoAtualMobile) turnoAtualMobile.textContent = '✅ Rodadas completas!';
    
    // Mostrar botão de votação apenas para o host
    if (data.mostrarBotaoVotacao && isHost) {
        document.getElementById('btnIniciarVotacao').style.display = 'inline-block';
    }
});

// Socket Events - Modo Online: Rodada de Dicas Completa
socket.on('rodadaDicasCompleta', (data) => {
    const rodadaAtual = data.rodadaAtual + 1; // Converter 0,1,2 para 1,2,3
    document.getElementById('turnoAtual').textContent = `✅ Rodada ${rodadaAtual - 1}/3 concluída! Iniciando rodada ${rodadaAtual}/3...`;
});

// Socket Events - Jogo Finalizado
socket.on('jogoFinalizado', (data) => {
    const resultadoFinal = document.getElementById('resultadoFinal');
    resultadoFinal.innerHTML = '<h3>Resultado Final - Identidades Reveladas</h3><ul></ul>';
    const lista = resultadoFinal.querySelector('ul');
    
    data.jogadores.forEach(jogador => {
        const li = document.createElement('li');
        li.textContent = `${jogador.nome} ${jogador.isImpostor ? '(🕵️ Impostor)' : '(👤 Jogador)'}`;
        if (jogador.isImpostor) {
            li.classList.add('impostor');
        }
        lista.appendChild(li);
    });
    
    // Mostrar após um breve delay para permitir que vejam o último resultado
    setTimeout(() => {
        mostrarTela('fimJogo');
    }, 3000);
});

// Socket Events - Tornou Host
socket.on('tornouHost', (data) => {
    isHost = true;
    atualizarConfigHost();
});

// Limpar inputs ao voltar
document.getElementById('btnVoltarCriar').addEventListener('click', () => {
    document.getElementById('nomeCriar').value = '';
});

document.getElementById('btnVoltarEntrar').addEventListener('click', () => {
    document.getElementById('codigoSala').value = '';
    document.getElementById('nomeEntrar').value = '';
    document.getElementById('erroMensagem').classList.remove('ativo');
});

// Função para atualizar status visual de conexão
function atualizarStatusConexao(status, mensagem) {
    const indicador = document.getElementById('statusIndicador');
    const texto = document.getElementById('statusTexto');
    
    if (!indicador || !texto) return;

    // Mapear status para classe CSS
    const statusClasses = {
        'conectado': ['conectado', 'Conectado'],
        'desconectado': ['desconectado', 'Desconectado'],
        'reconectando': ['reconectando', 'Reconectando...'],
        'falha-reconexao': ['erro', 'Erro na reconexão'],
        'pong-recebido': ['conectado', 'Conectado'],
        'erro-conexao': ['erro', 'Erro de conexão'],
        'wake-lock-ativo': ['conectado', 'Tela mantida ativa'],
        'background-ping': ['conectado', 'Em background'],
    };

    const [classe, textoStatus] = statusClasses[status] || ['desconectado', mensagem];
    
    // Remover classes anteriores
    indicador.className = 'status-indicador';
    indicador.classList.add(classe);
    texto.textContent = textoStatus;
}

// Adicionar classe para imagem de fundo apenas na tela inicial
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('tela-inicial-ativa');
    inicializarGerenciadores();

    // Listener para voltar para tela inicial
    document.addEventListener('click', (e) => {
        if (e.target.id === 'btnVoltarCriar' || e.target.id === 'btnVoltarEntrar') {
            document.body.classList.add('tela-inicial-ativa');
        } else if (e.target.id === 'btnCriarSala' || e.target.id === 'btnEntrarSala') {
            document.body.classList.remove('tela-inicial-ativa');
        }
    });

    // Listener para visibilidade da página (quando volta do background)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Página voltou ao foco
            console.log('[App] Página voltou ao foco');
            if (heartbeatManager) {
                heartbeatManager.startHeartbeat();
            }
        } else {
            // Página entrou em background
            console.log('[App] Página entrou em background');
            // O heartbeat continuará rodando via Service Worker
        }
    });

    // Tentar reconectar se a página voltar online
    window.addEventListener('online', () => {
        console.log('[App] Conexão online detectada');
        if (socket && !socket.connected) {
            socket.connect();
        }
    });

    window.addEventListener('offline', () => {
        console.log('[App] Conexão offline detectada');
    });
});

