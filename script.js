// =================================================================
// === VARIÁVEIS DE CONFIGURAÇÃO (AJUSTAR AQUI) ====================
// =================================================================

// Função utilitária para gerar avatares aleatórios (simulando uma foto)
const gerarAvatar = (nome) => `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&size=80&background=00FFFF&color=1A1A1A&bold=true`; // Cor do Grafite

const PARTICIPANTES = [
    // Total de 12 Participantes
    { id: 'u1', nome: 'Cristiane', foto: gerarAvatar('Cristiane') },
    { id: 'u2', nome: 'Emily', foto: gerarAvatar('Emily') },
    { id: 'u3', nome: 'Jeane', foto: gerarAvatar('Jeane') },
    { id: 'u4', nome: 'Jennifer', foto: gerarAvatar('Jennifer') },
    { id: 'u5', nome: 'João Vitor', foto: gerarAvatar('João Vitor') },
    { id: 'u6', nome: 'Juliana', foto: gerarAvatar('Juliana') },
    { id: 'u7', nome: 'Mônica', foto: gerarAvatar('Mônica') },
    { id: 'u8', nome: 'Nelson', foto: gerarAvatar('Nelson') },
    { id: 'u9', nome: 'Rafael', foto: gerarAvatar('Rafael') },
    { id: 'u10', nome: 'Rodrigo', foto: gerarAvatar('Rodrigo') },
    { id: 'u11', nome: 'Suellen', foto: gerarAvatar('Suellen') },
    { id: 'u12', nome: 'Thiago', foto: gerarAvatar('Thiago') }, 
];

// DATA LIMITE para alterar palpites - 23 de Dezembro de 2025 às 23:59:59
const DATA_LIMITE_ENVIO = new Date(2025, 11, 23, 23, 59, 59); 

// --- Configuração Financeira ---
const VALOR_APOSTA_POR_PESSOA = 10.00; // R$ 10.00 por pessoa

// --- GABARITO (SOLUÇÃO CORRETA) ---
const GABARITO = {
    // PREENCHA ISTO SÓ DEPOIS DO EVENTO! 
    'u1': '', 'u2': '', 'u3': '', 'u4': '', 'u5': '', 'u6': '',
    'u7': '', 'u8': '', 'u9': '', 'u10': '', 'u11': '', 'u12': '',
};


// =================================================================
// === VARIÁVEIS DE ESTADO E DOM ===================================
// =================================================================

const NUMERO_PARTICIPANTES = PARTICIPANTES.length;
const STORAGE_KEY_PREFIX = 'bolao_palpites_';
let usuarioLogadoId = 'u1'; 
let edicaoPermitida = true;
let timerInterval;

// Elementos DOM (HTML)
const palpiteContainer = document.getElementById('palpite-container');
const modal = document.getElementById('modal-palpite');
const closeBtn = document.querySelector('.close-btn');
const quemTirouNomeDisplay = document.getElementById('quemTirouNome');
const listaAmigosSecretos = document.getElementById('lista-amigos-secretos');
const dataLimiteDisplay = document.getElementById('dataLimiteDisplay');
const overlayBloqueio = document.getElementById('overlay-bloqueio');
const userSelect = document.getElementById('user-select');
const countdownTimer = document.getElementById('countdown-timer');
const countdownFinished = document.getElementById('countdown-finished');
const daysDisplay = document.getElementById('days');
const hoursDisplay = document.getElementById('hours');
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const showResultsBtn = document.getElementById('showResultsBtn');
const exportBtn = document.getElementById('exportBtn');


// =================================================================
// === FUNÇÕES DE LÓGICA DE DADOS ==================================
// =================================================================

function carregarMeusPalpites() {
    const key = STORAGE_KEY_PREFIX + usuarioLogadoId;
    const json = localStorage.getItem(key);
    try {
        return json ? JSON.parse(json) : {};
    } catch (e) {
        console.error("Erro ao carregar palpites:", e);
        return {};
    }
}

function salvarPalpite(quemTirouId, amigoSecretoId) {
    if (!edicaoPermitida) return;

    const meusPalpites = carregarMeusPalpites();
    meusPalpites[quemTirouId] = amigoSecretoId;

    const key = STORAGE_KEY_PREFIX + usuarioLogadoId;
    localStorage.setItem(key, JSON.stringify(meusPalpites));
    
    renderizarPalpites(); 
}

