
function query(query: string): HTMLElement {
    let out = document.querySelector(query);
    if (!out) {
        throw new Error(`Missing query: '${query}'`);
    }
    return out as HTMLElement;
}


const EMPTY = 0;
const DEBRIS = 1;
const MOVE_UD = 2;
const MOVE_DU = 3;
const MOVE_LR = 4;
const MOVE_RL = 5;
const MOVE_UR = 6;
const MOVE_RD = 7;
const MOVE_DL = 8;
const MOVE_LU = 9;
const MOVE_UL = 10;
const MOVE_LD = 11;
const MOVE_DR = 12;
const MOVE_RU = 13;
const SHIELD = 14;
const PUSH_U = 15;
const PUSH_D = 16;
const PUSH_L = 17;
const PUSH_R = 18;
const SPAWNER_UD = 19;
const SPAWNER_LR = 20;
const EATER_UD = 21;
const EATER_LR = 22;


let height = 512;
let width = 512;
let grid = new Uint8Array(height * width);
let age = new Uint8ClampedArray(height * width);

function radiationDoesHit(chance: number, row: number, col: number, block: number): boolean {
    if (Math.random() > chance) {
        return false;
    }
    if (block === SHIELD || grid[(row - 1) * height + col] === SHIELD || grid[(row + 1) * height + col] === SHIELD || grid[row * height + col - 1] === SHIELD || grid[row * height + col + 1] === SHIELD) {
        return Math.random() < 0.01;    
    }
    return true;
}

function normalize(index: number): number {
    if (index < 0) {
        return index + grid.length;
    } else if (index >= grid.length) {
        return index - grid.length;
    } else {
        return index;
    }
}

function updateGrid() {
    let changes: [number, number][] = [];
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            let index = row * height + col;
            let block = grid[index];
            if (block === EMPTY) {
                if (Math.random() < 0.0001) {
                    changes.push([index, 1 + Math.floor(Math.random() * 22)]);
                }
                continue;
            } else if (block === DEBRIS) {
                if (Math.random() < 0.25) {
                    changes.push([index, EMPTY]);
                    continue;
                }
            } else if (radiationDoesHit(0.01, row, col, block)) {
                changes.push([index, EMPTY]);
            } else if (block === SHIELD) {
                continue;
            } else if (block === SPAWNER_UD || block === SPAWNER_LR || block === EATER_UD || block === EATER_LR) {
                let items: number[];
                if (block === SPAWNER_UD || block === EATER_UD) {
                    items = [(row - 1) * height + col, (row + 1) * height + col];
                } else {
                    items = [row * height + col - 1, row * height + col + 1];
                }
                for (let index of items) {
                    if (block === SPAWNER_UD || block === SPAWNER_LR) {
                        if (grid[index] === EMPTY) {
                            changes.push([index, 1 + Math.floor(Math.random() * 22)]);
                        }
                    } else if (grid[index] !== EMPTY) {
                        changes.push([index, EMPTY]);
                    }
                }
            } else if (block === PUSH_U || block === PUSH_D || block === PUSH_L || block === PUSH_R) {
                let otherIndex: number;
                let nextOtherIndex: number;
                if (block === PUSH_U) {
                    otherIndex = (row - 1) * height + col;
                    nextOtherIndex = (row - 2) * height + col;
                } else if (block === PUSH_D) {
                    otherIndex = (row + 1) * height + col;
                    nextOtherIndex = (row + 2) * height + col;
                } else if (block === PUSH_L) {
                    otherIndex = row * height + col - 1;
                    nextOtherIndex = row * height + col - 2;
                } else {
                    otherIndex = row * height + col + 1;
                    nextOtherIndex = row * height + col + 2;
                }
                otherIndex = normalize(otherIndex);
                nextOtherIndex = normalize(nextOtherIndex);
                if (grid[otherIndex] !== EMPTY && grid[nextOtherIndex] === EMPTY) {
                    changes.push([index, DEBRIS]);
                    changes.push([otherIndex, block]);
                    changes.push([nextOtherIndex, grid[otherIndex]]);
                } else if (grid[otherIndex] === EMPTY) {
                    changes.push([index, DEBRIS]);
                    changes.push([otherIndex, block]);
                }
            } else {
                let startIndex: number;
                if (block === MOVE_UD || block === MOVE_UR || block === MOVE_UL) {
                    startIndex = (row - 1) * height + col;
                } else if (block === MOVE_RL || block === MOVE_RD || block === MOVE_RU) {
                    startIndex = row * height + col + 1;
                } else if (block === MOVE_DU || block === MOVE_DL || block === MOVE_DR) {
                    startIndex = (row + 1) * height + col;
                } else {
                    startIndex = row * height + col - 1;
                }
                startIndex = normalize(startIndex);
                if (grid[startIndex] === EMPTY) {
                    startIndex = index;
                }
                let endIndex: number;
                if (block === MOVE_DU || block === MOVE_LU || block === MOVE_RU) {
                    endIndex = (row - 1) * height + col;
                } else if (block === MOVE_LR || block === MOVE_UR || block === MOVE_DR) {
                    endIndex = row * height + col + 1;
                } else if (block === MOVE_UD || block === MOVE_RD || block === MOVE_LD) {
                    endIndex = (row + 1) * height + col;
                } else {
                    endIndex = row * height + col - 1;
                }
                endIndex = normalize(endIndex);
                if (grid[endIndex] !== EMPTY) {
                    continue;
                }
                let movedBlock = grid[startIndex];
                changes.push([startIndex, EMPTY]);
                changes.push([endIndex, movedBlock]);
            }
        }
    }
    for (let [index, block] of changes) {
        grid[index] = block;
        age[index] = 0;
    }
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            let index = row * height + col;
            if (grid[index] === EMPTY) {
                continue;
            }
            age[index]++;
            if (age[index] > (Math.random() * 80 + 20) && radiationDoesHit(1, row, col, grid[index])) {
                grid[index] = DEBRIS;
                age[index] = 0;
            }
        }
    }
}

