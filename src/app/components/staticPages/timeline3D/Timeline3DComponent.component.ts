import {
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  AfterViewInit,
  HostListener,
} from '@angular/core';
import { THREE } from './Timeline3DComponent.js';
import { HeaderComponent } from '../../common/header/header.component';
import { FooterComponent } from '../../common/footer/footer.component';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [HeaderComponent, FooterComponent],
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
  private num_spaces_right: number = 2;
  private num_spaces_left: number = 2;
  private first_space_left: number = 0;
  private first_space_right: number = 15;
  private walls: THREE.Mesh[] = [];
  private keys: { [key: string]: boolean } = {};

  constructor(private elRef: ElementRef, private renderer2: Renderer2) {}

  ngOnInit(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
    this.clock = new THREE.Clock();
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

  private calculatePlayerMovement(): { newX: number; newZ: number } {
    let newX = this.player.position.x;
    let newZ = this.player.position.z;

    if (this.keys['ArrowUp'] || this.keys['w']) {
      newZ -= this.playerSpeed;
    }
    if (this.keys['ArrowDown'] || this.keys['s']) {
      newZ += this.playerSpeed;
    }
    if (this.keys['ArrowLeft'] || this.keys['a']) {
      newX -= this.playerSpeed;
    }
    if (this.keys['ArrowRight'] || this.keys['d']) {
      newX += this.playerSpeed;
    }

    return { newX, newZ };
  }

  private cameraLimits = {
    minX: -10,
    maxX: 10,
    minZ: -65,
    maxZ: 80,
  };

  private enableTouchpadControls(): void {
    const touchpad = document.createElement('div');
    touchpad.style.position = 'absolute';
    touchpad.style.top = '0';
    touchpad.style.left = '0';
    touchpad.style.width = '100%';
    touchpad.style.height = '100%';
    touchpad.style.zIndex = '1000'; // Assicurati che sia sopra altri elementi
    touchpad.style.background = ''; // Per debug: puoi renderlo trasparente
    touchpad.style.cursor = 'pointer';
    document.body.appendChild(touchpad);

    let isInteracting = false;
    let lastX = 0;
    let lastY = 0;

    const startInteraction = (x: number, y: number) => {
      isInteracting = true;
      lastX = x;
      lastY = y;
    };

    const updateInteraction = (x: number, y: number) => {
      if (!isInteracting) return;

      const deltaX = x - lastX;
      const deltaY = y - lastY;

      // Aggiorna la posizione del personaggio
      this.updatePlayerPosition(
        this.player.position.x + deltaX * 0.01,
        this.player.position.z + deltaY * 0.01
      );

      lastX = x;
      lastY = y;
    };

    const endInteraction = () => {
      isInteracting = false;
    };

    // Eventi per il mouse
    touchpad.addEventListener('mousedown', (event) => startInteraction(event.clientX, event.clientY));
    touchpad.addEventListener('mousemove', (event) => updateInteraction(event.clientX, event.clientY));
    touchpad.addEventListener('mouseup', () => endInteraction());
    touchpad.addEventListener('mouseleave', () => endInteraction());

    // Eventi per il touch
    touchpad.addEventListener('touchstart', (event) => {
      const touch = event.touches[0];
      startInteraction(touch.clientX, touch.clientY);
    });
    touchpad.addEventListener('touchmove', (event) => {
      const touch = event.touches[0];
      updateInteraction(touch.clientX, touch.clientY);
    });
    touchpad.addEventListener('touchend', () => endInteraction());
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
    this.enableTouchpadControls()
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
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red
    const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
    this.player = new THREE.Mesh(playerGeometry, playerMaterial);
    this.player.position.set(0, 1, 0);
    this.scene.add(this.player);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    const { newX, newZ } = this.calculatePlayerMovement();
    this.updatePlayerPosition(newX, newZ);
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

    if (this.keys['ArrowUp']) directionZ = 1; // Movimento avanti
    if (this.keys['ArrowDown']) directionZ = -1; // Movimento indietro
    if (this.keys['ArrowLeft']) directionX = 1; // Movimento a sinistra
    if (this.keys['ArrowRight']) directionX = -1; // Movimento a destra

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
      cameraZ
    // Posiziona la telecamera e orientala verso il giocatore
    this.camera.position.set(cameraX, this.player.position.y + offset.y, cameraZ);
    this.camera.lookAt(this.player.position);
  }

  private updatePlayerPosition(newX: number, newZ: number): void {
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
