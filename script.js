// Global variables
let scene, camera, renderer, planet, uiObject, orbit, mechanicalSphere;
let particles = [];
let orbitPoints = [];
let orbitLine;
let meteorites = [];

// Add modal functionality
const contactBtn = document.getElementById('contact-btn');
const modal = document.getElementById('contact-modal');
const modalClose = modal.querySelector('.modal-close');
const contactForm = document.getElementById('contact-form');

// Modal controls
contactBtn.addEventListener('click', () => {
    modal.classList.add('active');
    initModalScene();
});

modalClose.addEventListener('click', () => {
    modal.classList.remove('active');
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
    }
});

// Form submission
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value,
        timestamp: new Date().toISOString()
    };
    
    // Get existing messages or initialize empty array
    let messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
    
    // Add new message
    messages.push(formData);
    
    // Store updated messages
    localStorage.setItem('contactMessages', JSON.stringify(messages));
    
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #00ffff, #0088ff);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        font-weight: bold;
        box-shadow: 0 4px 15px rgba(0, 255, 255, 0.3);
        z-index: 1001;
        animation: slideIn 0.3s ease-out;
    `;
    successMessage.textContent = 'Message sent successfully!';
    document.body.appendChild(successMessage);
    
    // Remove success message after 3 seconds
    setTimeout(() => {
        successMessage.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => successMessage.remove(), 300);
    }, 3000);
    
    // Clear form
    contactForm.reset();
    
    // Close modal after a short delay
    setTimeout(() => {
        modal.classList.remove('active');
    }, 1000);
});

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Modal 3D Scene
let modalScene, modalCamera, modalRenderer, modalObject;

// Add movement controls
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let selectedObject = null;
let planetRotationSpeed = 0.0005;
let autoRotation = true;
let lastMouseX = 0;
let lastMouseY = 0;
let isRotating = false;

// Add event listeners for object movement
document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mousemove', onMouseMove);
document.addEventListener('mouseup', onMouseUp);
document.addEventListener('keydown', onKeyDown);
document.addEventListener('wheel', onMouseWheel, { passive: false });

// Handle mouse wheel for zoom
function onMouseWheel(event) {
    event.preventDefault();
    const zoomSpeed = 0.1;
    const delta = event.deltaY;
    camera.position.z += delta * zoomSpeed;
    camera.position.z = Math.max(5, Math.min(15, camera.position.z));
}

// Update mouse movement handler
function onMouseMove(event) {
    if (isDragging && selectedObject) {
        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y
        };
        selectedObject.rotation.y += deltaMove.x * 0.005;
        selectedObject.rotation.x += deltaMove.y * 0.005;
        selectedObject.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, selectedObject.rotation.x));
        previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    if (planet) {
        const mouseX = (event.clientX - window.innerWidth / 2) / 100;
        const mouseY = (event.clientY - window.innerHeight / 2) / 100;
        const targetRotationY = -Math.PI * 0.1 + mouseX * 0.2;
        const targetRotationX = Math.PI * 0.1 + mouseY * 0.2;
        planet.rotation.y += (targetRotationY - planet.rotation.y) * 0.05;
        planet.rotation.x += (targetRotationX - planet.rotation.x) * 0.05;
    }
}

// Update mouse down handler
function onMouseDown(event) {
    isDragging = true;
    previousMousePosition = {
        x: event.clientX,
        y: event.clientY
    };
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
        selectedObject = intersects[0].object;
        while (!selectedObject.userData.isSelectable && selectedObject.parent) {
            selectedObject = selectedObject.parent;
        }
        autoRotation = false;
    }
}

// Update mouse up handler
function onMouseUp() {
    isDragging = false;
    selectedObject = null;
    autoRotation = true;
}

// Update key down handler
function onKeyDown(event) {
    if (!selectedObject) return;
    
    const moveSpeed = 0.1;
    const rotateSpeed = 0.1;
    
    switch(event.key) {
        case 'ArrowLeft':
            selectedObject.position.x -= moveSpeed;
            break;
        case 'ArrowRight':
            selectedObject.position.x += moveSpeed;
            break;
        case 'ArrowUp':
            selectedObject.position.y += moveSpeed;
            break;
        case 'ArrowDown':
            selectedObject.position.y -= moveSpeed;
            break;
        case 'w':
            selectedObject.position.z -= moveSpeed;
            break;
        case 's':
            selectedObject.position.z += moveSpeed;
            break;
        case 'q':
            selectedObject.rotation.y -= rotateSpeed;
            break;
        case 'e':
            selectedObject.rotation.y += rotateSpeed;
            break;
        case 'r':
            selectedObject.rotation.x -= rotateSpeed;
            break;
        case 'f':
            selectedObject.rotation.x += rotateSpeed;
            break;
        case ' ': // Spacebar to reset position
            selectedObject.position.set(0, 0, 0);
            selectedObject.rotation.set(0, 0, 0);
            break;
    }
}

// Update animation loop
function animate() {
    requestAnimationFrame(animate);
    
    if (planet) {
        if (autoRotation) {
            planet.rotation.y += planetRotationSpeed;
        }
        
        planet.children.forEach(child => {
            if (child.material instanceof THREE.ShaderMaterial) {
                child.material.uniforms.viewVector.value = camera.position;
            }
        });
    }
    
    // Animate meteorites
    meteorites.forEach(meteor => {
        meteor.userData.angle += meteor.userData.speed;
        
        // Update position
        meteor.position.x = Math.cos(meteor.userData.angle) * meteor.userData.radius;
        meteor.position.z = Math.sin(meteor.userData.angle) * meteor.userData.radius;
        meteor.position.y = meteor.userData.height + Math.sin(meteor.userData.angle * 2) * 0.1;
        
        // Rotate the cube
        meteor.children[0].rotation.x += meteor.userData.rotationSpeed.x;
        meteor.children[0].rotation.y += meteor.userData.rotationSpeed.y;
        meteor.children[0].rotation.z += meteor.userData.rotationSpeed.z;

        // Make text always face camera
        const textGroup = meteor.children[1];
        textGroup.lookAt(camera.position);
    });

    // Animate background particles
    const time = Date.now() * 0.001;
    particles.forEach(particle => {
        particle.rotation.x += particle.userData.rotationSpeed.x;
        particle.rotation.y += particle.userData.rotationSpeed.y;
        particle.rotation.z += particle.userData.rotationSpeed.z;
        
        const offset = particle.userData.movementOffset;
        const originalPos = particle.userData.originalPosition;
        
        particle.position.x = originalPos.x + Math.sin(time + offset) * 0.3;
        particle.position.y = originalPos.y + Math.cos(time + offset) * 0.3;
        particle.position.z = originalPos.z + Math.sin(time * 0.5 + offset) * 0.3;
    });
    
    renderer.render(scene, camera);
}

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 7;
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    
    // Get container and check if it exists
    const container = document.getElementById('scene-container');
    container.appendChild(renderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0x00ffff, 2);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Add point lights for better illumination
    const pointLight1 = new THREE.PointLight(0x00ffff, 1.5);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x0088ff, 1.5);
    pointLight2.position.set(-5, -5, -5);
    scene.add(pointLight2);
    
    // Create all objects
    createPlanet();
    createOrbitingUIObject();
    createMechanicalSphere();
    createParticles();
    
    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);
    
    // Start animation
    animate();
}

// Create glowing planet
function createPlanet() {
    planet = new THREE.Group();
    
    // Create core sphere with higher resolution
    const sphereGeometry = new THREE.SphereGeometry(2, 128, 128);
    
    // Create base material with turquoise color
    const baseMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8,
        shininess: 25
    });
    
    const baseMesh = new THREE.Mesh(sphereGeometry, baseMaterial);
    planet.add(baseMesh);

    // Load Earth texture and create Earth sphere
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg', 
        function(texture) {
            const earthMaterial = new THREE.MeshPhongMaterial({
                map: texture,
                transparent: true,
                opacity: 0.9
            });
            const earthMesh = new THREE.Mesh(sphereGeometry, earthMaterial);
            planet.add(earthMesh);

            // Create ServiceKit meteorites
            createServiceMeteors();
        }
    );
    
    // Create outer glow
    const glowGeometry = new THREE.SphereGeometry(2.2, 64, 64);
    const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            glowColor: { value: new THREE.Color(0x00ffff) },
            viewVector: { value: camera.position }
        },
        vertexShader: `
            uniform vec3 viewVector;
            varying float intensity;
            void main() {
                vec3 vNormal = normalize(normalMatrix * normal);
                vec3 vNormel = normalize(normalMatrix * viewVector);
                intensity = pow(0.7 - dot(vNormal, vNormel), 3.0);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 glowColor;
            varying float intensity;
            void main() {
                vec3 glow = glowColor * intensity;
                gl_FragColor = vec4(glow, 0.2);
            }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    planet.add(glowMesh);
    
    // Create grid pattern
    const gridGeometry = new THREE.SphereGeometry(2.01, 32, 32);
    const gridMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.1,
        wireframe: true
    });
    const grid = new THREE.Mesh(gridGeometry, gridMaterial);
    planet.add(grid);
    
    // Add ambient particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCnt = 2000;
    const posArray = new Float32Array(particlesCnt * 3);
    
    for(let i = 0; i < particlesCnt * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 5;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.005,
        color: 0x00ffff,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    planet.add(particlesMesh);
    
    scene.add(planet);
}

