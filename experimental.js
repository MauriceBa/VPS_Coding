
// ===== EXPERIMENTAL.JS - All Interactive Features =====

// ===== 1. THREE.JS INTERACTIVE ROOM =====
let scene, camera, renderer, objects = [];
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let targetRotation = { x: 0, y: 0 };

function initThreeJS() {
    const container = document.getElementById('three-container');
    if (!container) return;

    const canvas = document.getElementById('three-canvas');
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a25);

    // Camera
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 2;

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x6366f1, 1, 100);
    pointLight.position.set(5, 5, 5);
    pointLight.castShadow = true;
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xf59e0b, 0.5, 100);
    pointLight2.position.set(-5, 3, 5);
    scene.add(pointLight2);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(10, 10);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2a2a35,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    scene.add(floor);

    // Desk
    const deskGeometry = new THREE.BoxGeometry(4, 0.1, 2);
    const deskMaterial = new THREE.MeshStandardMaterial({ color: 0x3d3d4d });
    const desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.y = 0;
    desk.castShadow = true;
    desk.receiveShadow = true;
    scene.add(desk);

    // Desk legs
    const legGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a35 });
    const legPositions = [[-1.8, -0.5, 0.8], [1.8, -0.5, 0.8], [-1.8, -0.5, -0.8], [1.8, -0.5, -0.8]];
    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(...pos);
        leg.castShadow = true;
        scene.add(leg);
    });

    // Laptop (Interactive Object)
    const laptopGroup = new THREE.Group();
    
    const laptopBaseGeometry = new THREE.BoxGeometry(1.2, 0.05, 0.8);
    const laptopMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a25, metalness: 0.5, roughness: 0.4 });
    const laptopBase = new THREE.Mesh(laptopBaseGeometry, laptopMaterial);
    laptopBase.castShadow = true;
    laptopGroup.add(laptopBase);

    const laptopScreenGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.05);
    const laptopScreen = new THREE.Mesh(laptopScreenGeometry, laptopMaterial);
    laptopScreen.position.set(0, 0.4, -0.4);
    laptopScreen.rotation.x = 0.2;
    laptopScreen.castShadow = true;
    laptopGroup.add(laptopScreen);

    const screenGlowGeometry = new THREE.PlaneGeometry(1.1, 0.7);
    const screenGlowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x6366f1,
        transparent: true,
        opacity: 0.3
    });
    const screenGlow = new THREE.Mesh(screenGlowGeometry, screenGlowMaterial);
    screenGlow.position.set(0, 0.4, -0.37);
    screenGlow.rotation.x = 0.2;
    laptopGroup.add(screenGlow);

    laptopGroup.position.set(0, 0.05, 0);
    laptopGroup.userData = { name: 'laptop', clickable: true };
    scene.add(laptopGroup);
    objects.push(laptopGroup);

    // Coffee Cup (Interactive Object)
    const cupGroup = new THREE.Group();
    
    const cupGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.3, 16);
    const cupMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const cup = new THREE.Mesh(cupGeometry, cupMaterial);
    cup.position.y = 0.15;
    cup.castShadow = true;
    cupGroup.add(cup);

    const coffeeGeometry = new THREE.CircleGeometry(0.13, 16);
    const coffeeMaterial = new THREE.MeshBasicMaterial({ color: 0x3d2817 });
    const coffee = new THREE.Mesh(coffeeGeometry, coffeeMaterial);
    coffee.rotation.x = -Math.PI / 2;
    coffee.position.y = 0.28;
    cupGroup.add(coffee);

    const handleGeometry = new THREE.TorusGeometry(0.08, 0.02, 8, 16, Math.PI);
    const handle = new THREE.Mesh(handleGeometry, cupMaterial);
    handle.position.set(0.15, 0.15, 0);
    handle.rotation.z = -Math.PI / 2;
    cupGroup.add(handle);

    cupGroup.position.set(1.2, 0.05, 0.3);
    cupGroup.userData = { name: 'coffee', clickable: true };
    scene.add(cupGroup);
    objects.push(cupGroup);

    // Plant (Interactive Object)
    const plantGroup = new THREE.Group();
    
    const potGeometry = new THREE.CylinderGeometry(0.2, 0.15, 0.3, 16);
    const potMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const pot = new THREE.Mesh(potGeometry, potMaterial);
    pot.position.y = 0.15;
    pot.castShadow = true;
    plantGroup.add(pot);

    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.55;
    plantGroup.add(stem);

    const leafGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x32CD32 });
    for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        leaf.position.y = 0.6 + i * 0.08;
        leaf.position.x = Math.sin(i * 0.8) * 0.15;
        leaf.scale.y = 0.3;
        plantGroup.add(leaf);
    }

    plantGroup.position.set(-1.3, 0.05, -0.5);
    plantGroup.userData = { name: 'plant', clickable: true };
    scene.add(plantGroup);
    objects.push(plantGroup);

    // Books (Interactive Object)
    const booksGroup = new THREE.Group();
    
    const bookColors = [0x6366f1, 0xf59e0b, 0x10b981];
    bookColors.forEach((color, i) => {
        const bookGeometry = new THREE.BoxGeometry(0.4, 0.5 - i * 0.05, 0.05);
        const bookMaterial = new THREE.MeshStandardMaterial({ color: color });
        const book = new THREE.Mesh(bookGeometry, bookMaterial);
        book.position.set(0, 0.25 - i * 0.02, i * 0.06);
        book.rotation.y = i * 0.1;
        book.castShadow = true;
        booksGroup.add(book);
    });

    booksGroup.position.set(-1.2, 0.05, 0.5);
    booksGroup.userData = { name: 'books', clickable: true };
    scene.add(booksGroup);
    objects.push(booksGroup);

    // Mouse Events
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('click', onMouseClick);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onMouseUp);

    // Handle resize
    window.addEventListener('resize', onWindowResize);

    animate();
}

