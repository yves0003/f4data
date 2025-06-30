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
  private overflowArea: { x: number; y: number; currentRowHeight: number };

  constructor(
    canvasWidth: number,
    canvasHeight: number,
    cellSize = 10,
    padding = 5
  ) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.cellSize = cellSize;
    this.padding = padding;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.grid = Array(Math.ceil(this.canvasHeight / cellSize))
      .fill(false)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      .map(() => Array(Math.ceil(this.canvasWidth / cellSize)).fill(false));
    this.overflowArea = {
      x: 0,
      y: canvasHeight + padding,
      currentRowHeight: 0,
    };
  }

  positionElement(element: ElementDimensions): LayoutPosition {
    // Try to place inside canvas first (unchanged)
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

    // Updated overflow placement logic
    const availableWidth = this.canvasWidth - this.overflowArea.x;

    // If element fits in current overflow row
    if (element.width <= availableWidth) {
      const position = {
        x: this.overflowArea.x + this.padding,
        y: this.overflowArea.y + this.padding,
      };

      // Update overflow tracker
      this.overflowArea.x += element.width + this.padding;
      this.overflowArea.currentRowHeight = Math.max(
        this.overflowArea.currentRowHeight,
        element.height
      );

      return position;
    }
    // If element doesn't fit, move to new row
    else {
      // Move down by the tallest element in current row
      this.overflowArea.y += this.overflowArea.currentRowHeight + this.padding;
      this.overflowArea.x = 0;
      this.overflowArea.currentRowHeight = element.height;

      const position = {
        x: this.padding, // Start at beginning of new row
        y: this.overflowArea.y + this.padding,
      };

      this.overflowArea.x += element.width + this.padding;
      return position;
    }
  }

  private fits(element: ElementDimensions, col: number, row: number): boolean {
    const colsNeeded = Math.ceil(element.width / this.cellSize);
    const rowsNeeded = Math.ceil(element.height / this.cellSize);

    for (let i = row; i < row + rowsNeeded; i++) {
      for (let j = col; j < col + colsNeeded; j++) {
        if (
          i >= this.grid.length ||
          j >= this.grid[0].length ||
          this.grid[i][j]
        ) {
          return false;
        }
      }
    }
    return true;
  }

  private placeElement(
    element: ElementDimensions,
    col: number,
    row: number
  ): void {
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

export class CanvasLayoutManager2 {
  private grid: boolean[][];
  private cellSize: number;
  private padding: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private overflowArea: { x: number; y: number };

  constructor(
    canvasWidth: number,
    canvasHeight: number,
    cellSize = 10,
    padding = 5
  ) {
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
        if (
          i >= this.grid.length ||
          j >= this.grid[0].length ||
          this.grid[i][j]
        ) {
          return false;
        }
      }
    }
    return true;
  }

  private placeElement(
    element: ElementDimensions,
    col: number,
    row: number
  ): void {
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
