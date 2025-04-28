import { BoundingInfo, Color3, Color4, DefaultRenderingPipeline, FreeCamera, HemisphericLight, KeyboardEventTypes, MeshBuilder, MotionBlurPostProcess, PhysicsImpostor, Scalar, Scene, SceneLoader, Sound, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";
import { Inspector } from "@babylonjs/inspector";

const TRACK_WIDTH = 8;
const TRACK_HEIGHT = 0.1;
const TRACK_DEPTH = 3;
const NB_TRACKS = 50;
let NB_OBSTACLES = 5;
const SPAWN_POS_Z = (TRACK_DEPTH * NB_TRACKS);
let SPEED_Z = 20;
const SPEED_X = 10;
const MAX_SPEED_Z = 120;

import meshUrl from "../assets/models/player.glb";
import grassUrl from "../assets/textures/grass.jpg";
import obstacle1Url from "../assets/models/obs.glb";
import ballUrl from "../assets/models/football__soccer_ball.glb";
import stadiumUrl from "../assets/models/stadiumV2.glb";
import menuMusicUrl from "../assets/sounds/menuMusic.mp3";
import playMusicUrl from "../assets/sounds/playMusic.mp3";
import endingMusicUrl from "../assets/sounds/endingMusic.mp3";




class Game {

    engine;
    canvas;
    scene;

    startTimer;

    player;
    playerBox;
    elapsedTime;
    score;

    obstacles = [];
    tracks = [];

    inputMap = {};
    actions = {};

    constructor(engine, canvas) {
        this.engine = engine;
        this.canvas = canvas;
    }

    init() {
        this.engine.displayLoadingUI();
        this.createScene().then(() => {
            this.scene.onKeyboardObservable.add((kbInfo) => {
                switch (kbInfo.type) {
                    case KeyboardEventTypes.KEYDOWN:
                        this.inputMap[kbInfo.event.code] = true;
                        break;
                    case KeyboardEventTypes.KEYUP:
                        this.inputMap[kbInfo.event.code] = false;
                        this.actions[kbInfo.event.code] = true;
                        break;
                }
            });
            this.engine.hideLoadingUI();
            this.menuMusic.play();
            this.playMusic.stop();
            this.endingMusic.stop();
            //Inspector.Show(this.scene, {});
        });

    }

    start() {

        this.startTimer = 0;
        this.elapsedTime = 0;
        this.score = 0;
        this.menuMusic.stop();
        this.playMusic.play();
        this.endingMusic.stop();
        this.canvas.focus();
        this.engine.runRenderLoop(() => {

            let delta = this.engine.getDeltaTime() / 1000.0;

            this.updateMoves(delta);
            this.update(delta);

            this.scene.render();

            const fps = this.engine.getFps().toFixed(2);
            const fpsElement = document.getElementById('fps');
            if (fpsElement) {
                fpsElement.innerText = `${fps}`;
            }

        });
    }

    endGame() {
        this.engine.stopRenderLoop();
        document.getElementById('finalScore').innerText = `Score: ${this.score}`;
        document.getElementById('gameOverScreen').style.display = 'flex';
        this.playMusic.stop();
        this.menuMusic.stop();
        this.endingMusic.play();
    }

    restart() {

        this.canvas.focus();
        
        this.player.position.set(0, TRACK_HEIGHT / 2, 6);
        this.ball.position.set(0, 0.15, 7);
        
        for (let i = 0; i < this.obstacles.length; i++) {
            let obstacle = this.obstacles[i];
            let x = Scalar.RandomRange(-TRACK_WIDTH / 2, TRACK_WIDTH / 2);
            let z = Scalar.RandomRange(SPAWN_POS_Z - 15, SPAWN_POS_Z + 15);
            obstacle.position.set(x, 0.5, z);
        }
        
        for (let i = 0; i < this.tracks.length; i++) {
            this.tracks[i].position.z = TRACK_DEPTH * i;
        }
        
        SPEED_Z = 20;
        this.start();
    }

    update(delta) {

        this.elapsedTime += delta;

        if (Math.floor(this.elapsedTime) !== Math.floor(this.elapsedTime - delta)) {
            this.score += 1;
            document.getElementById('score').innerText = this.score;
        }

        if (Math.floor(this.elapsedTime) % 5 === 0 && Math.floor(this.elapsedTime) !== Math.floor(this.elapsedTime - delta)) {
            SPEED_Z += 5;
            if (SPEED_Z > MAX_SPEED_Z) {
                SPEED_Z = MAX_SPEED_Z;
            }
        }

        if (this.score > 1) {
            for (let i = 0; i < this.obstacles.length; i++) {
                let obstacle = this.obstacles[i];

                obstacle.position.z -= (SPEED_Z * delta);
                if (obstacle.position.z < 0) {
                    let x = Scalar.RandomRange(-TRACK_WIDTH / 2, TRACK_WIDTH / 2);
                    let z = Scalar.RandomRange(SPAWN_POS_Z - 15, SPAWN_POS_Z + 15);
                    obstacle.position.set(x, 0.5, z);
                } else {
                    if (this.playerBox.intersectsMesh(obstacle, false)) {
                        this.endGame();
                    }
                }
            }
        }

        for (let i = 0; i < this.tracks.length; i++) {
            let track = this.tracks[i];
            track.position.z -= SPEED_Z / 3 * delta;
        }


        for (let i = 0; i < this.tracks.length; i++) {
            let track = this.tracks[i];
            if (track.position.z <= 0) {
                let nextTrackIdx = (i + this.tracks.length - 1) % this.tracks.length;
                track.position.z = this.tracks[nextTrackIdx].position.z + TRACK_DEPTH;

            }
        }

        this.startTimer += delta;

        if (this.score >= 60) {
            this.winGame();
            return;
        }
    }

    updateMoves(delta) {
        if (this.inputMap["KeyA"] || this.inputMap["KeyQ"]) {
            this.player.position.x -= SPEED_X * delta;
            if (this.player.position.x < -3.75)
                this.player.position.x = -3.75;
        }
        else if (this.inputMap["KeyD"]) {
            this.player.position.x += SPEED_X * delta;
            if (this.player.position.x > 3.75)
                this.player.position.x = 3.75;
        }
        this.ball.position.x = this.player.position.x;
        this.ball.position.y = 0.15;
        this.ball.position.z = this.player.position.z + 1;
    }

    winGame() {
        this.engine.stopRenderLoop();
        document.getElementById('winScore').innerText = `Score: ${this.score}`;
        document.getElementById('winScreen').style.display = 'flex';
        this.playMusic.stop();
        this.menuMusic.stop();
        this.endingMusic.stop();
    }

    async createScene() {

        this.scene = new Scene(this.engine);

        this.camera = new FreeCamera("camera1", new Vector3(0, 3.8, 0), this.scene);

        this.camera.setTarget(new Vector3(0, 3, 3));

        this.camera.attachControl(this.canvas, true);

        var pipeline = new DefaultRenderingPipeline("default", true, this.scene, [this.camera]);

        pipeline.glowLayerEnabled = true;
        pipeline.glowLayer.intensity = 0.35;
        pipeline.glowLayer.blurKernelSize = 16;
        pipeline.glowLayer.ldrMerge = true;


        var light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);

        light.intensity = 0.7;


        let res = await SceneLoader.ImportMeshAsync("", "", meshUrl, this.scene);
        this.player = res.meshes[0];
        res.meshes[0].name = "Player";
        res.meshes[0].scaling = new Vector3(1, 1, 1);
        res.meshes[0].position.set(0, TRACK_HEIGHT / 2, 6);
        res.meshes[0].rotation = new Vector3(0, 0, 0);

        this.playerBox = MeshBuilder.CreateCapsule("playerCap", { width: 0.4, height: 1.7 });
        this.playerBox.position.y = 0.85;
        this.playerBox.parent = this.player;
        this.playerBox.checkCollisions = true;
        this.playerBox.collisionGroup = 1;
        this.playerBox.visibility = 0;

        res = await SceneLoader.ImportMeshAsync("", "", ballUrl, this.scene);
        this.ball = res.meshes[0];
        res.meshes[0].name = "Ball";
        this.ball.scaling = new Vector3(0.1, 0.1, 0.1);
        this.ball.position = new Vector3(2, 0.1, 8);
        this.ball.position.set(this.player.position.x, 0.15, this.player.position.z + 1);



        let mainTrack = MeshBuilder.CreateBox("trackmiddle", { width: TRACK_WIDTH, height: TRACK_HEIGHT, depth: TRACK_DEPTH });
        mainTrack.position = new Vector3(0, 0, 0);
        let matRoad = new StandardMaterial("road");
        let tex = new Texture(grassUrl);
        matRoad.diffuseTexture = tex;
        mainTrack.material = matRoad;
        for (let i = 0; i < NB_TRACKS; i++) {
            let newTrack = mainTrack.clone();
            newTrack.position.z = TRACK_DEPTH * i;
            this.tracks.push(newTrack);
        }
        mainTrack.dispose();



        res = await SceneLoader.ImportMeshAsync("", "", stadiumUrl, this.scene);
        res.meshes[0].name = "stadium";
        res.meshes[0].position = new Vector3(12, 20.09, 50.37);
        res.meshes[0].rotation = new Vector3(0, 0, 0);
        res.meshes[0].scaling = new Vector3(2, 2, 2);


        res = await SceneLoader.ImportMeshAsync("", "", obstacle1Url, this.scene);
        let obstacleModele = res.meshes[0];
        res.meshes[0].name = "Obstacle";
        for (let i = 0; i < NB_OBSTACLES; i++) {
            let obstacle = obstacleModele.clone("");
            obstacle.scaling = new Vector3(1, 1, 1);
            let x = Scalar.RandomRange(-TRACK_WIDTH / 2, TRACK_WIDTH / 2);
            let z = Scalar.RandomRange(SPAWN_POS_Z - 15, SPAWN_POS_Z + 15);
            obstacle.position.set(x, 0, z);
            let childMeshes = obstacle.getChildMeshes();

            let min = childMeshes[0].getBoundingInfo().boundingBox.minimumWorld;
            let max = childMeshes[0].getBoundingInfo().boundingBox.maximumWorld;

            for (let i = 0; i < childMeshes.length; i++) {
                let meshMin = childMeshes[i].getBoundingInfo().boundingBox.minimumWorld;
                let meshMax = childMeshes[i].getBoundingInfo().boundingBox.maximumWorld;
                min = Vector3.Minimize(min, meshMin);
                max = Vector3.Maximize(max, meshMax);
            }
            obstacle.setBoundingInfo(new BoundingInfo(min, max));
            obstacle.showBoundingBox = false;
            obstacle.checkCollisions = true;
            obstacle.collisionGroup = 2;

            this.obstacles.push(obstacle);
        }
        obstacleModele.setEnabled(false);
        obstacleModele.dispose();
        this.menuMusic = new Sound("menuMusic", menuMusicUrl, this.scene, undefined, { loop: true, autoplay: true, volume: 0.3 });
        this.playMusic = new Sound("playMusic", playMusicUrl, this.scene, undefined, { loop: true, autoplay: true, volume: 0.4 });
        this.endingMusic = new Sound("endingMusic", endingMusicUrl, this.scene, null, { volume: 0.3 });
    }


}

export default Game;