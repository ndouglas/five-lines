
const TILE_SIZE = 30;
const FPS = 30;
const SLEEP = 1000 / FPS;

interface Input {
  handle(): void;
}

class Right implements Input {
  handle() {
    map[player.getY()][player.getX() + 1].moveHorizontal(1);
  }
}

class Left implements Input {
  handle() {
    map[player.getY()][player.getX() - 1].moveHorizontal(-1);
  }
}

class Up implements Input {
  handle() {
    map[player.getY() - 1][player.getX()].moveVertical(-1);
  }
}

class Down implements Input {
  handle() {
    map[player.getY() + 1][player.getX()].moveVertical(1);
  }
}

enum RawTile {
  AIR,
  FLUX,
  UNBREAKABLE,
  PLAYER,
  STONE, FALLING_STONE,
  BOX, FALLING_BOX,
  KEY1, LOCK1,
  KEY2, LOCK2
}

class Player {
  private x: number = 1;
  private y: number = 1;
  getX() { return this.x; }
  getY() { return this.y; }
  setX(x: number) { this.x = x; }
  setY(y: number) { this.y = y; }
  draw(g: CanvasRenderingContext2D) {
    g.fillStyle = "#ff0000";
    g.fillRect(this.getX() * TILE_SIZE, this.getY() * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
}
let player = new Player();

interface FallingState {
  isFalling(): boolean;
}

class Falling implements FallingState {
  isFalling(): boolean { return true; }
}

class Resting implements FallingState {
  isFalling(): boolean { return false; }
}

class KeyConfiguration {
  private color: string;
  private id: number;
  private removeStrategy: RemoveStrategy;
  constructor(color: string, id: number, removeStrategy: RemoveStrategy) {
    this.color = color;
    this.id = id;
    this.removeStrategy = removeStrategy;
  }
  private getColor(): string { return this.color; }
  fits(id: number): boolean { return this.id === id; }
  setColor(g: CanvasRenderingContext2D): void {
    g.fillStyle = this.color;
  }
  removeLock() {
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        if (this.removeStrategy.check(map[y][x])) {
          map[y][x] = new Air();
        }
      }
    }
  }
}

interface RemoveStrategy {
  check(tile: Tile): boolean;
}

class RemoveLock1 implements RemoveStrategy {
  check(tile: Tile): boolean {
    return tile.isLock1();
  }
}

class RemoveLock2 implements RemoveStrategy {
  check(tile: Tile): boolean {
    return tile.isLock2();
  }
}

const YELLOW_KEY = new KeyConfiguration("#ffcc00", 1, new RemoveLock1());
const BLUE_KEY = new KeyConfiguration("#00ccff", 2, new RemoveLock2());

class FallStrategy {
  private state: FallingState;
  constructor(state: FallingState) {
    this.state = state;
  }
  update(tile: Tile, x: number, y: number) {
    this.state = map[y + 1][x].isAir() ? new Falling() : new Resting();
    this.drop(tile, x, y);
  }
  drop(tile: Tile, x: number, y: number): void {
    if (map[y + 1][x].isAir()) {
      map[y + 1][x] = tile;
      map[y][x] = new Air();
    }
  }
  isFalling(): boolean { return this.state.isFalling(); }
}

interface Tile {
  isAir(): boolean;
  isLock1(): boolean;
  isLock2(): boolean;
  draw(g: CanvasRenderingContext2D, x: number, y: number): void;
  moveHorizontal(dx: number): void;
  moveVertical(dy: number): void;
  isBoxy(): boolean;
  isStony(): boolean;
  update(x: number, y: number): void;
}

class Air implements Tile {
  isAir() { return true; }
  isLock1() { return false; }
  isLock2() { return false; }
  draw(g: CanvasRenderingContext2D, x: number, y: number): void { }
  moveHorizontal(dx: number): void {
    moveToTile(player.getX() + dx, player.getY());
  }
  moveVertical(dy: number): void {
    moveToTile(player.getX(), player.getY() + dy);
  }
  isBoxy(): boolean { return false; }
  isStony(): boolean { return false; }
  update(x: number, y: number): void { }
}