// Create orbiting UI/UX object with trail
function createOrbitingUIObject() {
    orbit = new THREE.Group();
    scene.add(orbit);
    
    uiObject = new THREE.Group();
    
    // Create main plate with rounded corners
    const roundedRectShape = new THREE.Shape();
    const width = 1.2;
    const height = 0.4;
    const radius = 0.1;

    roundedRectShape.moveTo(-width/2 + radius, -height/2);
    roundedRectShape.lineTo(width/2 - radius, -height/2);
    roundedRectShape.quadraticCurveTo(width/2, -height/2, width/2, -height/2 + radius);
    roundedRectShape.lineTo(width/2, height/2 - radius);
    roundedRectShape.quadraticCurveTo(width/2, height/2, width/2 - radius, height/2);
    roundedRectShape.lineTo(-width/2 + radius, height/2);
    roundedRectShape.quadraticCurveTo(-width/2, height/2, -width/2, height/2 - radius);
    roundedRectShape.lineTo(-width/2, -height/2 + radius);
    roundedRectShape.quadraticCurveTo(-width/2, -height/2, -width/2 + radius, -height/2);

    const plateGeometry = new THREE.ShapeGeometry(roundedRectShape);
    const plateMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide
    });
    
    const plate = new THREE.Mesh(plateGeometry, plateMaterial);
    
    // Add text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;
    
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = '#000000';
    context.font = 'bold 120px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('UI UX', canvas.width/2, canvas.height/2);
    
    const texture = new THREE.CanvasTexture(canvas);
    plate.material.map = texture;
    plate.material.needsUpdate = true;
    
    uiObject.add(plate);
    
    // Add small sphere at the end
    const sphereGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const sphereMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.x = 0.8;
    uiObject.add(sphere);
    
    // Create orbit trail
    const orbitCurve = new THREE.EllipseCurve(
        0, 0,
        3, 2,
        0, 2 * Math.PI,
        false,
        0
    );
    
    const points = orbitCurve.getPoints(100);
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const orbitMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
    });
    
    orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    orbitLine.rotation.x = Math.PI / 2;
    orbit.add(orbitLine);
    
    // Position the UI object in orbit
    uiObject.position.x = 3;
    orbit.add(uiObject);
}

