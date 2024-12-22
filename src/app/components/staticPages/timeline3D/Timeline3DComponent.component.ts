import {
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  AfterViewInit,
  HostListener,
} from '@angular/core';
import { THREE, GLTFLoader, DRACOLoader } from './Timeline3DComponent.js';
import { HeaderComponent } from '../../common/header/header.component';
import { FooterComponent } from '../../common/footer/footer.component';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, CommonModule],
  templateUrl: './Timeline3DComponent.component.html',
})
export class Timeline3DComponent implements OnInit, AfterViewInit {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private player!: THREE.Mesh;
  private wallSpacing = 10;
  private playerSpeed = 0.5; // Velocità di movimento del giocatore
  private clock!: THREE.Clock;
  isMobileDevice: boolean = window.innerWidth <= 900;
  private moveDirection = {up: 0, down: 0, left: 0, right: 0 };
  private num_spaces_right: number = 2;
  private num_spaces_left: number = 2;
  private first_space_left: number = 0;
  private first_space_right: number = 15;
  private walls: THREE.Mesh[] = [];
  private keys: { [key: string]: boolean } = {};
  private mixer: THREE.AnimationMixer | null = null;

  constructor(private elRef: ElementRef, private renderer2: Renderer2) {}

  ngOnInit(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
    this.clock = new THREE.Clock();
    window.addEventListener('resize', () => {
      this.isMobileDevice = window.innerWidth <= 900;
      console.log("size: ", window.innerWidth);
    });
  }

  private pathLimits = {
    minX: -5,
    maxX: 5,
    minZ: -60,
    maxZ: 75,
    horizontalPaths: [] as { orientation: boolean, minX: number, maxX: number, minZ: number, maxZ: number }[],
  };

// Aggiungi i limiti dei percorsi orizzontali durante la creazione della scena
  private addHorizontalPathsLimits(): void {
    const horizontalPathWidth = 50; // Larghezza dei percorsi
    const horizontalPathHeight = 10; // Lunghezza dei percorsi
    const wallsStart = this.first_space_right - 30 - this.wallSpacing / 2;
    // Percorsi a destra
    for (let i = 0; i < this.num_spaces_right; i++) {
      const zPosition = this.first_space_right + i * 40+wallsStart+horizontalPathHeight/2;
      this.pathLimits.horizontalPaths.push({
        orientation: true,
        minX: 25 - horizontalPathWidth / 2,
        maxX: 25 + horizontalPathWidth / 2,
        minZ: zPosition - horizontalPathHeight / 2,
        maxZ: zPosition + horizontalPathHeight / 2,
      });
    }

    // Percorsi a sinistra
    for (let i = 0; i < this.num_spaces_left; i++) {
      const zPosition = this.first_space_left + i * 40+wallsStart+horizontalPathHeight/2;
      this.pathLimits.horizontalPaths.push({
        orientation: false,
        minX: -25 - horizontalPathWidth / 2,
        maxX: -25 + horizontalPathWidth / 2,
        minZ: zPosition - horizontalPathHeight / 2,
        maxZ: zPosition + horizontalPathHeight / 2,
      });
    }
  }

// Controlla se il giocatore è in un percorso valido
  private isWithinPathLimits(x: number, z: number): boolean {

    // Consenti il movimento nei percorsi orizzontali
    for (const path of this.pathLimits.horizontalPaths) {
      if (((!path.orientation && x >= path.minX && x<=this.pathLimits.maxX) //percorso a sinistra
        || (path.orientation && x <= path.maxX && x>=this.pathLimits.minX))  //percorso a destra
        && z >= path.minZ && z <= path.maxZ) {
        return true;
      }
    }
    // Controlla i limiti principali
    if (
      x < this.pathLimits.minX ||
      x > this.pathLimits.maxX ||
      z < this.pathLimits.minZ ||
      z > this.pathLimits.maxZ
    ) {
      return false;
    }

    // Se non si trova in nessun percorso orizzontale, è nei limiti principali
    return true;
  }

