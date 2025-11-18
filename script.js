// =================================================================
// === VARIÁVEIS DE CONFIGURAÇÃO (AJUSTAR AQUI) ====================
// =================================================================

// Função utilitária para gerar avatares aleatórios (simulando uma foto)
// Usa o verde Spotify como fundo.
const gerarAvatar = (nome) => `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&size=80&background=1DB954&color=ffffff&bold=true`;

const PARTICIPANTES = [
    // Total de 12 Participantes com ID único
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

// DATA LIMITE para alterar palpites (Ano, Mês-1, Dia) - 22 de Dezembro de 2025
const DATA_LIMITE_ENVIO = new Date(2025, 11, 22); 

// --- Configuração Financeira ---
const VALOR_APOSTA_POR_PALPITE = 10.00; // R$ 10,00

// --- GABARITO (SOLUÇÃO CORRETA) ---
const GABARITO = {
    // PREENCHA ISTO SÓ DEPOIS DO EVENTO! Ex: 'u1': 'u5',
    'u1': '', 
    'u2': '', 
    'u3': '', 
    'u4': '', 
    'u5': '', 
    'u6': '',
    'u7': '',
    'u8': '',
    'u9': '',
    'u10': '',
    'u11': '',
    'u12': '',
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
const searchInput = document.getElementById('search-input'); // NOVO
const exportBtn = document.getElementById('exportBtn'); // NOVO

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

/**
 * Exporta os palpites do utilizador atual (que estão no localStorage)
 * para um formato JSON que pode ser copiado. (NOVO)
 */
function exportarPalpites() {
    const meusPalpites = carregarMeusPalpites();
    const nomeUsuario = PARTICIPANTES.find(p => p.id === usuarioLogadoId)?.nome || 'Desconhecido';
    
    // Inclui o nome e ID do utilizador nos dados exportados para identificação
    const dadosExportados = {
        usuarioId: usuarioLogadoId,
        usuarioNome: nomeUsuario,
        palpites: meusPalpites,
        dataHoraExportacao: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(dadosExportados, null, 2);

    // Cria uma área de texto para exibir o JSON e permitir a cópia
    const exportArea = document.createElement('textarea');
    exportArea.value = jsonString;
    exportArea.style.width = '100%';
    exportArea.style.height = '150px';
    exportArea.style.marginTop = '10px';
    exportArea.style.padding = '10px';
    exportArea.style.backgroundColor = '#333';
    exportArea.style.color = 'white';
    exportArea.style.border = '1px solid var(--primary-color)';
    exportArea.readOnly = true;

    // Remove qualquer área de exportação anterior e anexa a nova
    let existingExport = document.getElementById('export-output');
    if (existingExport) {
        existingExport.remove();
    }
    
    const outputDiv = document.createElement('div');
    outputDiv.id = 'export-output';
    outputDiv.style.marginTop = '15px';
    outputDiv.innerHTML = '<h4>Dados de Exportação (Copia este texto):</h4>';
    outputDiv.appendChild(exportArea);
    
    exportBtn.parentNode.insertBefore(outputDiv, exportBtn.nextSibling);

    // Tenta selecionar e copiar o texto automaticamente
    exportArea.select();
    try {
        document.execCommand('copy');
        alert(`Dados de ${nomeUsuario} copiados para a área de transferência!`);
    } catch (err) {
        // Se a cópia automática falhar
        console.error('Não foi possível copiar automaticamente. Por favor, copia manualmente o texto acima.', err);
    }
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

        // Conteúdo do card (Inclui o Avatar - NOVO)
        card.innerHTML = `
            <img src="${participante.foto}" alt="Avatar de ${participante.nome}" class="avatar">
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
    
    // Executa a filtragem após a renderização (útil quando o utilizador muda)
    filtrarPalpites();
}

/**
 * Filtra a lista de palpites com base no texto de pesquisa. (NOVO)
 */
function filtrarPalpites() {
    const termo = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll('.palpite-card');
    
    cards.forEach(card => {
        // Assume que o nome está no elemento com a classe 'palpite-quem-tirou'
        const nomeParticipante = card.querySelector('.palpite-quem-tirou').textContent.toLowerCase();
        
        if (nomeParticipante.includes(termo)) {
            card.style.display = 'flex'; // Mostra (usa 'flex' para corresponder ao display do CSS)
        } else {
            card.style.display = 'none'; // Esconde
        }
    });
}

/**
 * Abre o modal para o utilizador escolher o Amigo Secreto de um participante.
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
        const gabaritoPreenchido = Object.keys(GABARITO).filter(key => GABARITO[key] !== '').length === PARTICIPANTES.length;
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
    
    // Configura o seletor de utilizador e o filtro
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
        // Remove a área de exportação se existir
        document.getElementById('export-output')?.remove(); 
        alert(`A mudar para o utilizador: ${PARTICIPANTES.find(p => p.id === usuarioLogadoId).nome}. Palpites carregados (privados)!`);
    });
    
    // Event Listener para a Pesquisa (NOVO)
    searchInput.addEventListener('input', filtrarPalpites);
    
    // Event Listener para a Exportação (NOVO)
    exportBtn.addEventListener('click', exportarPalpites);

    renderizarPalpites();
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
