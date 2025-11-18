// =================================================================
// === VARIÁVEIS DE CONFIGURAÇÃO (AJUSTAR AQUI) ====================
// =================================================================

const PARTICIPANTES = [
    { id: 'u1', nome: 'Ana' },
    { id: 'u2', nome: 'Bruno' },
    { id: 'u3', nome: 'Carlos' },
    { id: 'u4', nome: 'Diana' },
    // Adicione mais participantes conforme necessário
];

// DATA LIMITE para alterar palpites (Ano, Mês-1, Dia) - Ex: 18 de Dezembro de 2025
// NOTA: Para testar o MODO DE RESULTADOS, altere esta data para uma data NO PASSADO.
const DATA_LIMITE_ENVIO = new Date(2025, 11, 18); 

// --- Configuração Financeira ---
const VALOR_APOSTA_POR_PALPITE = 10.00; // R$ 10,00

// --- GABARITO (SOLUÇÃO CORRETA) ---
// NOTA: PREENCHA ISTO SÓ DEPOIS DO EVENTO!
// O formato é: {'Quem Tirou ID': 'Amigo Secreto ID'}
const GABARITO = {
    // Exemplo:
    'u1': 'u3', 
    'u2': 'u4', 
    'u3': 'u1', 
    'u4': 'u2', 
    // Certifique-se de ter um par para cada participante na lista
};


// =================================================================
// === VARIÁVEIS DE ESTADO E DOM ===================================
// =================================================================

// Variáveis de Estado
const NUMERO_PALPITES = PARTICIPANTES.length - 1;
const STORAGE_KEY_PREFIX = 'bolao_palpites_';
let usuarioLogadoId = 'u1'; // Utilizador Padrão para Início
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

// ID do participante que está a ser palpitado atualmente
let participanteAdivinhadoId = null; 


// =================================================================
// === FUNÇÕES DE LÓGICA DE DADOS ==================================
// =================================================================

/**
 * Carrega os palpites do utilizador atual a partir do armazenamento local (privado).
 * @returns {object} Um objeto com os palpites { 'quemTirouId': 'amigoSecretoId' }
 */
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

/**
 * Salva o palpite do utilizador atual no armazenamento local.
 * @param {string} quemTirouId - ID de quem se está a palpitar.
 * @param {string} amigoSecretoId - ID do palpite.
 */
function salvarPalpite(quemTirouId, amigoSecretoId) {
    if (!edicaoPermitida) return;

    const meusPalpites = carregarMeusPalpites();
    meusPalpites[quemTirouId] = amigoSecretoId;

    const key = STORAGE_KEY_PREFIX + usuarioLogadoId;
    localStorage.setItem(key, JSON.stringify(meusPalpites));
    
    // Atualiza a interface
    renderizarPalpites(); 
}


// =================================================================
// === FUNÇÕES DE TEMPORIZAÇÃO E VALIDAÇÃO =========================
// =================================================================

/**
 * Verifica a data limite e atualiza a interface de acordo.
 */
function verificarDataLimite() {
    const hoje = new Date();
    
    // Verifica se a data atual é superior à data limite
    if (hoje > DATA_LIMITE_ENVIO) {
        edicaoPermitida = false;
        overlayBloqueio.style.display = 'flex'; // Mostra o overlay de bloqueio
        clearInterval(timerInterval); // Para a contagem regressiva
        countdownTimer.style.display = 'none';
        countdownFinished.style.display = 'block';
    } else {
        edicaoPermitida = true;
        overlayBloqueio.style.display = 'none';
        countdownTimer.style.display = 'block';
        countdownFinished.style.display = 'none';
    }
    
    // Formata e exibe a data limite
    dataLimiteDisplay.textContent = DATA_LIMITE_ENVIO.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    
    // Verifica o modo de resultados
    verificarModoResultados();
}

/**
 * Calcula e atualiza a contagem regressiva.
 */
function iniciarContagemRegressiva() {
    const agora = new Date().getTime();
    const diferenca = DATA_LIMITE_ENVIO.getTime() - agora;

    const umSegundo = 1000;
    const umMinuto = umSegundo * 60;
    const umaHora = umMinuto * 60;
    const umDia = umaHora * 24;

    if (diferenca < 0) {
        // Contagem regressiva concluída
        clearInterval(timerInterval);
        verificarDataLimite(); 
        return;
    }

    // Cálculo do tempo 
    const dias = Math.floor(diferenca / umDia);
    const horas = Math.floor((diferenca % umDia) / umaHora);
    const minutos = Math.floor((diferenca % umaHora) / umMinuto);
    const segundos = Math.floor((diferenca % umMinuto) / umSegundo);

    // Atualiza o DOM (garantindo dois dígitos)
    daysDisplay.textContent = String(dias).padStart(2, '0');
    hoursDisplay.textContent = String(horas).padStart(2, '0');
    minutesDisplay.textContent = String(minutos).padStart(2, '0');
    secondsDisplay.textContent = String(segundos).padStart(2, '0');
}


