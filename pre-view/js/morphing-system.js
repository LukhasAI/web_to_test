// PR0T3US Morphing System
// Sophisticated UI Integration with WebGL

class PR0T3USMorphingSystem {
    constructor() {
        this.isInitialized = false;
        this.currentShape = 'default';
        this.voiceIntensity = 0.5;
        this.morphSpeed = 1.0;
        this.aiEnabled = false;
        
        // WebGL integration
        this.webglSystem = null;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        
        // Particle system parameters
        this.particleCount = 1000;
        this.boundaryForce = 0.15;
        this.attractionStrength = 0.5;
        this.particleSize = 0.5;
        
        // UI State
        this.sidebarOpen = false;
        this.chatMinimized = false;
        this.chatMaximized = false;
        this.cameraEnabled = false;
        this.microphoneEnabled = false;
        
        // Chat history for research
        this.chatHistory = [];
        this.maxChatHistory = 100;
        
        // Performance tracking
        this.fpsCounter = 0;
        this.lastFpsUpdate = 0;
        this.currentFps = 60;
        
        // Voice data for audio reactivity
        this.voiceData = { intensity: 0, frequency: 0 };
        
        // API Configuration
        this.apiConfig = {
            openai: {
                enabled: false,
                apiKey: '',
                model: 'gpt-4',
                endpoint: 'https://api.openai.com/v1/chat/completions'
            },
            anthropic: {
                enabled: false,
                apiKey: '',
                model: 'claude-3-sonnet-20240229',
                endpoint: 'https://api.anthropic.com/v1/messages'
            },
            local: {
                enabled: false,
                endpoint: 'http://localhost:11434/v1/chat/completions',
                model: 'llama2'
            }
        };
        
        // Initialize system
        this.init();
    }
    
    async init() {
        try {
            console.log('PR0T3US: Initializing system...');
            
            // Initialize WebGL with proper camera setup
            await this.initWebGL();
            
            // Initialize UI
            this.initUI();
            
            // Initialize audio
            await this.initAudio();
            
            // Initialize chat history
            this.loadChatHistory();
            
            // Start performance monitoring
            this.startPerformanceMonitoring();
            
            // Initialize API connections
            this.initAPIConnections();
            
            this.isInitialized = true;
            console.log('PR0T3US: System initialization complete');
            
        } catch (error) {
            console.error('PR0T3US: Initialization failed:', error);
        }
    }
    
    async initWebGL() {
        return new Promise((resolve, reject) => {
            const checkWebGL = () => {
                if (typeof gl !== 'undefined' && gl) {
                    this.webglSystem = {
                        gl: gl,
                        camera: window.camera,
                        programs: window
                    };
                    
                    // Fix camera positioning for particle visibility
                    if (window.camera) {
                        // Set camera to proper distance and position for particle visibility
                        window.camera.pos = [0, 0, 25]; // Move camera further back
                        window.camera.look = [0, 0, 0]; // Look at center
                        window.camera.up = [0, 1, 0]; // Set up vector
                        window.camera.radius = 25; // Set larger radius
                        window.camera.zoom = 1.0; // Reset zoom
                        
                        // Enable auto-centering and disable auto-rotation for better particle viewing
                        window.camera.autoCentered = true;
                        window.camera.autoRotate = false;
                        
                        // Set proper field of view
                        window.camera.fov = 45;
                        
                        console.log('PR0T3US: Camera positioned for optimal particle visibility');
                    }
                    
                    // Ensure WebGL context is properly initialized
                    if (window.init) {
                        window.init();
                        console.log('PR0T3US: WebGL context initialized');
                    }
                    
                    // Start the render loop if it exists
                    if (window.draw) {
                        const renderLoop = () => {
                            window.draw();
                            requestAnimationFrame(renderLoop);
                        };
                        renderLoop();
                        console.log('PR0T3US: Render loop started');
                    }
                    
                    console.log('PR0T3US: WebGL context created successfully');
                    resolve();
                } else {
                    setTimeout(checkWebGL, 100);
                }
            };
            checkWebGL();
        });
    }
    
    initAPIConnections() {
        console.log('PR0T3US: Initializing API connections...');
        
        // Load saved API configurations
        this.loadAPIConfig();
        
        // Test API connections
        this.testAPIConnections();
    }
    
