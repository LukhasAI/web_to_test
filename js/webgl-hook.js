// WebGL Hook System for Voice-Modulated Morphing
class WebGLHook {
    constructor() {
        this.gl = null;
        this.originalDrawCall = null;
        this.voiceData = {
            intensity: 0,
            frequency: 0
        };
        this.currentShape = 'default';
        this.morphProgress = 0;
        this.targetShape = 'default';
        this.morphSpeed = 0.02;
        
        this.init();
    }
    
    init() {
        // Wait for the WebGL system to be ready
        this.waitForWebGL();
    }
    
    waitForWebGL() {
        const checkWebGL = () => {
            const canvas = document.getElementById('mainCanvas');
            if (canvas) {
                this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                if (this.gl) {
                    this.hookIntoWebGL();
                    return;
                }
            }
            setTimeout(checkWebGL, 100);
        };
        checkWebGL();
    }
    
    hookIntoWebGL() {
        console.log('WebGL Hook: Found WebGL context, hooking in...');
        
        // Store original WebGL functions
        this.originalDrawArrays = this.gl.drawArrays;
        this.originalDrawElements = this.gl.drawElements;
        this.originalUniform1f = this.gl.uniform1f;
        this.originalUniform3f = this.gl.uniform3f;
        this.originalUniformMatrix4fv = this.gl.uniformMatrix4fv;
        
        // Hook into draw calls
        this.gl.drawArrays = this.hookedDrawArrays.bind(this);
        this.gl.drawElements = this.hookedDrawElements.bind(this);
        this.gl.uniform1f = this.hookedUniform1f.bind(this);
        this.gl.uniform3f = this.hookedUniform3f.bind(this);
        this.gl.uniformMatrix4fv = this.hookedUniformMatrix4fv.bind(this);
        
        // Try to find and modify the main render loop
        this.findAndModifyRenderLoop();
        
        console.log('WebGL Hook: Successfully hooked into WebGL system');
    }
    
    findAndModifyRenderLoop() {
        // Look for common animation frame patterns
        const originalRequestAnimationFrame = window.requestAnimationFrame;
        let frameCount = 0;
        
        window.requestAnimationFrame = (callback) => {
            frameCount++;
            
            // Every few frames, try to inject our voice data
            if (frameCount % 3 === 0) {
                this.injectVoiceData();
            }
            
            return originalRequestAnimationFrame(callback);
        };
        
        // Also try to find global variables that might control the morph
        this.scanForGlobalVariables();
    }
    
