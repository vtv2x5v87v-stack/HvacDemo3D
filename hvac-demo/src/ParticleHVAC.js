import * as THREE from 'three';

export class ParticleHVAC {
    constructor(scene) {
        this.scene = scene;

        this.params = {
            evaporatorOn: true,
            heaterOn: true,
            blendDoor: 0.0,
            airSpeed: 0.08,
            modeDefrost: false,
            modeFace: true,
            modeFoot: false
        };

        this.zones = {
            start: -6,
            evapStart: -4,
            evapEnd: -2,
            doorPivot: 0,
            heaterEnd: 3,
            distribPoint: 3.5,
            end: 10.0
        };

        this.particleCount = 2000;
        this.initSystem();
        this.createDebugVisuals();
        this.createBlower();
        this.createDashboard();
        this.createDummy();
    }

    getTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.4, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);
        return new THREE.CanvasTexture(canvas);
    }

    initSystem() {
        this.geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);
        this.particlesData = [];

        for (let i = 0; i < this.particleCount; i++) {
            const x = this.zones.start + Math.random() * 2;
            const y = (Math.random() - 0.5) * 2;
            const z = (Math.random() - 0.5) * 2;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1;

            this.particlesData.push({
                initialOffset: { y, z },
                targetY: y,
                pathType: 0,
                outputMode: 0,
                speedVar: 0.5 + Math.random() * 0.8
            });
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.3,
            map: this.getTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.system = new THREE.Points(this.geometry, material);
        this.scene.add(this.system);
    }

    createDashboard() {
        this.dashGroup = new THREE.Group();
        this.scene.add(this.dashGroup);

        // 1. 仪表台主体 (尺寸缩小)
        const dashGeo = new THREE.BoxGeometry(1.8, 0.6, 3.2);
        const dashEdges = new THREE.EdgesGeometry(dashGeo);
        const dashMat = new THREE.LineBasicMaterial({ color: 0x555555 });
        const dash = new THREE.LineSegments(dashEdges, dashMat);
        dash.position.set(5.0, -0.5, 0);
        this.dashGroup.add(dash);

        // 2. 挡风玻璃
        const glassGeo = new THREE.PlaneGeometry(4, 1.5);
        const glassMat = new THREE.MeshBasicMaterial({
            color: 0xaaddff,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(5.0, 0.8, 0);
        glass.rotation.order = 'YXZ';
        glass.rotation.y = -Math.PI / 2;
        glass.rotation.x = -Math.PI / 4;
        this.dashGroup.add(glass);

        // 3. 出风口标识
        const defVent = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 2.5), new THREE.MeshBasicMaterial({ color: 0x333333 }));
        defVent.position.set(4.5, -0.1, 0);
        this.dashGroup.add(defVent);
    }

    // --- 修正：假人位置与大小 ---
    createDummy() {
        this.dummyGroup = new THREE.Group();
        // 位置下移：Y=-2.2 (让假人坐得更低，腾出头部空间)
        this.dummyGroup.position.set(8.0, -2.2, 0);
        this.scene.add(this.dummyGroup);

        const mat = new THREE.MeshStandardMaterial({
            color: 0x00aaff,       // <--- 【这里】控制小人的基础颜色
            roughness: 0.2,        // 粗糙度 (0=光滑镜面, 1=粗糙磨砂)
            metalness: 0.3,        // 金属度 (0=塑料, 1=金属)
            emissive: 0x002288,    // <--- 【这里】控制自发光颜色(暗处可见度)
            emissiveIntensity: 0.5 // 发光强度
        });

        // 1. 头部 (Head)
        // 坐标计算：基座Y=-2.2 + 局部Y=2.6 = 世界Y=0.4 (头部中心)
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 32, 32), mat);
        head.position.y = 2.6;
        this.dummyGroup.add(head);

        // 2. 躯干 (Torso)
        // 坐标计算：基座Y=-2.2 + 局部Y=1.4 = 世界Y=-0.8 (躯干中心)
        // 顶部约在 Y=-0.1 (脖子位置)
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.9), mat);
        torso.position.y = 1.4;
        this.dummyGroup.add(torso);

        // 3. 大腿
        const thighGeo = new THREE.BoxGeometry(0.8, 0.28, 0.28);
        const thighL = new THREE.Mesh(thighGeo, mat);
        thighL.position.set(-0.5, 0.8, 0.25); // 局部Y调整
        this.dummyGroup.add(thighL);
        const thighR = new THREE.Mesh(thighGeo, mat);
        thighR.position.set(-0.5, 0.8, -0.25);
        this.dummyGroup.add(thighR);

        // 4. 小腿
        const shinGeo = new THREE.BoxGeometry(0.22, 0.9, 0.22);
        const shinL = new THREE.Mesh(shinGeo, mat);
        shinL.position.set(-0.9, 0.3, 0.25);
        this.dummyGroup.add(shinL);
        const shinR = new THREE.Mesh(shinGeo, mat);
        shinR.position.set(-0.9, 0.3, -0.25);
        this.dummyGroup.add(shinR);

        // 5. 手臂
        const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.1);
        const armL = new THREE.Mesh(armGeo, mat);
        armL.position.set(0, 1.6, 0.6);
        armL.rotation.x = 0.2;
        this.dummyGroup.add(armL);
        const armR = new THREE.Mesh(armGeo, mat);
        armR.position.set(0, 1.6, -0.6);
        armR.rotation.x = -0.2;
        this.dummyGroup.add(armR);
    }

    createBlower() {
        this.blowerGroup = new THREE.Group();
        this.blowerGroup.position.set(this.zones.start - 1.5, 0, 0);
        this.scene.add(this.blowerGroup);

        const housingGeo = new THREE.CylinderGeometry(1.0, 1.0, 1.5, 32, 1, true);
        housingGeo.rotateZ(Math.PI / 2);
        const housingMat = new THREE.MeshBasicMaterial({
            color: 0x888888,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        this.blowerGroup.add(new THREE.Mesh(housingGeo, housingMat));

        this.rotorGroup = new THREE.Group();
        this.blowerGroup.add(this.rotorGroup);

        const hub = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 16).rotateZ(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xaaaaaa }));
        this.rotorGroup.add(hub);

        const bladeGeo = new THREE.BoxGeometry(0.05, 0.5, 0.3);
        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0x00aaff,
            emissive: 0x0044aa,
            emissiveIntensity: 0.5
        });

        for (let i = 0; i < 8; i++) {
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            const angle = (i / 8) * Math.PI * 2;
            blade.position.y = Math.cos(angle) * 0.7;
            blade.position.z = Math.sin(angle) * 0.7;
            blade.rotation.x = angle;
            blade.rotation.z = 0.7;
            this.rotorGroup.add(blade);
        }
    }

    createDebugVisuals() {
        const createGlowingBox = (w, h, d, color, x, y) => {
            const geo = new THREE.BoxGeometry(w, h, d);
            const edges = new THREE.EdgesGeometry(geo);
            const mat = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
            const mesh = new THREE.LineSegments(edges, mat);
            mesh.position.set(x, y, 0);
            const fillMesh = new THREE.Mesh(new THREE.BoxGeometry(w - 0.05, h - 0.05, d - 0.05), new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending }));
            mesh.add(fillMesh);
            return mesh;
        };

        this.evapMesh = createGlowingBox(1.5, 2.2, 2.2, 0x00ffff, (this.zones.evapStart + this.zones.evapEnd) / 2, 0);
        this.scene.add(this.evapMesh);

        this.heaterMesh = createGlowingBox(2.5, 1.1, 2.2, 0xff3300, (this.zones.doorPivot + this.zones.heaterEnd) / 2, -0.55);
        this.scene.add(this.heaterMesh);

        const doorGeo = new THREE.BoxGeometry(0.1, 1.3, 2.2);
        const doorMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.4, metalness: 0.8, emissive: 0xffaa00, emissiveIntensity: 0.2 });
        this.doorMesh = new THREE.Mesh(doorGeo, doorMat);

        this.doorPivotGroup = new THREE.Group();
        this.doorPivotGroup.position.set(this.zones.doorPivot, 0, 0);
        this.scene.add(this.doorPivotGroup);
        this.doorMesh.position.set(0, 0.65, 0);
        this.doorPivotGroup.add(this.doorMesh);
    }

    update() {
        const positions = this.geometry.attributes.position.array;
        const colors = this.geometry.attributes.color.array;

        const colWhite = { r: 0.8, g: 0.9, b: 1.0 };
        const colBlue = { r: 0.0, g: 0.6, b: 1.0 };
        const colRed = { r: 1.0, g: 0.1, b: 0.05 };

        const minAngle = 0.1;
        const maxAngle = Math.PI - 0.1;
        this.doorPivotGroup.rotation.z = maxAngle * (1 - this.params.blendDoor) + minAngle * this.params.blendDoor;

        if (this.rotorGroup) this.rotorGroup.rotation.x -= this.params.airSpeed * 5.0;

        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            const data = this.particlesData[i];

            let moveX = this.params.airSpeed * data.speedVar;
            let moveY = 0;

            // --- 出风模式路径计算 ---
            if (positions[i3] > this.zones.distribPoint) {
                if (data.outputMode === 0) {
                    const activeModes = [];
                    if (this.params.modeDefrost) activeModes.push(1);
                    if (this.params.modeFace) activeModes.push(2);
                    if (this.params.modeFoot) activeModes.push(3);

                    if (activeModes.length > 0) {
                        data.outputMode = activeModes[Math.floor(Math.random() * activeModes.length)];
                    } else {
                        data.outputMode = 2;
                    }
                }

                // --- 关键逻辑更新：对齐假人身体部位 ---
                if (data.outputMode === 1) {
                    // 吹窗 (Defrost)
                    // 逻辑：爬升到 Y > 1.8 (车顶棚，高于假人头部 Y=0.4)
                    if (positions[i3 + 1] > 1.8) {
                        moveX = this.params.airSpeed * 1.0; // 水平向后
                        moveY = 0;
                    } else {
                        moveX = this.params.airSpeed * 0.6;
                        moveY = this.params.airSpeed * 0.6;
                    }
                } else if (data.outputMode === 2) {
                    // 吹面 (Face)
                    // 逻辑：目标高度 Y = -0.4 (对应假人脖子/上胸位置)
                    // 假人头部中心在 Y=0.4，躯干中心在 Y=-0.8
                    // 所以 -0.4 正好在两者之间
                    moveY = (-0.4 - positions[i3 + 1]) * 0.1;
                    moveX = this.params.airSpeed * 1.0;
                } else if (data.outputMode === 3) {
                    // 吹脚 (Foot)
                    // 逻辑：目标高度 Y < -2.0 (地板)
                    if (positions[i3 + 1] < -2.0) {
                        moveX = this.params.airSpeed * 1.0;
                        moveY = 0;
                    } else {
                        moveY = -this.params.airSpeed * 0.8;
                        moveX = this.params.airSpeed * 0.4;
                    }
                }
            }

            positions[i3] += moveX;
            positions[i3 + 1] += moveY;

            let x = positions[i3];

            // 路径引导
            if (data.pathType !== 0 && x < this.zones.distribPoint) {
                positions[i3 + 1] += (data.targetY - positions[i3 + 1]) * 0.08;
            }

            // 分流决策
            if (x > this.zones.doorPivot && x < this.zones.distribPoint && data.pathType === 0) {
                if (Math.random() < this.params.blendDoor) {
                    data.pathType = 2; // 暖芯
                    data.targetY = -0.2 - Math.random() * 0.8;
                } else {
                    data.pathType = 1; // 旁路
                    data.targetY = 0.2 + Math.random() * 0.8;
                }
            }

            // 粒子重生
            if (x > this.zones.end || Math.abs(positions[i3 + 1]) > 4) {
                x = this.zones.start;
                positions[i3] = x;
                data.pathType = 0;
                data.outputMode = 0;
                positions[i3 + 1] = data.initialOffset.y;
                colors[i3] = colWhite.r; colors[i3 + 1] = colWhite.g; colors[i3 + 2] = colWhite.b;
                continue;
            }

            // 颜色逻辑
            let r = colWhite.r;
            let g = colWhite.g;
            let b = colWhite.b;

            if (x > this.zones.evapEnd) {
                if (this.params.evaporatorOn) {
                    r = colBlue.r; g = colBlue.g; b = colBlue.b;
                }
            }

            if (data.pathType === 2 && x > this.zones.heaterEnd) {
                if (this.params.heaterOn) {
                    r = colRed.r; g = colRed.g; b = colRed.b;
                }
            }

            colors[i3] = r; colors[i3 + 1] = g; colors[i3 + 2] = b;
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
    }
}