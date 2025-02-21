// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('scene-container').appendChild(renderer.domElement);

// Earth parameters (replacing particle sphere)
const radius = 5; // Same radius as your particle Earth
const earthGeometry = new THREE.SphereGeometry(radius, 32, 32); // Smooth sphere


// Load Earth texture
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load('E:\website.xyz\face\earth with moon\textures'); // Path to your file
const earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture });
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);
earth.position.set(0, 0, 0); // Same position as numberSphere

// Moon parameters
const moonRadius = 1;
const moonDistance = 10;
const moonGeometry = new THREE.SphereGeometry(moonRadius, 32, 32); // Increased resolution for smoother moon

// Moon shader material for phased illumination
const moonVertexShader = `
    varying vec3 vNormal;
    void main() {
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const moonFragmentShader = `
    varying vec3 vNormal;
    uniform vec3 sunDirection;
    void main() {
        float illumination = dot(vNormal, sunDirection);
        illumination = smoothstep(-0.5, 0.5, illumination); // Smooth transition for phases
        gl_FragColor = vec4(vec3(illumination), 1.0); // White color for illuminated part
    }
`;

const moonMaterial = new THREE.ShaderMaterial({
    vertexShader: moonVertexShader,
    fragmentShader: moonFragmentShader,
    uniforms: {
        sunDirection: { value: new THREE.Vector3(1, 0, 0) } // Initial sun direction
    }
});

const moon = new THREE.Mesh(moonGeometry, moonMaterial);
scene.add(moon);

// Add a directional light for the Sun
const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(100, 0, 0); // Position the Sun far to the right
scene.add(sunLight);

// Add ambient light for visibility (optional, to brighten the Earth)
const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft light, low intensity
scene.add(ambientLight);

// Position the camera
camera.position.z = 20; // Adjusted for visibility

// Moon orbit variables
let angle = 0;
const moonSpeed = 0.015;

// Add stars to the background
function addStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsVertices = [];
    for (let i = 0; i < 1000; i++) {
        starsVertices.push(
            THREE.MathUtils.randFloatSpread(2000),
            THREE.MathUtils.randFloatSpread(2000),
            THREE.MathUtils.randFloatSpread(2000)
        );
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.7 });
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);
}
addStars();

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Earth rotation: Rotate only around the Y-axis
    earth.rotation.y += 0.01; // Same speed as before

    // Moon's orbital motion
    angle += moonSpeed;
    moon.position.x = earth.position.x + moonDistance * Math.cos(angle);
    moon.position.z = earth.position.z + moonDistance * Math.sin(angle);
    moon.position.y = earth.position.y; // Keeping it on the same plane

    // Update sun direction for moon illumination
    const sunDirection = new THREE.Vector3(
        sunLight.position.x - moon.position.x,
        sunLight.position.y - moon.position.y,
        sunLight.position.z - moon.position.z
    ).normalize();
    moon.material.uniforms.sunDirection.value.copy(sunDirection);

    renderer.render(scene, camera);
}

// Start animation
animate();