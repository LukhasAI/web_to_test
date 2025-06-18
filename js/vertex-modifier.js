// Direct Vertex Buffer Modification System
class VertexModifier {
    constructor() {
        this.gl = null;
        this.originalBuffers = new Map();
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
        console.log('Vertex Modifier: Found WebGL context, hooking in...');
        
        // Hook into buffer creation and binding
        this.originalCreateBuffer = this.gl.createBuffer;
        this.originalBindBuffer = this.gl.bindBuffer;
        this.originalBufferData = this.gl.bufferData;
        this.originalVertexAttribPointer = this.gl.vertexAttribPointer;
        
        this.gl.createBuffer = this.hookedCreateBuffer.bind(this);
        this.gl.bindBuffer = this.hookedBindBuffer.bind(this);
        this.gl.bufferData = this.hookedBufferData.bind(this);
        this.gl.vertexAttribPointer = this.hookedVertexAttribPointer.bind(this);
        
        // Hook into draw calls to modify vertices in real-time
        this.originalDrawArrays = this.gl.drawArrays;
        this.originalDrawElements = this.gl.drawElements;
        
        this.gl.drawArrays = this.hookedDrawArrays.bind(this);
        this.gl.drawElements = this.hookedDrawElements.bind(this);
        
        console.log('Vertex Modifier: Successfully hooked into WebGL system');
    }
    
    hookedCreateBuffer() {
        const buffer = this.originalCreateBuffer.call(this.gl);
        this.originalBuffers.set(buffer, {
            data: null,
            size: 0,
            type: null,
            usage: null
        });
        return buffer;
    }
    
    hookedBindBuffer(target, buffer) {
        if (buffer && this.originalBuffers.has(buffer)) {
            // Store the currently bound buffer for modification
            this.currentBuffer = buffer;
        }
        return this.originalBindBuffer.call(this.gl, target, buffer);
    }
    
    hookedBufferData(target, data, usage) {
        if (this.currentBuffer && data) {
            // Store the original vertex data
            const bufferInfo = this.originalBuffers.get(this.currentBuffer);
            if (bufferInfo) {
                bufferInfo.data = new Float32Array(data);
                bufferInfo.size = data.byteLength;
                bufferInfo.type = target;
                bufferInfo.usage = usage;
                
                // Modify the data before sending to GPU
                const modifiedData = this.modifyVertexData(data);
                return this.originalBufferData.call(this.gl, target, modifiedData, usage);
            }
        }
        return this.originalBufferData.call(this.gl, target, data, usage);
    }
    
    hookedVertexAttribPointer(index, size, type, normalized, stride, offset) {
        // Store attribute information for later modification
        if (this.currentBuffer) {
            const bufferInfo = this.originalBuffers.get(this.currentBuffer);
            if (bufferInfo) {
                bufferInfo.attributes = bufferInfo.attributes || [];
                bufferInfo.attributes.push({
                    index, size, type, normalized, stride, offset
                });
            }
        }
        return this.originalVertexAttribPointer.call(this.gl, index, size, type, normalized, stride, offset);
    }
    
    hookedDrawArrays(mode, first, count) {
        // Modify vertices just before drawing
        this.modifyCurrentBuffer();
        return this.originalDrawArrays.call(this.gl, mode, first, count);
    }
    
    hookedDrawElements(mode, count, type, offset) {
        // Modify vertices just before drawing
        this.modifyCurrentBuffer();
        return this.originalDrawElements.call(this.gl, mode, count, type, offset);
    }
    
    modifyVertexData(data) {
        if (!data || this.voiceData.intensity === 0) return data;
        
        const vertices = new Float32Array(data);
        const modifiedVertices = new Float32Array(vertices.length);
        
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];
            const z = vertices[i + 2];
            
            const modified = this.applyShapeModification(x, y, z);
            