let canvas = document.querySelector('canvas') as HTMLCanvasElement;
canvas.width = width * 16;
canvas.height = height * 16;
let ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
ctx.strokeStyle = '#ffffff';
ctx.lineCap = 'round';
ctx.lineWidth = 2;

let offsetX = 0;
let offsetY = 0;
let scale = 1;

let isDragging = false;
let dragStart = {x: 0, y: 0};
let dragOffsetStart = {x: 0, y: 0};

function drawArrowhead(x: number, y: number, dir: 'up' | 'down' | 'left' | 'right'): void {
    ctx.moveTo(x, y);
    if (dir === 'up') {
        ctx.lineTo(x - 3, y + 3);
        ctx.moveTo(x, y);
        ctx.lineTo(x + 3, y + 3);
    } else if (dir === 'down') {
        ctx.lineTo(x - 3, y - 3);
        ctx.moveTo(x, y);
        ctx.lineTo(x + 3, y - 3);
    } else if (dir === 'left') {
        ctx.lineTo(x + 3, y - 3);
        ctx.moveTo(x, y);
        ctx.lineTo(x + 3, y + 3);
    } else {
        ctx.lineTo(x - 3, y - 3);
        ctx.moveTo(x, y);
        ctx.lineTo(x - 3, y + 3);
    }
}