function onMouseDown(event) {
    isDragging = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
}

function onMouseMove(event) {
    if (!isDragging) return;
    
    const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
    };

    targetRotation.y += deltaMove.x * 0.01;
    targetRotation.x += deltaMove.y * 0.01;
    targetRotation.x = Math.max(-0.5, Math.min(0.5, targetRotation.x));

    previousMousePosition = { x: event.clientX, y: event.clientY };
}

function onMouseUp() {
    isDragging = false;
}

function onTouchStart(event) {
    if (event.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
}

function onTouchMove(event) {
    if (!isDragging || event.touches.length !== 1) return;
    
    const deltaMove = {
        x: event.touches[0].clientX - previousMousePosition.x,
        y: event.touches[0].clientY - previousMousePosition.y
    };

    targetRotation.y += deltaMove.x * 0.01;
    targetRotation.x += deltaMove.y * 0.01;

    previousMousePosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    event.preventDefault();
}

function onMouseClick(event) {
    if (isDragging) return;

    const canvas = document.getElementById('three-canvas');
    const rect = canvas.getBoundingClientRect();
    
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(objects, true);
    
    if (intersects.length > 0) {
        let object = intersects[0].object;
        while (object.parent && !object.userData.clickable) {
            object = object.parent;
        }
        
        if (object.userData.clickable) {
            highlightObject(object);
            showObjectInfo(object.userData.name);
        }
    }
}

function highlightObject(object) {
    const originalY = object.position.y;
    let bounce = 0;
    const animateBounce = () => {
        bounce += 0.2;
        object.position.y = originalY + Math.sin(bounce) * 0.1;
        if (bounce < Math.PI) {
            requestAnimationFrame(animateBounce);
        } else {
            object.position.y = originalY;
        }
    };
    animateBounce();
}

function showObjectInfo(name) {
    const cards = document.querySelectorAll('.object-card');
    cards.forEach(card => {
        card.style.borderColor = 'rgba(255, 255, 255, 0.05)';
        card.style.transform = 'scale(1)';
    });

    const targetCard = document.querySelector(`[data-object="${name}"]`);
    if (targetCard) {
        targetCard.style.borderColor = '#6366f1';
        targetCard.style.transform = 'scale(1.05)';
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        setTimeout(() => {
            targetCard.style.borderColor = 'rgba(255, 255, 255, 0.05)';
            targetCard.style.transform = 'scale(1)';
        }, 2000);
    }
}

function onWindowResize() {
    const container = document.getElementById('three-container');
    if (!container || !camera || !renderer) return;

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (scene) {
        // Smooth camera rotation
        scene.rotation.y += (targetRotation.y - scene.rotation.y) * 0.05;
        scene.rotation.x += (targetRotation.x - scene.rotation.x) * 0.05;

        // Animate objects slightly
        objects.forEach((obj, index) => {
            obj.position.y += Math.sin(Date.now() * 0.001 + index) * 0.0005;
        });
    }

    renderer.render(scene, camera);
}

// ===== 2. DASHBOARD =====
function initDashboard() {
    // Update coding hours (simulated)
    updateCodingHours();
    setInterval(updateCodingHours, 60000); // Update every minute

    // Set today's date
    const todayDate = document.getElementById('today-date');
    if (todayDate) {
        const options = { weekday: 'short', day: 'numeric', month: 'short' };
        todayDate.textContent = new Date().toLocaleDateString('de-DE', options);
    }
}

function updateCodingHours() {
    const codingHours = document.getElementById('coding-hours');
    if (!codingHours) return;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
    const hours = Math.floor((now - startOfDay) / (1000 * 60 * 60));
    const minutes = Math.floor(((now - startOfDay) % (1000 * 60 * 60)) / (1000 * 60));
    
    const displayHours = Math.max(0, Math.min(hours, 8));
    const displayMinutes = Math.max(0, Math.min(minutes, 59));
    
    codingHours.textContent = `${displayHours}h ${displayMinutes}m`;
}

// ===== 3. SECRETS & EASTER EGGS =====
let eggsFound = 0;
const foundEggs = new Set();

// Konami Code
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join(',') === konamiSequence.join(',')) {
        unlockKonami();
    }
});