  private calculatePlayerMovement(): { newX: number; newZ: number,  direction: THREE.Vector3 } {
    let newX = this.player.position.x;
    let newZ = this.player.position.z;
    const direction = new THREE.Vector3();
    if (this.keys['ArrowUp'] || this.keys['w'] || (this.isMobileDevice && this.moveDirection.up)) {
      newZ -= this.playerSpeed;
      direction.set(0, 0, -1);
    }
    if (this.keys['ArrowDown'] || this.keys['s'] || (this.isMobileDevice && this.moveDirection.down)) {
      newZ += this.playerSpeed;
      direction.set(0, 0, 1);

    }
    if (this.keys['ArrowLeft'] || this.keys['a'] || (this.isMobileDevice && this.moveDirection.left)) {
      newX -= this.playerSpeed;
      direction.set(-1, 0, 0);
    }
    if (this.keys['ArrowRight'] || this.keys['d'] || (this.isMobileDevice && this.moveDirection.right)) {
      newX += this.playerSpeed;
      direction.set(1, 0, 0);

    }


    return { newX, newZ, direction };
  }

  private cameraLimits = {
    minX: -10,
    maxX: 10,
    minZ: -65,
    maxZ: 80,
  };

  // Aggiungi i listener per il movimento del joystick
  private addJoystickListeners(): void {
    const directions = ['up', 'down', 'left', 'right'];

    directions.forEach(direction => {
      const button = document.getElementById(direction);

      // Ascolta l'evento 'mousedown' per attivare il movimento
      button?.addEventListener('mousedown', () => this.handleJoystickInput(direction, true));

      // Ascolta l'evento 'mouseup' per fermare il movimento
      button?.addEventListener('mouseup', () => this.handleJoystickInput(direction, false));

      // Supporto per i dispositivi touch
      button?.addEventListener('touchstart', () => this.handleJoystickInput(direction, true));
      button?.addEventListener('touchend', () => this.handleJoystickInput(direction, false));
    });
  }

  private handleJoystickInput(direction: string, isPressed: boolean): void {
    if (direction === 'up') {
      this.moveDirection.up = isPressed ? 1 : 0;  // Movimento in avanti
    }
    if (direction === 'down') {
      this.moveDirection.down = isPressed ? 1 : 0;  // Movimento indietro
    }
    if (direction === 'left') {
      this.moveDirection.left = isPressed ? 1 : 0;  // Movimento a sinistra
    }
    if (direction === 'right') {
      this.moveDirection.right = isPressed ? 1 : 0;  // Movimento a destra
    }
  }

  ngAfterViewInit(): void {
    const canvas = this.elRef.nativeElement.querySelector('#three-canvas') as HTMLCanvasElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, this.playerSpeed, 1000);
    this.camera.position.set(0, 5, 10);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    this.scene.add(light);

