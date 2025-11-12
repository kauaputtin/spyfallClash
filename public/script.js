const socket = io();

let codigoSalaAtual = null;
let isHost = false;
let nomeJogador = '';
let jogadores = [];

// Elementos da interface
const telas = {
    inicial: document.getElementById('telaInicial'),
    criarSala: document.getElementById('telaCriarSala'),
    entrarSala: document.getElementById('telaEntrarSala'),
    sala: document.getElementById('telaSala'),
    rodada: document.getElementById('telaRodada'),
    votacao: document.getElementById('telaVotacao'),
    resultado: document.getElementById('telaResultado'),
    fimJogo: document.getElementById('telaFimJogo')
};

// Função para mudar de tela
function mostrarTela(tela) {
    Object.values(telas).forEach(t => t.classList.remove('ativa'));
    telas[tela].classList.add('ativa');
    
    // Adicionar/remover classe no body para imagem de fundo
    if (tela === 'inicial') {
        document.body.classList.add('tela-inicial-ativa');
    } else {
        document.body.classList.remove('tela-inicial-ativa');
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
    if (nome) {
        nomeJogador = nome;
        socket.emit('criarSala', nome);
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

// Event Listeners - Fim de Jogo
document.getElementById('btnNovaPartida').addEventListener('click', () => {
    location.reload();
});

document.getElementById('btnVoltarMenu').addEventListener('click', () => {
    location.reload();
});

// Socket Events - Sala Criada
socket.on('salaCriada', (data) => {
    codigoSalaAtual = data.codigo;
    isHost = data.isHost;
    document.getElementById('codigoSalaDisplay').textContent = data.codigo;
    mostrarTela('sala');
    atualizarConfigHost();
});

// Socket Events - Entrou na Sala
socket.on('entrouSala', (data) => {
    codigoSalaAtual = data.codigo;
    isHost = data.isHost;
    document.getElementById('codigoSalaDisplay').textContent = data.codigo;
    mostrarTela('sala');
    atualizarConfigHost();
    document.getElementById('erroMensagem').classList.remove('ativo');
});

// Socket Events - Erro
socket.on('erro', (data) => {
    const erroDiv = document.getElementById('erroMensagem');
    erroDiv.textContent = data.mensagem;
    erroDiv.classList.add('ativo');
});

// Socket Events - Atualizar Jogadores
socket.on('atualizarJogadores', (listaJogadores) => {
    jogadores = listaJogadores;
    atualizarListaJogadores();
    atualizarConfigHost();
});

function atualizarListaJogadores() {
    const lista = document.getElementById('listaJogadores');
    const quantidade = document.getElementById('quantidadeJogadores');
    const listaRodada = document.getElementById('listaJogadoresRodada');
    
    lista.innerHTML = '';
    if (listaRodada) listaRodada.innerHTML = '';
    
    quantidade.textContent = jogadores.length;
    
    jogadores.forEach(jogador => {
        const li = document.createElement('li');
        li.textContent = jogador.nome;
        if (jogador.id === socket.id && isHost) {
            li.classList.add('host');
        }
        lista.appendChild(li);
        
        if (listaRodada) {
            const liRodada = document.createElement('li');
            liRodada.textContent = jogador.nome;
            if (jogador.id === socket.id && isHost) {
                liRodada.classList.add('host');
            }
            listaRodada.appendChild(liRodada);
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
    document.getElementById('totalRodadas').textContent = data.totalRodadas;
    
    if (data.isImpostor) {
        document.getElementById('infoNormal').style.display = 'none';
        document.getElementById('infoImpostor').style.display = 'block';
        document.getElementById('palavraSecreta').textContent = '';
    } else {
        document.getElementById('infoNormal').style.display = 'block';
        document.getElementById('infoImpostor').style.display = 'none';
        document.getElementById('palavraSecreta').textContent = data.palavra;
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

// Enter key para inputs
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        if (document.getElementById('nomeCriar').value.trim()) {
            document.getElementById('btnConfirmarCriar').click();
        }
        if (document.getElementById('codigoSala').value.trim() && 
            document.getElementById('nomeEntrar').value.trim()) {
            document.getElementById('btnConfirmarEntrar').click();
        }
    }
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

// Adicionar classe para imagem de fundo na tela inicial ao carregar
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('tela-inicial-ativa');
});