function updateCanvas() {
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            let block = grid[row * height + col];
            let x = col * 16;
            let y = row * 16;
            if (block === EMPTY) {
                continue;
            } else if (block === DEBRIS) {
                ctx.fillStyle = '#7f7f7f';
                ctx.fillRect(x, y, 16, 16);
            } else if (block === SHIELD) {
                ctx.fillStyle = '#007fff';
                ctx.fillRect(x, y, 16, 16);
            } else if (block === SPAWNER_UD || block === SPAWNER_LR || block === EATER_UD || block === EATER_LR) {
                if (block === SPAWNER_UD || block === SPAWNER_LR) {
                    ctx.fillStyle = '#00ff00';
                } else {
                    ctx.fillStyle = '#ff0000';
                }
                ctx.fillRect(x, y, 16, 16);
                ctx.beginPath();
                if (block === SPAWNER_UD || block === EATER_UD) {
                    ctx.moveTo(x + 8, y + 2);
                    ctx.lineTo(x + 8, y + 14);
                } else {
                    ctx.moveTo(x + 2, y + 8);
                    ctx.lineTo(x + 14, y + 8);
                }
                ctx.stroke();
            } else if (block === PUSH_U || block === PUSH_D || block === PUSH_L || block === PUSH_R) {
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(x, y, 16, 16);
                ctx.beginPath();
                if (block === PUSH_U || block === PUSH_D) {
                    ctx.moveTo(x + 8, y + 2);
                    ctx.lineTo(x + 8, y + 14);
                    if (block === PUSH_U) {
                        drawArrowhead(x + 8, y + 2, 'up');
                    } else {
                        drawArrowhead(x + 8, y + 14, 'down');
                    }
                } else {
                    ctx.moveTo(x + 2, y + 8);
                    ctx.lineTo(x + 14, y + 8);
                    if (block === PUSH_L) {
                        drawArrowhead(x + 2, y + 8, 'left');
                    } else {
                        drawArrowhead(x + 14, y + 8, 'right');
                    }
                }
                ctx.stroke();
            } else {
                ctx.fillStyle = '#bf00bf';
                ctx.fillRect(x, y, 16, 16);
                ctx.beginPath();
                ctx.moveTo(x + 8, y + 8);
                if (block === MOVE_UD || block === MOVE_UR || block === MOVE_UL) {
                    ctx.lineTo(x + 8, y + 2);
                } else if (block === MOVE_RL || block === MOVE_RD || block === MOVE_RU) {
                    ctx.lineTo(x + 14, y + 8);
                } else if (block === MOVE_DU || block === MOVE_DL || block === MOVE_DR) {
                    ctx.lineTo(x + 8, y + 14);
                } else {
                    ctx.lineTo(x + 2, y + 8);
                }
                ctx.moveTo(x + 8, y + 8)
                if (block === MOVE_DU || block === MOVE_LU || block === MOVE_RU) {
                    ctx.lineTo(x + 8, y + 2);
                    drawArrowhead(x + 8, y + 2, 'up');
                } else if (block === MOVE_LR || block === MOVE_UR || block === MOVE_DR) {
                    ctx.lineTo(x + 14, y + 8);
                    drawArrowhead(x + 14, y + 8, 'right');
                } else if (block === MOVE_UD || block === MOVE_RD || block === MOVE_LD) {
                    ctx.lineTo(x + 8, y + 14);
                    drawArrowhead(x + 8, y + 14, 'down');
                } else {
                    ctx.lineTo(x + 2, y + 8);
                    drawArrowhead(x + 2, y + 8, 'left');
                }
                ctx.stroke();
            }
        }
    }
    ctx.restore();
}

canvas.addEventListener('mousedown', event => {
    isDragging = true;
    dragStart = {x: event.clientX, y: event.clientY};
    dragOffsetStart = {x: offsetX, y: offsetY};
});

canvas.addEventListener('mousemove', event => {
    if (!isDragging) {
        return;
    }
    offsetX = dragOffsetStart.x + (event.clientX - dragStart.x);
    offsetY = dragOffsetStart.y + (event.clientY - dragStart.y);
});

canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mouseleave', () => isDragging = false);

canvas.addEventListener('wheel', event => {
    event.preventDefault();
    let rect = canvas.getBoundingClientRect();
    let mouseX = event.clientX - rect.left;
    let mouseY = event.clientY - rect.top;
    let zoomAmount = event.deltaY < 0 ? 1.1 : 0.9;
    let newScale = Math.min(Math.max(0.1, scale * zoomAmount), 10);
    let worldX = (mouseX - offsetX) / scale;
    let worldY = (mouseY - offsetY) / scale;
    offsetX = mouseX - worldX * newScale;
    offsetY = mouseY - worldY * newScale;
    scale = newScale;
});


query('#step').addEventListener('click', () => {
    updateGrid();
    updateCanvas();
});


for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
        if (Math.random() < 0.25) {
            let r = Math.random();
            if (r < 0.1) {
                grid[row * height + col] = SHIELD;
            } else if (r < 0.13) {
                grid[row * height + col] = 15 + Math.floor(Math.random() * 4);
            } else if (r < 0.14) {
                grid[row * height + col] = Math.random() >= 0.5 ? SPAWNER_UD : SPAWNER_LR;
            } else if (r < 0.15) {
                grid[row * height + col] = Math.random() >= 0.5 ? EATER_UD : EATER_LR;
            } else {
                grid[row * height + col] = 2 + Math.floor(Math.random() * 12);
            }
        }
    }
}

window.addEventListener('load', updateCanvas);

setInterval(updateGrid, 100);
setInterval(updateCanvas, 1000/60);
