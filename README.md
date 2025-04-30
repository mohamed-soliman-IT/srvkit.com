# 3D Earth Visualization

This project creates an interactive 3D visualization of Earth using Three.js. It demonstrates how to create 3D spheres, apply textures, add lighting, and implement camera controls for user interaction.

## Features

- 3D Earth with realistic textures
- Interactive camera controls (rotate, zoom, pan)
- Fallback mechanisms for various browsers and environments
- Robust error handling for WebGL and texture loading
- Responsive design that adapts to window size

## Setup

1. Clone or download this repository
2. Open `index.html` in a web browser

No build process is required - this is a pure HTML/JavaScript project.

## Project Structure

- `index.html` - Main HTML file that loads all scripts and defines the page structure
- `script.js` - Main JavaScript code that initializes the 3D scene and handles interactions
- `js/OrbitControls.js` - Local copy of Three.js OrbitControls for camera manipulation
- `assets/` - Directory containing textures and other resources

## Technical Details

### Dependencies

- Three.js (r132) - Loaded from CDN with local fallback
- OrbitControls - Used for camera manipulation

### Browser Compatibility

This application requires WebGL support. It includes:
- WebGL detection
- Fallback mechanisms for loading libraries
- Multiple texture source options

## Troubleshooting

If you encounter any issues:

1. Check the debug panel in the lower-left corner for error messages
2. Ensure your browser supports WebGL
3. If textures aren't loading, the application will fall back to a blue sphere

## License

This project is open source and available under the MIT License.

## Credits

- Earth textures are sourced from NASA and Solar System Scope
- Three.js library by [three.js authors](https://github.com/mrdoob/three.js/) 