// Create mechanical sphere
function createMechanicalSphere() {
    mechanicalSphere = new THREE.Group();
    
    // Create base sphere with wireframe
    const sphereGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const sphereMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.1,
        wireframe: true
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    mechanicalSphere.add(sphere);
    
    // Add rings
    const ringGeometry = new THREE.TorusGeometry(0.5, 0.02, 16, 32);
    const ringMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.5
    });
    
    const ring1 = new THREE.Mesh(ringGeometry, ringMaterial);
    ring1.rotation.x = Math.PI / 2;
    mechanicalSphere.add(ring1);
    
    const ring2 = new THREE.Mesh(ringGeometry, ringMaterial);
    ring2.rotation.y = Math.PI / 2;
    mechanicalSphere.add(ring2);
    
    // Add red dot
    const dotGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    const dotMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.5
    });
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.y = 0.5;
    mechanicalSphere.add(dot);
    
    // Position in scene
    mechanicalSphere.position.set(3, -2, 0);
    scene.add(mechanicalSphere);
}

// Create background particles
function createParticles() {
    const colors = [0x00ffff, 0x0088ff, 0x0044ff];
    
    for (let i = 0; i < 300; i++) {
        const geometry = new THREE.SphereGeometry(0.01, 8, 8);
        const material = new THREE.MeshPhongMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            transparent: true,
            opacity: Math.random() * 0.5 + 0.25
        });
        
        const particle = new THREE.Mesh(geometry, material);
        
        // Random position in a sphere
        const radius = Math.random() * 15 + 5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        particle.position.x = radius * Math.sin(phi) * Math.cos(theta);
        particle.position.y = radius * Math.sin(phi) * Math.sin(theta);
        particle.position.z = radius * Math.cos(phi);
        
        particle.userData = {
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.01,
                y: (Math.random() - 0.5) * 0.01,
                z: (Math.random() - 0.5) * 0.01
            },
            originalPosition: particle.position.clone(),
            movementOffset: Math.random() * Math.PI * 2
        };
        
        particles.push(particle);
        scene.add(particle);
    }
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function initModalScene() {
    const container = document.getElementById('modal-3d-container');
    
    // Create scene
    modalScene = new THREE.Scene();
    
    // Create camera
    modalCamera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    modalCamera.position.z = 5;
    
    // Create renderer
    modalRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    modalRenderer.setSize(container.clientWidth, container.clientHeight);
    modalRenderer.setClearColor(0x000000, 0);
    
    // Clear container
    container.innerHTML = '';
    container.appendChild(modalRenderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    modalScene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0x00ffff, 2);
    pointLight.position.set(5, 3, 5);
    modalScene.add(pointLight);
    
    // Create inspiring 3D object
    createModalObject();
    
    // Start animation
    animateModal();
}

