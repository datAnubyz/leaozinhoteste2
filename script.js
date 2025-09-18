document.addEventListener('DOMContentLoaded', () => {
    
    // --- ELEMENTOS DO DOM ---
    const personaHub = document.getElementById('persona-hub');
    const chatContainer = document.getElementById('chatContainer');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.getElementById('chatMessages');
    const typingIndicator = document.getElementById('typingIndicator');
    const backButton = document.getElementById('backButton');
    
    // --- ELEMENTOS DINÂMICOS DO CHAT ---
    const botAvatar = document.getElementById('botAvatar');
    const botName = document.getElementById('botName');
    const typingText = document.getElementById('typingText');

    // --- DADOS DAS PERSONAS (COM WEBHOOK PATHS INDIVIDUAIS) ---
    const personas = {
        gestor: {
            name: 'Leão Gestor',
            icon: '📈',
            welcome: 'Olá! Sou o Leão Gestor. Minha especialidade é performance e estratégia. Como posso otimizar seus resultados hoje?',
            webhookPath: 'leao-gestor',
            theme: {
                '--primary-color': '#3498db',
                '--primary-lighter': '#5dade2',
                '--primary-shadow': 'rgba(52, 152, 219, 0.3)',
                '--primary-border': 'rgba(52, 152, 219, 0.2)',
            }
        },
        social: {
            name: 'Leão Social',
            icon: '📱',
            welcome: 'E aí! Aqui é o Leão Social, pronto pra bombar! Criatividade e engajamento são meu forte. Qual a boa de hoje?',
            webhookPath: 'leaozinho',
            theme: {
                '--primary-color': '#e84393',
                '--primary-lighter': '#fd79a8',
                '--primary-shadow': 'rgba(232, 67, 147, 0.3)',
                '--primary-border': 'rgba(232, 67, 147, 0.2)',
            }
        },
        torcedor: {
            name: 'Leão Torcedor',
            icon: '⚽',
            welcome: 'Fala, campeão! Eu sou o Leão Torcedor, seu parceiro para as melhores apostas esportivas. Qual o palpite de hoje?',
            webhookPath: 'leao-torcedor',
            theme: {
                '--primary-color': '#2ecc71',
                '--primary-lighter': '#58d68d',
                '--primary-shadow': 'rgba(46, 204, 113, 0.3)',
                '--primary-border': 'rgba(46, 204, 113, 0.2)',
            }
        },
        croupier: {
            name: 'Leão Croupier',
            icon: '🃏',
            welcome: 'Bem-vindo à mesa. Eu sou o Leão Croupier, seu mestre no universo do cassino. Façam suas apostas. Como posso servi-lo?',
            webhookPath: 'leao-croupier',
            theme: {
                '--primary-color': '#e74c3c',
                '--primary-lighter': '#f1948a',
                '--primary-shadow': 'rgba(231, 76, 60, 0.3)',
                '--primary-border': 'rgba(231, 76, 60, 0.2)',
            }
        }
    };
    
    // --- ESTADO DA APLICAÇÃO ---
    let isTyping = false;
    let currentPersona = null;
    const webhookBaseUrl = 'https://n8n.srv871883.hstgr.cloud/webhook-test/';

    // --- FUNÇÕES PRINCIPAIS ---

    /**
     * Inicializa a tela de seleção de personas
     */
    function initHub() {
        document.querySelectorAll('.persona-card').forEach(card => {
            card.addEventListener('click', () => {
                const personaKey = card.dataset.persona;
                startChat(personaKey);
            });
        });

        backButton.addEventListener('click', showHub);
    }
    
    /**
     * Exibe a tela de seleção e esconde o chat
     */
    function showHub() {
        chatContainer.style.display = 'none';
        personaHub.style.display = 'block';
        currentPersona = null;
    }

    /**
     * Inicia o chat com a persona selecionada
     * @param {string} personaKey - A chave da persona (ex: 'gestor')
     */
    function startChat(personaKey) {
        currentPersona = personas[personaKey];
        if (!currentPersona) return;

        // Limpa mensagens antigas
        chatMessages.innerHTML = '';
        
        // Aplica o tema da persona
        Object.keys(currentPersona.theme).forEach(key => {
            chatContainer.style.setProperty(key, currentPersona.theme[key]);
        });
        
        // Atualiza a UI do chat
        botAvatar.textContent = currentPersona.icon;
        botName.textContent = currentPersona.name;
        typingText.textContent = `${currentPersona.name} está digitando...`;
        
        // Troca de tela
        personaHub.style.display = 'none';
        chatContainer.style.display = 'flex';
        
        // Exibe mensagem de boas-vindas
        setTimeout(() => {
            addBotMessage(currentPersona.welcome);
            messageInput.focus();
        }, 500);
    }

    /**
     * Envia a mensagem do usuário
     */
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (!message || isTyping) return;

        addUserMessage(message);
        
        messageInput.value = '';
        sendButton.disabled = true;
        isTyping = true;

        showTypingIndicator();

        try {
            const response = await sendToWebhook(message);
            
            if (response && response.reply) {
                await addBotMessage(response.reply);
            } else {
                await addBotMessage("Hmm... Algo deu errado. Mas não se preocupe, acontece nas melhores mesas! Tente novamente. ✨");
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            await addBotMessage("Ops! A conexão falhou. Verifique a rede e vamos tentar de novo! 💪");
        } finally {
            hideTypingIndicator();
            isTyping = false;
            // Re-avalia o estado do botão
            messageInput.dispatchEvent(new Event('input'));
            messageInput.focus();
        }
    }

    /**
     * Envia dados para o webhook DINÂMICO
     * @param {string} message - A mensagem do usuário
     */
    async function sendToWebhook(message) {
        if (!currentPersona || !currentPersona.webhookPath) {
            throw new Error("Persona atual ou webhookPath não definido.");
        }

        // Monta a URL correta com base na persona selecionada
        const fullWebhookUrl = webhookBaseUrl + currentPersona.webhookPath;
        console.log(`Enviando para: ${fullWebhookUrl}`); // Log para debug

        try {
            // Usa a URL dinâmica que acabamos de montar
            const response = await fetch(fullWebhookUrl, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: message,
                    persona: currentPersona.name 
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();

        } catch (error) {
            console.error(`Erro na requisição para ${fullWebhookUrl}:`, error);
            throw error;
        }
    }

    // --- FUNÇÕES AUXILIARES DE UI ---
    
    function addUserMessage(message) {
        const el = createMessageElement(message, 'user');
        chatMessages.appendChild(el);
        scrollToBottom();
    }

    async function addBotMessage(message) {
        const el = createMessageElement(message, 'bot');
        chatMessages.appendChild(el);
        scrollToBottom();
    }

    function createMessageElement(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        // Para renderizar quebras de linha como \n
        contentDiv.innerText = message;

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        messageDiv.appendChild(contentDiv);
        contentDiv.appendChild(timeDiv); // Colocando o tempo dentro do balão para melhor alinhamento

        return messageDiv;
    }

    function showTypingIndicator() {
        typingIndicator.style.display = 'flex';
        scrollToBottom();
    }

    function hideTypingIndicator() {
        typingIndicator.style.display = 'none';
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- EVENT LISTENERS ---
    
    sendButton.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    messageInput.addEventListener('input', () => {
        sendButton.disabled = messageInput.value.trim().length === 0 || isTyping;
    });

    // --- INICIALIZAÇÃO ---
    initHub();
});
