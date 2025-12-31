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
  private overflowArea: {
    x: number;
    y: number;
    currentRowHeight: number;
    maxRowWidth: number;
  };

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
    this.grid = Array(Math.ceil(this.canvasHeight / cellSize))
      .fill(false)
      .map(() => Array(Math.ceil(this.canvasWidth / cellSize)).fill(false));
    this.overflowArea = {
      x: 0,
      y: canvasHeight + padding,
      currentRowHeight: 0,
      maxRowWidth: canvasWidth,
    };
  }

  positionElement(element: ElementDimensions): LayoutPosition {
    const elementHeightInCells = Math.ceil(element.height / this.cellSize);
    const canvasHeightInCells = this.grid.length;

    // If element is taller than canvas, start from top and fill available height
    if (elementHeightInCells > canvasHeightInCells) {
      return this.positionTallElement(element);
    }

    // Try normal placement
    for (
      let row = 0;
      row <= canvasHeightInCells - elementHeightInCells;
      row++
    ) {
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

    // If no space in canvas, use overflow
    return this.positionInOverflow(element);
  }

  private positionTallElement(element: ElementDimensions): LayoutPosition {
    // Try to place at top (row 0) using full canvas height
    for (let col = 0; col < this.grid[0].length; col++) {
      if (this.fitsTallElement(col, element)) {
        this.placeTallElement(col, element);
        return {
          x: col * this.cellSize, //+ this.padding,
          y: 0, //+ this.padding, // Starts at top
        };
      }
    }

    // If can't place in canvas, use overflow
    return this.positionInOverflow(element);
  }

  private fitsTallElement(col: number, element: ElementDimensions): boolean {
    const colsNeeded = Math.ceil(element.width / this.cellSize);

    // Check if we have enough horizontal space
    if (col + colsNeeded > this.grid[0].length) {
      return false;
    }

    // Check if all needed columns are free in the entire height
    for (let i = 0; i < this.grid.length; i++) {
      for (let j = col; j < col + colsNeeded; j++) {
        if (this.grid[i][j]) {
          return false;
        }
      }
    }
    return true;
  }

  private placeTallElement(col: number, element: ElementDimensions): void {
    const colsNeeded = Math.ceil(element.width / this.cellSize);

    // Mark all cells in these columns as occupied for full height
    for (let i = 0; i < this.grid.length; i++) {
      for (let j = col; j < col + colsNeeded; j++) {
        this.grid[i][j] = true;
      }
    }
  }

  private positionInOverflow(element: ElementDimensions): LayoutPosition {
    const availableWidth = this.overflowArea.maxRowWidth - this.overflowArea.x;

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
        x: this.padding,
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
