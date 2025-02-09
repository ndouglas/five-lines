
const TILE_SIZE = 30;
const FPS = 30;
const SLEEP = 1000 / FPS;

interface Input {
  handle(): void;
}

class Right implements Input {
  handle() {
    player.moveHorizontal(map, 1);
  }
}

class Left implements Input {
  handle() {
    player.moveHorizontal(map, -1);
  }
}

class Up implements Input {
  handle() {
    player.moveVertical(map, -1);
  }
}

class Down implements Input {
  handle() {
    player.moveVertical(map, 1);
  }
}

interface RawTileValue {
  transform(): Tile;
}
class AirValue implements RawTileValue {
  transform(): Tile { return new Air(); }
}
class FluxValue implements RawTileValue {
  transform(): Tile { return new Flux(); }
}
class UnbreakableValue implements RawTileValue {
  transform(): Tile { return new Unbreakable(); }
}
class PlayerValue implements RawTileValue {
  transform(): Tile { return new PlayerTile(); }
}
class StoneValue implements RawTileValue {
  transform(): Tile { return new Stone(new Resting()); }
}
class FallingStoneValue implements RawTileValue {
  transform(): Tile { return new Stone(new Falling()); }
}
class BoxValue implements RawTileValue {
  transform(): Tile { return new Box(new Resting()); }
}
class FallingBoxValue implements RawTileValue {
  transform(): Tile { return new Box(new Falling()); }
}
class Key1Value implements RawTileValue {
  transform(): Tile { return new Key(YELLOW_KEY); }
}
class Lock1Value implements RawTileValue {
  transform(): Tile { return new LockTile(YELLOW_KEY); }
}
class Key2Value implements RawTileValue {
  transform(): Tile { return new Key(BLUE_KEY); }
}
class Lock2Value implements RawTileValue {
  transform(): Tile { return new LockTile(BLUE_KEY); }
}

class RawTile2 {
  static readonly AIR = new RawTile2(new AirValue());
  static readonly FLUX = new RawTile2(new FluxValue());
  static readonly UNBREAKABLE = new RawTile2(new UnbreakableValue());
  static readonly PLAYER = new RawTile2(new PlayerValue());
  static readonly STONE = new RawTile2(new StoneValue());
  static readonly FALLING_STONE = new RawTile2(new FallingStoneValue());
  static readonly BOX = new RawTile2(new BoxValue());
  static readonly FALLING_BOX = new RawTile2(new FallingBoxValue());
  static readonly KEY1 = new RawTile2(new Key1Value());
  static readonly LOCK1 = new RawTile2(new Lock1Value());
  static readonly KEY2 = new RawTile2(new Key2Value());
  static readonly LOCK2 = new RawTile2(new Lock2Value());

  private value: RawTileValue;
  private constructor(value: RawTileValue) {
    this.value = value;
  }
  transform(): Tile {
    return this.value.transform();
  }
}

const RAW_TILES = [
  RawTile2.AIR,
  RawTile2.FLUX,
  RawTile2.UNBREAKABLE,
  RawTile2.PLAYER,
  RawTile2.STONE, RawTile2.FALLING_STONE,
  RawTile2.BOX, RawTile2.FALLING_BOX,
  RawTile2.KEY1, RawTile2.LOCK1,
  RawTile2.KEY2, RawTile2.LOCK2,
];

