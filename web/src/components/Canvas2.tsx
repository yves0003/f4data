import {
  Dispatch,
  MouseEvent,
  WheelEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useWindowContext } from "../context/WindowsContext";
import { useImmer } from "use-immer";
import { CanvasLayoutManager } from "../helpers/CanvasLayoutManager";
import { Table } from "./Table";
import { getInfosLinks } from "../helpers/getInfosLinks";
import { Line } from "../helpers/Lines";
import { sortElementsToDraw } from "../helpers/sortElementsToDraw";
import { cursorIsInTable, getElementAtPosition } from "../utils";
import { ZoomControls } from "./ZoomControls";
import { OutputTable } from "../helpers/ast_to_data2";
type CanvasAction = "none" | "moving" | "movePlan" | "rightClick" | "zoom";
type SelectedElement = OutputTable & { offsetX: number; offsetY: number };
type TableType = OutputTable;

const useCanvasState = () => {
  const [elements, setElements] = useImmer<TableType[]>([]);
  const [selectedElement, setSelectedElement] =
    useState<SelectedElement | null>(null);
  const [action, setAction] = useState<CanvasAction>("none");
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  return {
    elements,
    setElements,
    selectedElement,
    setSelectedElement,
    action,
    setAction,
    scale,
    setScale,
    pan,
    setPan,
  };
};

