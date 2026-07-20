(() => {
  "use strict";

  const SELECTORS = {
    particles: "particles",
    terminal: "screen-terminal",
    game: "screen-game",
    memory: "screen-memory",
    final: "screen-final",
    terminalLines: "terminalLines",
    startButton: "startButton",
    gameBoard: "gameBoard",
    scoreValue: "scoreValue",
    gameComplete: "gameComplete",
    poemLines: "poemLines",
    continueButton: "continueButton",
    finalTerminal: "finalTerminal",
    finalTerminalLine: "finalTerminalLine",
    finalMessage: "finalMessage",
    replayButton: "replayButton"
  };

  const TIMING = {
    screenFade: 920,
    terminalChar: 38,
    terminalLinePause: 390,
    poemLineDelay: 980,
    poemButtonDelay: 900,
    finalIntroPause: 1400,
    finalFadePause: 900,
    finalReplayDelay: 900,
    finalChar: 36,
    finalLinePause: 280,
    gameStep: 112,
    completionHold: 1900
  };

  const GAME = {
    size: 18,
    targetScore: 54,
    startLength: 4,
    startX: 8,
    startY: 9,
    initialDirection: { x: 1, y: 0 }
  };

  const TEXT = {
    terminal: [
      "Connection established...",
      "Loading memories...",
      "Searching...",
      "Match found."
    ],
    poem: [
      "Есть вещи,",
      "которые невозможно взять с собой.",
      "",
      "Но воспоминания",
      "всегда путешествуют вместе с человеком."
    ],
    finalIntro: "Loading final message...",
    final: [
      "Ну что.",
      "",
      "Если ты уже дошла сюда,",
      "значит идея с QR все-таки сработала.",
      "",
      "Этот сайт —",
      "маленькое напоминание о том,",
      "что когда-нибудь мы пересечемся еще раз.",
      "",
      "А если нет —",
      "значит будет еще одна хорошая история,",
      "которую можно будет вспоминать.",
      "",
      "Удачи тебе :)"
    ]
  };

  const state = {
    activeScreen: SELECTORS.terminal,
    animationFrame: 0,
    particles: [],
    gameFrame: 0,
    gameRunning: false,
    lastGameTime: 0,
    snake: [],
    direction: { ...GAME.initialDirection },
    nextDirection: { ...GAME.initialDirection },
    food: { x: 0, y: 0 },
    score: 0,
    touchStart: null
  };

  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function cacheElements() {
    Object.keys(SELECTORS).forEach((key) => {
      elements[key] = byId(SELECTORS[key]);
    });
  }

  function delay(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function showElement(element) {
    element.classList.remove("hidden");
  }

  function hideElement(element) {
    element.classList.add("hidden");
  }

  function switchScreen(nextId) {
    byId(state.activeScreen).classList.remove("screen-active");
    byId(nextId).classList.add("screen-active");
    state.activeScreen = nextId;
  }

  async function typeLine(container, text, className) {
    const line = document.createElement("div");
    line.className = className;
    container.appendChild(line);

    for (let index = 0; index < text.length; index += 1) {
      line.textContent += text[index];
      await delay(TIMING.terminalChar);
    }
  }

  async function runTerminal() {
    for (const line of TEXT.terminal) {
      await typeLine(elements.terminalLines, line, "terminal-line");
      await delay(TIMING.terminalLinePause);
    }
    showElement(elements.startButton);
  }

  function createParticles() {
    const amount = Math.max(28, Math.floor(window.innerWidth / 32));
    elements.particles.innerHTML = "";
    state.particles = [];

    for (let index = 0; index < amount; index += 1) {
      const node = document.createElement("span");
      node.className = "particle";
      elements.particles.appendChild(node);
      state.particles.push({
        node,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 1 + Math.random() * 2.4,
        speed: 0.08 + Math.random() * 0.22,
        drift: -0.08 + Math.random() * 0.16,
        opacity: 0.12 + Math.random() * 0.48
      });
    }
  }

  function animateParticles() {
    state.particles.forEach((particle) => {
      particle.y -= particle.speed;
      particle.x += particle.drift;

      if (particle.y < -12) {
        particle.y = window.innerHeight + 12;
        particle.x = Math.random() * window.innerWidth;
      }

      if (particle.x < -12) {
        particle.x = window.innerWidth + 12;
      }

      if (particle.x > window.innerWidth + 12) {
        particle.x = -12;
      }

      particle.node.style.width = `${particle.size}px`;
      particle.node.style.height = `${particle.size}px`;
      particle.node.style.opacity = particle.opacity;
      particle.node.style.transform = `translate3d(${particle.x}px, ${particle.y}px, 0)`;
    });

    state.animationFrame = window.requestAnimationFrame(animateParticles);
  }

  function createBoard() {
    const totalCells = GAME.size * GAME.size;
    elements.gameBoard.style.gridTemplateColumns = `repeat(${GAME.size}, 1fr)`;
    elements.gameBoard.innerHTML = "";

    for (let index = 0; index < totalCells; index += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      elements.gameBoard.appendChild(cell);
    }
  }

  function resetGame() {
    state.score = 0;
    state.direction = { ...GAME.initialDirection };
    state.nextDirection = { ...GAME.initialDirection };
    state.snake = [];

    for (let index = 0; index < GAME.startLength; index += 1) {
      state.snake.push({ x: GAME.startX - index, y: GAME.startY });
    }

    elements.scoreValue.textContent = String(state.score);
    hideElement(elements.gameComplete);
    placeFood();
    renderGame();
  }

  function startGame() {
    resetGame();
    state.gameRunning = true;
    state.lastGameTime = performance.now();
    window.cancelAnimationFrame(state.gameFrame);
    state.gameFrame = window.requestAnimationFrame(gameLoop);
  }

  function stopGame() {
    state.gameRunning = false;
    window.cancelAnimationFrame(state.gameFrame);
  }

  function gameLoop(timestamp) {
    if (!state.gameRunning) {
      return;
    }

    if (timestamp - state.lastGameTime >= TIMING.gameStep) {
      state.lastGameTime = timestamp;
      moveSnake();
      renderGame();
    }

    state.gameFrame = window.requestAnimationFrame(gameLoop);
  }

  function moveSnake() {
    state.direction = state.nextDirection;

    const head = state.snake[0];
    const nextHead = {
      x: wrap(head.x + state.direction.x),
      y: wrap(head.y + state.direction.y)
    };

    const bodyWithoutTail = state.snake.slice(0, -1);
    const hitSelf = bodyWithoutTail.some((part) => sameCell(part, nextHead));

    if (hitSelf) {
      resetGame();
      return;
    }

    state.snake.unshift(nextHead);

    if (sameCell(nextHead, state.food)) {
      state.score += 1;
      elements.scoreValue.textContent = String(state.score);

      if (state.score === GAME.targetScore) {
        completeGame();
        return;
      }

      placeFood();
    } else {
      state.snake.pop();
    }
  }

  function wrap(value) {
    if (value < 0) {
      return GAME.size - 1;
    }
    if (value >= GAME.size) {
      return 0;
    }
    return value;
  }

  function sameCell(first, second) {
    return first.x === second.x && first.y === second.y;
  }

  function placeFood() {
    const emptyCells = [];

    for (let y = 0; y < GAME.size; y += 1) {
      for (let x = 0; x < GAME.size; x += 1) {
        const cell = { x, y };
        const occupied = state.snake.some((part) => sameCell(part, cell));
        if (!occupied) {
          emptyCells.push(cell);
        }
      }
    }

    state.food = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  function renderGame() {
    const cells = elements.gameBoard.children;

    for (let index = 0; index < cells.length; index += 1) {
      cells[index].className = "cell";
    }

    state.snake.forEach((part, index) => {
      const cellIndex = part.y * GAME.size + part.x;
      cells[cellIndex].classList.add(index === 0 ? "cell-head" : "cell-snake");
    });

    const foodIndex = state.food.y * GAME.size + state.food.x;
    cells[foodIndex].classList.add("cell-food");
  }

  async function completeGame() {
    stopGame();
    showElement(elements.gameComplete);
    await delay(TIMING.completionHold);
    switchScreen(SELECTORS.final);
    runFinalMessage();
  }

  function setDirection(next) {
    const isOpposite = next.x + state.direction.x === 0 && next.y + state.direction.y === 0;
    if (!isOpposite) {
      state.nextDirection = next;
    }
  }

  function handleKeydown(event) {
    const keyMap = {
      ArrowUp: { x: 0, y: -1 },
      KeyW: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      KeyS: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      KeyA: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      KeyD: { x: 1, y: 0 }
    };

    const next = keyMap[event.code];
    if (next && state.activeScreen === SELECTORS.game) {
      event.preventDefault();
      setDirection(next);
    }
  }

  function handleTouchStart(event) {
    const touch = event.changedTouches[0];
    state.touchStart = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event) {
    if (!state.touchStart || state.activeScreen !== SELECTORS.game) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - state.touchStart.x;
    const deltaY = touch.clientY - state.touchStart.y;
    const minSwipe = 24;

    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < minSwipe) {
      return;
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setDirection({ x: deltaX > 0 ? 1 : -1, y: 0 });
    } else {
      setDirection({ x: 0, y: deltaY > 0 ? 1 : -1 });
    }

    state.touchStart = null;
  }

  async function runPoem() {
    elements.poemLines.innerHTML = "";
    hideElement(elements.continueButton);

    TEXT.poem.forEach((line, index) => {
      const node = document.createElement("p");
      node.className = "poem-line";
      node.textContent = line || "\u00A0";
      node.style.animationDelay = `${index * TIMING.poemLineDelay}ms`;
      elements.poemLines.appendChild(node);
    });

    await delay(TEXT.poem.length * TIMING.poemLineDelay + TIMING.poemButtonDelay);
    showElement(elements.continueButton);
  }

  async function typeTextInto(element, text, charDelay) {
    element.classList.add("typing-caret");

    for (let index = 0; index < text.length; index += 1) {
      element.textContent += text[index];
      await delay(charDelay);
    }

    element.classList.remove("typing-caret");
  }

  async function runFinalMessage() {
    elements.finalTerminal.classList.remove("final-terminal-hidden");
    elements.finalTerminalLine.textContent = "";
    elements.finalMessage.innerHTML = "";
    hideElement(elements.finalMessage);
    hideElement(elements.replayButton);

    await typeTextInto(elements.finalTerminalLine, TEXT.finalIntro, TIMING.terminalChar);
    await delay(TIMING.finalIntroPause);
    elements.finalTerminal.classList.add("final-terminal-hidden");
    await delay(TIMING.finalFadePause);
    showElement(elements.finalMessage);

    for (const line of TEXT.final) {
      const node = document.createElement("p");
      node.className = line ? "final-message-line" : "final-message-line final-gap";
      elements.finalMessage.appendChild(node);

      if (line) {
        await typeTextInto(node, line, TIMING.finalChar);
      }

      await delay(TIMING.finalLinePause);
    }

    await delay(TIMING.finalReplayDelay);
    showElement(elements.replayButton);
  }

  function restartExperience() {
    stopGame();
    elements.terminalLines.innerHTML = "";
    hideElement(elements.startButton);
    elements.finalTerminalLine.textContent = "";
    elements.finalMessage.innerHTML = "";
    elements.finalTerminal.classList.remove("final-terminal-hidden");
    hideElement(elements.finalMessage);
    hideElement(elements.replayButton);
    switchScreen(SELECTORS.terminal);
    runTerminal();
  }

  function bindEvents() {
    elements.startButton.addEventListener("click", () => {
      switchScreen(SELECTORS.game);
      startGame();
    });

    elements.continueButton.addEventListener("click", () => {
      switchScreen(SELECTORS.final);
      runFinalMessage();
    });

    elements.replayButton.addEventListener("click", restartExperience);

    window.addEventListener("keydown", handleKeydown);
    elements.gameBoard.addEventListener("touchstart", handleTouchStart, { passive: true });
    elements.gameBoard.addEventListener("touchend", handleTouchEnd, { passive: true });

    window.addEventListener("resize", () => {
      createParticles();
    });
  }

  function init() {
    cacheElements();
    createParticles();
    animateParticles();
    createBoard();
    bindEvents();
    runTerminal();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