class Player {
  private x: number = 1;
  private y: number = 1;
  draw(g: CanvasRenderingContext2D) {
    g.fillStyle = "#ff0000";
    g.fillRect(this.x * TILE_SIZE, this.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
  moveHorizontal(map: Map, dx: number) {
    map.moveHorizontal(this, this.x, this.y, dx);
  }
  moveVertical(map: Map, dy: number) {
    map.moveVertical(this, this.x, this.y, dy);
  }
  pushHorizontal(map: Map, tile: Tile, dx: number) {
    map.pushHorizontal(this, tile, this.x, this.y, dx);
  }
  move(map: Map, dx: number, dy: number) {
    this.moveToTile(map, this.x + dx, this.y + dy);
  }
  moveToTile(map: Map, newx: number, newy: number) {
    map.movePlayer(this.x, this.y, newx, newy);
    this.x = newx;
    this.y = newy;
  }
}
let player = new Player();

class Map {
  private map: Tile[][];
  constructor() {
    this.map = new Array(rawMap.length);
    for (let y = 0; y < rawMap.length; y++) {
      this.map[y] = new Array(rawMap[y].length);
      for (let x = 0; x < rawMap[y].length; x++) {
        this.map[y][x] = RAW_TILES[rawMap[y][x]].transform();
      }
    }
  }
  isAir(x: number, y: number): boolean {
    return this.map[y][x].isAir();
  }
  setTile(x: number, y: number, tile: Tile) {
    this.map[y][x] = tile;
  }
  movePlayer(x: number, y: number, newx: number, newy: number) {
    this.map[y][x] = new Air();
    this.map[newy][newx] = new PlayerTile();
  }
  update() {
    for (let y = this.map.length - 1; y >= 0; y--) {
      for (let x = 0; x < this.map[y].length; x++) {
        this.updateTile(x, y);
      }
    }
  }
  draw(g: CanvasRenderingContext2D) {
    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[y].length; x++) {
        this.map[y][x].draw(g, x, y);
      }
    }
  }
  drop(tile: Tile, x: number, y: number): void {
    this.map[y + 1][x] = tile;
    this.map[y][x] = new Air();
  }
  getBlockOnTopState(x: number, y: number) { return this.map[y][x].getBlockOnTopState(); }
  moveHorizontal(player: Player, x: number, y: number, dx: number) {
    this.map[y][x + dx].moveHorizontal(this, player, dx);
  }
  pushHorizontal(player: Player, tile: Tile, x: number, y: number, dx: number) {
    if (this.isAir(x + dx + dx, y) && !this.isAir(x + dx, y + 1)) {
      this.setTile(x + dx + dx, y, tile);
      player.moveToTile(map, x + dx, y);
    }
  }
  moveVertical(player: Player, x: number, y: number, dy: number) {
    this.map[y + dy][x].moveVertical(this, player, dy);
  }
  remove(removeStrategy: RemoveStrategy) {
    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[y].length; x++) {
        if (removeStrategy.check(this.map[y][x])) {
          this.map[y][x] = new Air();
        }
      }
    }
  }
  updateTile(x: number, y: number) {
    this.map[y][x].update(this, x, y);
  }
}

interface FallingState {
  isFalling(): boolean;
  drop(map: Map, tile: Tile, x: number, y: number): void;
}

class Falling implements FallingState {
  isFalling(): boolean { return true; }
  drop(map: Map, tile: Tile, x: number, y: number): void {
    map.drop(tile, x, y);
  }
}

