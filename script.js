(() => {
  "use strict";

  const SELECTORS = {
    particles: "particles",
    terminal: "screen-terminal",
    menu: "screen-menu",
    game: "screen-game",
    flappy: "screen-flappy",
    memory: "screen-memory",
    final: "screen-final",
    terminalLines: "terminalLines",
    startButton: "startButton",
    snakeFreeButton: "snakeFreeButton",
    flappyButton: "flappyButton",
    messageButton: "messageButton",
    snakeTitle: "snakeTitle",
    gameBoard: "gameBoard",
    scoreValue: "scoreValue",
    gameComplete: "gameComplete",
    snakeMenuButton: "snakeMenuButton",
    flappyStage: "flappyStage",
    flappyRose: "flappyRose",
    flappyScoreValue: "flappyScoreValue",
    flappyOverlay: "flappyOverlay",
    flappyOverlayText: "flappyOverlayText",
    flappyMenuButton: "flappyMenuButton",
    poemLines: "poemLines",
    continueButton: "continueButton",
    finalTerminal: "finalTerminal",
    finalTerminalLine: "finalTerminalLine",
    finalMessage: "finalMessage",
    finalActions: "finalActions",
    finalMenuButton: "finalMenuButton",
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

  const FLAPPY = {
    roseSize: 34,
    startX: 80,
    gravity: 0.00145,
    lift: -0.46,
    pipeWidth: 58,
    pipeGap: 148,
    pipeSpacing: 215,
    pipeSpeed: 0.17,
    spawnOffset: 120
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
    terminalRunId: 0,
    finalRunId: 0,
    gameFrame: 0,
    gameRunning: false,
    lastGameTime: 0,
    snakeMode: "challenge",
    snake: [],
    direction: { ...GAME.initialDirection },
    nextDirection: { ...GAME.initialDirection },
    food: { x: 0, y: 0 },
    score: 0,
    touchStart: null,
    flappyFrame: 0,
    flappyRunning: false,
    flappyLastTime: 0,
    flappyY: 0,
    flappyVelocity: 0,
    flappyScore: 0,
    flappyPipes: [],
    flappyStarted: false
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
    const runId = state.terminalRunId + 1;
    state.terminalRunId = runId;
    elements.terminalLines.innerHTML = "";
    hideElement(elements.startButton);

    for (const line of TEXT.terminal) {
      if (runId !== state.terminalRunId) {
        return;
      }
      await typeLine(elements.terminalLines, line, "terminal-line");
      await delay(TIMING.terminalLinePause);
    }

    if (runId !== state.terminalRunId) {
      return;
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

  function resetGame(mode) {
    state.snakeMode = mode || state.snakeMode;
    state.score = 0;
    state.direction = { ...GAME.initialDirection };
    state.nextDirection = { ...GAME.initialDirection };
    state.snake = [];

    for (let index = 0; index < GAME.startLength; index += 1) {
      state.snake.push({ x: GAME.startX - index, y: GAME.startY });
    }

    elements.scoreValue.textContent = String(state.score);
    elements.snakeTitle.textContent = state.snakeMode === "challenge" ? "Набери 54" : "Бесконечная змейка";
    hideElement(elements.gameComplete);
    placeFood();
    renderGame();
  }

  function startGame(mode) {
    stopFlappy();
    resetGame(mode);
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

      if (state.snakeMode === "challenge" && state.score === GAME.targetScore) {
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

  function returnToMenu() {
    stopGame();
    stopFlappy();
    state.terminalRunId += 1;
    state.finalRunId += 1;
    hideElement(elements.gameComplete);
    hideElement(elements.flappyOverlay);
    switchScreen(SELECTORS.menu);
  }

  function setDirection(next) {
    const isOpposite = next.x + state.direction.x === 0 && next.y + state.direction.y === 0;
    if (!isOpposite) {
      state.nextDirection = next;
    }
  }

  function handleKeydown(event) {
    if (state.activeScreen === SELECTORS.flappy && (event.code === "Space" || event.code === "ArrowUp")) {
      event.preventDefault();
      flap();
      return;
    }

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
    const runId = state.finalRunId + 1;
    state.finalRunId = runId;
    elements.finalTerminal.classList.remove("final-terminal-hidden");
    elements.finalTerminalLine.textContent = "";
    elements.finalMessage.innerHTML = "";
    hideElement(elements.finalMessage);
    hideElement(elements.finalActions);

    await typeTextInto(elements.finalTerminalLine, TEXT.finalIntro, TIMING.terminalChar);
    if (runId !== state.finalRunId) {
      return;
    }
    await delay(TIMING.finalIntroPause);
    elements.finalTerminal.classList.add("final-terminal-hidden");
    await delay(TIMING.finalFadePause);
    if (runId !== state.finalRunId) {
      return;
    }
    showElement(elements.finalMessage);

    for (const line of TEXT.final) {
      if (runId !== state.finalRunId) {
        return;
      }
      const node = document.createElement("p");
      node.className = line ? "final-message-line" : "final-message-line final-gap";
      elements.finalMessage.appendChild(node);

      if (line) {
        await typeTextInto(node, line, TIMING.finalChar);
      }

      await delay(TIMING.finalLinePause);
    }

    await delay(TIMING.finalReplayDelay);
    if (runId === state.finalRunId) {
      showElement(elements.finalActions);
    }
  }

  function restartExperience() {
    state.finalRunId += 1;
    elements.finalTerminalLine.textContent = "";
    elements.finalMessage.innerHTML = "";
    elements.finalTerminal.classList.remove("final-terminal-hidden");
    hideElement(elements.finalMessage);
    hideElement(elements.finalActions);
    switchScreen(SELECTORS.game);
    startGame("free");
  }

  function createPipe(x) {
    const stageHeight = elements.flappyStage.clientHeight;
    const minTop = 54;
    const maxTop = Math.max(minTop, stageHeight - FLAPPY.pipeGap - 90);
    const gapTop = minTop + Math.random() * (maxTop - minTop);
    const top = document.createElement("div");
    const bottom = document.createElement("div");

    top.className = "pipe pipe-top";
    bottom.className = "pipe pipe-bottom";
    elements.flappyStage.append(top, bottom);

    return {
      x,
      gapTop,
      passed: false,
      top,
      bottom
    };
  }

  function resetFlappy() {
    state.flappyPipes.forEach((pipe) => {
      pipe.top.remove();
      pipe.bottom.remove();
    });
    state.flappyPipes = [];
    state.flappyScore = 0;
    state.flappyStarted = false;
    state.flappyY = elements.flappyStage.clientHeight * 0.42;
    state.flappyVelocity = 0;
    elements.flappyScoreValue.textContent = "0";
    elements.flappyOverlayText.textContent = "Нажми, чтобы взлететь";
    showElement(elements.flappyOverlay);
    positionFlappyRose();
  }

  function startFlappy() {
    stopGame();
    resetFlappy();
    state.flappyRunning = true;
    state.flappyLastTime = performance.now();
    window.cancelAnimationFrame(state.flappyFrame);
    state.flappyFrame = window.requestAnimationFrame(flappyLoop);
  }

  function stopFlappy() {
    state.flappyRunning = false;
    window.cancelAnimationFrame(state.flappyFrame);
  }

  function flap() {
    if (state.activeScreen !== SELECTORS.flappy) {
      return;
    }

    if (!state.flappyRunning) {
      startFlappy();
    }

    state.flappyStarted = true;
    hideElement(elements.flappyOverlay);
    state.flappyVelocity = FLAPPY.lift;
  }

  function flappyLoop(timestamp) {
    if (!state.flappyRunning) {
      return;
    }

    const delta = Math.min(34, timestamp - state.flappyLastTime);
    state.flappyLastTime = timestamp;

    if (state.flappyStarted) {
      updateFlappy(delta);
    }

    renderFlappy();
    state.flappyFrame = window.requestAnimationFrame(flappyLoop);
  }

  function updateFlappy(delta) {
    const stageWidth = elements.flappyStage.clientWidth;
    const stageHeight = elements.flappyStage.clientHeight;

    state.flappyVelocity += FLAPPY.gravity * delta;
    state.flappyY += state.flappyVelocity * delta;

    if (!state.flappyPipes.length) {
      state.flappyPipes.push(createPipe(stageWidth + FLAPPY.spawnOffset));
      state.flappyPipes.push(createPipe(stageWidth + FLAPPY.spawnOffset + FLAPPY.pipeSpacing));
    }

    state.flappyPipes.forEach((pipe) => {
      pipe.x -= FLAPPY.pipeSpeed * delta;

      if (!pipe.passed && pipe.x + FLAPPY.pipeWidth < FLAPPY.startX) {
        pipe.passed = true;
        state.flappyScore += 1;
        elements.flappyScoreValue.textContent = String(state.flappyScore);
      }
    });

    const firstPipe = state.flappyPipes[0];
    if (firstPipe && firstPipe.x < -FLAPPY.pipeWidth) {
      firstPipe.top.remove();
      firstPipe.bottom.remove();
      state.flappyPipes.shift();
      const lastX = state.flappyPipes[state.flappyPipes.length - 1].x;
      state.flappyPipes.push(createPipe(lastX + FLAPPY.pipeSpacing));
    }

    if (state.flappyY < 0 || state.flappyY + FLAPPY.roseSize > stageHeight || flappyHitsPipe()) {
      endFlappyRound();
    }
  }

  function flappyHitsPipe() {
    const roseLeft = FLAPPY.startX;
    const roseRight = FLAPPY.startX + FLAPPY.roseSize;
    const roseTop = state.flappyY;
    const roseBottom = state.flappyY + FLAPPY.roseSize;

    return state.flappyPipes.some((pipe) => {
      const pipeLeft = pipe.x;
      const pipeRight = pipe.x + FLAPPY.pipeWidth;
      const overlapsX = roseRight > pipeLeft && roseLeft < pipeRight;
      const outsideGap = roseTop < pipe.gapTop || roseBottom > pipe.gapTop + FLAPPY.pipeGap;
      return overlapsX && outsideGap;
    });
  }

  function endFlappyRound() {
    state.flappyStarted = false;
    state.flappyRunning = false;
    elements.flappyOverlayText.textContent = "Еще раз?";
    showElement(elements.flappyOverlay);
    window.cancelAnimationFrame(state.flappyFrame);
  }

  function positionFlappyRose() {
    elements.flappyRose.style.transform = `translate3d(${FLAPPY.startX}px, ${state.flappyY}px, 0)`;
  }

  function renderFlappy() {
    const stageHeight = elements.flappyStage.clientHeight;
    positionFlappyRose();

    state.flappyPipes.forEach((pipe) => {
      pipe.top.style.height = `${pipe.gapTop}px`;
      pipe.top.style.transform = `translate3d(${pipe.x}px, 0, 0)`;
      pipe.bottom.style.height = `${stageHeight - pipe.gapTop - FLAPPY.pipeGap}px`;
      pipe.bottom.style.transform = `translate3d(${pipe.x}px, 0, 0)`;
    });
  }

  function bindEvents() {
    elements.startButton.addEventListener("click", () => {
      switchScreen(SELECTORS.menu);
    });

    elements.snakeFreeButton.addEventListener("click", () => {
      switchScreen(SELECTORS.game);
      startGame("free");
    });

    elements.messageButton.addEventListener("click", () => {
      switchScreen(SELECTORS.game);
      startGame("challenge");
    });

    elements.flappyButton.addEventListener("click", () => {
      switchScreen(SELECTORS.flappy);
      startFlappy();
    });

    elements.snakeMenuButton.addEventListener("click", returnToMenu);
    elements.flappyMenuButton.addEventListener("click", returnToMenu);

    elements.flappyStage.addEventListener("pointerdown", flap);
    elements.flappyOverlay.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      startFlappy();
      flap();
    });

    elements.continueButton.addEventListener("click", () => {
      switchScreen(SELECTORS.final);
      runFinalMessage();
    });

    elements.replayButton.addEventListener("click", restartExperience);
    elements.finalMenuButton.addEventListener("click", returnToMenu);

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