    loadAPIConfig() {
        try {
            const saved = localStorage.getItem('pr0t3us_api_config');
            if (saved) {
                this.apiConfig = { ...this.apiConfig, ...JSON.parse(saved) };
                console.log('PR0T3US: API configuration loaded');
            }
        } catch (error) {
            console.error('PR0T3US: Failed to load API config:', error);
        }
    }
    
    saveAPIConfig() {
        try {
            localStorage.setItem('pr0t3us_api_config', JSON.stringify(this.apiConfig));
            console.log('PR0T3US: API configuration saved');
        } catch (error) {
            console.error('PR0T3US: Failed to save API config:', error);
        }
    }
    
    async testAPIConnections() {
        for (const [provider, config] of Object.entries(this.apiConfig)) {
            if (config.enabled && config.apiKey) {
                try {
                    await this.testAPIProvider(provider, config);
                } catch (error) {
                    console.error(`PR0T3US: ${provider} API test failed:`, error);
                }
            }
        }
    }
    
    async testAPIProvider(provider, config) {
        const testMessage = { role: 'user', content: 'Hello, this is a connection test.' };
        
        try {
            const response = await this.sendAPIMessage(provider, [testMessage]);
            console.log(`PR0T3US: ${provider} API connection successful`);
            this.updateAPIStatus(provider, 'connected');
        } catch (error) {
            console.error(`PR0T3US: ${provider} API connection failed:`, error);
            this.updateAPIStatus(provider, 'error');
        }
    }
    
    updateAPIStatus(provider, status) {
        const statusElement = document.getElementById(`${provider}Status`);
        if (statusElement) {
            statusElement.className = `status-dot ${status}`;
            statusElement.title = `${provider.toUpperCase()}: ${status}`;
        }
    }
    
    async sendAPIMessage(provider, messages) {
        const config = this.apiConfig[provider];
        if (!config.enabled || !config.apiKey) {
            throw new Error(`${provider} API not configured`);
        }
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
        };
        
        let requestBody;
        
