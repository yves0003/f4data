type ElementDimensions = {
  width: number;
  height: number;
};
type LayoutPosition = {
  x: number;
  y: number;
};

// Add the CanvasLayoutManager class
export class CanvasLayoutManager {
  private grid: boolean[][];
  private cellSize: number;
  private padding: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private overflowArea: { x: number; y: number };

  constructor(canvasWidth: number, canvasHeight: number, cellSize = 10, padding = 5) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.cellSize = cellSize;
    this.padding = padding;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.grid = Array(Math.ceil(this.canvasHeight / cellSize))
      .fill(false)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      .map(() => Array(Math.ceil(this.canvasWidth / cellSize)).fill(false));
    this.overflowArea = { x: 0, y: canvasHeight + padding };
  }

  positionElement(element: ElementDimensions): LayoutPosition {
    // Try to place inside canvas first
    for (let row = 0; row < this.grid.length; row++) {
      for (let col = 0; col < this.grid[0].length; col++) {
        if (this.fits(element, col, row)) {
          this.placeElement(element, col, row);
          return {
            x: col * this.cellSize + this.padding,
            y: row * this.cellSize + this.padding,
          };
        }
      }
    }

    // Place in overflow area if no space
    const overflowPos = { ...this.overflowArea };
    this.overflowArea.y += element.height + this.padding;
    return overflowPos;
  }

  private fits(element: ElementDimensions, col: number, row: number): boolean {
    const colsNeeded = Math.ceil(element.width / this.cellSize);
    const rowsNeeded = Math.ceil(element.height / this.cellSize);

    for (let i = row; i < row + rowsNeeded; i++) {
      for (let j = col; j < col + colsNeeded; j++) {
        if (i >= this.grid.length || j >= this.grid[0].length || this.grid[i][j]) {
          return false;
        }
      }
    }
    return true;
  }

  private placeElement(element: ElementDimensions, col: number, row: number): void {
    const colsNeeded = Math.ceil(element.width / this.cellSize);
    const rowsNeeded = Math.ceil(element.height / this.cellSize);

    for (let i = row; i < row + rowsNeeded; i++) {
      for (let j = col; j < col + colsNeeded; j++) {
        if (i < this.grid.length && j < this.grid[0].length) {
          this.grid[i][j] = true;
        }
      }
    }
  }
}
