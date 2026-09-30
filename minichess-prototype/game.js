const BOARD_SIZE = 5;

// 체스 기물 유니코드 매핑
const PIECE_SYMBOLS = {
    'wR': '♖', 'wN': '♘', 'wB': '♗', 'wQ': '♕', 'wK': '♔', 'wP': '♙',
    'bR': '♜', 'bN': '♞', 'bB': '♝', 'bQ': '♛', 'bK': '♚', 'bP': '♟'
};

let board = [];
let currentTurn = 'w';
let selectedSquare = null;
let gameOver = false;

const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const resetBtn = document.getElementById('reset-btn');

function initGame() {
    board = [
        ['bR', 'bN', 'bB', 'bQ', 'bK'],
        ['bP', 'bP', 'bP', 'bP', 'bP'],
        [null, null, null, null, null],
        ['wP', 'wP', 'wP', 'wP', 'wP'],
        ['wR', 'wN', 'wB', 'wQ', 'wK'],
    ];
    currentTurn = 'w';
    selectedSquare = null;
    gameOver = false;
    updateStatus();
    renderBoard();
}

function updateStatus() {
    if (gameOver) return;
    statusElement.textContent = currentTurn === 'w' ? "백(White)의 턴입니다." : "흑(Black)의 턴입니다.";
    statusElement.style.color = currentTurn === 'w' ? "#fff" : "#ff9999";
}

function renderBoard() {
    boardElement.innerHTML = '';
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const square = document.createElement('div');
            square.classList.add('square');
            // 색상 패턴 (짝수 합은 밝은색)
            if ((r + c) % 2 === 0) {
                square.classList.add('light');
            } else {
                square.classList.add('dark');
            }
            
            square.dataset.r = r;
            square.dataset.c = c;
            
            const piece = board[r][c];
            if (piece) {
                const pieceEl = document.createElement('span');
                pieceEl.classList.add('piece');
                pieceEl.classList.add(piece.charAt(0) === 'w' ? 'white' : 'black');
                pieceEl.textContent = PIECE_SYMBOLS[piece];
                square.appendChild(pieceEl);
            }
            
            square.addEventListener('click', () => handleSquareClick(r, c));
            boardElement.appendChild(square);
        }
    }
}

function handleSquareClick(r, c) {
    if (gameOver) return;

    const clickedPiece = board[r][c];

    // 아무것도 선택되지 않은 상태에서 내 기물을 클릭
    if (!selectedSquare) {
        if (clickedPiece && clickedPiece.charAt(0) === currentTurn) {
            selectSquare(r, c);
        }
    } else {
        // 이미 선택된 상태
        const [sr, sc] = selectedSquare;
        
        // 같은 기물을 다시 클릭하면 선택 해제
        if (sr === r && sc === c) {
            clearSelection();
            return;
        }

        // 내 다른 기물을 클릭하면 선택 변경
        if (clickedPiece && clickedPiece.charAt(0) === currentTurn) {
            clearSelection();
            selectSquare(r, c);
            return;
        }

        // 이동 가능한 곳인지 확인하고 이동
        const validMoves = getValidMoves(sr, sc);
        const isValid = validMoves.some(m => m.r === r && m.c === c);

        if (isValid) {
            movePiece(sr, sc, r, c);
        } else {
            clearSelection();
        }
    }
}

function selectSquare(r, c) {
    selectedSquare = [r, c];
    const index = r * BOARD_SIZE + c;
    boardElement.children[index].classList.add('selected');
    
    // 이동 가능한 칸 하이라이트
    const validMoves = getValidMoves(r, c);
    validMoves.forEach(m => {
        const moveIdx = m.r * BOARD_SIZE + m.c;
        boardElement.children[moveIdx].classList.add('highlight');
    });
}

function clearSelection() {
    selectedSquare = null;
    Array.from(boardElement.children).forEach(sq => {
        sq.classList.remove('selected');
        sq.classList.remove('highlight');
    });
}

function movePiece(fromR, fromC, toR, toC) {
    const piece = board[fromR][fromC];
    const targetPiece = board[toR][toC];
    
    // 승리 조건 체크 (왕을 잡았을 때)
    if (targetPiece && targetPiece.charAt(1) === 'K') {
        gameOver = true;
        statusElement.textContent = `${currentTurn === 'w' ? '백(White)' : '흑(Black)'} 승리!`;
        statusElement.style.color = "#ffff00";
    }

    // 이동 처리
    board[toR][toC] = piece;
    board[fromR][fromC] = null;
    
    // 폰 프로모션 (간소화: 끝에 도달하면 무조건 퀸으로)
    if (piece.charAt(1) === 'P') {
        if ((currentTurn === 'w' && toR === 0) || (currentTurn === 'b' && toR === BOARD_SIZE - 1)) {
            board[toR][toC] = currentTurn + 'Q';
        }
    }

    clearSelection();
    
    if (!gameOver) {
        currentTurn = currentTurn === 'w' ? 'b' : 'w';
        updateStatus();
    }
    
    renderBoard();
}

function getValidMoves(r, c) {
    const piece = board[r][c];
    if (!piece) return [];
    
    const color = piece.charAt(0);
    const type = piece.charAt(1);
    const moves = [];

    function addIfValid(nr, nc) {
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            const target = board[nr][nc];
            if (!target || target.charAt(0) !== color) {
                moves.push({ r: nr, c: nc });
                return target === null; // 빈 칸이면 true 반환 (레이저처럼 뚫고가는 기물용)
            }
        }
        return false;
    }

    function addLine(dr, dc) {
        let nr = r + dr, nc = c + dc;
        while (addIfValid(nr, nc)) {
            nr += dr;
            nc += dc;
        }
    }

    if (type === 'P') { // Pawn
        const dir = color === 'w' ? -1 : 1;
        // 1칸 전진
        if (r + dir >= 0 && r + dir < BOARD_SIZE && !board[r + dir][c]) {
            moves.push({ r: r + dir, c });
        }
        // 대각선 공격
        for (let dc of [-1, 1]) {
            const nr = r + dir, nc = c + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                const target = board[nr][nc];
                if (target && target.charAt(0) !== color) {
                    moves.push({ r: nr, c: nc });
                }
            }
        }
    } else if (type === 'R') { // Rook
        addLine(-1, 0); addLine(1, 0); addLine(0, -1); addLine(0, 1);
    } else if (type === 'B') { // Bishop
        addLine(-1, -1); addLine(-1, 1); addLine(1, -1); addLine(1, 1);
    } else if (type === 'Q') { // Queen
        addLine(-1, 0); addLine(1, 0); addLine(0, -1); addLine(0, 1);
        addLine(-1, -1); addLine(-1, 1); addLine(1, -1); addLine(1, 1);
    } else if (type === 'K') { // King
        const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
        dirs.forEach(([dr, dc]) => addIfValid(r + dr, c + dc));
    } else if (type === 'N') { // Knight
        const dirs = [[-2,-1],[-2,1],[2,-1],[2,1],[-1,-2],[-1,2],[1,-2],[1,2]];
        dirs.forEach(([dr, dc]) => addIfValid(r + dr, c + dc));
    }

    return moves;
}

resetBtn.addEventListener('click', initGame);

// 시작
initGame();