            modifiedVertices[i] = modified.x;
            modifiedVertices[i + 1] = modified.y;
            modifiedVertices[i + 2] = modified.z;
        }
        
        return modifiedVertices;
    }
    
    modifyCurrentBuffer() {
        if (!this.currentBuffer || !this.originalBuffers.has(this.currentBuffer)) return;
        
        const bufferInfo = this.originalBuffers.get(this.currentBuffer);
        if (!bufferInfo || !bufferInfo.data) return;
        
        // Modify the buffer data in real-time
        const modifiedData = this.modifyVertexData(bufferInfo.data);
        
        // Update the buffer with modified data
        this.gl.bindBuffer(bufferInfo.type, this.currentBuffer);
        this.gl.bufferData(bufferInfo.type, modifiedData, bufferInfo.usage);
    }
    
    applyShapeModification(x, y, z) {
        const intensity = this.voiceData.intensity / 128;
        const frequency = this.voiceData.frequency;
        
        let modifiedX = x;
        let modifiedY = y;
        let modifiedZ = z;
        
        // Apply voice modulation
        const voiceModulation = Math.sin(frequency * 0.01) * intensity * 0.1;
        const scale = 1.0 + intensity * 0.05;
        
        switch (this.currentShape) {
            case 'cat':
                // Cat shape modifications
                const distance = Math.sqrt(x * x + y * y + z * z);
                const normalizedX = x / distance;
                const normalizedY = y / distance;
                const normalizedZ = z / distance;
                
                // Pointed ears (top vertices)
                if (y > 0.7) {
                    modifiedX *= 0.8;
                    modifiedZ *= 0.8;
                    modifiedY *= 1.3;
                }
                
                // Elongated body
                if (Math.abs(y) < 0.3) {
                    modifiedX *= 1.2;
                    modifiedZ *= 1.2;
                }
                
                // Tail (bottom vertices)
                if (y < -0.7) {
                    modifiedX *= 0.6;
                    modifiedZ *= 0.6;
                    modifiedY *= 1.5;
                }
                
                // Purring effect
                const purr = Math.sin(frequency * 0.01) * intensity * 0.1;
                modifiedX += normalizedX * purr;
                modifiedY += normalizedY * purr;
                modifiedZ += normalizedZ * purr;
                break;
                
            case 'car':
                // Car shape modifications
                if (Math.abs(y) < 0.4) {
                    modifiedX *= 1.8; // Wider
                    modifiedZ *= 1.4; // Longer
                    modifiedY *= 0.6; // Flatter
                }
                
                // Wheels (side vertices)
                if (Math.abs(x) > 0.7) {
                    modifiedX *= 1.1;
                    modifiedY *= 0.8;
                    modifiedZ *= 0.9;
                }
                
                // Engine vibration
                const vibration = Math.sin(frequency * 0.02) * intensity * 0.05;
                modifiedX += vibration;
                modifiedY += vibration;
                modifiedZ += vibration;
                break;
                
            case 'person':
                // Person shape modifications
                if (y > 0.6) {
                    modifiedX *= 0.9; // Head
                    modifiedZ *= 0.9;
                    modifiedY *= 1.1;
                }
                
                if (Math.abs(y) < 0.3) {
                    modifiedX *= 1.1; // Torso
                    modifiedY *= 1.2;
                }
                
                if (Math.abs(x) > 0.8 && Math.abs(y) < 0.4) {
                    modifiedX *= 1.3; // Arms
                    modifiedY *= 0.9;
                    modifiedZ *= 0.8;
                }
                
                if (y < -0.5) {
                    modifiedX *= 0.8; // Legs
                    modifiedZ *= 0.8;
                    modifiedY *= 1.4;
                }
                
                // Breathing effect
                const breath = Math.sin(frequency * 0.005) * intensity * 0.08;
                modifiedX += breath;
                modifiedY += breath;
                modifiedZ += breath;
                break;
                
            default:
                // Default voice modulation
                modifiedX *= scale + voiceModulation;
                modifiedY *= scale + voiceModulation;
                modifiedZ *= scale + voiceModulation;
                break;
        }
        
        return { x: modifiedX, y: modifiedY, z: modifiedZ };
    }
    
    setVoiceData(voiceData) {
        this.voiceData = voiceData;
    }
    
    setTargetShape(shape) {
        this.targetShape = shape;
        this.morphProgress = 0;
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
                requestAnimationFrame(morph);
            }
        };
        morph();
    }
    
    getState() {
        return {
            currentShape: this.currentShape,
            targetShape: this.targetShape,
            morphProgress: this.morphProgress,
            voiceData: this.voiceData,
            bufferCount: this.originalBuffers.size
        };
    }
}

// Initialize the vertex modifier system
window.addEventListener('load', () => {
    setTimeout(() => {
        window.vertexModifier = new VertexModifier();
        console.log('Vertex Modifier System initialized');
    }, 500);
}); 