// =================================================================
// === FUNÇÕES DE INTERFACE (DOM) ==================================
// =================================================================

/**
 * Preenche e exibe as informações financeiras.
 */
function renderizarSumarioFinanceiro() {
    const totalArrecadado = VALOR_APOSTA_POR_PALPITE * PARTICIPANTES.length * NUMERO_PALPITES;

    // Atualiza os elementos HTML com os valores calculados
    document.getElementById('valorPalpiteDisplay').textContent = VALOR_APOSTA_POR_PALPITE.toFixed(2).replace('.', ',');
    document.getElementById('numParticipantesDisplay').textContent = PARTICIPANTES.length;
    document.getElementById('numPalpitesDisplay').textContent = NUMERO_PALPITES;
    
    // Formata o prémio total
    document.getElementById('premioTotalDisplay').textContent = totalArrecadado.toFixed(2).replace('.', ',');
}

/**
 * Renderiza a lista de participantes e os palpites atuais do utilizador.
 */
function renderizarPalpites() {
    const meusPalpites = carregarMeusPalpites();
    palpiteContainer.innerHTML = ''; // Limpa o conteúdo anterior

    PARTICIPANTES.forEach(participante => {
        const palpiteId = meusPalpites[participante.id];
        const palpiteNome = PARTICIPANTES.find(p => p.id === palpiteId)?.nome || 'Não Palpitado (Clique para escolher)';
        
        // Se o utilizador atual é o participante, não precisa de palpitar sobre si mesmo
        const isSelf = participante.id === usuarioLogadoId; 
        
        // Cria o elemento HTML do card
        const card = document.createElement('div');
        card.classList.add('palpite-card');
        if (palpiteId) {
             card.classList.add('selecionado');
        }
        if (!edicaoPermitida || isSelf) {
            card.classList.add('bloqueado');
        }

        // Conteúdo do card
        card.innerHTML = `
            <div class="palpite-info">
                <div>
                    <p class="palpite-quem-tirou">Quem tirou: **${participante.nome}**</p>
                    ${isSelf ? '<p style="color: #FF4500; font-weight: bold; font-size: 12px;">(És tu! Não precisas de palpitar.)</p>' : ''}
                </div>
                <p class="palpite-atual">${palpiteNome} ${!isSelf && !edicaoPermitida ? '🔒' : (!isSelf ? '➡️' : '')}</p>
            </div>
        `;
        
        // Adiciona o evento de clique (abrir modal)
        if (edicaoPermitida && !isSelf) {
            card.addEventListener('click', () => abrirModalPalpite(participante.id, participante.nome));
        }

        palpiteContainer.appendChild(card);
    });
}

/**
 * Abre o modal para o utilizador escolher o Amigo Secreto de um participante.
 * Implementa a Validação: impede que a pessoa palpite que o participante tirou a si mesmo.
 * @param {string} id - ID do participante que a pessoa acha que tirou.
 * @param {string} nome - Nome do participante para exibir no modal.
 */
function abrirModalPalpite(id, nome) {
    if (!edicaoPermitida) return;

    participanteAdivinhadoId = id;
    quemTirouNomeDisplay.textContent = nome;
    listaAmigosSecretos.innerHTML = ''; // Limpa as opções anteriores

    // Filtra a lista: O participante 'id' não pode ser o Amigo Secreto dele próprio.
    const amigosParaPalpitar = PARTICIPANTES.filter(amigo => amigo.id !== id);

    // Cria um botão para cada participante como opção de Amigo Secreto
    amigosParaPalpitar.forEach(amigo => { 
        const btn = document.createElement('button');
        btn.textContent = `Acho que é **${amigo.nome}**`;
        btn.addEventListener('click', () => {
            salvarPalpite(participanteAdivinhadoId, amigo.id);
            fecharModalPalpite();
            alert(`Palpite de ${nome} -> ${amigo.nome} guardado localmente!`);
        });
        listaAmigosSecretos.appendChild(btn);
    });

    modal.style.display = 'block';
}

/**
 * Fecha o modal de palpites.
 */
function fecharModalPalpite() {
    modal.style.display = 'none';
    participanteAdivinhadoId = null;
}


// =================================================================
// === FUNÇÕES DE RESULTADOS E PONTUAÇÃO ===========================
// =================================================================

/**
 * Verifica se a aplicação deve entrar em modo de resultados (pós-evento).
 */
