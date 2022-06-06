var scene,
  camera,
  cameras,
  cameraIndex,
  renderer,
  controls,
  clock,
  player,
  food,
  model,
  player_box,
  player_box_b,
  mixer,
  actions,
  sun,
  crateTexture,
  crateNormalMap,
  crateBumpMap,
  crateBox,
  box;
var run_f = true;
var run_b = true;
var turn_l = true;
var turn_r = true;
var crates = [];
var loadingManager = null;
var RESOURCES_LOADED = false;
init();

function subclip(sourceClip, name, startFrame, endFrame, fps) {
  fps = fps || 30;

  var clip = sourceClip.clone();
  clip.name = name;

  var tracks = [];

  for (var i = 0; i < clip.tracks.length; ++i) {
    var track = clip.tracks[i];
    var valueSize = track.getValueSize();

    var times = [];
    var values = [];

    for (var j = 0; j < track.times.length; ++j) {
      var frame = track.times[j] * fps;

      if (frame < startFrame || frame >= endFrame) continue;

      times.push(track.times[j]);

      for (var k = 0; k < valueSize; ++k) {
        values.push(track.values[j * valueSize + k]);
      }
    }

    if (times.length === 0) continue;

    track.times = THREE.AnimationUtils.convertArray(
      times,
      track.times.constructor
    );
    track.values = THREE.AnimationUtils.convertArray(
      values,
      track.values.constructor
    );

    tracks.push(track);
  }

  clip.tracks = tracks;

  // find minimum .times value across all tracks in the trimmed clip
  var minStartTime = Infinity;

  for (var i = 0; i < clip.tracks.length; ++i) {
    if (minStartTime > clip.tracks[i].times[0]) {
      minStartTime = clip.tracks[i].times[0];
    }
  }

  // shift all tracks such that clip begins at t=0

  for (var i = 0; i < clip.tracks.length; ++i) {
    clip.tracks[i].shift(-1 * minStartTime);
  }

  clip.resetDuration();

  return clip;
}

