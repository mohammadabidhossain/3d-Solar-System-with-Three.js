// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('scene-container').appendChild(renderer.domElement);

// Add OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth camera movement
controls.dampingFactor = 0.05; // Damping inertia
controls.screenSpacePanning = false; // Pan in world space
controls.minDistance = 10; // Minimum zoom distance
controls.maxDistance = 200; // Maximum zoom distance (adjusted for larger scene)
controls.target.set(0, 0, 0); // Look at the center of the scene (Sun's position)

// Sun parameters
const sunRadius = 8;
const sunGeometry = new THREE.SphereGeometry(sunRadius, 64, 64);
let sun; // Define sun in the outer scope

// Load the Sun texture and create the mesh
const textureLoader = new THREE.TextureLoader();
textureLoader.load(
    'sun.jpg',
    (sunTexture) => {
        const sunMaterial = new THREE.MeshBasicMaterial({
            map: sunTexture, // Apply the Sun texture
        });
        sun = new THREE.Mesh(sunGeometry, sunMaterial); // Assign to outer scope
        scene.add(sun);
        sun.position.set(0, 0, 0); // Sun at the center
    },
    undefined,
    (err) => {
        console.error('Error loading Sun texture:', err); // Log any errors
    }
);

// Add a light source for the Sun
const sunLight = new THREE.PointLight(0xffffff, 2, 100);
sunLight.position.set(0, 0, 0); // Co-located with the Sun
scene.add(sunLight);



// Sphere (Earth-like) parameters
const radius = 3;
let earth; // Define earth in the outer scope

// Load the Earth texture and create the mesh
textureLoader.load(
    'earth.jpg',
    (earthTexture) => {
        const earthGeometry = new THREE.SphereGeometry(radius, 64, 64);
        const earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture });
        earth = new THREE.Mesh(earthGeometry, earthMaterial); // Assign to outer scope
        scene.add(earth);
        earth.position.set(12000, 0, 0); // Initial position away from Sun (using earthOrbitRadius)
    },
    undefined,
    (err) => {
        console.error('Error loading Earth texture:', err); // Log any errors
    }
);

// Moon parameters
const moonRadius = 0.7;
const moonDistanceFromEarth = 8;
const moonGeometry = new THREE.SphereGeometry(moonRadius, 32, 32);
const moonMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff }); // Simple white moon
const moon = new THREE.Mesh(moonGeometry, moonMaterial);
scene.add(moon);

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
        illumination = smoothstep(-0.5, 0.5, illumination);
        gl_FragColor = vec4(vec3(illumination), 1.0);
    }
`;

moon.material = new THREE.ShaderMaterial({
    vertexShader: moonVertexShader,
    fragmentShader: moonFragmentShader,
    uniforms: {
        sunDirection: { value: new THREE.Vector3(1, 0, 0) }
    }
});

// Orbit variables
let earthAngle = 0;
const earthOrbitRadius = 20; // Distance of Earth from Sun
const earthOrbitSpeed = 0.005;

let moonAngle = 0;
const moonSpeed = 0.010;

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

// Position the camera
camera.position.z = 70; // Adjusted to see the whole system

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate the Sun if it exists
    if (sun) {
        sun.rotation.y += 0.002;
    }

    // Rotate the Earth if it exists
    if (earth) {
        // Adjust rotation to 365 times per orbit (using frame-rate independent method)
        const clock = new THREE.Clock();
        const deltaTime = clock.getDelta();
        const rotationsPerSecond = 365 / (2 * Math.PI / earthOrbitSpeed); // Approx rotations per second
        earth.rotation.y += rotationsPerSecond * 2 * Math.PI * deltaTime;

        // Earth's orbit around the Sun
        earthAngle += earthOrbitSpeed;
        earth.position.x = sunLight.position.x + earthOrbitRadius * Math.cos(earthAngle);
        earth.position.z = sunLight.position.z + earthOrbitRadius * Math.sin(earthAngle);

        // Moon's orbit around Earth
        moonAngle += moonSpeed;
        moon.position.x = earth.position.x + moonDistanceFromEarth * Math.cos(moonAngle);
        moon.position.z = earth.position.z + moonDistanceFromEarth * Math.sin(moonAngle);
        moon.position.y = earth.position.y;
    }

    // Update sun direction for moon illumination
    const sunDirection = new THREE.Vector3().subVectors(sunLight.position, moon.position).normalize();
    moon.material.uniforms.sunDirection.value.copy(sunDirection);

    // Update controls
    controls.update();

    renderer.render(scene, camera);
}

// Start nimation
animate();