class Resting implements FallingState {
  isFalling(): boolean { return false; }
  drop(map: Map, tile: Tile, x: number, y: number): void { }
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
  fits(id: number): boolean { return this.id === id; }
  setColor(g: CanvasRenderingContext2D): void {
    g.fillStyle = this.color;
  }
  removeLock(map: Map) {
    map.remove(this.removeStrategy);
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
  update(map: Map, tile: Tile, x: number, y: number) {
    this.state = map.getBlockOnTopState(x, y + 1);
    this.state.drop(map, tile, x, y);
  }
  isFalling(): boolean { return this.state.isFalling(); }
}

interface Tile {
  isAir(): boolean;
  isLock1(): boolean;
  isLock2(): boolean;
  draw(g: CanvasRenderingContext2D, x: number, y: number): void;
  moveHorizontal(map: Map, player: Player, dx: number): void;
  moveVertical(map: Map, player: Player, dy: number): void;
  isBoxy(): boolean;
  isStony(): boolean;
  update(map: Map, x: number, y: number): void;
  getBlockOnTopState(): FallingState;
}

class Air implements Tile {
  isAir() { return true; }
  isLock1() { return false; }
  isLock2() { return false; }
  draw(g: CanvasRenderingContext2D, x: number, y: number): void { }
  moveHorizontal(map: Map, player: Player, dx: number): void {
    player.move(map, dx, 0);
  }
  moveVertical(map: Map, player: Player, dy: number): void {
    player.move(map, 0, dy);
  }
  isBoxy(): boolean { return false; }
  isStony(): boolean { return false; }
  update(map: Map, x: number, y: number): void { }
  getBlockOnTopState() { return new Falling(); }
}

class Flux implements Tile {
  isAir() { return false; }
  isLock1() { return false; }
  isLock2() { return false; }
  draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    g.fillStyle = "#ccffcc";
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
  moveHorizontal(map: Map, player: Player, dx: number): void {
    player.move(map, dx, 0);
  }
  moveVertical(map: Map, player: Player, dy: number): void {
    player.move(map, 0, dy);
  }
  isBoxy(): boolean { return false; }
  isStony(): boolean { return false; }
  update(map: Map, x: number, y: number): void { }
  getBlockOnTopState() { return new Resting(); }
}

class Unbreakable {
  isAir() { return false; }
  isLock1() { return false; }
  isLock2() { return false; }
  draw(g: CanvasRenderingContext2D, x: number, y: number): void {
    g.fillStyle = "#999999";
    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
  moveHorizontal(map: Map, player: Player, dx: number): void { }
  moveVertical(map: Map, player: Player, dy: number): void { }
  isBoxy(): boolean { return false; }
  isStony(): boolean { return false; }
  update(map: Map, x: number, y: number): void { }
  getBlockOnTopState() { return new Resting(); }
}

class PlayerTile implements Tile {
  isAir() { return false; }
  isLock1() { return false; }
  isLock2() { return false; }
  draw(g: CanvasRenderingContext2D, x: number, y: number): void { }
  moveHorizontal(map: Map, player: Player, dx: number): void { }
  moveVertical(map: Map, player: Player, dy: number): void { }
  isBoxy(): boolean { return false; }
  isStony(): boolean { return false; }
  update(map: Map, x: number, y: number): void { }
  getBlockOnTopState() { return new Resting(); }
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
  moveHorizontal(map: Map, player: Player, dx: number): void {
    if (!this.fallStrategy.isFalling()) {
      player.pushHorizontal(map, this, dx);
    }
  }
  moveVertical(map: Map, player: Player, dy: number): void { }
  isBoxy(): boolean { return false; }
  isStony(): boolean { return true; }
  update(map: Map, x: number, y: number): void {
    this.fallStrategy.update(map, this, x, y);
  }
  getBlockOnTopState() { return new Resting(); }
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
  moveHorizontal(map: Map, player: Player, dx: number): void {
    if (!this.fallStrategy.isFalling()) {
      player.pushHorizontal(map, this, dx);
    }
  }
  moveVertical(map: Map, player: Player, dy: number): void { }
  isBoxy(): boolean { return true; }
  isStony(): boolean { return false; }
  update(map: Map, x: number, y: number): void {
    this.fallStrategy.update(map, this, x, y);
  }
  getBlockOnTopState() { return new Resting(); }
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
  moveHorizontal(map: Map, player: Player, dx: number): void {
    this.configuration.removeLock(map);
    player.move(map, dx, 0);
  }
  moveVertical(map: Map, player: Player, dy: number): void {
    this.configuration.removeLock(map);
    player.move(map, 0, dy);
  }
  isBoxy(): boolean { return false; }
  isStony(): boolean { return false; }
  update(map: Map, x: number, y: number): void { }
  getBlockOnTopState() { return new Resting(); }
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
  moveHorizontal(map: Map, player: Player, dx: number): void { }
  moveVertical(map: Map, player: Player, dy: number): void { }
  isBoxy(): boolean { return false; }
  isStony(): boolean { return false; }
  update(map: Map, x: number, y: number): void { }
  getBlockOnTopState() { return new Resting(); }
}

let rawMap: number[][] = [
  [2, 2, 2, 2, 2, 2, 2, 2],
  [2, 3, 0, 1, 1, 2, 0, 2],
  [2, 4, 2, 6, 1, 2, 0, 2],
  [2, 8, 4, 1, 1, 2, 0, 2],
  [2, 4, 1, 1, 1, 9, 0, 2],
  [2, 2, 2, 2, 2, 2, 2, 2],
];
let map = new Map();

function assertExhausted(x: never): never {
  throw new Error("Unexpected object: " + x);
}

let inputs: Input[] = [];

function update() {
  handleInputs();
  map.update();
}

function handleInputs() {
  while (inputs.length > 0) {
    let current = inputs.pop();
    current.handle();
  }
}

function draw() {
  let g = createGraphics();
  map.draw(g);
  player.draw(g);
}

function createGraphics() {
  let canvas = document.getElementById("GameCanvas") as HTMLCanvasElement;
  let g = canvas.getContext("2d");
  g.clearRect(0, 0, canvas.width, canvas.height);
  return g;
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

