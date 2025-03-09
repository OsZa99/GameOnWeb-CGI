import { Engine, FreeCamera, HemisphericLight, SceneLoader, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";
import { Inspector } from '@babylonjs/inspector';
import Game from "./game";

let engine;
let canvas;
let game;

window.onload = () => {


  canvas = document.getElementById("renderCanvas");

  engine = new Engine(canvas, true);



  window.addEventListener("resize", function () {
    engine.resize();
  });

  game = new Game(engine, canvas);
  game.init();
  const playButton = document.getElementById('playButton');
  const menu = document.getElementById('menu');
  const gui = document.getElementById('gui');

  playButton.addEventListener('click', () => {
    menu.style.display = 'none';
    gui.style.display = 'none';
    game.start();
    canvas.focus();
  });

  const restartButton = document.getElementById('restartButton');
  const gameOverScreen = document.getElementById('gameOverScreen');
  restartButton.addEventListener('click', function () {
    game.restart();
  });


}
