let boardId = location.pathname.replace(/[^\w ]/, "").trim();

if (!boardId) {
  boardId = prompt("Your board name", "123");
  location.assign(boardId);
}

let socket = io("http://localhost:3000/", { query: `boardId=${boardId}` });

const canvas = new fabric.Canvas("canvasStageRoot");

let isRectActive = false,
  isCircleActive = false,
  isFreeDrawing = false,
  isLoadedFromJson = false,
  activeColor = "#000000";

//set w & h for canvas
canvas.setHeight(1000);
canvas.setWidth(1000);

function initCanvas(canvas) {
  canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
  canvas.freeDrawingBrush.shadow = new fabric.Shadow({
    blur: 0,
    offsetX: 0,
    offsetY: 0,
    affectStroke: true,
    color: "#ffffff",
  });
  canvas.freeDrawingBrush.width = 5;
  canvas.isDrawingMode = false;

  return canvas;
}

function setBrush(options) {
  if (options.color !== undefined) {
    canvas.freeDrawingBrush.color = options.color;
  }
}

function setCanvasSelectableStatus(val) {
  canvas.forEachObject(function(obj) {
    obj.lockMovementX = !val;
    obj.lockMovementY = !val;
    obj.hasControls = val;
    obj.hasBorders = val;
    obj.selectable = val;
  });
  canvas.renderAll();
}

function setFreeDrawingMode(val) {
  isFreeDrawing = val;
  disableShapeMode();
}

function removeCanvasEvents() {
  canvas.off("mouse:down");
  canvas.off("mouse:move");
  canvas.off("mouse:up");
  canvas.off("object:moving");
}

function enableShapeMode() {
  removeCanvasEvents();
  isFreeDrawing = canvas.isDrawingMode;
  canvas.isDrawingMode = false;
  canvas.selection = false;
  setCanvasSelectableStatus(false);
}

function disableShapeMode() {
  removeCanvasEvents();
  canvas.isDrawingMode = isFreeDrawing;
  canvas.selection = true;
  isRectActive = isCircleActive = false;
  setCanvasSelectableStatus(true);
}

function emitEvent() {
  const jsonData = canvas.toJSON();
  socket.emit(`drawing${boardId}`, jsonData);
}

const changeColor = (color) => {
  activeColor = color;
  setBrush({ color });
};

const toolText = () => {
  enableShapeMode();
  canvas.add(
    new fabric.IText("Double click and Type", {
      fontFamily: "arial black",
      fill: activeColor,
      fontSize: 24,
      left: 10,
      top: 10,
      objecttype: "text",
    })
  );
};

function toolRect() {
  if (!isRectActive || isCircleActive) {
    disableShapeMode();
    isRectActive = true;
    enableShapeMode();
    new Rectangle(canvas);
  } else {
    disableShapeMode();
    isRectActive = false;
  }
}

function toolCircle() {
  if (!isCircleActive || isRectActive) {
    disableShapeMode();
    isCircleActive = true;
    enableShapeMode();
    new Circle(canvas);
  } else {
    disableShapeMode();
    isCircleActive = false;
  }
}

function toolClearAll() {
  const isConfirmed = confirm("This will remove all data");
  if (isConfirmed == true) {
    canvas.clear();
    emitEvent();
  }
}

function toolPencil() {
  if (canvas.isDrawingMode) {
    setFreeDrawingMode(false);
  } else {
    setFreeDrawingMode(true);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  //Canvas init
  initCanvas(canvas).renderAll();

  //canvas events
  canvas.on("after:render", function() {
    if (!isLoadedFromJson) {
      emitEvent();
    }
    isLoadedFromJson = false;
  });

  canvas.renderAll();

  //Sockets
  socket.on(`welcome`, function(obj) {
    if (!obj) return;
    canvas.loadFromJSON(obj);
  });

  socket.on(`drawing${boardId}`, function(obj) {
    if (!obj) return;

    isLoadedFromJson = true;
    canvas.loadFromJSON(obj);
  });

  // set default tool
  toolPencil();
});
