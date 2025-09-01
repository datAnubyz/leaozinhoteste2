class ChatBot {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.typingIndicator = document.getElementById('typingIndicator');
        // Novo elemento: Botão do microfone
        this.micButton = document.getElementById('micButton');
        
        this.webhookUrl = 'https://n8n.srv871883.hstgr.cloud/webhook-test/leaozinho';
        this.isTyping = false;
        
        this.sessionId = null;

        // Propriedades para o Reconhecimento de Voz
        this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = null;
        
        this.init();
    }

    init() {
        this.generateSessionId();
        this.setupEventListeners();
        // Configura o reconhecimento de voz
        this.setupSpeechRecognition();
        this.displayWelcomeMessage();
    }
    
    generateSessionId() {
        this.sessionId = crypto.randomUUID();
        console.log('Chat session started with ID:', this.sessionId);
    }

    // --- LÓGICA DE RECONHECIMENTO DE VOZ ---
    setupSpeechRecognition() {
        if (this.SpeechRecognition) {
            this.recognition = new this.SpeechRecognition();
            this.recognition.lang = 'pt-BR'; // Define o idioma
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;

            // Evento disparado quando a fala é reconhecida
            this.recognition.onresult = (event) => {
                const speechResult = event.results[0][0].transcript;
                this.messageInput.value = speechResult;
                // Envia a mensagem automaticamente após o reconhecimento
                this.sendMessage();
            };

            // Evento para feedback visual (quando começa a ouvir)
            this.recognition.onstart = () => {
                this.micButton.classList.add('recording');
            };

            // Evento para remover o feedback visual (quando para de ouvir)
            this.recognition.onend = () => {
                this.micButton.classList.remove('recording');
            };

            // Trata erros
            this.recognition.onerror = (event) => {
                console.error('Erro no reconhecimento de voz:', event.error);
                this.micButton.classList.remove('recording');
            };

        } else {
            console.warn('Reconhecimento de voz não é suportado neste navegador.');
            this.micButton.style.display = 'none'; // Esconde o botão se não houver suporte
        }
    }
    
    startVoiceRecognition() {
        if (this.recognition && !this.isTyping) {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Erro ao iniciar o reconhecimento de voz:', error);
            }
        }
    }
    // --- FIM DA LÓGICA DE VOZ ---

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.messageInput.addEventListener('input', () => {
            const hasText = this.messageInput.value.trim().length > 0;
            this.sendButton.disabled = !hasText || this.isTyping;
        });

        // Adiciona o listener para o botão de microfone
        if (this.micButton) {
            this.micButton.addEventListener('click', () => this.startVoiceRecognition());
        }
    }

    displayWelcomeMessage() {
        setTimeout(() => {
            this.addBotMessage("🦁 VIVA A MAGIA DE VEGAS! 🎰\n\nOlá! Sou o LEÃOZINHO, seu assistente virtual de elite! ✨\n\nEstou aqui para transformar sua experiência em algo EXTRAORDINÁRIO! Como posso te ajudar hoje? 🌟");
        }, 500);
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        
        if (!message || this.isTyping) return;

        this.addUserMessage(message);
        
        this.messageInput.value = '';
        this.sendButton.disabled = true;
        this.isTyping = true;

        this.showTypingIndicator();

        try {
            const response = await this.sendToWebhook(message);
            
            this.hideTypingIndicator();
            
            if (response && response.reply) {
                await this.addBotMessage(response.reply);
            } else {
                await this.addBotMessage("🦁 Hmm... Algo deu errado na transmissão! Mas o LEÃOZINHO nunca desiste! Tente novamente e vamos fazer a MÁGICA acontecer! ✨");
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            this.hideTypingIndicator();
            await this.addBotMessage("🦁 Ops! Parece que houve uma interferência na conexão! O LEÃOZINHO está trabalhando para resolver isso. Verifique sua conexão e vamos tentar novamente! 💪✨");
        } finally {
            this.isTyping = false;
            // Reavalia o estado do botão de enviar
            const hasText = this.messageInput.value.trim().length > 0;
            this.sendButton.disabled = !hasText;
            this.messageInput.focus();
        }
    }

    async sendToWebhook(message) {
        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: message,
                    sessionId: this.sessionId 
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro na requisição para webhook:', error);
            throw error;
        }
    }

    addUserMessage(message) {
        const messageElement = this.createMessageElement(message, 'user');
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }

    async addBotMessage(message) {
        const messageElement = this.createMessageElement('', 'bot');
        const messageContent = messageElement.querySelector('.message-content');
        
        messageContent.textContent = message;

        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }

    createMessageElement(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = message;

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = this.getCurrentTime();

        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);

        return messageDiv;
    }



    showTypingIndicator() {
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }

    scrollToBottom() {
        requestAnimationFrame(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        });
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Inicializar o chatbot quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new ChatBot();
});