function init() {
  const assetPath = "assets";

  clock = new THREE.Clock();

  // scene = new THREE.Scene();
  let col = 0xffffff;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(col);
  scene.fog = new THREE.Fog(col, 10, 100);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 4, 7);
  camera.lookAt(0, 1.5, 0);

  const ambient = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambient);

  const light1 = new THREE.DirectionalLight(0xffffff, 2);
  light1.position.set(100, 100, 100);

  const light2 = new THREE.DirectionalLight(0xffffff, 2);
  light2.position.set(0, 1, 100);
  // scene.add(light2);

  // const ambient = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.5);
  // scene.add(ambient);

  // const light = new THREE.DirectionalLight(0xffffff);
  // light.position.set(1, 10, 6);
  // light.castShadow = true;
  // const shadowSize = 5;
  // light.shadow.camera.top = shadowSize;
  // light.shadow.camera.bottom = -shadowSize;
  // light.shadow.camera.left = -shadowSize;
  // light.shadow.camera.right = shadowSize;
  // scene.add(light);
  sun = light1;

  var skybox = new THREE.CubeTextureLoader();
  var texture = skybox.load([
    "img/cocoa_ft.jpg",
    "img/cocoa_bk.jpg",
    "img/cocoa_up.jpg",
    "img/cocoa_dn.jpg",
    "img/cocoa_rt.jpg",
    "img/cocoa_lf.jpg",
  ]);
  scene.background = texture;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const planeGeometry = new THREE.PlaneBufferGeometry(200, 200);
  const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  scene.add(plane);

  const grid = new THREE.GridHelper(200, 80);
  // scene.add(grid);

  const anims = [
    { start: 30, end: 59, name: "backpedal", loop: true },
    { start: 489, end: 548, name: "idle", loop: true },
    { start: 768, end: 791, name: "run", loop: true },
    { start: 839, end: 858, name: "shuffleLeft", loop: true },
    { start: 899, end: 918, name: "shuffleRight", loop: true },
    { start: 1264, end: 1293, name: "walk", loop: true },
  ];

  loadingManager = new THREE.LoadingManager();
  function textureLoading() {
    var textureLoader = new THREE.TextureLoader(loadingManager);
    crateTexture = textureLoader.load("assets/crate0/crate0_diffuse.png");
    crateBumpMap = textureLoader.load("assets/crate0/crate0_bump.png");
    crateNormalMap = textureLoader.load("assets/crate0/crate0_normal.png");
  }
  textureLoading();

  function crateCreation(gx, gy, gz, px, py, pz) {
    var cratename = new THREE.Mesh(
      new THREE.BoxGeometry(gx, gy, gz),
      new THREE.MeshPhongMaterial({
        color: 0xffffff,

        map: crateTexture,
        bumpMap: crateBumpMap,
        normalMap: crateNormalMap,
      })
    );

    cratename.position.set(px, py, pz);
    cratename.receiveShadow = true;
    cratename.castShadow = true;
    scene.add(cratename);

    cratename.name = "block";

    // var crate = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
    // crate.setFromObject(cratename);

    crates.push(cratename);
  }

  function createCrates() {
    crateCreation(20, 5, 3, 12, 3 / 2, 2.5);
    crateCreation(3, 5, 8, -2.5, 3 / 2, 2.5);
    crateCreation(25, 5, 3, 15, 3 / 2, -3);
    crateCreation(3, 5, 5, -2.5, 3 / 2, -3);
    crateCreation(3, 5, 32, -2.5, 3 / 2, 25);
    crateCreation(3, 5, 72, 28, 3 / 2, 32);
    crateCreation(3, 5, 23, 20, 3 / 2, 15);
    crateCreation(13, 5, 3, 15, 3 / 2, 28);
    crateCreation(3, 5, 20, 10, 3 / 2, 35);
    crateCreation(12, 5, 3, 21, 3 / 2, 34);
    crateCreation(60, 5, 3, 2, 3 / 2, 65);
    crateCreation(3, 5, 12, 18, 3 / 2, 60);
    crateCreation(3, 5, 12, 5, 3 / 2, 60);
    crateCreation(3, 5, 25, -8, 3 / 2, 55);
    crateCreation(25, 5, 3, -16, 3 / 2, -3);
    crateCreation(3, 5, 35, -30, 3 / 2, 12);
  }

  createCrates();
  // for (var i = 0; i < crates.length; i++) {
  //   console.log(crates[i].position);
  // }

  const loader = new THREE.GLTFLoader();
  // loader.setPath(assetPath);

  loader.load(
    "assets/bought_bread/scene.gltf",
    function (gltf) {
      food = gltf.scene;
      food.scale.set(25, 25, 25);
      scene.add(food);

      food.position.set(box2.position.x, 2, box2.position.z);
    },
    undefined,
    function (e) {
      console.error(e);
    }
  );

  loader.load(
    "assets/Skull.gltf",
    function (gltf) {
      model = gltf.scene;
      model.scale.set(2, 2, 2);
      scene.add(model);
      model.position.set(box1.position.x, 0, box1.position.z);
    },
    undefined,
    function (e) {
      console.error(e);
    }
  );

  loader.load("assets/fred.glb", (object) => {
    // console.log(object.animations[0]);
    mixer = new THREE.AnimationMixer(object.scene);
    // console.log(object);
    mixer.addEventListener("finished", (e) => {
      if (e.action.next != undefined) playAction(e.action.next);
    });
    object.scene.children[0].rotation.x = 0;
    actions = {};

    object.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    anims.forEach((anim) => {
      const clip = subclip(
        object.animations[0],
        anim.name,
        anim.start,
        anim.end
      );
      const action = mixer.clipAction(clip);
      if (!anim.loop) {
        action.loop = THREE.LoopOnce;
        action.clampWhenFinished = true;
      }
      if (anim.next != undefined) action.next = anim.next;
      actions[anim.name] = action;
    });

    player = new THREE.Object3D();
    sun.target = player;

    object.scene.children[0].scale.set(0.02, 0.02, 0.02);
    player.add(object.scene.children[0]);
    player.scale.set(0.5, 1, 1);

    createCameras();
    addKeyboardControl();

    playAction("idle");

    scene.add(player);
    update();
  });

  const btn = document.getElementById("camera-btn");
  btn.addEventListener("click", changeCamera);

  window.addEventListener("resize", resize, false);
}

function createCameras() {
  cameras = [];
  cameraIndex = 0;

  const followCam = new THREE.Object3D();
  followCam.position.copy(camera.position);
  player.add(followCam);
  cameras.push(followCam);

  const frontCam = new THREE.Object3D();
  frontCam.position.set(0, 3, -8);
  player.add(frontCam);
  cameras.push(frontCam);

  const overheadCam = new THREE.Object3D();
  overheadCam.position.set(0, 20, 0);
  cameras.push(overheadCam);
}

function changeCamera() {
  cameraIndex++;
  if (cameraIndex >= cameras.length) cameraIndex = 0;
}

function addKeyboardControl() {
  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);
}

function keyDown(evt) {
  let forward =
    player.userData.move !== undefined ? player.userData.move.forward : 0;
  let turn = player.userData.move !== undefined ? player.userData.move.turn : 0;

  switch (evt.keyCode) {
    case 87: //W
      forward = 1;
      break;
    case 83: //S
      forward = -1;
      break;
    case 65: //A
      turn = 1;
      break;
    case 68: //D
      turn = -1;
      break;
  }

  playerControl(forward, turn);
}

function keyUp(evt) {
  let forward =
    player.userData.move !== undefined ? player.userData.move.forward : 0;
  let turn = player.userData.move !== undefined ? player.userData.move.turn : 0;

  switch (evt.keyCode) {
    case 87: //W
      forward = 0;
      break;
    case 83: //S
      forward = 0;
      break;
    case 65: //A
      turn = 0;
      break;
    case 68: //D
      turn = 0;
      break;
  }

  playerControl(forward, turn);
}