function exportarPalpites() {
    const meusPalpites = carregarMeusPalpites();
    const nomeUsuario = PARTICIPANTES.find(p => p.id === usuarioLogadoId)?.nome || 'Desconhecido';
    
    const dadosExportados = {
        usuarioId: usuarioLogadoId,
        usuarioNome: nomeUsuario,
        palpites: meusPalpites,
        dataHoraExportacao: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(dadosExportados, null, 2);

    const tempElement = document.createElement('textarea');
    tempElement.value = jsonString;
    document.body.appendChild(tempElement);
    
    tempElement.select();
    tempElement.setSelectionRange(0, 99999); 
    
    try {
        document.execCommand('copy');
        alert(`Dados de ${nomeUsuario} copiados para a área de transferência! Cole em um ficheiro de texto.`);
    } catch (err) {
        alert('Não foi possível copiar automaticamente. Por favor, copie o JSON manualmente.');
        console.error('Falha na cópia:', err);
    }
    
    document.body.removeChild(tempElement);
    document.getElementById('export-output')?.remove();
}


// =================================================================
// === FUNÇÕES DE TEMPORIZAÇÃO E VALIDAÇÃO =========================
// =================================================================

function verificarDataLimite() {
    const hoje = new Date();
    
    if (hoje > DATA_LIMITE_ENVIO) {
        edicaoPermitida = false;
        overlayBloqueio.style.display = 'flex';
        clearInterval(timerInterval);
        
        countdownTimer.style.display = 'none';
        document.getElementById('countdown-finished').style.display = 'block';

    } else {
        edicaoPermitida = true;
        overlayBloqueio.style.display = 'none';
        
        // CORREÇÃO: Inicializa ou mantém o intervalo APENAS se não estiver ativo
        if (!timerInterval) {
            timerInterval = setInterval(iniciarContagemRegressiva, 1000); 
        }
        
        countdownTimer.style.display = 'block';
        document.getElementById('countdown-finished').style.display = 'none';
    }
    
    dataLimiteDisplay.textContent = DATA_LIMITE_ENVIO.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    verificarModoResultados();
}

function iniciarContagemRegressiva() {
    const agora = new Date().getTime();
    const diferenca = DATA_LIMITE_ENVIO.getTime() - agora;

    const umSegundo = 1000;
    const umMinuto = umSegundo * 60;
    const umaHora = umMinuto * 60;
    const umDia = umaHora * 24;

    if (diferenca < 0) {
        clearInterval(timerInterval);
        timerInterval = null; // Limpa o intervalo
        verificarDataLimite(); 
        return;
    }

    const dias = Math.floor(diferenca / umDia);
    const horas = Math.floor((diferenca % umDia) / umaHora);
    const minutos = Math.floor((diferenca % umaHora) / umMinuto);
    const segundos = Math.floor((diferenca % umMinuto) / umSegundo);

    daysDisplay.textContent = String(dias).padStart(2, '0');
    hoursDisplay.textContent = String(horas).padStart(2, '0');
    minutesDisplay.textContent = String(minutos).padStart(2, '0');
    secondsDisplay.textContent = String(segundos).padStart(2, '0');
}


// =================================================================
// === FUNÇÕES DE INTERFACE (DOM) ==================================
// =================================================================

function renderizarSumarioFinanceiro() {
    const totalArrecadado = VALOR_APOSTA_POR_PESSOA * NUMERO_PARTICIPANTES;

    document.getElementById('valorPalpiteDisplay').textContent = VALOR_APOSTA_POR_PESSOA.toFixed(2).replace('.', ',');
    document.getElementById('numParticipantesDisplay').textContent = NUMERO_PARTICIPANTES;
    document.getElementById('numPalpitesDisplay').textContent = NUMERO_PARTICIPANTES - 1; 
    
    document.getElementById('premioTotalDisplay').textContent = totalArrecadado.toFixed(2).replace('.', ',');
}

function renderizarPalpites() {
    const meusPalpites = carregarMeusPalpites();
    palpiteContainer.innerHTML = ''; 

    PARTICIPANTES.forEach(participante => {
        const palpiteId = meusPalpites[participante.id];
        const palpiteNome = PARTICIPANTES.find(p => p.id === palpiteId)?.nome || 'Não Palpitado (Clique para escolher)';
        
        const isSelf = participante.id === usuarioLogadoId; 
        
        const card = document.createElement('div');
        card.classList.add('palpite-card');
        if (palpiteId) { card.classList.add('selecionado'); }
        if (!edicaoPermitida || isSelf) { card.classList.add('bloqueado'); }

        card.innerHTML = `
            <img src="${participante.foto}" alt="Avatar de ${participante.nome}" class="avatar">
            <div class="palpite-info">
                <div>
                    <p class="palpite-quem-tirou">${participante.nome}</p>
                    ${isSelf ? '<p style="color: #FF00FF; font-weight: bold; font-size: 12px;">(És tu! Palpite bloqueado.)</p>' : ''}
                </div>
                <p class="palpite-atual">${palpiteNome} ${!isSelf && !edicaoPermitida ? '🔒' : (!isSelf ? '➡️' : '')}</p>
            </div>
        `;
        
        if (edicaoPermitida && !isSelf) {
            card.addEventListener('click', () => abrirModalPalpite(participante.id, participante.nome));
        }

        palpiteContainer.appendChild(card);
    });
}

function abrirModalPalpite(id, nome) {
    if (!edicaoPermitida) return;

    participanteAdivinhadoId = id;
    quemTirouNomeDisplay.textContent = nome;
    listaAmigosSecretos.innerHTML = ''; 
    
    const meusPalpites = carregarMeusPalpites();
    const amigosSecretosJaEscolhidos = Object.values(meusPalpites);

    PARTICIPANTES.forEach(amigo => { 
        const btn = document.createElement('button');
        btn.textContent = `Acho que é **${amigo.nome}**`;
        
        const naoESiProprio = amigo.id !== id;
        const isCurrentChoice = amigo.id === meusPalpites[id];
        const isChosenByOther = amigosSecretosJaEscolhidos.includes(amigo.id) && !isCurrentChoice;
        
        if (naoESiProprio && !isChosenByOther) {
            btn.addEventListener('click', () => {
                salvarPalpite(participanteAdivinhadoId, amigo.id);
                fecharModalPalpite();
            });
            if (isCurrentChoice) {
                 btn.textContent += " (Atual)";
            }
        } else {
            if (naoESiProprio) {
                 btn.disabled = true;
                 btn.textContent += " (Já Escolhido)";
            } else {
                 btn.disabled = true;
                 btn.textContent += " (Não é possível)";
            }
        }
        
        listaAmigosSecretos.appendChild(btn);
    });

    modal.style.display = 'block';
}

function fecharModalPalpite() {
    participanteAdivinhadoId = null;
    modal.style.display = 'none';
}


// ... [Funções de resultados (verificarModoResultados, calcularPontuacaoIndividual, renderizarPontuacao) permanecem inalteradas]

// =================================================================
// === INICIALIZAÇÃO E EVENT LISTENERS =============================
// =================================================================

function init() {
    renderizarSumarioFinanceiro();
    
    // CORREÇÃO CRONÓMETRO: Inicia a contagem e a verificação de data
    verificarDataLimite(); 
    iniciarContagemRegressiva(); // Chamada inicial para preencher os valores na hora 0
    
    renderizarPalpites();
    
    PARTICIPANTES.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.nome;
        userSelect.appendChild(option);
    });
    userSelect.value = usuarioLogadoId; 

    userSelect.addEventListener('change', (e) => {
        usuarioLogadoId = e.target.value;
        verificarDataLimite(); 
        renderizarPalpites();
        document.getElementById('myScoreDisplay').style.display = 'none'; 
        document.getElementById('export-output')?.remove(); 
    });
    
    exportBtn.addEventListener('click', exportarPalpites);
    showResultsBtn.addEventListener('click', calcularPontuacaoIndividual);

    closeBtn.addEventListener('click', fecharModalPalpite);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            fecharModalPalpite();
        }
    });
}

document.addEventListener('DOMContentLoaded', init);
