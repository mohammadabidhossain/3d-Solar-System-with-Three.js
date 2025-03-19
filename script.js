//distance between earth to sun and earth to moon is scaled with real distance
//radius of sun, earth and moon should be scaled, has not done yet
//Increased eccentricity (e = 0.2) for a more pronounced ellipse (you can revert to 0.0167 later).

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('scene-container').appendChild(renderer.domElement);

// Add OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.5;
controls.screenSpacePanning = false;
controls.minDistance = 10;
controls.maxDistance = 200;
controls.target.set(0, 0, 0);

// Orbital parameters for Earth's elliptical orbit
const a = 40; // Semi-major axis (scaled Earth-Sun distance)
const e = 0.2; // Increased eccentricity for a more noticeable ellipse (real Earth: 0.0167)
let meanAnomaly = 0; // Starting mean anomaly
const meanAnomalyStep = 0.009; // Speed of orbit

// Function to solve Kepler's equation using Newton's method
function solveKepler(M, e, tolerance = 1e-6, maxIterations = 100) {
    let E = M; // Initial guess
    for (let i = 0; i < maxIterations; i++) {
        const f = E - e * Math.sin(E) - M; // Kepler's equation
        const fPrime = 1 - e * Math.cos(E); // Derivative
        const delta = f / fPrime;
        E -= delta;
        if (Math.abs(delta) < tolerance) {
            break;
        }
    }
    return E;
}

// Sun parameters
const sunRadius = 8;
const sunGeometry = new THREE.SphereGeometry(sunRadius, 64, 64);
let sun;

// Load the Sun texture and create the mesh
const textureLoader = new THREE.TextureLoader();
textureLoader.load(
    'sun.jpg',
    (sunTexture) => {
        const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
        sun = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sun);
        sun.position.set(0, 0, 0); // Sun at the center
    },
    undefined,
    (err) => {
        console.error('Error loading Sun texture:', err);
    }
);

// Add a light source for the Sun
const sunLight = new THREE.PointLight(0xffffff, 2, 100);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// Earth parameters
const radius = 3;
let earth;

// Load the Earth texture and create the mesh
textureLoader.load(
    'earth.jpg',
    (earthTexture) => {
        const earthGeometry = new THREE.SphereGeometry(radius, 64, 64);
        const earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture });
        earth = new THREE.Mesh(earthGeometry, earthMaterial);
        scene.add(earth);
        earth.position.x = a * (1 - e); // Start at perihelion
        earth.position.z = 0;
        earth.rotation.y = 0;
    },
    undefined,
    (err) => {
        console.error('Error loading Earth texture:', err);
    }
);

// Moon parameters
const moonRadius = 0.7;
const moonDistanceFromEarth = 4.033; // Scaled real distance
const moonGeometry = new THREE.SphereGeometry(moonRadius, 32, 32);
const moonMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
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
let moonAngle = 0;
const moonSpeed = 0.010;

// Function to create an orbit circle (for Moon)
function createOrbitCircle(radius, color) {
    const orbitGeometry = new THREE.RingGeometry(radius - 0.1, radius, 64);
    const orbitMaterial = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    const orbitCircle = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbitCircle.rotation.x = Math.PI / 2;
    return orbitCircle;
}

// Create Moon's orbit circle
const moonOrbitCircle = createOrbitCircle(moonDistanceFromEarth, 0xffffff);
scene.add(moonOrbitCircle);

// Create Earth's elliptical orbit path
const orbitPoints = [];
const numPoints = 100;
for (let i = 0; i <= numPoints; i++) {
    const E = (i / numPoints) * 2 * Math.PI; // Sample eccentric anomaly
    const x = a * (Math.cos(E) - e);
    const z = a * Math.sqrt(1 - e * e) * Math.sin(E);
    orbitPoints.push(new THREE.Vector3(x, 0, z));
}
const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
const earthOrbitPath = new THREE.Line(orbitGeometry, orbitMaterial);
scene.add(earthOrbitPath);

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
camera.position.z = 70;

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate the Sun if it exists (counterclockwise)
    if (sun) {
        sun.rotation.y += 0.002;
    }

    // Rotate the Earth if it exists (counterclockwise)
    if (earth) {
        earth.rotation.y += 0.02;

        // Earth's orbit around the Sun (elliptical, counterclockwise)
        meanAnomaly -= meanAnomalyStep; // Decrease for counterclockwise motion
        if (meanAnomaly < 0) meanAnomaly += 2 * Math.PI; // Wrap around
        const E = solveKepler(meanAnomaly, e); // Solve for eccentric anomaly
        earth.position.x = a * (Math.cos(E) - e); // X position
        earth.position.z = a * Math.sqrt(1 - e * e) * Math.sin(E); // Z position

        // Moon's orbit around Earth (counterclockwise)
        moonAngle -= moonSpeed;
        moon.position.x = earth.position.x + moonDistanceFromEarth * Math.cos(moonAngle);
        moon.position.z = earth.position.z + moonDistanceFromEarth * Math.sin(moonAngle);
        moon.position.y = earth.position.y;

        // Update Moon's orbit circle position
        moonOrbitCircle.position.x = earth.position.x;
        moonOrbitCircle.position.z = earth.position.z;
    }

    // Update sun direction for moon illumination
    const sunDirection = new THREE.Vector3().subVectors(sunLight.position, moon.position).normalize();
    moon.material.uniforms.sunDirection.value.copy(sunDirection);

    // Update controls
    controls.update();

    renderer.render(scene, camera);
}

// Start animation
animate();
