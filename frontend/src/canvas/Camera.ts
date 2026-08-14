export class Camera {
  x: number = 0;
  y: number = 0;
  targetX: number = 0;
  targetY: number = 0;
  zoom: number = 1;
  targetZoom: number = 1;
  isDragging: boolean = false;
  dragStart: { x: number; y: number } = { x: 0, y: 0 };

  constructor() {}

  update() {
    this.x += (this.targetX - this.x) * 0.1;
    this.y += (this.targetY - this.y) * 0.1;
    this.zoom += (this.targetZoom - this.zoom) * 0.1;
  }

  flyTo(x: number, y: number, zoom: number = 1.3) {
    this.targetX = -x * zoom;
    this.targetY = -y * zoom;
    this.targetZoom = zoom;
  }

  reset() {
    this.targetX = 0;
    this.targetY = 0;
    this.targetZoom = 1;
  }

  handleWheel(e: WheelEvent) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    this.targetZoom = Math.min(3, Math.max(0.4, this.targetZoom * zoomFactor));
  }
}