class Flux implements Tile {
  isAir() { return false; }
  isLock1() { return false; }
  isLock2() { return false; }
  draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    g.fillStyle = "#ccffcc";
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
  moveHorizontal(dx: number): void {
    moveToTile(player.getX() + dx, player.getY());
  }
  moveVertical(dy: number): void {
    moveToTile(player.getX(), player.getY() + dy);
  }
  isBoxy(): boolean { return false; }
  isStony(): boolean { return false; }
  update(x: number, y: number): void { }
}

class Unbreakable {
  isAir() { return false; }
  isLock1() { return false; }
  isLock2() { return false; }
  draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    g.fillStyle = "#999999";
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
  moveHorizontal(dx: number): void { }
  moveVertical(dy: number): void { }
  isBoxy(): boolean { return false; }
  isStony(): boolean { return false; }
  update(x: number, y: number): void { }
}

class PlayerTile implements Tile {
  isAir() { return false; }
  isLock1() { return false; }
  isLock2() { return false; }
  draw(g: CanvasRenderingContext2D, x: number, y: number): void { }
  moveHorizontal(dx: number): void { }
  moveVertical(dy: number): void { }
  isBoxy(): boolean { return false; }
  isStony(): boolean { return false; }
  update(x: number, y: number): void { }
}

class Stone implements Tile {
  private fallStrategy: FallStrategy;
  constructor(falling: FallingState) {
    this.fallStrategy = new FallStrategy(falling);
  }
  isAir() { return false; }
  isLock1() { return false; }
  isLock2() { return false; }
  draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    g.fillStyle = "#0000cc";
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
  moveHorizontal(dx: number): void {
    if (this.fallStrategy.isFalling()) {
      if (map[player.getY()][player.getX() + dx + dx].isAir() && !map[player.getY() + 1][player.getX() + dx].isAir()) {
        map[player.getY()][player.getX() + dx + dx] = map[player.getY()][player.getX() + dx];
        moveToTile(player.getX() + dx, player.getY());
      }
    }
  }
  moveVertical(dy: number): void { }
  isBoxy(): boolean { return false; }
  isStony(): boolean { return true; }
  update(x: number, y: number): void {
    this.fallStrategy.update(this, x, y);
  }
}

class Box implements Tile {
  private fallStrategy: FallStrategy;
  constructor(falling: FallingState) {
    this.fallStrategy = new FallStrategy(falling);
  }
  isAir() { return false; }
  isLock1() { return false; }
  isLock2() { return false; }
  draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    g.fillStyle = "#8b4513";
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
  moveHorizontal(dx: number): void {
    if (!this.fallStrategy.isFalling()) {
      if (map[player.getY()][player.getX() + dx + dx].isAir() && !map[player.getY() + 1][player.getX() + dx].isAir()) {
        map[player.getY()][player.getX() + dx + dx] = map[player.getY()][player.getX() + dx];
        moveToTile(player.getX() + dx, player.getY());
      }
    }
  }
  moveVertical(dy: number): void { }
  isBoxy(): boolean { return true; }
  isStony(): boolean { return false; }
  update(x: number, y: number): void {
    this.fallStrategy.update(this, x, y);
  }
}

class Key implements Tile {
  private configuration: KeyConfiguration;
  constructor(configuration: KeyConfiguration) {
    this.configuration = configuration;
  }
  isAir() { return false; }
  isLock1() { return false; }
  isLock2() { return false; }
  draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    this.configuration.setColor(g);
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
  moveHorizontal(dx: number): void {
    this.configuration.removeLock();
    moveToTile(player.getX() + dx, player.getY());
  }
  moveVertical(dy: number): void {
    this.configuration.removeLock();
    moveToTile(player.getX(), player.getY() + dy);
  }
  isBoxy(): boolean { return false; }
  isStony(): boolean { return false; }
  update(x: number, y: number): void { }
}

