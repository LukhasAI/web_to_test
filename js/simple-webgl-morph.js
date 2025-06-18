// Simple WebGL Morphing System
class SimpleWebGLMorph {
    constructor() {
        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.vertexBuffer = null;
        this.indexBuffer = null;
        this.vertexCount = 0;
        
        this.voiceData = {
            intensity: 0,
            frequency: 0
        };
        this.currentShape = 'default';
        this.morphProgress = 0;
        this.targetShape = 'default';
        this.morphSpeed = 0.02;
        this.time = 0;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupWebGL();
        this.createShaders();
        this.createGeometry();
        this.startRenderLoop();
    }
    
    setupCanvas() {
        // Get the existing canvas or create a new one
        this.canvas = document.getElementById('mainCanvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'mainCanvas';
            document.body.appendChild(this.canvas);
        }
        
        // Set canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        });
    }
    
    setupWebGL() {
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) {
            alert('WebGL not supported!');
            return;
        }
        
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    }
    
    createShaders() {
        const vertexShaderSource = `
            attribute vec3 aPosition;
            attribute vec3 aNormal;
            
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform float uTime;
            uniform float uVoiceIntensity;
            uniform float uVoiceFrequency;
            uniform float uCurrentShape;
            uniform float uMorphProgress;
            
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            vec3 applyVoiceModulation(vec3 position, float time, float intensity, float frequency) {
                vec3 modulated = position;
                
                // Voice intensity affects overall scale
                float voiceScale = 1.0 + intensity * 0.2;
                modulated *= voiceScale;
                
                // Voice frequency creates subtle vibration
                float vibration = sin(time * 50.0 + frequency * 0.01) * intensity * 0.05;
                modulated += normalize(position) * vibration;
                
                return modulated;
            }
            
            vec3 applyShapeMorphing(vec3 position) {
                vec3 morphed = position;
                
                if (uCurrentShape > 0.5) {
                    // Cat shape
                    if (uCurrentShape < 1.5) {
                        vec3 normalized = normalize(position);
                        float y = normalized.y;
                        
                        // Pointed ears
                        if (y > 0.7) {
                            morphed.x *= 0.8;
                            morphed.z *= 0.8;
                            morphed.y *= 1.3;
                        }
                        
                        // Elongated body
                        if (abs(y) < 0.3) {
                            morphed.x *= 1.2;
                            morphed.z *= 1.2;
                        }
                        
                        // Tail
                        if (y < -0.7) {
                            morphed.x *= 0.6;
                            morphed.z *= 0.6;
                            morphed.y *= 1.5;
                        }
                    }
                    // Car shape
                    else if (uCurrentShape < 2.5) {
                        vec3 normalized = normalize(position);
                        float y = normalized.y;
                        float x = normalized.x;
                        float z = normalized.z;
                        
                        // Car body
                        if (abs(y) < 0.4) {
                            morphed.x *= 1.8;
                            morphed.z *= 1.4;
                            morphed.y *= 0.6;
                        }
                        
                        // Wheels
                        if (abs(x) > 0.7) {
                            morphed.x *= 1.1;
                            morphed.y *= 0.8;
                            morphed.z *= 0.9;
                        }
                        
                        // Hood and trunk
                        if (z > 0.5) {
                            morphed.x *= 0.9;
                            morphed.y *= 0.8;
                            morphed.z *= 1.2;
                        }
                    }
                    // Person shape
                    else if (uCurrentShape < 3.5) {
                        vec3 normalized = normalize(position);
                        float y = normalized.y;
                        float x = normalized.x;
                        
                        // Head
                        if (y > 0.6) {
                            morphed.x *= 0.9;
                            morphed.z *= 0.9;
                            morphed.y *= 1.1;
                        }
                        
                        // Torso
                        if (abs(y) < 0.3) {
                            morphed.x *= 1.1;
                            morphed.z *= 1.0;
                            morphed.y *= 1.2;
                        }
                        
                        // Arms
                        if (abs(x) > 0.8 && abs(y) < 0.4) {
                            morphed.x *= 1.3;
                            morphed.y *= 0.9;
                            morphed.z *= 0.8;
                        }
                        
                        // Legs
                        if (y < -0.5) {
                            morphed.x *= 0.8;
                            morphed.z *= 0.8;
                            morphed.y *= 1.4;
                        }
                    }
                }
                
                return morphed;
            }
            
            void main() {
                vec3 voiceModulated = applyVoiceModulation(aPosition, uTime, uVoiceIntensity, uVoiceFrequency);
                vec3 shapeMorphed = applyShapeMorphing(voiceModulated);
                
                vPosition = shapeMorphed;
                vNormal = aNormal;
                
                gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(shapeMorphed, 1.0);
            }
        `;
        
        const fragmentShaderSource = `
            precision mediump float;
            
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            uniform float uTime;
            uniform float uVoiceIntensity;
            uniform float uCurrentShape;
            
            void main() {
                vec3 normal = normalize(vNormal);
                vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
                
                float diffuse = max(dot(normal, lightDir), 0.0);
                
                vec3 color;
                if (uCurrentShape < 1.5) {
                    // Cat - orange/yellow
                    color = vec3(1.0, 0.6, 0.2);
                } else if (uCurrentShape < 2.5) {
                    // Car - red
                    color = vec3(0.8, 0.2, 0.2);
                } else if (uCurrentShape < 3.5) {
                    // Person - blue
                    color = vec3(0.2, 0.6, 1.0);
                } else {
                    // Default - green
                    color = vec3(0.2, 0.8, 0.4);
                }
                
                // Add voice-reactive glow
                float glow = uVoiceIntensity * 0.5;
                color += vec3(glow, glow * 0.5, glow * 0.2);
                
                gl_FragColor = vec4(color * (0.3 + 0.7 * diffuse), 1.0);
            }
        `;
        
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        this.program = this.createProgram(vertexShader, fragmentShader);
        
        // Get uniform locations
        this.uniforms = {
            modelViewMatrix: this.gl.getUniformLocation(this.program, 'uModelViewMatrix'),
            projectionMatrix: this.gl.getUniformLocation(this.program, 'uProjectionMatrix'),
            time: this.gl.getUniformLocation(this.program, 'uTime'),
            voiceIntensity: this.gl.getUniformLocation(this.program, 'uVoiceIntensity'),
            voiceFrequency: this.gl.getUniformLocation(this.program, 'uVoiceFrequency'),
            currentShape: this.gl.getUniformLocation(this.program, 'uCurrentShape'),
            morphProgress: this.gl.getUniformLocation(this.program, 'uMorphProgress')
        };
    }
    
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program linking error:', this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }
        
        return program;
    }
    
    createGeometry() {
        // Create an icosahedron
        const vertices = [];
        const indices = [];
        
        // Icosahedron vertices
        const phi = (1.0 + Math.sqrt(5.0)) / 2.0;
        const a = 1.0;
        const b = 1.0 / phi;
        
        const icosahedronVertices = [
            [0, b, -a], [b, a, 0], [-b, a, 0], [0, b, a], [b, -a, 0], [-b, -a, 0],
            [0, -b, -a], [a, 0, b], [-a, 0, b], [a, 0, -b], [-a, 0, -b], [0, -b, a]
        ];
        
        // Create vertices with normals
        for (let i = 0; i < icosahedronVertices.length; i++) {
            const vertex = icosahedronVertices[i];
            const length = Math.sqrt(vertex[0] * vertex[0] + vertex[1] * vertex[1] + vertex[2] * vertex[2]);
            
            // Position
            vertices.push(vertex[0] / length * 2.0);
            vertices.push(vertex[1] / length * 2.0);
            vertices.push(vertex[2] / length * 2.0);
            
            // Normal (same as position for unit sphere)
            vertices.push(vertex[0] / length);
            vertices.push(vertex[1] / length);
            vertices.push(vertex[2] / length);
        }
        
        // Icosahedron faces
        const icosahedronFaces = [
            [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 5], [0, 5, 1],
            [1, 5, 7], [1, 7, 2], [2, 7, 8], [2, 8, 3], [3, 8, 4],
            [4, 8, 9], [4, 9, 5], [5, 9, 7], [7, 9, 10], [7, 10, 8],
            [8, 10, 11], [8, 11, 9], [9, 11, 10], [10, 11, 6], [10, 6, 7]
        ];
        
        // Create indices
        for (let i = 0; i < icosahedronFaces.length; i++) {
            const face = icosahedronFaces[i];
            indices.push(face[0], face[1], face[2]);
        }
        
        // Create vertex buffer
        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
        
        // Create index buffer
        this.indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);
        
        this.vertexCount = indices.length;
        
        // Set up attributes
        this.gl.useProgram(this.program);
        
        const positionLocation = this.gl.getAttribLocation(this.program, 'aPosition');
        const normalLocation = this.gl.getAttribLocation(this.program, 'aNormal');
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 24, 0);
        
        this.gl.enableVertexAttribArray(normalLocation);
        this.gl.vertexAttribPointer(normalLocation, 3, this.gl.FLOAT, false, 24, 12);
    }
    
    startRenderLoop() {
        const render = () => {
            this.time += 0.016;
            
            // Update morphing
            if (this.currentShape !== this.targetShape) {
                this.morphProgress += this.morphSpeed;
                if (this.morphProgress >= 1.0) {
                    this.morphProgress = 1.0;
                    this.currentShape = this.targetShape;
                }
            }
            
            this.render();
            requestAnimationFrame(render);
        };
        
        render();
    }
    
    render() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        // Set up matrices
        const aspect = this.canvas.width / this.canvas.height;
        const projectionMatrix = this.perspective(45 * Math.PI / 180, aspect, 0.1, 100.0);
        
        const modelViewMatrix = this.translate(0, 0, -8);
        modelViewMatrix.multiply(this.rotateY(this.time * 0.5));
        modelViewMatrix.multiply(this.rotateX(this.time * 0.3));
        
        // Set uniforms
        this.gl.useProgram(this.program);
        
        this.gl.uniformMatrix4fv(this.uniforms.projectionMatrix, false, projectionMatrix.elements);
        this.gl.uniformMatrix4fv(this.uniforms.modelViewMatrix, false, modelViewMatrix.elements);
        this.gl.uniform1f(this.uniforms.time, this.time);
        this.gl.uniform1f(this.uniforms.voiceIntensity, this.voiceData.intensity / 128);
        this.gl.uniform1f(this.uniforms.voiceFrequency, this.voiceData.frequency);
        this.gl.uniform1f(this.uniforms.currentShape, this.getShapeValue(this.currentShape));
        this.gl.uniform1f(this.uniforms.morphProgress, this.morphProgress);
        
        // Draw
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.drawElements(this.gl.TRIANGLES, this.vertexCount, this.gl.UNSIGNED_SHORT, 0);
    }
    
    // Matrix utilities
    perspective(fov, aspect, near, far) {
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
        const rangeInv = 1.0 / (near - far);
        
        return new Matrix4([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ]);
    }
    
    translate(x, y, z) {
        return new Matrix4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1
        ]);
    }
    
    rotateX(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new Matrix4([
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1
        ]);
    }
    
    rotateY(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new Matrix4([
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1
        ]);
    }
    
    getShapeValue(shape) {
        const shapeMap = {
            'default': 0.0,
            'cat': 1.0,
            'car': 2.0,
            'person': 3.0
        };
        return shapeMap[shape] || 0.0;
    }
    
    setVoiceData(voiceData) {
        this.voiceData = voiceData;
    }
    
    setTargetShape(shape) {
        this.targetShape = shape;
        this.morphProgress = 0;
    }
    
    getState() {
        return {
            currentShape: this.currentShape,
            targetShape: this.targetShape,
            morphProgress: this.morphProgress,
            voiceData: this.voiceData
        };
    }
}

// Simple Matrix4 class
class Matrix4 {
    constructor(elements) {
        this.elements = elements || new Array(16).fill(0);
    }
    
    multiply(other) {
        const result = new Array(16);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result[i * 4 + j] = 0;
                for (let k = 0; k < 4; k++) {
                    result[i * 4 + j] += this.elements[i * 4 + k] * other.elements[k * 4 + j];
                }
            }
        }
        this.elements = result;
        return this;
    }
}

// Initialize the simple WebGL morph system
window.addEventListener('load', () => {
    setTimeout(() => {
        window.simpleWebGLMorph = new SimpleWebGLMorph();
        console.log('Simple WebGL Morph System initialized');
    }, 100);
}); 