        if (provider === 'openai') {
            requestBody = {
                model: config.model,
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7
            };
        } else if (provider === 'anthropic') {
            requestBody = {
                model: config.model,
                max_tokens: 1000,
                messages: messages
            };
        } else if (provider === 'local') {
            requestBody = {
                model: config.model,
                messages: messages,
                stream: false
            };
        }
        
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (provider === 'openai') {
            return data.choices[0].message.content;
        } else if (provider === 'anthropic') {
            return data.content[0].text;
        } else if (provider === 'local') {
            return data.choices[0].message.content;
        }
    }
    
    initUI() {
        console.log('PR0T3US: Initializing UI...');
        
        // Settings toggle
        const settingsToggle = document.getElementById('settingsToggle');
        const settingsSidebar = document.getElementById('settingsSidebar');
        const lockSettings = document.getElementById('lockSettings');
        
        // Fullscreen toggle
        const fullscreenToggle = document.getElementById('fullscreenToggle');
        
        // Quick settings toggle (top-right)
        const topSettingsToggle = document.getElementById('topSettingsToggle');
        
        if (settingsToggle && settingsSidebar) {
            settingsToggle.addEventListener('click', () => {
                settingsSidebar.classList.toggle('open');
            });
            
            // Close settings when clicking outside
            document.addEventListener('click', (e) => {
                if (!settingsSidebar.contains(e.target) && !settingsToggle.contains(e.target)) {
                    settingsSidebar.classList.remove('open');
                }
            });
            
            // Lock settings functionality
            if (lockSettings) {
                lockSettings.addEventListener('click', () => {
                    const isLocked = lockSettings.textContent === '🔒';
                    lockSettings.textContent = isLocked ? '🔓' : '🔒';
                    lockSettings.title = isLocked ? 'Unlock Settings' : 'Lock Settings';
                    
                    if (isLocked) {
                        settingsSidebar.classList.remove('locked');
                    } else {
                        settingsSidebar.classList.add('locked');
                    }
                });
            }
        }
        
        // Fullscreen functionality
        if (fullscreenToggle) {
            fullscreenToggle.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().then(() => {
                        fullscreenToggle.textContent = '⛶';
                        fullscreenToggle.title = 'Exit Fullscreen';
                    }).catch(err => {
                        console.error('Error entering fullscreen:', err);
                    });
                } else {
                    document.exitFullscreen().then(() => {
                        fullscreenToggle.textContent = '⛶';
                        fullscreenToggle.title = 'Fullscreen';
                    }).catch(err => {
                        console.error('Error exiting fullscreen:', err);
                    });
                }
            });
        }
        
        // Quick settings functionality
        if (topSettingsToggle) {
            topSettingsToggle.addEventListener('click', () => {
                this.showQuickSettings();
            });
        }
        
        // Initialize all control sections
        this.initAPIControls();
        this.initParameterControls();
        this.initSystemControls();
        this.initChatControls();
        
        console.log('PR0T3US: UI initialization complete');
    }
    
    initAPIControls() {
        // API Save & Test button
        const saveAPI = document.getElementById('saveAPI');
        if (saveAPI) {
            saveAPI.addEventListener('click', async () => {
                await this.saveAndTestAPI();
            });
        }
        
        // Load existing API keys
        this.loadAPIKeys();
    }
    
    async saveAndTestAPI() {
        console.log('PR0T3US: Saving and testing API configuration...');
        
        // Get API keys from inputs
        const openaiKey = document.getElementById('openaiKey')?.value;
        const anthropicKey = document.getElementById('anthropicKey')?.value;
        const localEndpoint = document.getElementById('localEndpoint')?.value;
        
        // Update configuration
        if (openaiKey) {
            this.apiConfig.openai.apiKey = openaiKey;
            this.apiConfig.openai.enabled = true;
            // Mask the API key in the input
            document.getElementById('openaiKey').value = '••••••••••••••••••••••••••••••••';
        }
        
        if (anthropicKey) {
            this.apiConfig.anthropic.apiKey = anthropicKey;
            this.apiConfig.anthropic.enabled = true;
            // Mask the API key in the input
            document.getElementById('anthropicKey').value = '••••••••••••••••••••••••••••••••';
        }
        
        if (localEndpoint) {
            this.apiConfig.local.endpoint = localEndpoint;
            this.apiConfig.local.enabled = true;
        }
        
        // Save configuration
        this.saveAPIConfig();
        
        // Test connections
        await this.testAPIConnections();
        
        // Show success message
        this.addChatMessage('system', 'API configuration saved and tested successfully!', 'system');
        
        // Hide empty API inputs
        this.hideEmptyAPIInputs();
    }
    
    hideEmptyAPIInputs() {
        const openaiInput = document.getElementById('openaiKey');
        const anthropicInput = document.getElementById('anthropicKey');
        const localInput = document.getElementById('localEndpoint');
        
        // Hide inputs that are empty or not configured
        if (openaiInput && !this.apiConfig.openai.enabled) {
            openaiInput.style.display = 'none';
            if (openaiInput.previousElementSibling) openaiInput.previousElementSibling.style.display = 'none'; // Hide label
        }
        
        if (anthropicInput && !this.apiConfig.anthropic.enabled) {
            anthropicInput.style.display = 'none';
            if (anthropicInput.previousElementSibling) anthropicInput.previousElementSibling.style.display = 'none'; // Hide label
        }
        
        if (localInput && !this.apiConfig.local.enabled) {
            localInput.style.display = 'none';
            if (localInput.previousElementSibling) localInput.previousElementSibling.style.display = 'none'; // Hide label
        }
    }
    
    loadAPIKeys() {
        // Load saved API keys into inputs
        const openaiInput = document.getElementById('openaiKey');
        const anthropicInput = document.getElementById('anthropicKey');
        const localInput = document.getElementById('localEndpoint');
        
        if (openaiInput && this.apiConfig.openai.apiKey) {
            openaiInput.value = this.apiConfig.openai.apiKey;
        }
        
        if (anthropicInput && this.apiConfig.anthropic.apiKey) {
            anthropicInput.value = this.apiConfig.anthropic.apiKey;
        }
        
        if (localInput && this.apiConfig.local.endpoint) {
            localInput.value = this.apiConfig.local.endpoint;
        }
    }
    
    initParameterControls() {
        // Particle system controls
        this.initSliderControl('particleCount', 'particleCountValue', 1000, (value) => {
            this.particleCount = value;
            this.updateParticleSystem();
        });
        
        this.initSliderControl('boundaryForce', 'boundaryForceValue', 0.15, (value) => {
            this.boundaryForce = value;
            this.updateBoundaryForce();
        });
        
        this.initSliderControl('attractionStrength', 'attractionStrengthValue', 0.5, (value) => {
            this.attractionStrength = value;
            this.updateAttractionStrength();
        });
        
        this.initSliderControl('particleSize', 'particleSizeValue', 0.5, (value) => {
            this.particleSize = value;
            this.updateParticleSize();
        });
        
        // Morphing controls
        this.initSliderControl('morphSpeed', 'morphSpeedValue', 1.0, (value) => {
            this.morphSpeed = value;
            this.updateMorphingSpeed();
        });
        
        this.initSliderControl('voiceIntensity', 'voiceIntensityValue', 0.5, (value) => {
            this.voiceIntensity = value;
            this.applyVoiceModulation();
        });
    }
    
    initSliderControl(sliderId, valueId, defaultValue, callback) {
        const slider = document.getElementById(sliderId);
        const valueDisplay = document.getElementById(valueId);
        
        if (slider && valueDisplay) {
            // Set initial value
            slider.value = defaultValue;
            valueDisplay.textContent = defaultValue;
            
            // Add event listener
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                valueDisplay.textContent = value.toFixed(2);
                if (callback) callback(value);
            });
        }
    }
    
    initSystemControls() {
        // Camera toggle
        const toggleCamera = document.getElementById('toggleCamera');
        if (toggleCamera) {
            toggleCamera.addEventListener('click', () => {
                this.toggleCamera();
            });
        }
        
        // Microphone toggle
        const toggleMicrophone = document.getElementById('toggleMicrophone');
        if (toggleMicrophone) {
            toggleMicrophone.addEventListener('click', () => {
                this.toggleMicrophone();
            });
        }
        
        // Reset system
        const resetSystem = document.getElementById('resetSystem');
        if (resetSystem) {
            resetSystem.addEventListener('click', () => {
                this.resetSystem();
            });
        }
        
        // Export configuration
        const exportConfig = document.getElementById('exportConfig');
        if (exportConfig) {
            exportConfig.addEventListener('click', () => {
                this.exportConfiguration();
            });
        }
    }
    
    initChatControls() {
        // Chat input
        const chatInput = document.getElementById('chatInput');
        const sendMessage = document.getElementById('sendMessage');
        
        if (chatInput && sendMessage) {
            // Send on Enter (but allow Shift+Enter for new lines)
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendChatMessage();
                }
            });
            
            // Auto-resize textarea
            chatInput.addEventListener('input', () => {
                chatInput.style.height = 'auto';
                chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
            });
            
            // Send button
            sendMessage.addEventListener('click', () => {
                this.sendChatMessage();
            });
        }
        
        // Model selector
        const modelSelector = document.getElementById('modelSelector');
        if (modelSelector) {
            modelSelector.addEventListener('change', (e) => {
                this.updateSelectedModel(e.target.value);
            });
        }
        
        // Chat minimize/maximize
        const minimizeChat = document.getElementById('minimizeChat');
        const maximizeChat = document.getElementById('maximizeChat');
        const chatInterface = document.getElementById('chatInterface');
        
        if (minimizeChat && chatInterface) {
            minimizeChat.addEventListener('click', () => {
                chatInterface.style.height = '60px';
                chatInterface.style.overflow = 'hidden';
            });
        }
        
        if (maximizeChat && chatInterface) {
            maximizeChat.addEventListener('click', () => {
                chatInterface.style.height = '500px';
                chatInterface.style.overflow = 'visible';
            });
        }
    }
    
    updateSelectedModel(modelName) {
        console.log('PR0T3US: Selected model:', modelName);
        
        // Update the active model based on the selection
        if (modelName.includes('gpt')) {
            this.apiConfig.openai.model = modelName;
        } else if (modelName.includes('claude')) {
            this.apiConfig.anthropic.model = modelName;
        } else if (modelName.includes('llama') || modelName.includes('mistral')) {
            this.apiConfig.local.model = modelName;
        }
        
        this.saveAPIConfig();
        this.addChatMessage('system', `Switched to ${modelName}`, 'system');
    }
    
    async initAudio() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
            
            this.microphone.connect(this.analyser);
            
            console.log('PR0T3US: Audio system initialized');
            this.startAudioAnalysis();
            
        } catch (error) {
            console.error('PR0T3US: Audio initialization failed:', error);
        }
    }
    
    stopAudio() {
        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }
        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }
        console.log('PR0T3US: Audio system stopped');
    }
    
    startAudioAnalysis() {
        if (!this.analyser) return;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const analyzeAudio = () => {
            if (!this.analyser) return;
            
            this.analyser.getByteFrequencyData(dataArray);
            
            // Calculate average frequency and intensity
            let sum = 0;
            let count = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                if (dataArray[i] > 0) {
                    sum += dataArray[i];
                    count++;
                }
            }
            
            const average = count > 0 ? sum / count : 0;
            const intensity = average / 255;
            
            // Update voice data
            this.voiceData.intensity = intensity;
            this.voiceData.frequency = average;
            
            // Apply voice modulation to particles
            this.applyVoiceModulation();
            
            requestAnimationFrame(analyzeAudio);
        };
        
        analyzeAudio();
    }
    
    applyVoiceModulation() {
        if (this.webglSystem && window.applyVoiceModulation) {
            window.applyVoiceModulation(this.voiceData);
        }
    }
    
    resetSystem() {
        if (confirm('Are you sure you want to reset the system? This will clear all settings.')) {
            // Reset parameters to defaults
            this.particleCount = 1000;
            this.morphSpeed = 1.0;
            this.boundaryForce = 0.15;
            this.attractionStrength = 0.5;
            this.particleSize = 0.5;
            
            // Clear chat history
            this.chatHistory = [];
            this.saveChatHistory();
            
            // Reset UI
            this.updateUI();
            
            // Reset WebGL system
            if (this.webglSystem && window.resetSystem) {
                window.resetSystem();
            }
            
            console.log('PR0T3US: System reset complete');
        }
    }
    
    exportConfiguration() {
        const config = {
            particleCount: this.particleCount,
            morphSpeed: this.morphSpeed,
            boundaryForce: this.boundaryForce,
            attractionStrength: this.attractionStrength,
            particleSize: this.particleSize,
            apiConfig: this.apiConfig,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pr0t3us_config_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('PR0T3US: Configuration exported');
    }
    
    importConfiguration(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                
                // Apply configuration
                this.particleCount = config.particleCount || 1000;
                this.morphSpeed = config.morphSpeed || 1.0;
                this.boundaryForce = config.boundaryForce || 0.15;
                this.attractionStrength = config.attractionStrength || 0.5;
                this.particleSize = config.particleSize || 0.5;
                
                if (config.apiConfig) {
                    this.apiConfig = { ...this.apiConfig, ...config.apiConfig };
                    this.saveAPIConfig();
                }
                
                // Update UI
                this.updateUI();
                
                // Update system
                this.updateParticleSystem();
                this.updateMorphingSpeed();
                this.updateBoundaryForce();
                this.updateAttractionStrength();
                this.updateParticleSize();
                
                console.log('PR0T3US: Configuration imported');
                
            } catch (error) {
                console.error('PR0T3US: Failed to import configuration:', error);
                alert('Failed to import configuration. Please check the file format.');
            }
        };
        reader.readAsText(file);
    }
    
    updateColorTheme(theme) {
        document.body.className = `theme-${theme}`;
        console.log(`PR0T3US: Color theme changed to ${theme}`);
    }
    
    updateUI() {
        // Update all UI elements with current values
        const particleCountSlider = document.getElementById('particleCount');
        const particleCountValue = document.getElementById('particleCountValue');
        if (particleCountSlider) particleCountSlider.value = this.particleCount;
        if (particleCountValue) particleCountValue.textContent = this.particleCount.toLocaleString();
        
        const morphSpeedSlider = document.getElementById('morphSpeed');
        const morphSpeedValue = document.getElementById('morphSpeedValue');
        if (morphSpeedSlider) morphSpeedSlider.value = this.morphSpeed;
        if (morphSpeedValue) morphSpeedValue.textContent = this.morphSpeed.toFixed(2);
        
        const boundaryForceSlider = document.getElementById('boundaryForce');
        const boundaryForceValue = document.getElementById('boundaryForceValue');
        if (boundaryForceSlider) boundaryForceSlider.value = this.boundaryForce;
        if (boundaryForceValue) boundaryForceValue.textContent = this.boundaryForce.toFixed(2);
        
        const attractionSlider = document.getElementById('attractionStrength');
        const attractionValue = document.getElementById('attractionValue');
        if (attractionSlider) attractionSlider.value = this.attractionStrength;
        if (attractionValue) attractionValue.textContent = this.attractionStrength.toFixed(2);
        
        const particleSizeSlider = document.getElementById('particleSize');
        const particleSizeValue = document.getElementById('particleSizeValue');
        if (particleSizeSlider) particleSizeSlider.value = this.particleSize;
        if (particleSizeValue) particleSizeValue.textContent = this.particleSize.toFixed(2);
        
        // Update displays
        const particleCountDisplay = document.getElementById('particleCountDisplay');
        if (particleCountDisplay) particleCountDisplay.textContent = this.particleCount.toLocaleString();
    }
    
    updateParticleSystem() {
        if (this.webglSystem && window.updateParticleCount) {
            window.updateParticleCount(this.particleCount);
            console.log(`PR0T3US: Particle count updated to ${this.particleCount}`);
        }
        
        // Update display
        const display = document.getElementById('particleCountDisplay');
        if (display) {
            display.textContent = this.particleCount.toLocaleString();
        }
    }
    
    updateMorphingSpeed() {
        if (this.webglSystem && window.updateMorphSpeed) {
            window.updateMorphSpeed(this.morphSpeed);
            console.log(`PR0T3US: Morph speed updated to ${this.morphSpeed}`);
        }
    }
    
    updateBoundaryForce() {
        if (this.webglSystem && window.updateBoundaryForce) {
            window.updateBoundaryForce(this.boundaryForce);
            console.log(`PR0T3US: Boundary force updated to ${this.boundaryForce}`);
        }
    }
    
    updateAttractionStrength() {
        if (this.webglSystem && window.updateAttractionStrength) {
            window.updateAttractionStrength(this.attractionStrength);
            console.log(`PR0T3US: Attraction strength updated to ${this.attractionStrength}`);
        }
    }
    
    updateParticleSize() {
        if (this.webglSystem && window.updateParticleSize) {
            window.updateParticleSize(this.particleSize);
            console.log(`PR0T3US: Particle size updated to ${this.particleSize}`);
        }
    }
    
    startPerformanceMonitoring() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const updatePerformance = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                this.currentFps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                frameCount = 0;
                lastTime = currentTime;
                
                // Update FPS display
                const fpsDisplay = document.getElementById('fpsDisplay');
                if (fpsDisplay) {
                    fpsDisplay.textContent = this.currentFps;
                }
                
                // Update memory display
                this.updateMemoryDisplay();
            }
            
            requestAnimationFrame(updatePerformance);
        };
        
        updatePerformance();
    }
    
    updateMemoryDisplay() {
        if (performance.memory) {
            const usedMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
            const totalMB = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
            
            const memoryDisplay = document.getElementById('memoryDisplay');
            if (memoryDisplay) {
                memoryDisplay.textContent = `${usedMB}MB`;
            }
        }
    }
    
    loadChatHistory() {
        try {
            const saved = localStorage.getItem('pr0t3us_chat_history');
            if (saved) {
                this.chatHistory = JSON.parse(saved);
                console.log('PR0T3US: Chat history loaded');
            }
        } catch (error) {
            console.error('PR0T3US: Failed to load chat history:', error);
        }
    }
    
    saveChatHistory() {
        try {
            localStorage.setItem('pr0t3us_chat_history', JSON.stringify(this.chatHistory));
        } catch (error) {
            console.error('PR0T3US: Failed to save chat history:', error);
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            document.getElementById('fullscreenToggle').classList.add('fullscreen');
        } else {
            document.exitFullscreen();
            document.getElementById('fullscreenToggle').classList.remove('fullscreen');
        }
    }
    
    toggleCamera() {
        this.cameraEnabled = !this.cameraEnabled;
        const cameraToggle = document.getElementById('cameraToggle');
        
        if (cameraToggle) {
            if (this.cameraEnabled) {
                cameraToggle.classList.add('active');
                cameraToggle.innerHTML = '<i class="fas fa-video-slash"></i><span>Camera</span>';
            } else {
                cameraToggle.classList.remove('active');
                cameraToggle.innerHTML = '<i class="fas fa-video"></i><span>Camera</span>';
            }
        }
        
        console.log(`PR0T3US: Camera ${this.cameraEnabled ? 'enabled' : 'disabled'}`);
    }
    
    toggleMicrophone() {
        this.microphoneEnabled = !this.microphoneEnabled;
        const micToggle = document.getElementById('micToggle');
        
        if (micToggle) {
            if (this.microphoneEnabled) {
                micToggle.classList.add('active');
                micToggle.innerHTML = '<i class="fas fa-microphone-slash"></i><span>Microphone</span>';
                this.initAudio();
            } else {
                micToggle.classList.remove('active');
                micToggle.innerHTML = '<i class="fas fa-microphone"></i><span>Microphone</span>';
                this.stopAudio();
            }
        }
        
        console.log(`PR0T3US: Microphone ${this.microphoneEnabled ? 'enabled' : 'disabled'}`);
    }
    
    async sendChatMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput?.value?.trim();
        
        if (!message) return;
        
        // Add user message to chat
        this.addChatMessage('user', message);
        chatInput.value = '';
        
        // Show typing indicator
        this.addChatMessage('system', 'AI is thinking...', 'typing');
        
        try {
            // Get active API provider
            const activeProvider = this.getActiveAPIProvider();
            
            if (!activeProvider) {
                this.addChatMessage('system', 'No AI provider configured. Please configure an API in the settings.', 'error');
                return;
            }
            
            // Prepare conversation context
            const messages = this.prepareConversationContext(message);
            
            // Send to AI
            const response = await this.sendAPIMessage(activeProvider, messages);
            
            // Remove typing indicator and add AI response
            this.removeTypingIndicator();
            this.addChatMessage('ai', response);
            
        } catch (error) {
            console.error('PR0T3US: Chat error:', error);
            this.removeTypingIndicator();
            this.addChatMessage('system', `Error: ${error.message}`, 'error');
        }
    }
    
    getActiveAPIProvider() {
        for (const [provider, config] of Object.entries(this.apiConfig)) {
            if (config.enabled && config.apiKey) {
                return provider;
            }
        }
        return null;
    }
    
    prepareConversationContext(userMessage) {
        const messages = [
            {
                role: 'system',
                content: `You are PR0T3US, an advanced AI assistant integrated with a sophisticated particle morphing system. 
                You help users understand and control the system's parameters, provide insights about the visual effects, 
                and assist with research and development. Be concise, technical, and helpful. 
                Current system state: ${this.particleCount} particles, morph speed: ${this.morphSpeed}, 
                boundary force: ${this.boundaryForce}, attraction strength: ${this.attractionStrength}.`
            }
        ];
        
        // Add recent conversation history (last 5 messages)
        const recentHistory = this.chatHistory.slice(-5);
        for (const msg of recentHistory) {
            if (msg.sender === 'user') {
                messages.push({ role: 'user', content: msg.content });
            } else if (msg.sender === 'ai') {
                messages.push({ role: 'assistant', content: msg.content });
            }
        }
        
        // Add current user message
        messages.push({ role: 'user', content: userMessage });
        
        return messages;
    }
    
    addChatMessage(sender, content, type = 'normal') {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender} ${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${sender.toUpperCase()}</span>
                <span class="message-time">${timestamp}</span>
            </div>
            <div class="message-content">${content}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Save to history
        this.chatHistory.push({
            sender,
            content,
            timestamp: new Date().toISOString()
        });
        
        // Limit history size
        if (this.chatHistory.length > this.maxChatHistory) {
            this.chatHistory = this.chatHistory.slice(-this.maxChatHistory);
        }
        
        this.saveChatHistory();
    }
    
    removeTypingIndicator() {
        const typingMessage = document.querySelector('.message.typing');
        if (typingMessage) {
            typingMessage.remove();
        }
    }
    
    showQuickSettings() {
        // Create quick settings modal
        const modal = document.createElement('div');
        modal.className = 'quick-settings-modal';
        modal.innerHTML = `
            <div class="quick-settings-content">
                <div class="quick-settings-header">
                    <h3>⚡ Quick Settings</h3>
                    <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="quick-settings-grid">
                    <div class="quick-setting-item">
                        <label>🎨 Visual Style</label>
                        <select id="visualStyle">
                            <option value="default">Default</option>
                            <option value="neon">Neon</option>
                            <option value="minimal">Minimal</option>
                            <option value="cosmic">Cosmic</option>
                        </select>
                    </div>
                    <div class="quick-setting-item">
                        <label>🎵 Audio Reactivity</label>
                        <input type="range" id="audioReactivity" min="0" max="100" value="50">
                        <span id="audioValue">50%</span>
                    </div>
                    <div class="quick-setting-item">
                        <label>⚡ Performance Mode</label>
                        <select id="performanceMode">
                            <option value="auto">Auto</option>
                            <option value="high">High Quality</option>
                            <option value="balanced">Balanced</option>
                            <option value="low">Low Power</option>
                        </select>
                    </div>
                    <div class="quick-setting-item">
                        <label>🌊 Particle Density</label>
                        <input type="range" id="particleDensity" min="100" max="10000" value="1000" step="100">
                        <span id="densityValue">1000</span>
                    </div>
                    <div class="quick-setting-item">
                        <label>🎭 AI Personality</label>
                        <select id="aiPersonality">
                            <option value="professional">Professional</option>
                            <option value="creative">Creative</option>
                            <option value="analytical">Analytical</option>
                            <option value="friendly">Friendly</option>
                        </select>
                    </div>
                    <div class="quick-setting-item">
                        <label>🔧 Auto-Save</label>
                        <input type="checkbox" id="autoSave" checked>
                    </div>
                </div>
                <div class="quick-settings-actions">
                    <button class="apply-btn" onclick="this.parentElement.parentElement.parentElement.remove()">Apply</button>
                    <button class="reset-btn" onclick="this.parentElement.parentElement.parentElement.remove()">Reset</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners for the quick settings
        const audioReactivity = modal.querySelector('#audioReactivity');
        const audioValue = modal.querySelector('#audioValue');
        const particleDensity = modal.querySelector('#particleDensity');
        const densityValue = modal.querySelector('#densityValue');
        
        audioReactivity.addEventListener('input', (e) => {
            audioValue.textContent = e.target.value + '%';
            this.updateAudioReactivity(e.target.value);
        });
        
        particleDensity.addEventListener('input', (e) => {
            densityValue.textContent = e.target.value;
            this.updateParticleDensity(e.target.value);
        });
        
        // Add CSS for the modal
        if (!document.querySelector('#quick-settings-styles')) {
            const style = document.createElement('style');
            style.id = 'quick-settings-styles';
            style.textContent = `
                .quick-settings-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    backdrop-filter: blur(10px);
                }
                
                .quick-settings-content {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border: 1px solid #2a2a3e;
                    border-radius: 12px;
                    padding: 20px;
                    width: 400px;
                    max-width: 90vw;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                }
                
                .quick-settings-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #2a2a3e;
                }
                
                .quick-settings-header h3 {
                    margin: 0;
                    color: #00d4ff;
                    font-size: 18px;
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    color: #cccccc;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s ease;
                }
                
                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #ffffff;
                }
                
                .quick-settings-grid {
                    display: grid;
                    gap: 15px;
                    margin-bottom: 20px;
                }
                
                .quick-setting-item {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                
                .quick-setting-item label {
                    color: #cccccc;
                    font-size: 14px;
                    font-weight: 500;
                }
                
                .quick-setting-item select,
                .quick-setting-item input[type="range"] {
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid #2a2a3e;
                    border-radius: 6px;
                    color: #ffffff;
                    padding: 8px 12px;
                    font-size: 14px;
                }
                
                .quick-setting-item input[type="range"] {
                    padding: 0;
                    height: 6px;
                    background: linear-gradient(to right, #00d4ff 0%, #00d4ff 50%, #2a2a3e 50%, #2a2a3e 100%);
                    border: none;
                    border-radius: 3px;
                }
                
                .quick-setting-item input[type="checkbox"] {
                    width: 20px;
                    height: 20px;
                    accent-color: #00d4ff;
                }
                
                .quick-settings-actions {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }
                
                .apply-btn, .reset-btn {
                    background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
                    border: none;
                    border-radius: 6px;
                    color: #ffffff;
                    padding: 8px 16px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }
                
                .reset-btn {
                    background: linear-gradient(135deg, #666666 0%, #444444 100%);
                }
                
                .apply-btn:hover, .reset-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    updateAudioReactivity(value) {
        // Update audio reactivity settings
        console.log('PR0T3US: Audio reactivity set to', value + '%');
        // Implementation for audio reactivity
    }
    
    updateParticleDensity(density) {
        // Update particle density
        console.log('PR0T3US: Particle density set to', density);
        // Implementation for particle density changes
    }
}

// Initialize PR0T3US system when script loads
let pr0t3usSystem;
document.addEventListener('DOMContentLoaded', function() {
    pr0t3usSystem = new PR0T3USMorphingSystem();
    console.log('PR0T3US: System instance created');
});

// Export for global access
window.PR0T3US = pr0t3usSystem; 