class LockTile implements Tile {
  private configuration: KeyConfiguration;
  constructor(configuration: KeyConfiguration) {
    this.configuration = configuration;
  }
  isAir() { return false; }
  isLock1() { return this.configuration.fits(1); }
  isLock2() { return this.configuration.fits(2); }
  draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    this.configuration.setColor(g);
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
  moveHorizontal(dx: number): void { }
  moveVertical(dy: number): void { }
  isBoxy(): boolean { return false; }
  isStony(): boolean { return false; }
  update(x: number, y: number): void { }
}

let rawMap: RawTile[][] = [
  [2, 2, 2, 2, 2, 2, 2, 2],
  [2, 3, 0, 1, 1, 2, 0, 2],
  [2, 4, 2, 6, 1, 2, 0, 2],
  [2, 8, 4, 1, 1, 2, 0, 2],
  [2, 4, 1, 1, 1, 9, 0, 2],
  [2, 2, 2, 2, 2, 2, 2, 2],
];
let map: Tile[][];

function assertExhausted(x: never): never {
  throw new Error("Unexpected object: " + x);
}

function transformTile(tile: RawTile) {
  switch (tile) {
    case RawTile.AIR: return new Air();
    case RawTile.PLAYER: return new PlayerTile();
    case RawTile.UNBREAKABLE: return new Unbreakable();
    case RawTile.STONE: return new Stone(new Resting());
    case RawTile.FALLING_STONE: return new Stone(new Falling());
    case RawTile.BOX: return new Box(new Resting());
    case RawTile.FALLING_BOX: return new Box(new Falling());
    case RawTile.FLUX: return new Flux();
    case RawTile.KEY1: return new Key(YELLOW_KEY);
    case RawTile.LOCK1: return new LockTile(YELLOW_KEY);
    case RawTile.KEY2: return new Key(BLUE_KEY);
    case RawTile.LOCK2: return new LockTile(BLUE_KEY);
    default: assertExhausted(tile);
  }
}

function transformMap() {
  map = new Array(rawMap.length);
  for (let y = 0; y < rawMap.length; y++) {
    map[y] = new Array(rawMap[y].length);
    for (let x = 0; x < rawMap[y].length; x++) {
      map[y][x] = transformTile(rawMap[y][x]);
    }
  }
}

let inputs: Input[] = [];

function moveToTile(newx: number, newy: number) {
  map[player.getY()][player.getX()] = new Air();
  map[newy][newx] = new PlayerTile();
  player.setX(newx);
  player.setY(newy);
}

function update() {
  handleInputs();
  updateMap();
}

function handleInputs() {
  while (inputs.length > 0) {
    let current = inputs.pop();
    current.handle();
  }
}

function updateMap() {
  for (let y = map.length - 1; y >= 0; y--) {
    for (let x = 0; x < map[y].length; x++) {
      updateTile(x, y);
    }
  }
}

function updateTile(x: number, y: number) {
  map[y][x].update(x, y);
}

function draw() {
  let g = createGraphics();
  drawMap(g);
  player.draw(g);
}

function createGraphics() {
  let canvas = document.getElementById("GameCanvas") as HTMLCanvasElement;
  let g = canvas.getContext("2d");
  g.clearRect(0, 0, canvas.width, canvas.height);
  return g;
}

function drawMap(g: CanvasRenderingContext2D) {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      map[y][x].draw(g, x, y);
    }
  }
}

function gameLoop() {
  let before = Date.now();
  update();
  draw();
  let after = Date.now();
  let frameTime = after - before;
  let sleep = SLEEP - frameTime;
  setTimeout(() => gameLoop(), sleep);
}

window.onload = () => {
  transformMap();
  gameLoop();
}

const LEFT_KEY = "ArrowLeft";
const UP_KEY = "ArrowUp";
const RIGHT_KEY = "ArrowRight";
const DOWN_KEY = "ArrowDown";
window.addEventListener("keydown", e => {
  if (e.key === LEFT_KEY || e.key === "a") inputs.push(new Left());
  else if (e.key === UP_KEY || e.key === "w") inputs.push(new Up());
  else if (e.key === RIGHT_KEY || e.key === "d") inputs.push(new Right());
  else if (e.key === DOWN_KEY || e.key === "s") inputs.push(new Down());
});