const Canvas = ({
  listTables,
  arrange,
  setArrange,
  listLinks,
}: {
  listTables: OutputTable[];
  arrange: boolean;
  setArrange: Dispatch<React.SetStateAction<boolean>>;
  listLinks: Transformed[];
}) => {
  const [fontSize] = useState(13);
  const [police] = useState("Arial");
  const [editorWidth] = useState(0);
  const zoomSensitivity = 1000;
  const margin = 5;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { clientWidth, clientHeight } = useWindowContext();
  const state = useCanvasState();

  const initialPanRef = useRef(state.pan);
  const initialScreenPosRef = useRef({ x: 0, y: 0 });
  const wheelTimeoutRef = useRef<number>();
  const layoutManagerRef = useRef<CanvasLayoutManager | null>(null);

  // Initialize layout manager
  useLayoutEffect(() => {
    const canvasWidth = clientWidth - editorWidth;
    const canvasHeight = clientHeight;
    layoutManagerRef.current = new CanvasLayoutManager(
      canvasWidth,
      canvasHeight
    );
  }, [clientWidth, clientHeight, editorWidth, state, listTables]);

  // Get canvas coordinates from screen coordinates
  const getMouseCoordinates = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => ({
      clientX: (event.clientX - editorWidth - state.pan.x) / state.scale,
      clientY: (event.clientY - state.pan.y) / state.scale,
    }),
    [editorWidth, state.pan.x, state.pan.y, state.scale]
  );

  // Canvas interaction handlers
  const handleMouseDown = (event: MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const { clientX, clientY } = getMouseCoordinates(event);
    if (event.button === 2) {
      state.setAction("rightClick");
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext("2d");
      if (!context) return;
      const element = getElementAtPosition(
        clientX,
        clientY,
        state.elements,
        context,
        fontSize,
        margin
      );
      if (!element) {
        const elementUnderCursor = cursorIsInTable(
          clientX,
          clientY,
          state.elements,
          context,
          fontSize,
          margin
        );
        if (!elementUnderCursor) {
          state.setAction("movePlan");
          initialPanRef.current = state.pan;
          initialScreenPosRef.current = {
            x: event.clientX - editorWidth,
            y: event.clientY,
          };
        }
      } else {
        state.setAction("moving");
        // Move element to end of array
        state.setElements((draft) => {
          const index = draft.findIndex((e) => e._id === element._id);
          if (index > -1) {
            const updatedElement = {
              ...draft[index],
              position: {
                ...draft[index].position,
                pos_x: clientX - (clientX - draft[index].position.pos_x),
                pos_y: clientY - (clientY - draft[index].position.pos_y),
              },
            };
            draft.splice(index, 1);
            draft.push(updatedElement);
          }
        });
        state.setSelectedElement({
          ...element,
          offsetX: clientX - element.position.pos_x,
          offsetY: clientY - element.position.pos_y,
        });
      }
    }
  };

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      const { clientX, clientY } = getMouseCoordinates(event);

      switch (state.action) {
        case "none": {
          if (state.action === "none") {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const context = canvas.getContext("2d");
            if (!context) return;
            if (!state.selectedElement) {
              const elementFound = getElementAtPosition(
                clientX,
                clientY,
                state.elements,
                context,
                fontSize,
                margin
              );
              const elementUnderCursor = cursorIsInTable(
                clientX,
                clientY,
                state.elements,
                context,
                fontSize,
                margin
              );

              if (elementUnderCursor) {
                state.setElements((draft) => {
                  const element = draft.find(
                    (e) => e._id === elementUnderCursor._id
                  );
                  if (element) {
                    element.cursorIsIn = true;
                  }
                });
              } else {
                state.setElements((draft) => {
                  const element = draft.find((e) => e.cursorIsIn);
                  if (element) {
                    element.cursorIsIn = false;
                  }
                });
              }
              if (elementFound) {
                canvasRef.current.style.cursor = "move";
              } else {
                canvasRef.current.style.cursor = "default";
              }
            } else {
              canvasRef.current.style.cursor = "move";
            }
          }
          break;
        }
        case "movePlan": {
          const currentX = event.clientX - editorWidth;
          const currentY = event.clientY;
          const deltaX = currentX - initialScreenPosRef.current.x;
          const deltaY = currentY - initialScreenPosRef.current.y;
          state.setPan({
            x: initialPanRef.current.x + deltaX,
            y: initialPanRef.current.y + deltaY,
          });
          break;
        }

        case "moving": {
          if (!state.selectedElement) return;
          const selectedElements = state.selectedElement;
          state.setElements((draft) => {
            const element = draft.find((e) => e._id === selectedElements._id);
            if (element) {
              element.position.pos_x = clientX - selectedElements.offsetX;
              element.position.pos_y = clientY - selectedElements.offsetY;
            }
          });
          break;
        }
      }
    },
    [editorWidth, getMouseCoordinates, fontSize, state]
  );

  const panRef = useRef(state.pan);
  const scaleRef = useRef(state.scale);

  // Update refs when values change
  useEffect(() => {
    panRef.current = state.pan;
    scaleRef.current = state.scale;
  }, [state.pan, state.scale]);

  const handleZoom = useCallback(
    (delta: number, clientX?: number, clientY?: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // If no coordinates provided, use canvas center
      const useCenter =
        typeof clientX === "undefined" || typeof clientY === "undefined";

      if (useCenter) {
        const canvasWidth = clientWidth - editorWidth;
        const canvasHeight = clientHeight;
        clientX = canvasWidth / 2 + canvas.offsetLeft;
        clientY = canvasHeight / 2 + canvas.offsetTop;
      }

      // Get canvas bounding rectangle
      const rect = canvas.getBoundingClientRect();

      // Convert to canvas coordinates
      if (!clientX || !clientY) return;
      const mouseX =
        (clientX - rect.left - panRef.current.x) / scaleRef.current;
      const mouseY = (clientY - rect.top - panRef.current.y) / scaleRef.current;

      // Calculate new scale
      const newScale = Math.min(Math.max(scaleRef.current + delta, 0.1), 2);

      // Calculate new pan
      const newPanX = panRef.current.x - mouseX * (newScale - scaleRef.current);
      const newPanY = panRef.current.y - mouseY * (newScale - scaleRef.current);

      state.setPan({ x: newPanX, y: newPanY });
      state.setScale(newScale);
    },
    [state, clientWidth, clientHeight, editorWidth]
  );
  const handleWheel = (event: WheelEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const delta = -event.deltaY / zoomSensitivity;

    // Zoom to mouse position
    handleZoom(delta, event.clientX, event.clientY);

    clearTimeout(wheelTimeoutRef.current);
    wheelTimeoutRef.current = setTimeout(
      () => state.setAction("none"),
      500
    ) as unknown as number;
  };

  const handleMouseUp = () => {
    state.setAction("none");
    if (!state.selectedElement) return;
    state.setSelectedElement(null);
  };

  // Update getElementWidth and getElementHeight functions
  const getElementWidth = useCallback(
    (element: OutputTable, fontSize: number, margin: number) => {
      const maxWidth = element.variables.reduce((max, variable) => {
        const width = measureTextWidth(variable.name, fontSize);
        return Math.max(max, width);
      }, 0);
      return maxWidth + margin * 2;
    },
    []
  );

  const getElementHeight = useCallback(
    (element: OutputTable, fontSize: number, margin: number) => {
      return (
        (fontSize + margin * 2) * element.variables.length +
        margin +
        (fontSize + margin * 2)
      );
    },
    []
  );
  useEffect(() => {
    state.setElements((draft) => {
      if (state.elements.length === 0) {
        return listTables;
      } else {
        const newTables: OutputTable[] = [];
        listTables.forEach((table) => {
          let elementFound = draft.find((e) => e._id === table._id);
          if (elementFound) {
            elementFound = {
              ...table,
              position: {
                pos_x: elementFound.position.pos_x,
                pos_y: elementFound.position.pos_y,
              },
            };
            // elementFound.position.pos_y = prev.position.pos_y;
            // elementFound.position.pos_x = prev.position.pos_x;
            newTables.push(elementFound);
          } else {
            newTables.push(table);
          }
        });
        return newTables;
      }
    });
    if (state.elements.length === 0) {
      setArrange(true);
    }
  }, [listTables, setArrange]);
  useLayoutEffect(() => {
    if (!layoutManagerRef.current) return;
    if (state.elements.length === 0) return;
    if (arrange) {
      state.setElements((draft) => {
        draft.forEach((element) => {
          const elementWidth = getElementWidth(element, fontSize, margin);
          const widthTitle = measureTextWidth(element.name, fontSize);
          const elementHeight = getElementHeight(element, fontSize, margin);
          if (!layoutManagerRef.current) return;
          const pos = layoutManagerRef.current.positionElement({
            width: widthTitle > elementWidth ? widthTitle : elementWidth,
            height: elementHeight,
          });

          element.position.pos_x = pos.x /*+ element.position.pos_x*/;
          element.position.pos_y = pos.y /*+ element.position.pos_y*/;
        });
      });
      setArrange(false);
    }
  }, [
    clientWidth,
    clientHeight,
    fontSize,
    margin,
    getElementWidth,
    getElementHeight,
    state,
    arrange,
    setArrange,
  ]);

  // Canvas rendering
  useLayoutEffect(() => {
    if (!layoutManagerRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = (clientWidth - editorWidth) * dpr;
    canvas.height = clientHeight * dpr;
    canvas.style.width = `${clientWidth - editorWidth}px`;
    canvas.style.height = `${clientHeight}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${fontSize}px ${police}`;
    ctx.textBaseline = "top";
    ctx.setTransform(dpr, 0, 0, dpr, state.pan.x * dpr, state.pan.y * dpr);
    ctx.scale(state.scale, state.scale);

    const allTables = state.elements.map((table) =>
      Table.fromObject(table)(ctx)
    );
    //const allTables = listTables.map(table => Table.fromObject(table)(ctx));
    //const allLinks = linkTest.reduce(
    const allLinks = listLinks.reduce(
      (list, link) => getInfosLinks(list, link, allTables),
      [] as Line[]
    );

    const combinedArray = [...allLinks, ...allTables];
    const allElementsToDraw = combinedArray.sort(sortElementsToDraw);
    allElementsToDraw.forEach((element) => element.draw(ctx));
    //allTables.forEach(element => element.draw(ctx));

    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    return () => {
      canvas.removeEventListener("contextmenu", (e) => e.preventDefault());
      clearTimeout(wheelTimeoutRef.current);
    };
  }, [
    clientWidth,
    clientHeight,
    editorWidth,
    fontSize,
    margin,
    police,
    state,
    listTables,
  ]);

  const measureTextWidth = (text: string, fontSize: number) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;
    ctx.font = `${fontSize}px Arial`;
    return ctx.measureText(text).width;
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      <ZoomControls
        scale={state.scale}
        onZoom={handleZoom}
        editorWidth={editorWidth}
      />
    </>
  );
};

export default Canvas;