function verificarModoResultados() {
    const hoje = new Date();
    const resultModeSection = document.getElementById('resultModeSection');
    const resultDivider = document.getElementById('resultDivider');
    
    // Critério: Só entra em modo de resultados DEPOIS da data limite
    if (hoje > DATA_LIMITE_ENVIO) {
        resultModeSection.style.display = 'block';
        resultDivider.style.display = 'block';
        
        // Verifica se o gabarito foi preenchido (pelo menos um par)
        const gabaritoPreenchido = Object.keys(GABARITO).length === PARTICIPANTES.length;
        document.getElementById('gabaritoWarning').style.display = gabaritoPreenchido ? 'none' : 'block';
        showResultsBtn.disabled = !gabaritoPreenchido;
        
        // Esconde os palpites para focar nos resultados (opcional)
        palpiteContainer.style.display = 'none'; 
        document.querySelector('h2').style.display = 'none';

        return gabaritoPreenchido;
    }
    
    // Se não estiver em modo de resultados, esconde a secção
    resultModeSection.style.display = 'none';
    resultDivider.style.display = 'none';
    
    // Garante que o registo de palpites está visível
    palpiteContainer.style.display = 'block'; 
    document.querySelector('h2').style.display = 'block';

    return false;
}

/**
 * Calcula a pontuação do utilizador atual comparando os palpites com o gabarito.
 */
function calcularPontuacaoIndividual() {
    if (!verificarModoResultados()) return; // Sai se não estiver em modo de resultados

    const meusPalpites = carregarMeusPalpites();
    let acertos = 0;
    
    const pontuacaoDetalhada = PARTICIPANTES.map(participante => {
        // Ignorar o próprio utilizador logado e participantes sem gabarito
        if (participante.id === usuarioLogadoId || !GABARITO[participante.id]) {
            return null;
        }

        const meuPalpite = meusPalpites[participante.id];
        const gabaritoCorreto = GABARITO[participante.id];
        
        const palpiteNome = PARTICIPANTES.find(p => p.id === meuPalpite)?.nome || 'Sem Palpite';
        const gabaritoNome = PARTICIPANTES.find(p => p.id === gabaritoCorreto)?.nome || 'Não Definido (Erro no Gabarito)';
        
        const acertou = (meuPalpite && meuPalpite === gabaritoCorreto);
        if (acertou) {
            acertos++;
        }

        return {
            nome: participante.nome,
            acertou: acertou,
            meuPalpite: palpiteNome,
            gabarito: gabaritoNome,
            quemTirouId: participante.id
        };
    }).filter(item => item !== null); 

    renderizarPontuacao(acertos, pontuacaoDetalhada);
}

/**
 * Exibe a pontuação e os detalhes dos acertos/erros no ecrã.
 */
function renderizarPontuacao(acertos, detalhes) {
    const myScoreDisplay = document.getElementById('myScoreDisplay');
    myScoreDisplay.style.display = 'block';
    
    let html = `<h4 class="score-title">Resultado para ti:</h4>`;
    html += `<p class="total-score-text">Total de Acertos: <span class="score-number">${acertos}</span> / ${detalhes.length}</p>`;
    
    detalhes.forEach(detalhe => {
        const statusClass = detalhe.acertou ? 'acerto' : 'erro';
        const statusText = detalhe.acertou ? '✅ Acertaste!' : '❌ Erraste!';
        
        html += `
            <div class="palpite-detalhe ${statusClass}">
                <p><strong>Palpite sobre ${detalhe.nome}:</strong> ${statusText}</p>
                <p class="detalhe-text">O teu palpite: **${detalhe.meuPalpite}**</p>
                <p class="detalhe-text">O correto era: **${detalhe.gabarito}**</p>
            </div>
        `;
    });
    
    myScoreDisplay.innerHTML = html;
}


// =================================================================
// === INICIALIZAÇÃO E EVENT LISTENERS =============================
// =================================================================

/**
 * Inicializa a aplicação
 */
function init() {
    renderizarSumarioFinanceiro();
    
    // Inicia a contagem regressiva e verifica a data limite a cada segundo
    timerInterval = setInterval(verificarDataLimite, 1000); 
    
    renderizarPalpites();
    
    // Configura o seletor de utilizador (apenas para teste)
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
        document.getElementById('myScoreDisplay').style.display = 'none'; // Esconde resultados ao trocar de user
        alert(`A mudar para o utilizador: ${PARTICIPANTES.find(p => p.id === usuarioLogadoId).nome}. Palpites carregados (privados)!`);
    });
}

// Event Listeners do Modal
closeBtn.addEventListener('click', fecharModalPalpite);
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        fecharModalPalpite();
    }
});

// Event Listener do Botão de Resultados
showResultsBtn.addEventListener('click', calcularPontuacaoIndividual);

// Inicia a aplicação quando a página carrega
document.addEventListener('DOMContentLoaded', init);