function createModalObject() {
    // Create a group for the entire object
    modalObject = new THREE.Group();
    
    // Create main sphere
    const sphereGeometry = new THREE.IcosahedronGeometry(1, 1);
    const sphereMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8,
        wireframe: true
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    modalObject.add(sphere);
    
    // Create inner sphere
    const innerSphereGeometry = new THREE.IcosahedronGeometry(0.8, 1);
    const innerSphereMaterial = new THREE.MeshPhongMaterial({
        color: 0x0088ff,
        transparent: true,
        opacity: 0.5
    });
    const innerSphere = new THREE.Mesh(innerSphereGeometry, innerSphereMaterial);
    modalObject.add(innerSphere);
    
    // Add particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCnt = 100;
    const posArray = new Float32Array(particlesCnt * 3);
    
    for(let i = 0; i < particlesCnt * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 3;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.02,
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    modalObject.add(particlesMesh);
    
    // Add connecting lines
    const linesMaterial = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3
    });
    
    for(let i = 0; i < 8; i++) {
        const lineGeometry = new THREE.BufferGeometry();
        const points = [];
        points.push(new THREE.Vector3(0, 0, 0));
        points.push(new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ));
        lineGeometry.setFromPoints(points);
        const line = new THREE.Line(lineGeometry, linesMaterial);
        modalObject.add(line);
    }
    
    modalScene.add(modalObject);
}

function animateModal() {
    if (!modal.classList.contains('active')) return;
    
    requestAnimationFrame(animateModal);
    
    if (modalObject) {
        modalObject.rotation.x += 0.005;
        modalObject.rotation.y += 0.007;
        
        // Pulse effect
        const time = Date.now() * 0.001;
        modalObject.scale.x = 1 + Math.sin(time) * 0.1;
        modalObject.scale.y = 1 + Math.sin(time) * 0.1;
        modalObject.scale.z = 1 + Math.sin(time) * 0.1;
        
        // Update particles
        modalObject.children.forEach(child => {
            if (child instanceof THREE.Points) {
                child.rotation.x -= 0.002;
                child.rotation.y -= 0.003;
            }
        });
    }
    
    modalRenderer.render(modalScene, modalCamera);
}