function unlockKonami() {
    const konamiBox = document.getElementById('konami-box');
    if (!konamiBox || konamiBox.classList.contains('unlocked')) return;
    
    konamiBox.classList.add('unlocked');
    konamiBox.querySelector('.secret-locked').classList.add('hidden');
    konamiBox.querySelector('.secret-unlocked').classList.remove('hidden');
    
    // Confetti effect
    createConfetti();
}

function checkRiddle() {
    const input = document.getElementById('riddle-answer');
    const answer = input.value.toLowerCase().trim();
    const correctAnswers = ['karte', 'karten', 'landkarte', 'landkarten', 'map'];
    
    if (correctAnswers.includes(answer)) {
        const riddleBox = document.getElementById('riddle-box');
        riddleBox.classList.add('unlocked');
        riddleBox.querySelector('.secret-locked').classList.add('hidden');
        riddleBox.querySelector('.secret-unlocked').classList.remove('hidden');
        createConfetti();
    } else {
        input.style.borderColor = '#ef4444';
        setTimeout(() => {
            input.style.borderColor = '';
        }, 1000);
    }
}

function findEgg(eggNumber) {
    if (foundEggs.has(eggNumber)) return;
    
    foundEggs.add(eggNumber);
    eggsFound++;
    
    const eggIndicator = document.getElementById(`egg-${eggNumber}`);
    if (eggIndicator) {
        eggIndicator.classList.add('found');
    }
    
    document.getElementById('eggs-found').textContent = eggsFound;
    
    // Hide the found egg button
    const eggButton = document.getElementById(`hidden-egg-${eggNumber}`);
    if (eggButton) {
        eggButton.style.display = 'none';
    }
    
    if (eggsFound === 5) {
        const easterBox = document.getElementById('easter-box');
        easterBox.classList.add('unlocked');
        easterBox.querySelector('.secret-locked').classList.add('hidden');
        easterBox.querySelector('.secret-unlocked').classList.remove('hidden');
        createConfetti();
    }
}

