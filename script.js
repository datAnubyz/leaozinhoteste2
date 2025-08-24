class ChatBot {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.typingIndicator = document.getElementById('typingIndicator');
        
        this.webhookUrl = 'https://n8n.srv871883.hstgr.cloud/webhook-test/leaozinho';
        this.isTyping = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.displayWelcomeMessage();
    }

    setupEventListeners() {
        // Envio por botão
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Envio por Enter
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Desabilitar botão quando input estiver vazio
        this.messageInput.addEventListener('input', () => {
            const hasText = this.messageInput.value.trim().length > 0;
            this.sendButton.disabled = !hasText || this.isTyping;
        });
    }

    displayWelcomeMessage() {
        setTimeout(() => {
            this.addBotMessage("🦁 VIVA A MAGIA DE VEGAS! 🎰\n\nOlá! Sou o LEÃOZINHO, seu assistente virtual de elite! ✨\n\nEstou aqui para transformar sua experiência em algo EXTRAORDINÁRIO! Como posso te ajudar hoje? 🌟");
        }, 500);
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        
        if (!message || this.isTyping) return;

        // Adicionar mensagem do usuário
        this.addUserMessage(message);
        
        // Limpar input e desabilitar
        this.messageInput.value = '';
        this.sendButton.disabled = true;
        this.isTyping = true;

        // Mostrar indicador de digitação
        this.showTypingIndicator();

        try {
            // Enviar para webhook
            const response = await this.sendToWebhook(message);
            
            // Esconder indicador de digitação
            this.hideTypingIndicator();
            
            // Adicionar resposta do bot (instantâneo; animação sutil via CSS)
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
            this.sendButton.disabled = false;
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
                    question: message
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
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
        
        // Inserir imediatamente o texto (sem digitar caractere por caractere)
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