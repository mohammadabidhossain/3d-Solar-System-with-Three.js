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
const aEarth = 40; // Semi-major axis (scaled Earth-Sun distance, 1 AU)
const eEarth = 0.2; // Increased eccentricity for a more noticeable ellipse (real Earth: 0.0167)
let meanAnomalyEarth = 0; // Starting mean anomaly
const meanAnomalyStepEarth = 0.009; // Speed of Earth's orbit

// Orbital parameters for Mars' elliptical orbit
const aMars = 60.8; // Semi-major axis (scaled Mars-Sun distance, 1.52 AU, 1.52 * 40)
const eMars = 0.2; // Eccentricity (real Mars: 0.0934, but using 0.2 to match Earth)
let meanAnomalyMars = 0; // Starting mean anomaly for Mars
const meanAnomalyStepMars = 0.0048; // Speed of Mars' orbit (slower, since Mars' orbital period is ~1.88 Earth years)

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
const earthRadius = 3;
let earth;

// Load the Earth texture and create the mesh
textureLoader.load(
    'earth.jpg',
    (earthTexture) => {
        const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
        const earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture });
        earth = new THREE.Mesh(earthGeometry, earthMaterial);
        scene.add(earth);
        earth.position.x = aEarth * (1 - eEarth); // Start at perihelion
        earth.position.z = 0;
        earth.rotation.y = 0;
    },
    undefined,
    (err) => {
        console.error('Error loading Earth texture:', err);
    }
);

// Mars parameters
const marsRadius = 1.596; // Slightly smaller than Earth
let mars;

// Load a Mars texture (you'll need to provide a 'mars.jpg' texture file)
textureLoader.load(
    'mars.jpg', // Replace with the path to your Mars texture
    (marsTexture) => {
        const marsGeometry = new THREE.SphereGeometry(marsRadius, 64, 64);
        const marsMaterial = new THREE.MeshStandardMaterial({ map: marsTexture });
        mars = new THREE.Mesh(marsGeometry, marsMaterial);
        scene.add(mars);
        mars.position.x = aMars * (1 - eMars); // Start at perihelion
        mars.position.z = 0;
        mars.rotation.y = 0;
    },
    undefined,
    (err) => {
        console.error('Error loading Mars texture:', err);
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
const moonSpeed = 0.09203;

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
const earthOrbitPoints = [];
const numPoints = 100;
for (let i = 0; i <= numPoints; i++) {
    const E = (i / numPoints) * 2 * Math.PI; // Sample eccentric anomaly
    const x = aEarth * (Math.cos(E) - eEarth);
    const z = aEarth * Math.sqrt(1 - eEarth * eEarth) * Math.sin(E);
    earthOrbitPoints.push(new THREE.Vector3(x, 0, z));
}
const earthOrbitGeometry = new THREE.BufferGeometry().setFromPoints(earthOrbitPoints);
const earthOrbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
const earthOrbitPath = new THREE.Line(earthOrbitGeometry, earthOrbitMaterial);
scene.add(earthOrbitPath);

// Create Mars' elliptical orbit path
const marsOrbitPoints = [];
for (let i = 0; i <= numPoints; i++) {
    const E = (i / numPoints) * 2 * Math.PI; // Sample eccentric anomaly
    const x = aMars * (Math.cos(E) - eMars);
    const z = aMars * Math.sqrt(1 - eMars * eMars) * Math.sin(E);
    marsOrbitPoints.push(new THREE.Vector3(x, 0, z));
}
const marsOrbitGeometry = new THREE.BufferGeometry().setFromPoints(marsOrbitPoints);
const marsOrbitMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 }); // Red for Mars
const marsOrbitPath = new THREE.Line(marsOrbitGeometry, marsOrbitMaterial);
scene.add(marsOrbitPath);

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
camera.position.z = 100; // Adjusted to see Mars' orbit

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate the Sun if it exists (counterclockwise)
    if (sun) {
        sun.rotation.y += 0.002;
    }

    // Update Earth's position and rotation
    if (earth) {
        earth.rotation.y += 0.02;

        // Earth's orbit around the Sun (elliptical, counterclockwise)
        meanAnomalyEarth -= meanAnomalyStepEarth; // Decrease for counterclockwise motion
        if (meanAnomalyEarth < 0) meanAnomalyEarth += 2 * Math.PI; // Wrap around
        const E_earth = solveKepler(meanAnomalyEarth, eEarth); // Solve for eccentric anomaly
        earth.position.x = aEarth * (Math.cos(E_earth) - eEarth); // X position
        earth.position.z = aEarth * Math.sqrt(1 - eEarth * eEarth) * Math.sin(E_earth); // Z position

        // Moon's orbit around Earth (counterclockwise)
        moonAngle -= moonSpeed;
        moon.position.x = earth.position.x + moonDistanceFromEarth * Math.cos(moonAngle);
        moon.position.z = earth.position.z + moonDistanceFromEarth * Math.sin(moonAngle);
        moon.position.y = earth.position.y;

        // Update Moon's orbit circle position
        moonOrbitCircle.position.x = earth.position.x;
        moonOrbitCircle.position.z = earth.position.z;
    }

    // Update Mars' position and rotation
    if (mars) {
        mars.rotation.y += 0.015; // Slightly slower rotation than Earth

        // Mars' orbit around the Sun (elliptical, counterclockwise)
        meanAnomalyMars -= meanAnomalyStepMars; // Decrease for counterclockwise motion
        if (meanAnomalyMars < 0) meanAnomalyMars += 2 * Math.PI; // Wrap around
        const E_mars = solveKepler(meanAnomalyMars, eMars); // Solve for eccentric anomaly
        mars.position.x = aMars * (Math.cos(E_mars) - eMars); // X position
        mars.position.z = aMars * Math.sqrt(1 - eMars * eMars) * Math.sin(E_mars); // Z position
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
