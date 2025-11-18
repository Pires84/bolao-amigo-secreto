// =================================================================
// === VARIÁVEIS DE CONFIGURAÇÃO (AJUSTAR AQUI) ====================
// =================================================================

// Função utilitária para gerar avatares aleatórios (simulando uma foto)
const gerarAvatar = (nome) => `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&size=80&background=1DB954&color=ffffff&bold=true`;

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

// DATA LIMITE para alterar palpites (Ano, Mês-1, Dia) - 23 de Dezembro de 2025
// CORREÇÃO: Vamos definir o horário para 23:59:59 para garantir que o dia 23 é completo.
const DATA_LIMITE_ENVIO = new Date(2025, 11, 23, 23, 59, 59); 

// --- Configuração Financeira ---
const VALOR_APOSTA_POR_PESSOA = 10.00; // CORREÇÃO: 10.00 por pessoa, não por palpite.

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
const searchInput = document.getElementById('search-input');
const exportBtn = document.getElementById('exportBtn');
const valorPalpiteDisplay = document.getElementById('valorPalpiteDisplay');

let participanteAdivinhadoId = null; 


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

/**
 * CORREÇÃO: Exportação Limpa. Copia os dados brutos para a área de transferência.
 */
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

    // 1. Cria um elemento temporário para selecionar e copiar
    const tempElement = document.createElement('textarea');
    tempElement.value = jsonString;
    document.body.appendChild(tempElement);
    
    // 2. Seleciona o conteúdo
    tempElement.select();
    tempElement.setSelectionRange(0, 99999); // Para mobile
    
    // 3. Executa o comando de cópia
    try {
        document.execCommand('copy');
        alert(`Dados de ${nomeUsuario} copiados para a área de transferência! Cole em um ficheiro de texto.`);
    } catch (err) {
        alert('Não foi possível copiar automaticamente. Por favor, copie o JSON manualmente.');
        console.error('Falha na cópia:', err);
    }
    
    // 4. Remove o elemento temporário
    document.body.removeChild(tempElement);

    // Remove a área de exportação antiga se existir
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
    } else {
        edicaoPermitida = true;
        overlayBloqueio.style.display = 'none';
        timerInterval = timerInterval || setInterval(iniciarContagemRegressiva, 1000); // CORREÇÃO: Garante que o timer inicia
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
        verificarDataLimite(); 
        // Exibe "Prazo Encerrado!"
        countdownTimer.style.display = 'none';
        document.getElementById('countdown-finished').style.display = 'block';
        return;
    }
    
    // Esconde "Prazo Encerrado!" e mostra o timer
    countdownTimer.style.display = 'block';
    document.getElementById('countdown-finished').style.display = 'none';

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
    // CORREÇÃO: R$ 10.00 por pessoa * Total de Pessoas
    const totalArrecadado = VALOR_APOSTA_POR_PESSOA * NUMERO_PARTICIPANTES;

    document.getElementById('valorPalpiteDisplay').textContent = VALOR_APOSTA_POR_PESSOA.toFixed(2).replace('.', ',');
    document.getElementById('numParticipantesDisplay').textContent = NUMERO_PARTICIPANTES;
    document.getElementById('numPalpitesDisplay').textContent = NUMERO_PARTICIPANTES - 1; // Palpites por pessoa (total - 1)
    
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
                    ${isSelf ? '<p style="color: #FF4500; font-weight: bold; font-size: 12px;">(És tu! Palpite bloqueado.)</p>' : ''}
                </div>
                <p class="palpite-atual">${palpiteNome} ${!isSelf && !edicaoPermitida ? '🔒' : (!isSelf ? '➡️' : '')}</p>
            </div>
        `;
        
        if (edicaoPermitida && !isSelf) {
            card.addEventListener('click', () => abrirModalPalpite(participante.id, participante.nome));
        }

        palpiteContainer.appendChild(card);
    });
    
    filtrarPalpites();
}

/**
 * CORREÇÃO: Impede que o "Amigo Secreto" escolhido seja atribuído a outra pessoa.
 */
function abrirModalPalpite(id, nome) {
    if (!edicaoPermitida) return;

    participanteAdivinhadoId = id;
    quemTirouNomeDisplay.textContent = nome;
    listaAmigosSecretos.innerHTML = ''; 
    
    // 1. Encontra todos os palpites do utilizador atual
    const meusPalpites = carregarMeusPalpites();
    const amigosSecretosJaEscolhidos = Object.values(meusPalpites);

    // 2. Filtra a lista: O participante 'id' não pode tirar a si mesmo E não pode ter sido escolhido por outro palpite
    const amigosParaPalpitar = PARTICIPANTES.filter(amigo => {
        // Regra 1: Não pode ser ele próprio
        const naoESiProprio = amigo.id !== id;
        
        // Regra 2: Se o amigo não for o palpite atual para 'id', ele não pode estar na lista de já escolhidos
        const naoFoiEscolhido = (amigo.id === meusPalpites[id]) || !amigosSecretosJaEscolhidos.includes(amigo.id);
        
        return naoESiProprio && naoFoiEscolhido;
    });

    // 3. Cria botões de opção
    PARTICIPANTES.forEach(amigo => { 
        const btn = document.createElement('button');
        btn.textContent = `Acho que é **${amigo.nome}**`;
        
        const isAvailable = amigosParaPalpitar.some(a => a.id === amigo.id);

        if (isAvailable) {
            btn.addEventListener('click', () => {
                salvarPalpite(participanteAdivinhadoId, amigo.id);
                fecharModalPalpite();
            });
        } else {
            // Se o palpite for o atual, está OK. Se não for, está bloqueado.
            if (amigo.id !== meusPalpites[id]) {
                btn.disabled = true;
                btn.textContent += " (Já Escolhido)";
            } else {
                 btn.addEventListener('click', () => {
                    salvarPalpite(participanteAdivinhadoId, amigo.id);
                    fecharModalPalpite();
                });
            }
        }
        
        // Se for a escolha atual, marca
        if (amigo.id === meusPalpites[id]) {
             btn.textContent += " (Atual)";
        }

        listaAmigosSecretos.appendChild(btn);
    });

    modal.style.display = 'block';
}

function fecharModalPalpite() {
    modal.style.display = 'none';
    participanteAdivinhadoId = null;
}

function filtrarPalpites() {
    const termo = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll('.palpite-card');
    
    cards.forEach(card => {
        const nomeParticipante = card.querySelector('.palpite-quem-tirou').textContent.toLowerCase();
        
        if (nomeParticipante.includes(termo)) {
            card.style.display = 'flex'; 
        } else {
            card.style.display = 'none'; 
        }
    });
}


// =================================================================
// === INICIALIZAÇÃO E EVENT LISTENERS =============================
// =================================================================

function init() {
    renderizarSumarioFinanceiro();
    
    // Inicia a contagem regressiva e a verificação de data
    verificarDataLimite(); 
    
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
    
    searchInput.addEventListener('input', filtrarPalpites);
    exportBtn.addEventListener('click', exportarPalpites);
    showResultsBtn.addEventListener('click', calcularPontuacaoIndividual);

    closeBtn.addEventListener('click', fecharModalPalpite);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            fecharModalPalpite();
        }
    });
    
    // Funções de resultados (deixadas fora da correção para focar nas funcionais)
    // ... [As funções verificarModoResultados, calcularPontuacaoIndividual e renderizarPontuacao permanecem sem alteração] ...
}

document.addEventListener('DOMContentLoaded', init);
