// Simple Voice-Modulated Morphing System
class SimpleVoiceMorph {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.isListening = false;
        this.currentShape = 'default';
        this.voiceSensitivity = 1.0;
        this.frequencyData = new Uint8Array(256);
        this.voiceBars = [];
        this.morphIntensity = 0;
        this.morphFrequency = 0;
        
        // Canvas overlay for voice effects
        this.overlayCanvas = null;
        this.overlayCtx = null;
        
        this.init();
    }
    
    init() {
        this.createOverlay();
        this.initControls();
        this.initVoiceVisualizer();
        this.startMorphingLoop();
    }
    
    createOverlay() {
        // Create an overlay canvas that sits on top of the main canvas
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCanvas.style.position = 'absolute';
        this.overlayCanvas.style.top = '0';
        this.overlayCanvas.style.left = '0';
        this.overlayCanvas.style.pointerEvents = 'none';
        this.overlayCanvas.style.zIndex = '100';
        
        // Get the main canvas and position the overlay
        const mainCanvas = document.getElementById('mainCanvas');
        if (mainCanvas) {
            mainCanvas.parentNode.insertBefore(this.overlayCanvas, mainCanvas.nextSibling);
            this.resizeOverlay();
            
            // Resize overlay when window resizes
            window.addEventListener('resize', () => this.resizeOverlay());
        }
        
        this.overlayCtx = this.overlayCanvas.getContext('2d');
    }
    
    resizeOverlay() {
        const mainCanvas = document.getElementById('mainCanvas');
        if (mainCanvas && this.overlayCanvas) {
            this.overlayCanvas.width = mainCanvas.width;
            this.overlayCanvas.height = mainCanvas.height;
        }
    }
    
    initControls() {
        // Voice control buttons
        const startBtn = document.getElementById('startVoice');
        const stopBtn = document.getElementById('stopVoice');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startVoiceInput());
        }
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopVoiceInput());
        }
        
        // Morphing shape buttons
        document.querySelectorAll('.morph-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.setMorphShape(e.target.dataset.shape);
            });
        });
        
        // Voice sensitivity slider
        const sensitivitySlider = document.getElementById('voiceSensitivity');
        const sensitivityValue = document.getElementById('sensitivityValue');
        
        if (sensitivitySlider) {
            sensitivitySlider.addEventListener('input', (e) => {
                this.voiceSensitivity = parseFloat(e.target.value);
                if (sensitivityValue) {
                    sensitivityValue.textContent = e.target.value;
                }
            });
        }
    }
    
    initVoiceVisualizer() {
        const visualizer = document.getElementById('voiceVisualizer');
        if (!visualizer) return;
        
        // Create voice bars
        for (let i = 0; i < 32; i++) {
            const bar = document.createElement('div');
            bar.className = 'voice-bar';
            bar.style.left = (i * 8) + 'px';
            bar.style.height = '0px';
            visualizer.appendChild(bar);
            this.voiceBars.push(bar);
        }
    }
    
    async startVoiceInput() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            this.analyser.smoothingTimeConstant = 0.8;
            
            this.microphone.connect(this.analyser);
            
            this.isListening = true;
            this.updateVoiceStatus();
            this.startAnalysis();
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    }
    
    stopVoiceInput() {
        if (this.microphone && this.microphone.mediaStream) {
            this.microphone.mediaStream.getTracks().forEach(track => track.stop());
        }
        
        this.isListening = false;
        this.updateVoiceStatus();
        
        // Reset voice bars
        this.voiceBars.forEach(bar => {
            bar.style.height = '0px';
        });
        
        // Clear overlay
        if (this.overlayCtx) {
            this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        }
    }
    
    updateVoiceStatus() {
        const statusElement = document.getElementById('voiceStatus');
        if (statusElement) {
            if (this.isListening) {
                statusElement.textContent = 'Voice Input: Active';
                statusElement.className = 'status-listening';
            } else {
                statusElement.textContent = 'Voice Input: Disabled';
                statusElement.className = 'status-not-listening';
            }
        }
    }
    
    startAnalysis() {
        const analyze = () => {
            if (!this.isListening) return;
            
            this.analyser.getByteFrequencyData(this.frequencyData);
            
            // Calculate voice intensity and frequency characteristics
            const averageIntensity = this.calculateAverageIntensity();
            const dominantFrequency = this.calculateDominantFrequency();
            
            // Update voice visualizer
            this.updateVoiceVisualizer();
            
            // Store voice data for morphing
            this.morphIntensity = averageIntensity;
            this.morphFrequency = dominantFrequency;
            
            // Send voice data to WebGL hook system
            if (window.webglHook) {
                window.webglHook.setVoiceData({
                    intensity: averageIntensity,
                    frequency: dominantFrequency
                });
            }
            
            // Send voice data to vertex modifier system
            if (window.vertexModifier) {
                window.vertexModifier.setVoiceData({
                    intensity: averageIntensity,
                    frequency: dominantFrequency
                });
            }
            
            requestAnimationFrame(analyze);
        };
        
        analyze();
    }
    
    updateVoiceVisualizer() {
        // Update voice bars based on frequency data
        for (let i = 0; i < this.voiceBars.length; i++) {
            const dataIndex = Math.floor(i * this.frequencyData.length / this.voiceBars.length);
            const value = this.frequencyData[dataIndex] || 0;
            const height = (value / 255) * 60; // Max height of 60px
            
            this.voiceBars[i].style.height = height + 'px';
            
            // Change color based on intensity
            const intensity = value / 255;
            if (intensity > 0.7) {
                this.voiceBars[i].style.background = '#FF5722';
            } else if (intensity > 0.4) {
                this.voiceBars[i].style.background = '#FFC107';
            } else {
                this.voiceBars[i].style.background = '#4CAF50';
            }
        }
    }
    
    calculateAverageIntensity() {
        let sum = 0;
        for (let i = 0; i < this.frequencyData.length; i++) {
            sum += this.frequencyData[i];
        }
        return (sum / this.frequencyData.length) * this.voiceSensitivity;
    }
    
    calculateDominantFrequency() {
        let maxIndex = 0;
        let maxValue = 0;
        
        for (let i = 0; i < this.frequencyData.length; i++) {
            if (this.frequencyData[i] > maxValue) {
                maxValue = this.frequencyData[i];
                maxIndex = i;
            }
        }
        
        // Convert index to frequency (rough approximation)
        return maxIndex * (this.audioContext.sampleRate / (this.analyser.fftSize * 2));
    }
    
    startMorphingLoop() {
        let time = 0;
        
        const morphLoop = () => {
            time += 0.016; // ~60fps
            
            // Apply voice effects to the overlay
            this.applyVoiceEffects(time);
            
            // Try to affect the main WebGL system if possible
            this.tryAffectWebGLSystem();
            
            requestAnimationFrame(morphLoop);
        };
        
        morphLoop();
    }
    
    applyVoiceEffects(time) {
        if (!this.overlayCtx || !this.isListening) return;
        
        const canvas = this.overlayCanvas;
        const ctx = this.overlayCtx;
        
        // Clear the overlay
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate effect intensity
        const intensity = this.morphIntensity / 128;
        const frequency = this.morphFrequency;
        
        if (intensity > 0.1) { // Only show effects when there's significant voice input
            // Create voice-reactive visual effects based on shape
            switch (this.currentShape) {
                case 'cat':
                    this.drawCatEffects(ctx, canvas, time, intensity, frequency);
                    break;
                case 'car':
                    this.drawCarEffects(ctx, canvas, time, intensity, frequency);
                    break;
                case 'person':
                    this.drawPersonEffects(ctx, canvas, time, intensity, frequency);
                    break;
                default:
                    this.drawDefaultEffects(ctx, canvas, time, intensity, frequency);
                    break;
            }
        }
    }
    
    drawDefaultEffects(ctx, canvas, time, intensity, frequency) {
        // Create pulsing circles that respond to voice
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Main pulse
        const pulseRadius = 50 + Math.sin(time * 10 + frequency * 0.01) * intensity * 30;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(76, 175, 80, ${intensity * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Frequency rings
        for (let i = 0; i < 3; i++) {
            const ringRadius = 80 + i * 40 + Math.sin(time * 5 + i) * intensity * 20;
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(33, 150, 243, ${intensity * 0.3})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
    
    drawCatEffects(ctx, canvas, time, intensity, frequency) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Purring effect - gentle waves
        for (let i = 0; i < 5; i++) {
            const waveRadius = 60 + i * 20 + Math.sin(time * 20 + i * 2) * intensity * 15;
            ctx.beginPath();
            ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 193, 7, ${intensity * 0.4})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Cat ears effect
        const earLeft = centerX - 40;
        const earRight = centerX + 40;
        const earY = centerY - 60;
        
        ctx.fillStyle = `rgba(255, 193, 7, ${intensity * 0.6})`;
        ctx.beginPath();
        ctx.moveTo(earLeft, earY);
        ctx.lineTo(earLeft - 20, earY - 30);
        ctx.lineTo(earLeft + 20, earY - 20);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(earRight, earY);
        ctx.lineTo(earRight + 20, earY - 30);
        ctx.lineTo(earRight - 20, earY - 20);
        ctx.closePath();
        ctx.fill();
    }
    
    drawCarEffects(ctx, canvas, time, intensity, frequency) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Engine vibration effect
        const vibration = Math.sin(time * 50 + frequency * 0.02) * intensity * 10;
        
        // Car body outline
        ctx.strokeStyle = `rgba(255, 87, 34, ${intensity * 0.7})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(centerX - 80 + vibration, centerY - 30, 160, 60);
        
        // Wheels
        ctx.fillStyle = `rgba(33, 33, 33, ${intensity * 0.8})`;
        ctx.beginPath();
        ctx.arc(centerX - 60 + vibration, centerY + 30, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 60 + vibration, centerY + 30, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Exhaust effect
        for (let i = 0; i < 3; i++) {
            const exhaustX = centerX + 80 + vibration;
            const exhaustY = centerY + 20 + i * 10;
            ctx.fillStyle = `rgba(128, 128, 128, ${intensity * 0.5})`;
            ctx.fillRect(exhaustX, exhaustY, 20 + Math.sin(time * 10 + i) * 10, 3);
        }
    }
    
    drawPersonEffects(ctx, canvas, time, intensity, frequency) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Breathing effect
        const breath = Math.sin(time * 2 + frequency * 0.005) * intensity * 20;
        
        // Head
        ctx.fillStyle = `rgba(255, 193, 7, ${intensity * 0.6})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 60 + breath, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Body
        ctx.fillStyle = `rgba(33, 150, 243, ${intensity * 0.5})`;
        ctx.fillRect(centerX - 20, centerY - 35 + breath, 40, 60);
        
        // Arms
        ctx.fillStyle = `rgba(255, 193, 7, ${intensity * 0.4})`;
        ctx.fillRect(centerX - 40, centerY - 20 + breath, 20, 40);
        ctx.fillRect(centerX + 20, centerY - 20 + breath, 20, 40);
        
        // Legs
        ctx.fillStyle = `rgba(33, 33, 33, ${intensity * 0.4})`;
        ctx.fillRect(centerX - 15, centerY + 25 + breath, 15, 40);
        ctx.fillRect(centerX, centerY + 25 + breath, 15, 40);
    }
    
    tryAffectWebGLSystem() {
        // Try to affect the existing WebGL system by modifying global variables
        if (window.gl && this.isListening) {
            // Try to find and modify the main rendering loop
            if (window.requestAnimationFrame) {
                // We could potentially hook into the main render loop here
                // For now, we'll just use the overlay effects
            }
        }
    }
    
    setMorphShape(shape) {
        this.currentShape = shape;
        
        // Update button states
        document.querySelectorAll('.morph-button').forEach(button => {
            button.classList.remove('active');
        });
        const activeButton = document.querySelector(`[data-shape="${shape}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        // Send shape change to WebGL hook system
        if (window.webglHook) {
            window.webglHook.setTargetShape(shape);
        }
        
        // Send shape change to vertex modifier system
        if (window.vertexModifier) {
            window.vertexModifier.setTargetShape(shape);
        }
        
        console.log(`Morphing to: ${shape}`);
    }
}

// Initialize the simple voice morph system
window.addEventListener('load', () => {
    setTimeout(() => {
        window.simpleVoiceMorph = new SimpleVoiceMorph();
        console.log('Simple Voice Morph System initialized');
    }, 1000);
}); 