function playerControl(forward, turn) {
  if (forward == 0 && turn == 0) {
    delete player.userData.move;
  } else {
    if (player.userData.move) {
      player.userData.move.forward = forward;
      player.userData.move.turn = turn;
    } else {
      player.userData.move = {
        forward,
        turn,
        time: clock.getElapsedTime(),
        speed: 1,
      };
      cameraIndex = 1;
    }
  }
}

const box1 = new THREE.Mesh(
  new THREE.BoxGeometry(2, 2, 2),
  new THREE.MeshPhongMaterial({
    color: 0x444444,
  })
);

box1.position.set(23, 0, 23);
scene.add(box1);

box = new THREE.Mesh(
  new THREE.BoxGeometry(0.05, 0.05, 0.05),
  new THREE.MeshPhongMaterial({
    color: 0xff0000,
  })
);

box.position.set(0, 0, 0);
scene.add(box);
box.name = "player";

const box2 = new THREE.Mesh(
  new THREE.BoxGeometry(2, 2, 2),
  new THREE.MeshPhongMaterial({
    color: 0xffff00,
  })
);

box2.position.set(0, 0, 8);
scene.add(box2);
box2.name = "food";

var b = [];
for (let i = 0; i < scene.children.length; i++) {
  if (scene.children[i].isMesh) {
    b[i] = scene.children[i];
    console.log(b[i]);
  }
}
b.shift();

console.log(b);
console.log(scene.children);

const raycaster = new THREE.Raycaster();
const search = [];
const search_b = [];
const lag = 0.08;

for (let i = 0; i < 360; i += 3) {
  search[i] = new THREE.Vector3(Math.cos(i), 0, Math.sin(i));
  // console.log(search[i]);
}
function chase() {
  search.forEach((direction) => {
    raycaster.set(box1.position, direction, 0, 100);
    const intersects = raycaster.intersectObjects(scene.children, false);

    if (intersects.length > 0) {
      if (intersects[0].object.name == "player") {
        box1.position.x += direction.x * lag;
        box1.position.z += direction.z * lag;
        model.position.set(box1.position.x, 0, box1.position.z);
      }
    }
  });
}
function checkFood() {
  search.forEach((direction) => {
    raycaster.set(box.position, direction, 0, 50);
    const intersects = raycaster.intersectObjects(b, false);
    if (intersects.length > 0) {
      if (intersects[0].object.name == "food") {
        if (intersects[0].distance < 3) {
          box2.position.x = 100;
          box2.position.z = 100;
          food.position.set(box2.position.x, 2, box2.position.z);
        }
      }
    }
  });
}

for (let i = 0; i < 360; i += 3) {
  search_b[i] = new THREE.Vector3(Math.cos(i), 0, Math.sin(i));
}
function checkCollision() {
  search_b.forEach((direction) => {
    raycaster.set(box.position, direction, 0, 50);
    const intersects = raycaster.intersectObjects(b, false);
    // console.log(intersects[1]);
    if (intersects.length > 0) {
      if (intersects[0].object.name == "block") {
        if (intersects[0].distance < 0.7) {
          // console.log(player.position);
          box.position.x -= direction.x * 0.01;
          // box.position.y += curr_position.y;
          box.position.z -= direction.z * 0.01;

          player.position.x = box.position.x;
          player.position.z = box.position.z;
        }
      }
    }
  });
}

function update() {
  // player_box.update();
  // console.log(player.position);
  box.position.x = player.position.x;
  box.position.z = player.position.z;
  chase();
  checkCollision();
  checkFood();
  requestAnimationFrame(update);
  renderer.render(scene, camera);

  const dt = clock.getDelta();
  mixer.update(dt);

  if (player.userData.move !== undefined) {
    if (player.userData.move.forward > 0 && player.userData.move.speed < 10)
      player.userData.move.speed += 0.1;
    player.translateZ(
      player.userData.move.forward * dt * player.userData.move.speed
    );
    player.rotateY(player.userData.move.turn * dt);

    //Update actions here
    if (player.userData.move.forward < 0) {
      playAction("backpedal");
    } else if (player.userData.move.forward == 0) {
      if (player.userData.move.turn < 0) {
        playAction("shuffleLeft");
      } else {
        playAction("shuffleRight");
      }
    } else if (player.userData.move.speed > 5) {
      playAction("run");
    } else {
      playAction("walk");
    }
  } else {
    playAction("idle");
  }

  camera.position.lerp(
    cameras[cameraIndex].getWorldPosition(new THREE.Vector3()),
    0.05
  );
  const pos = player.position.clone();
  pos.y += 3;
  camera.lookAt(pos);

  if (this.sun != undefined) {
    sun.position.x = player.position.x;
    sun.position.y = player.position.y + 10;
    sun.position.z = player.position.z - 10;
    sun.target = this.player;
  }
}

function playAction(name) {
  if (player.userData.actionName == name) return;
  const action = actions[name];
  player.userData.actionName = name;
  mixer.stopAllAction();
  action.reset();
  action.fadeIn(0.5);
  action.play();
}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
