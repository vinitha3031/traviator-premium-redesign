
        // --- 1. Custom Cursor Engine ---
        const cursorCircle = document.getElementById('cursor-circle');
        const cursorDot = document.getElementById('cursor-dot');

        if (window.innerWidth >= 1024) {
            document.addEventListener('mousemove', (e) => {
                const { clientX, clientY } = e;
                cursorCircle.style.transform = `translate(${clientX}px, ${clientY}px) translate(-50%, -50%)`;
                cursorDot.style.transform = `translate(${clientX}px, ${clientY}px) translate(-50%, -50%)`;
            });

            const hoverTargets = document.querySelectorAll('a, button, input, select, .journey-card');
            hoverTargets.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    cursorCircle.style.width = '50px';
                    cursorCircle.style.height = '50px';
                    cursorCircle.style.backgroundColor = 'rgba(212, 243, 74, 0.1)';
                });
                el.addEventListener('mouseleave', () => {
                    cursorCircle.style.width = '32px';
                    cursorCircle.style.height = '32px';
                    cursorCircle.style.backgroundColor = 'transparent';
                });
            });
        }

        // --- 2. Mobile Menu Navigation ---
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const closeMobileMenuBtn = document.getElementById('close-mobile-menu');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileLinks = document.querySelectorAll('.mobile-link');

        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('opacity-0', 'pointer-events-none');
            mobileMenu.classList.add('opacity-100');
        });
        closeMobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('opacity-100');
            mobileMenu.classList.add('opacity-0', 'pointer-events-none');
        });
        mobileLinks.forEach(link => link.addEventListener('click', () => {
            mobileMenu.classList.remove('opacity-100');
            mobileMenu.classList.add('opacity-0', 'pointer-events-none');
        }));

        // --- 3. THREE.JS 3D INTERACTIVE GLOBE & PARTICLES ---
        let scene, camera, renderer, globeGroup, particlesMesh;
        const waypoints = [
            { name: "Svalbard Arctic", lat: 78.22, lon: 15.63, alt: "1,420m", temp: "-14°C", risk: "Level IV (Polar)", desc: "Deep fjord ice sheets and high-arctic traverses." },
            { name: "Patagonia Ice Field", lat: -50.50, lon: -73.19, alt: "2,100m", temp: "4°C", risk: "Level III (Trek)", desc: "Granite cathedrals and continental ice sheets." },
            { name: "Karakoram K2", lat: 35.88, lon: 76.51, alt: "5,150m", temp: "-22°C", risk: "Level V (High Alt)", desc: "Concordia throne room surrounded by 8,000m giants." },
            { name: "Vatnajökull Iceland", lat: 64.14, lon: -21.94, alt: "1,820m", temp: "-6°C", risk: "Level III (Volcanic)", desc: "Sub-glacial volcanic craters and ice caverns." }
        ];
        const waypointMarkers = [];
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        function init3DGlobe() {
            const container = document.getElementById('globe-container');
            const canvas = document.getElementById('globe-canvas');

            const width = container.clientWidth;
            const height = container.clientHeight;

            // Scene, Camera, Renderer
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
            camera.position.z = 280;

            renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            globeGroup = new THREE.Group();
            scene.add(globeGroup);

            // 1. Wireframe Topographic Globe Sphere
            const sphereGeo = new THREE.IcosahedronGeometry(80, 5);
            const sphereMat = new THREE.MeshBasicMaterial({
                color: 0x232832,
                wireframe: true,
                transparent: true,
                opacity: 0.4
            });
            const globeMesh = new THREE.Mesh(sphereGeo, sphereMat);
            globeGroup.add(globeMesh);

            // Inner Glowing Atmosphere Core
            const coreGeo = new THREE.SphereGeometry(78, 32, 32);
            const coreMat = new THREE.MeshBasicMaterial({
                color: 0x0A0C0F,
                transparent: true,
                opacity: 0.95
            });
            const coreMesh = new THREE.Mesh(coreGeo, coreMat);
            globeGroup.add(coreMesh);

            // 2. Orbiting Satellite Glowing Ring
            const ringGeo = new THREE.RingGeometry(105, 106, 64);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0xD4F34A,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.3
            });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            ringMesh.rotation.x = Math.PI / 3;
            globeGroup.add(ringMesh);

            // 3. Waypoint Pins Calculation (Lat/Lon to 3D Cartesian Coordinates)
            waypoints.forEach((wp, idx) => {
                const phi = (90 - wp.lat) * (Math.PI / 180);
                const theta = (wp.lon + 180) * (Math.PI / 180);
                const r = 81;

                const x = -(r * Math.sin(phi) * Math.cos(theta));
                const z = (r * Math.sin(phi) * Math.sin(theta));
                const y = (r * Math.cos(phi));

                // Pulsing Pin Mesh
                const pinGeo = new THREE.SphereGeometry(2.5, 16, 16);
                const pinMat = new THREE.MeshBasicMaterial({ color: 0xD4F34A });
                const pinMesh = new THREE.Mesh(pinGeo, pinMat);
                pinMesh.position.set(x, y, z);
                pinMesh.userData = wp;
                globeGroup.add(pinMesh);
                waypointMarkers.push(pinMesh);

                // Pin Outer Ring Halo
                const haloGeo = new THREE.RingGeometry(3.5, 4.5, 16);
                const haloMat = new THREE.MeshBasicMaterial({ color: 0xD4F34A, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
                const haloMesh = new THREE.Mesh(haloGeo, haloMat);
                haloMesh.position.set(x * 1.02, y * 1.02, z * 1.02);
                haloMesh.lookAt(0, 0, 0);
                globeGroup.add(haloMesh);
            });

            // 4. Aurora Swarm Particle Cloud Around Globe
            const particlesCount = 600;
            const positions = new Float32Array(particlesCount * 3);
            for (let i = 0; i < particlesCount * 3; i += 3) {
                const u = Math.random();
                const v = Math.random();
                const theta = u * 2.0 * Math.PI;
                const phi = Math.acos(2.0 * v - 1.0);
                const r = 110 + Math.random() * 40;

                positions[i] = r * Math.sin(phi) * Math.cos(theta);
                positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
                positions[i + 2] = r * Math.cos(phi);
            }

            const particlesGeo = new THREE.BufferGeometry();
            particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const particlesMat = new THREE.PointsMaterial({
                color: 0xD4F34A,
                size: 1.5,
                transparent: true,
                opacity: 0.5
            });

            particlesMesh = new THREE.Points(particlesGeo, particlesMat);
            scene.add(particlesMesh);

            // Drag Controls State

            // Drag Controls State — desktop + mobile
            let isDragging = false;
            let previousPointerPosition = { x: 0, y: 0 };

            // Allow finger dragging without the browser taking over
            canvas.style.touchAction = 'none';

            container.addEventListener('pointerdown', (e) => {
                isDragging = true;

                previousPointerPosition = {
                    x: e.clientX,
                    y: e.clientY
                };

                container.setPointerCapture(e.pointerId);
            });

            container.addEventListener('pointermove', (e) => {
                const rect = container.getBoundingClientRect();

                mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

                if (isDragging) {
                    const deltaX = e.clientX - previousPointerPosition.x;
                    const deltaY = e.clientY - previousPointerPosition.y;

                    globeGroup.rotation.y += deltaX * 0.005;
                    globeGroup.rotation.x += deltaY * 0.005;

                    previousPointerPosition = {
                        x: e.clientX,
                        y: e.clientY
                    };

                    return;
                }

                // Waypoint hover detection (desktop)
                if (e.pointerType === 'mouse') {
                    raycaster.setFromCamera(mouse, camera);
                    const intersects = raycaster.intersectObjects(waypointMarkers);

                    const tooltip = document.getElementById('globe-tooltip');

                    if (intersects.length > 0) {
                        const target = intersects[0].object.userData;

                        document.getElementById('tooltip-title').textContent = target.name;
                        document.getElementById('tooltip-coords').textContent =
                            `${target.lat}° N, ${target.lon}° E`;
                        document.getElementById('tooltip-alt').textContent = target.alt;
                        document.getElementById('tooltip-desc').textContent = target.desc;

                        tooltip.style.left = `${e.clientX - rect.left}px`;
                        tooltip.style.top = `${e.clientY - rect.top}px`;
                        tooltip.classList.remove('opacity-0');

                        document.getElementById('telemetry-target').textContent = target.name;
                        document.getElementById('telemetry-temp').textContent = target.temp;
                        document.getElementById('telemetry-risk').textContent = target.risk;
                        document.getElementById('globe-active-waypoint').textContent =
                            `SELECTED WAYPOINT: ${target.name.toUpperCase()}`;
                    } else {
                        tooltip.classList.add('opacity-0');
                    }
                }
            });

            function stopGlobeDragging() {
                isDragging = false;
            }

            container.addEventListener('pointerup', stopGlobeDragging);
            container.addEventListener('pointercancel', stopGlobeDragging);
            container.addEventListener('lostpointercapture', stopGlobeDragging);


            // Responsive Canvas Resizing
            window.addEventListener('resize', () => {
                const newWidth = container.clientWidth;
                const newHeight = container.clientHeight;
                camera.aspect = newWidth / newHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(newWidth, newHeight);
            });
        }

        function animateGlobe() {
            requestAnimationFrame(animateGlobe);

            // Subtle continuous rotation
            globeGroup.rotation.y += 0.002;
            if (particlesMesh) {
                particlesMesh.rotation.y -= 0.0008;
            }

            renderer.render(scene, camera);
        }

        window.onload = function() {
            init3DGlobe();
            animateGlobe();
        };

        // --- 4. WebAudio Spatial Sound Synthesizer ---
        let audioCtx = null;
        let isAudioPlaying = false;
        let noiseSource = null;

        function toggleAudio() {
            if (!audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContext();
            }

            const stateText = document.getElementById('audio-state-text');

            if (!isAudioPlaying) {
                if (audioCtx.state === 'suspended') audioCtx.resume();

                const bufferSize = audioCtx.sampleRate * 2;
                const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }

                noiseSource = audioCtx.createBufferSource();
                noiseSource.buffer = buffer;
                noiseSource.loop = true;

                const filter = audioCtx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(250, audioCtx.currentTime);

                const gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.025, audioCtx.currentTime);

                noiseSource.connect(filter);
                filter.connect(gain);
                gain.connect(audioCtx.destination);

                noiseSource.start();
                isAudioPlaying = true;
                if(stateText) stateText.textContent = "Sound On";
                showToast("Spatial Wilderness Ambience Activated");
            } else {
                if (noiseSource) {
                    noiseSource.stop();
                    noiseSource.disconnect();
                }
                isAudioPlaying = false;
                if(stateText) stateText.textContent = "Sound Off";
                showToast("Ambience Muted");
            }
        }
        document.getElementById('audio-toggle').addEventListener('click', toggleAudio);

        // --- 5. Journey Category Filtering ---
        function filterJourneys(category) {
            const cards = document.querySelectorAll('.journey-item');
            const buttons = document.querySelectorAll('.journey-filter-btn');

            buttons.forEach(btn => {
                if (btn.getAttribute('data-filter') === category) {
                    btn.className = "journey-filter-btn px-4 py-2 rounded-full border border-limeAccent bg-limeAccent text-obsidian transition-all cursor-pointer font-bold uppercase tracking-wider";
                } else {
                    btn.className = "journey-filter-btn px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:border-limeAccent text-warmIvory/70 hover:text-warmIvory transition-all cursor-pointer uppercase tracking-wider";
                }
            });

            cards.forEach(card => {
                if (category === 'all' || card.getAttribute('data-category') === category) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        }

        // --- 6. Destination Showcase Matrix ---
        const destData = {
            iceland: {
                location: "Vatnajökull Ice Cap, Iceland",
                temp: "-6°C",
                elevation: "1,820m",
                season: "Sept — May",
                img: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1600&q=80"
            },
            atacama: {
                location: "Valle de la Luna, Chile",
                temp: "18°C",
                elevation: "2,500m",
                season: "Year Round",
                img: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=80"
            },
            bhutan: {
                location: "Paro Valley, Bhutan",
                temp: "8°C",
                elevation: "3,120m",
                season: "Oct — April",
                img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80"
            }
        };

        function switchDestination(key) {
            const data = destData[key];
            if (!data) return;

            document.getElementById('dest-img-container').style.backgroundImage = `url('${data.img}')`;
            document.getElementById('dest-location-text').textContent = data.location;
            document.getElementById('dest-temp-text').textContent = data.temp;
            document.getElementById('dest-elevation-text').textContent = data.elevation;
            document.getElementById('dest-season-text').textContent = data.season;

            const selectors = document.querySelectorAll('.dest-selector-btn');
            selectors.forEach(btn => {
                btn.className = "dest-selector-btn text-left p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-limeAccent/50 transition-all cursor-pointer group";
            });

            const activeBtn = document.getElementById(`dest-btn-${key}`);
            if (activeBtn) {
                activeBtn.className = "dest-selector-btn text-left p-6 rounded-2xl border border-limeAccent bg-limeAccent/10 transition-all cursor-pointer group";
            }
        }

        // --- 7. Modal Drawer Controls ---
        function openExpeditionModal(title, region, duration, coords, difficulty, price, img, desc) {
            document.getElementById('modal-title').textContent = title;
            document.getElementById('modal-region').textContent = region;
            document.getElementById('modal-duration').textContent = duration;
            document.getElementById('modal-coords').textContent = coords;
            document.getElementById('modal-difficulty').textContent = difficulty;
            document.getElementById('modal-price').textContent = price;
            document.getElementById('modal-img').src = img;
            document.getElementById('modal-desc').textContent = desc;

            const modal = document.getElementById('expedition-modal');
            modal.classList.remove('opacity-0', 'pointer-events-none');
            modal.classList.add('opacity-100');
        }

        function closeExpeditionModal() {
            const modal = document.getElementById('expedition-modal');
            modal.classList.remove('opacity-100');
            modal.classList.add('opacity-0', 'pointer-events-none');
        }

        // --- 8. Toast Notifications & Forms ---
        function showToast(msg) {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = "bg-slateCard border border-limeAccent/80 text-warmIvory text-xs px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md transition-all duration-300 pointer-events-auto transform translate-y-2 opacity-0 font-mono";
            toast.innerHTML = `<i class="fa-solid fa-compass text-limeAccent"></i> <span>${msg}</span>`;
            container.appendChild(toast);

            setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
            setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-y-2');
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }

        function handlePlannerSubmit(e) {
            e.preventDefault();
            const email = document.getElementById('plan-email').value;
            showToast(`Custom route dossier dispatched to ${email}`);
            document.getElementById('planner-form').reset();
        }

        function handleNewsletterSubmit(e) {
            e.preventDefault();
            const email = document.getElementById('newsletter-email').value;
            showToast(`Registered ${email} for Wilderness Dispatches`);
            e.target.reset();
        }

        // --- 9. Intersection Observer Scroll Reveal ---
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.15 });

        document.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));

        // --- 10. Live UTC Clock ---
        function updateUTCClock() {
            const now = new Date();
            const h = String(now.getUTCHours()).padStart(2, '0');
            const m = String(now.getUTCMinutes()).padStart(2, '0');
            const s = String(now.getUTCSeconds()).padStart(2, '0');
            const clock = document.getElementById('utc-clock');
            if(clock) clock.textContent = `${h}:${m}:${s} UTC`;
        }
        setInterval(updateUTCClock, 1000);
        updateUTCClock();