    this.addGround();
    this.addWalls();
    this.addHorizontalPathsLimits();
    this.addPlayer();
    if (this.isMobileDevice) {
      console.log("is mobile")
      this.addJoystickListeners();
    }
    this.animate();
  }

  private addGround(): void {

    const wallsStart = this.first_space_right - 30 - this.wallSpacing / 2;
    // Add the grass ground
    const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const grassGeometry = new THREE.PlaneGeometry(200, 200); // Ground covering the entire area
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2;
    this.scene.add(grass);

    // Add the main path (vertical)
    const pathMaterial = new THREE.MeshStandardMaterial({ color: 0xE3C16F }); // Ochre
    const pathGeometry = new THREE.PlaneGeometry(10, 200);
    const mainPath = new THREE.Mesh(pathGeometry, pathMaterial);
    mainPath.rotation.x = -Math.PI / 2;
    mainPath.position.y = 0.01; // Slightly above the grass
    this.scene.add(mainPath);

    // Add horizontal paths (transversal paths between walls)
    const horizontalPathMaterial = new THREE.MeshStandardMaterial({ color: 0xE3C16F });
    const horizontalPathWidth = 50; // Width of the horizontal path
    const horizontalPathHeight = 10; // Length of the horizontal path (matches space between walls)

    // Add paths for spaces on the right
    for (let i = 0; i < this.num_spaces_right; i++) {
      const zPosition = this.first_space_right + i * 40+wallsStart+horizontalPathHeight/2; // Adjust based on first space and spacing
      const horizontalPathGeometry = new THREE.PlaneGeometry(horizontalPathWidth, horizontalPathHeight);
      const horizontalPath = new THREE.Mesh(horizontalPathGeometry, horizontalPathMaterial);
      horizontalPath.rotation.x = -Math.PI / 2;
      horizontalPath.position.set(25, 0.01, zPosition); // Centered on X-axis
      this.scene.add(horizontalPath);
    }

    // Add paths for spaces on the left
    for (let i = 0; i < this.num_spaces_left; i++) {
      const zPosition = this.first_space_left + i * 40+wallsStart+horizontalPathHeight/2; // Adjust based on first space and spacing
      const horizontalPathGeometry = new THREE.PlaneGeometry(horizontalPathWidth, horizontalPathHeight);
      const horizontalPath = new THREE.Mesh(horizontalPathGeometry, horizontalPathMaterial);
      horizontalPath.rotation.x = -Math.PI / 2;
      horizontalPath.position.set(-25, 0.01, zPosition); // Centered on X-axis
      this.scene.add(horizontalPath);
    }

  }

  private addWalls(): void {
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 }); // Gray

    // Add walls on the left
    for (let i = 0; i < this.num_spaces_left + 1; i++) {
      let wallGeometry;
      let wallZStart;
      if(i!=(this.num_spaces_left)) {
        wallGeometry = new THREE.BoxGeometry(1, 2, 30); // Walls 30 units long
        wallZStart = this.first_space_left + i * 40 - 30 - this.wallSpacing / 2; // Adjust to align with spaces
      }
    else {
        wallGeometry = new THREE.BoxGeometry(1, 2, 30+(this.first_space_right-this.first_space_left));
        wallZStart = this.first_space_right + i * 40 - 30 - this.wallSpacing / 2-(this.first_space_right-this.first_space_left)/2;
      }
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(-5.5, 0, wallZStart);
      this.scene.add(wall);
      this.walls.push(wall);
    }

    // Add walls on the right
    for (let i = 0; i < this.num_spaces_right + 1; i++) {
      let wallGeometry;

      wallGeometry = new THREE.BoxGeometry(1, 2, 30); // Walls 30 units long

      const wallZStart = this.first_space_right + i * 40 - 30 - this.wallSpacing / 2; // Adjust to align with spaces
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(5.5, 0, wallZStart);
      this.scene.add(wall);
      this.walls.push(wall);
    }
  }

  private addPlayer(): void {
    const loader = new GLTFLoader();
    /*const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath( '/examples/jsm/libs/draco/' );
    loader.setDRACOLoader( dracoLoader );*/
    // Carica il modello 3D (assicurati di usare il percorso corretto)
    try {
      loader.load('3Dmodels/scene.gltf', (gltf: any) => {
        const model = gltf.scene;
        model.scale.set(0.015, 0.015, 0.015)
        this.mixer = new THREE.AnimationMixer(model);

        // Posizioniamo il modello
        model.position.set(0, 1, 0);
        const walkClip = gltf.animations.find((clip: any) => clip.name === 'Walk');
        if (walkClip) {
          const walkAction = this.mixer.clipAction(walkClip);
          walkAction.play(); // Avvia l'animazione
        }
        this.scene.add(model);

        // Animazioni
        this.mixer = new THREE.AnimationMixer(model);

        // Aggiungi l'animazione della camminata (ad esempio, "Walk" è il nome dell'animazione nel modello glTF)
        gltf.animations.forEach((clip: any) => {
          this.mixer?.clipAction(clip).play();
        });

        this.player = model; // Impostiamo il modello come il giocatore
      });
    } catch (error) {
      console.error("error: ",error);
    }
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    const { newX, newZ, direction } = this.calculatePlayerMovement();

    const time = this.clock.getElapsedTime();

    // Controlla se il giocatore si sta muovendo
    const isMoving = newX !== this.player?.position.x || newZ !== this.player?.position.z;

    if (isMoving && this.player) {
      // Anima solo quando c'è movimento
      const time = this.clock.getElapsedTime();

      this.player.rotation.z = Math.sin(time * this.playerSpeed*5) * 0.1; // Oscillazione laterale
      this.player.rotation.x = Math.cos(time * this.playerSpeed*5) * 0.05; // Movimento avanti e indietro
      this.player.position.y = Math.abs(Math.sin(time * this.playerSpeed*5)) * 0.05; // Leggero movimento verticale
    } else if (this.player) {
      // Resetta l'orientamento se non si muove
      this.player.rotation.z = 0;
      this.player.rotation.x = 0;
    }


    this.updatePlayerPosition(newX, newZ, direction);
    this.updateCameraPosition(); // Aggiorna la telecamera
    this.renderer.render(this.scene, this.camera);
  }

  private updateCameraPosition(): void {
    const offset = { x: 0, y: 5, z: 10 }; // Offset della telecamera
    let cameraX = this.player.position.x;
    let cameraZ = this.player.position.z;

    // Calcola la direzione del movimento basandoti sui tasti premuti
    let directionX = 0;
    let directionZ = 0;

    if (this.keys['ArrowUp'] || this.keys['w'] || (this.isMobileDevice && this.moveDirection.up)) directionZ = 1; // Movimento avanti
    if (this.keys['ArrowDown'] || this.keys['s'] || (this.isMobileDevice && this.moveDirection.down)) directionZ = -1; // Movimento indietro
    if (this.keys['ArrowLeft'] || this.keys['a'] || (this.isMobileDevice && this.moveDirection.left)) directionX = 1; // Movimento a sinistra
    if (this.keys['ArrowRight'] || this.keys['d'] || (this.isMobileDevice && this.moveDirection.right)) directionX = -1; // Movimento a destra

    // Calcola il vettore direzione risultante
    const magnitude = Math.sqrt(directionX ** 2 + directionZ ** 2);

    if (magnitude > 0) {
      directionX /= magnitude; // Normalizza il vettore
      directionZ /= magnitude;


      // Posiziona la telecamera dietro il giocatore nella direzione del movimento
      cameraX += directionX * offset.z; // Offset lungo X
      cameraZ += directionZ * offset.z; // Offset lungo Z

      // Applica i limiti alla posizione della telecamera
      cameraX = Math.max(this.cameraLimits.minX, Math.min(cameraX, this.cameraLimits.maxX));
      cameraZ = Math.max(this.cameraLimits.minZ, Math.min(cameraZ, this.cameraLimits.maxZ));
    }else {
      cameraZ += Math.max(this.cameraLimits.minZ, Math.min(offset.z, this.cameraLimits.maxZ));
    }

    // Posiziona la telecamera e orientala verso il giocatore
    this.camera.position.set(cameraX, this.player.position.y + offset.y, cameraZ);
    this.camera.lookAt(this.player.position);
  }

  private updatePlayerPosition(newX: number, newZ: number, direction: THREE.Vector3): void {
    const targetDirection = direction.clone().normalize(); // Direzione normalizzata

    // Calcola l'angolo verso la nuova direzione
    const angle = Math.atan2(targetDirection.x, targetDirection.z);

    // Ruota il modello (asse Y per Three.js)
    this.player.rotation.y = angle;
    if (this.isWithinPathLimits(newX, newZ)) {
      this.player.position.set(newX, this.player.position.y, newZ);
    } else {
      console.log("Movimento fuori dai limiti!");
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    this.keys[event.key] = true;
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    this.keys[event.key] = false;
  }
}