// Handle window resize
window.addEventListener('resize', () => {
    if (modalRenderer && modal.classList.contains('active')) {
        const container = document.getElementById('modal-3d-container');
        modalCamera.aspect = container.clientWidth / container.clientHeight;
        modalCamera.updateProjectionMatrix();
        modalRenderer.setSize(container.clientWidth, container.clientHeight);
    }
});

// Modify createServiceMeteors function to create 3D cubes
function createServiceMeteors() {
    const services = [
        { name: 'Web Develop', color: 0x00ff00 },
        { name: 'UI/UX Design', color: 0xff00ff },
        { name: 'AI Solutions', color: 0x0000ff },
        { name: 'Mobile Apps', color: 0xffff00 },
        { name: 'Marketing', color: 0x00ffff }
    ];

    services.forEach((service, index) => {
        const serviceGroup = new THREE.Group();
        serviceGroup.userData.isSelectable = true;

        // Create main cube
        const cubeGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const cubeMaterial = new THREE.MeshPhongMaterial({
            color: service.color,
            transparent: true,
            opacity: 0.8,
            wireframe: true
        });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        serviceGroup.add(cube);

        // Add glowing edges
        const edges = new THREE.EdgesGeometry(cubeGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({
            color: service.color,
            transparent: true,
            opacity: 0.5
        });
        const edgesMesh = new THREE.LineSegments(edges, edgesMaterial);
        serviceGroup.add(edgesMesh);

        // Create text display group that will always face camera
        const textGroup = new THREE.Group();

        // Create background panel
        const panelGeometry = new THREE.PlaneGeometry(2, 0.6);
        const panelMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        
        // Add glow to panel edges
        const glowGeometry = new THREE.PlaneGeometry(2.1, 0.7);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: service.color,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.z = -0.01;
        textGroup.add(glow);
        textGroup.add(panel);

        // Create text texture
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;

        // Fill background
        context.fillStyle = 'rgba(0, 0, 0, 0)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw text
        context.font = 'bold 72px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Add white outline
        context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        context.lineWidth = 8;
        context.strokeText(service.name, canvas.width/2, canvas.height/2);
        
        // Add colored glow
        context.shadowColor = `rgb(${service.color >> 16}, ${(service.color >> 8) & 255}, ${service.color & 255})`;
        context.shadowBlur = 20;
        context.fillStyle = '#ffffff';
        context.fillText(service.name, canvas.width/2, canvas.height/2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const textGeometry = new THREE.PlaneGeometry(1.9, 0.5);
        const textMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false
        });

        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.z = 0.01;
        textGroup.add(textMesh);

        // Position text group
        textGroup.position.set(1.2, 0.3, 0);
        serviceGroup.add(textGroup);

        // Set initial position
        const angle = (index / services.length) * Math.PI * 2;
        const orbitRadius = 3;
        const orbitHeight = (index % 2 === 0 ? 0.5 : -0.5);
        
        serviceGroup.position.set(
            Math.cos(angle) * orbitRadius,
            orbitHeight,
            Math.sin(angle) * orbitRadius
        );
        
        serviceGroup.userData = {
            angle: angle,
            speed: 0.003,
            radius: orbitRadius,
            height: orbitHeight,
            rotationSpeed: {
                x: 0.0005,
                y: 0.0005,
                z: 0.0005
            }
        };

        scene.add(serviceGroup);
        meteorites.push(serviceGroup);
    });
}

// Start everything when the page loads
window.addEventListener('load', init); 

function onMouseWheel(event) {
    event.preventDefault();
    
    const zoomSpeed = 0.1;
    const delta = event.deltaY;
    
    // Adjust camera distance
    camera.position.z += delta * zoomSpeed;
    
    // Limit zoom range
    camera.position.z = Math.max(5, Math.min(15, camera.position.z));
} 