    scanForGlobalVariables() {
        // Look for common variable names that might control the morph
        const possibleVars = [
            'morph', 'shape', 'form', 'transform', 'scale', 'rotation',
            'intensity', 'frequency', 'amplitude', 'modulation'
        ];
        
        possibleVars.forEach(varName => {
            if (window[varName] !== undefined) {
                console.log(`Found global variable: ${varName}`, window[varName]);
            }
        });
        
        // Look for functions that might be controlling the morph
        const possibleFuncs = [
            'updateMorph', 'setShape', 'transformShape', 'applyMorph',
            'updateTransform', 'setIntensity', 'setFrequency'
        ];
        
        possibleFuncs.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                console.log(`Found global function: ${funcName}`);
                this.hookIntoFunction(funcName);
            }
        });
    }
    
    hookIntoFunction(funcName) {
        const originalFunc = window[funcName];
        window[funcName] = (...args) => {
            // Inject our voice data before calling the original function
            this.injectVoiceData();
            return originalFunc.apply(window, args);
        };
    }
    
    injectVoiceData() {
        // Try to set global variables that might control the morph
        if (this.voiceData.intensity > 0) {
            // Try common variable names
            const intensityVars = ['morphIntensity', 'voiceIntensity', 'intensity', 'amplitude'];
            intensityVars.forEach(varName => {
                if (window[varName] !== undefined) {
                    window[varName] = this.voiceData.intensity / 128;
                }
            });
            
            const frequencyVars = ['morphFrequency', 'voiceFrequency', 'frequency', 'modulation'];
            frequencyVars.forEach(varName => {
                if (window[varName] !== undefined) {
                    window[varName] = this.voiceData.frequency;
                }
            });
        }
        
        // Try to call functions that might update the morph
        const updateFuncs = ['updateMorph', 'setMorph', 'updateShape', 'setShape'];
        updateFuncs.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                try {
                    window[funcName](this.voiceData.intensity, this.voiceData.frequency);
                } catch (e) {
                    // Ignore errors
                }
            }
        });
    }
    
    hookedDrawArrays(mode, first, count) {
        // Inject voice data before drawing
        this.injectVoiceData();
        return this.originalDrawArrays.call(this.gl, mode, first, count);
    }
    
    hookedDrawElements(mode, count, type, offset) {
        // Inject voice data before drawing
        this.injectVoiceData();
        return this.originalDrawElements.call(this.gl, mode, count, type, offset);
    }
    
    hookedUniform1f(location, value) {
        // Modify uniform values based on voice data
        if (location && this.voiceData.intensity > 0) {
            // Try to identify which uniform this is and modify it
            const modifiedValue = this.modifyUniformValue(value, 'float');
            return this.originalUniform1f.call(this.gl, location, modifiedValue);
        }
        return this.originalUniform1f.call(this.gl, location, value);
    }
    
    hookedUniform3f(location, x, y, z) {
        // Modify 3D uniform values based on voice data
        if (location && this.voiceData.intensity > 0) {
            const modifiedX = this.modifyUniformValue(x, 'x');
            const modifiedY = this.modifyUniformValue(y, 'y');
            const modifiedZ = this.modifyUniformValue(z, 'z');
            return this.originalUniform3f.call(this.gl, location, modifiedX, modifiedY, modifiedZ);
        }
        return this.originalUniform3f.call(this.gl, location, x, y, z);
    }
    
    hookedUniformMatrix4fv(location, transpose, value) {
        // Modify matrix uniforms (like model/view/projection matrices)
        if (location && this.voiceData.intensity > 0) {
            const modifiedValue = this.modifyMatrixValue(value);
            return this.originalUniformMatrix4fv.call(this.gl, location, transpose, modifiedValue);
        }
        return this.originalUniformMatrix4fv.call(this.gl, location, transpose, value);
    }
    
    modifyUniformValue(value, type) {
        const intensity = this.voiceData.intensity / 128;
        const frequency = this.voiceData.frequency;
        
        switch (this.currentShape) {
            case 'cat':
                // Cat purring effect
                return value + Math.sin(frequency * 0.01) * intensity * 0.1;
            case 'car':
                // Car engine vibration
                return value + Math.sin(frequency * 0.02) * intensity * 0.05;
            case 'person':
                // Person breathing effect
                return value + Math.sin(frequency * 0.005) * intensity * 0.08;
            default:
                // Default voice modulation
                return value + intensity * 0.05;
        }
    }
    
    modifyMatrixValue(matrix) {
        // Create a copy of the matrix to modify
        const modifiedMatrix = new Float32Array(matrix);
        const intensity = this.voiceData.intensity / 128;
        
        // Apply voice modulation to scale components
        switch (this.currentShape) {
            case 'cat':
                // Cat shape: elongate and add ears
                modifiedMatrix[0] *= 1.0 + intensity * 0.1; // Scale X
                modifiedMatrix[5] *= 1.0 + intensity * 0.15; // Scale Y
                modifiedMatrix[10] *= 1.0 + intensity * 0.1; // Scale Z
                break;
            case 'car':
                // Car shape: flatten and elongate
                modifiedMatrix[0] *= 1.0 + intensity * 0.2; // Scale X (wider)
                modifiedMatrix[5] *= 0.8 + intensity * 0.1; // Scale Y (flatter)
                modifiedMatrix[10] *= 1.0 + intensity * 0.15; // Scale Z (longer)
                break;
            case 'person':
                // Person shape: human proportions
                modifiedMatrix[0] *= 1.0 + intensity * 0.08; // Scale X
                modifiedMatrix[5] *= 1.0 + intensity * 0.12; // Scale Y
                modifiedMatrix[10] *= 1.0 + intensity * 0.08; // Scale Z
                break;
            default:
                // Default: subtle voice modulation
                const scale = 1.0 + intensity * 0.05;
                modifiedMatrix[0] *= scale;
                modifiedMatrix[5] *= scale;
                modifiedMatrix[10] *= scale;
                break;
        }
        
        return modifiedMatrix;
    }
    
    setVoiceData(voiceData) {
        this.voiceData = voiceData;
    }
    
    setTargetShape(shape) {
        this.targetShape = shape;
        this.morphProgress = 0;
        
        // Start morphing animation
        this.startMorphing();
    }
    
    startMorphing() {
        const morph = () => {
            if (this.currentShape !== this.targetShape) {
                this.morphProgress += this.morphSpeed;
                if (this.morphProgress >= 1.0) {
                    this.morphProgress = 1.0;
                    this.currentShape = this.targetShape;
                }
                
                // Interpolate between shapes
                this.interpolateShapes();
                
                requestAnimationFrame(morph);
            }
        };
        morph();
    }
    
    interpolateShapes() {
        // This will be called during morphing to smoothly transition between shapes
        // The actual shape interpolation happens in the uniform modification functions
    }
    
    // Method to get current state
    getState() {
        return {
            currentShape: this.currentShape,
            targetShape: this.targetShape,
            morphProgress: this.morphProgress,
            voiceData: this.voiceData
        };
    }
}

// Initialize the WebGL hook system
window.addEventListener('load', () => {
    setTimeout(() => {
        window.webglHook = new WebGLHook();
        console.log('WebGL Hook System initialized');
    }, 500);
}); 