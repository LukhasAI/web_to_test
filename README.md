# Voice-Modulated Morphing Character

A WebGL-based interactive morphing system that responds to voice input and can transform between different shapes (Cat, Car, Person) while maintaining the same shell structure.

## Features

### 🎤 Voice Modulation
- **Real-time voice analysis** using Web Audio API
- **Voice intensity affects morphing** - louder sounds create more dramatic effects
- **Frequency-based animations** - different voice frequencies trigger different effects
- **Adjustable sensitivity** - control how responsive the morph is to your voice

### 🎭 Shape Morphing
- **Default Sphere** - Base spherical shape with subtle voice modulation
- **Cat Shape** - Pointed ears, elongated body, tail, with purring effects
- **Car Shape** - Elongated body, wheels, hood/trunk, with engine vibration
- **Person Shape** - Head, torso, arms, legs, with breathing effects

### 🎨 Interactive Controls
- **Voice Input Controls** - Start/stop microphone access
- **Shape Selection** - Click buttons to morph between different forms
- **Sensitivity Slider** - Adjust voice response intensity
- **Real-time Voice Visualizer** - See your voice frequency spectrum

## How to Use

1. **Open the application** in a modern web browser (Chrome, Firefox, Safari, Edge)
2. **Allow microphone access** when prompted
3. **Click "Start Voice Input"** to begin voice analysis
4. **Speak or make sounds** to see the morph respond to your voice
5. **Click shape buttons** (Cat, Car, Person) to morph between different forms
6. **Adjust sensitivity** using the slider to control voice response
7. **Watch the voice visualizer** to see your voice frequency spectrum

## Technical Details

### Architecture
- **WebGL-based rendering** using the existing icosahedron morphing system
- **Web Audio API** for real-time voice analysis
- **Shader modifications** for voice-modulated vertex transformations
- **Dual morphing systems** for maximum compatibility

### Files
- `test_1.html` - Main application with controls and voice input
- `build.js` - Original WebGL morphing system (obfuscated)
- `morphing-system.js` - JavaScript-based morphing system
- `shader-modifications.js` - WebGL shader modification system
- `main.css` - Styling for the interface
- `jl_matrix_min.js` - GL Matrix library for 3D math

### Voice Effects by Shape

#### Cat Shape
- **Purring effect** - Low-frequency voice creates gentle purring animation
- **Pointed ears** - Top vertices are elongated and pointed
- **Elongated body** - Middle section is stretched horizontally
- **Tail** - Bottom vertices form a tail-like extension

#### Car Shape
- **Engine vibration** - Voice creates mechanical vibration effects
- **Elongated body** - Flattened and stretched for car-like proportions
- **Wheels** - Side vertices are modified to suggest wheels
- **Hood/Trunk** - Front and back sections are elongated

#### Person Shape
- **Breathing effect** - Voice intensity affects breathing animation
- **Head** - Top vertices form a head-like shape
- **Torso** - Middle section represents the body
- **Arms** - Side vertices are extended to suggest arms
- **Legs** - Bottom vertices form leg-like extensions

## Browser Compatibility

- **Chrome** 66+ (Recommended)
- **Firefox** 60+
- **Safari** 11+
- **Edge** 79+

## Requirements

- **Microphone access** - Required for voice input
- **WebGL support** - Required for 3D rendering
- **Web Audio API** - Required for voice analysis
- **HTTPS or localhost** - Required for microphone access in most browsers

## Troubleshooting

### Microphone Not Working
- Ensure you've allowed microphone access in your browser
- Check that you're using HTTPS or localhost
- Try refreshing the page and allowing access again

### No Visual Response
- Check browser console for errors
- Ensure WebGL is supported in your browser
- Try adjusting the voice sensitivity slider

### Performance Issues
- Close other applications using the microphone
- Reduce voice sensitivity if the morphing is too intense
- Use a modern browser for best performance

## Development

This system is built on top of an existing WebGL morphing visualization. The voice modulation and shape morphing features are added through:

1. **Voice Controller** - Handles microphone input and voice analysis
2. **Morphing System** - JavaScript-based vertex manipulation
3. **Shader Modifications** - WebGL shader injection for real-time effects

The system is designed to be modular and can be extended with additional shapes and voice effects.

## License

This project uses the MIT License for the original WebGL system. You are free to modify, distribute, and use this code for both personal and commercial purposes. 