function createConfetti() {
    const colors = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}vw;
            top: -10px;
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            z-index: 9999;
            pointer-events: none;
        `;
        document.body.appendChild(confetti);
        
        const duration = 2000 + Math.random() * 2000;
        const rotation = Math.random() * 360;
        
        confetti.animate([
            { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
            { transform: `translateY(${window.innerHeight}px) rotate(${rotation}deg)`, opacity: 0 }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }).onfinish = () => confetti.remove();
    }
}

// ===== 4. JOURNEY SCROLL ANIMATION =====
function initJourneyScroll() {
    const chapters = document.querySelectorAll('.journey-chapter');
    const progressFill = document.getElementById('journey-progress');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.3 });

    chapters.forEach(chapter => observer.observe(chapter));

    // Parallax effect for chapter visuals
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        chapters.forEach(chapter => {
            const rect = chapter.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            const viewportCenter = window.innerHeight / 2;
            const distance = (centerY - viewportCenter) / window.innerHeight;
            
            const layer1 = chapter.querySelector('.layer-1');
            const layer2 = chapter.querySelector('.layer-2');
            
            if (layer1) {
                layer1.style.transform = `translateY(${distance * -30}px)`;
            }
            if (layer2) {
                layer2.style.transform = `translateY(${distance * -50}px)`;
            }
        });

        // Update progress bar
        const journeySection = document.getElementById('journey');
        if (journeySection && progressFill) {
            const rect = journeySection.getBoundingClientRect();
            const sectionHeight = journeySection.offsetHeight;
            const scrolled = Math.max(0, -rect.top);
            const progress = Math.min(100, (scrolled / (sectionHeight - window.innerHeight)) * 100);
            progressFill.style.height = `${progress}%`;
        }
    });
}

// ===== 5. AI CHAT =====
const aiKnowledge = {
    'technologien': 'Meine Top-Technologien sind: **React** für Frontend, **Node.js** fürs Backend, **Three.js** für 3D, und **Python** für AI/ML. Ich liebe es, neue Tools auszuprobieren!',
    'projekte': 'Aktuell arbeite ich an: **Personal Website 3.0** (diese Seite!), einem **AI Chat Bot**, und einer **Mobile App**. Check sie im Dashboard!',
    'stack': 'Mein bevorzugter Stack: Frontend mit **React/Vue**, Backend mit **Node.js/Express**, Datenbank **PostgreSQL/MongoDB**, und deployed auf **Vercel/AWS**.',
    'lerne': 'Gerade lerne ich: **Three.js** für 3D-Web-Animationen, **Rust** für Performance-kritische Teile, und experimentiere mit **LLMs**!',
    'buch': 'Ich lese gerade "Clean Code" von Robert C. Martin (60% durch) und "Atomic Habits" von James Clear (30% durch).',
    'kaffee': 'Kaffee ist mein treuer Begleiter! ☕ Heute schon 3 Tassen. Ohne Koffein läuft hier nichts. 😄',
    'hobby': 'Neben Coding: Videospiele 🎮, Wandern 🥾, gute Bücher 📚, und experimentieren mit neuem Tech.',
    'berlin': 'Ja, ich bin in Berlin! Aktuell 8°C und leicht bewölkt. Typisches Februar-Wetter. 🌤️',
    'ziele': 'Meine Ziele 2026: Mehr Open Source Contributions, eine erfolgreiche App veröffentlichen, und Rust meistern!',
    'default': 'Interessante Frage! 😊 Ich bin eine KI-Version von Maurice. Frag mich ruhig was über meine Projekte, Skills oder Interessen!'
};

function handleChatKeypress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function sendSuggestion(text) {
    document.getElementById('chat-input').value = text;
    sendMessage();
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    addMessage(message, 'user');
    input.value = '';
    
    // Simulate AI thinking
    setTimeout(() => {
        const response = generateAIResponse(message);
        addMessage(response, 'ai');
    }, 500 + Math.random() * 1000);
}

function addMessage(text, sender) {
    const container = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatar = sender === 'ai' ? '🤖' : '👤';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <p>${text}</p>
        </div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function generateAIResponse(message) {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('technolog') || lowerMsg.includes('stack') || lowerMsg.includes('tools')) {
        return aiKnowledge.technologien;
    }
    if (lowerMsg.includes('projekt') || lowerMsg.includes('arbeit')) {
        return aiKnowledge.projekte;
    }
    if (lowerMsg.includes('lern') || lowerMsg.includes('lerne') || lowerMsg.includes('study')) {
        return aiKnowledge.lerne;
    }
    if (lowerMsg.includes('buch') || lowerMsg.includes('lesen') || lowerMsg.includes('book')) {
        return aiKnowledge.buch;
    }
    if (lowerMsg.includes('kaffee') || lowerMsg.includes('coffee')) {
        return aiKnowledge.kaffee;
    }
    if (lowerMsg.includes('hobby') || lowerMsg.includes('interesse') || lowerMsg.includes('freizeit')) {
        return aiKnowledge.hobby;
    }
    if (lowerMsg.includes('berlin') || lowerMsg.includes('standort') || lowerMsg.includes('wohn')) {
        return aiKnowledge.berlin;
    }
    if (lowerMsg.includes('ziel') || lowerMsg.includes('goal') || lowerMsg.includes('plan')) {
        return aiKnowledge.ziele;
    }
    if (lowerMsg.includes('hallo') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
        return 'Hey! 👋 Schön, dass du hier bist! Was möchtest du über mich wissen?';
    }
    
    return aiKnowledge.default;
}

// ===== RETRO MODE =====
function activateRetroMode() {
    document.getElementById('retro-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function deactivateRetroMode() {
    document.getElementById('retro-overlay').classList.add('hidden');
    document.body.style.overflow = '';
}

// ===== MATRIX MODE =====
let matrixInterval;

function toggleMatrixMode() {
    const canvas = document.getElementById('matrix-canvas');
    const closeBtn = document.getElementById('matrix-close');
    
    if (canvas.classList.contains('hidden')) {
        canvas.classList.remove('hidden');
        closeBtn.classList.remove('hidden');
        startMatrixEffect();
    } else {
        canvas.classList.add('hidden');
        closeBtn.classList.add('hidden');
        stopMatrixEffect();
    }
}

function startMatrixEffect() {
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@#$%^&*';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = [];
    
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100;
    }
    
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0F0';
        ctx.font = fontSize + 'px monospace';
        
        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    matrixInterval = setInterval(draw, 35);
}

function stopMatrixEffect() {
    if (matrixInterval) {
        clearInterval(matrixInterval);
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initThreeJS();
    initDashboard();
    initJourneyScroll();
    
    // Object card click handlers
    document.querySelectorAll('.object-card').forEach(card => {
        card.addEventListener('click', () => {
            const objectName = card.dataset.object;
            const object = objects.find(obj => obj.userData.name === objectName);
            if (object) {
                highlightObject(object);
            }
        });
    });
});
