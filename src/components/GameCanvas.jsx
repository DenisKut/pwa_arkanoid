import { useEffect, useRef, useState } from 'react'
import ballSvg from "/assets/gameTextures/ball.svg"
import blockSvg5 from "/assets/gameTextures/brick_bomb.svg"
import blockSvg3 from "/assets/gameTextures/brick_cyan.svg"
import blockSvg4 from "/assets/gameTextures/brick_green.svg"
import blockSvg1 from "/assets/gameTextures/brick_orange.svg"
import blockSvg2 from "/assets/gameTextures/brick_purple.svg"
import paddleSvg from "/assets/gameTextures/paddle.svg"
import explosionSound from '/assets/sounds/boom.wav'
import bounceSound from '/assets/sounds/bounce.wav'
import destroySound from '/assets/sounds/destroy.wav'

const levels = [
  {
    blocks: [
      [1, 1, 1, 1, 1, 1, 1],
      [2, 3, 4, 5, 4, 3, 2],
      [3, 4, 5, 0, 5, 4, 3],
      [4, 5, 0, 0, 0, 5, 4],
    ],
    music: '/assets/sounds/NEFFEX_Go.mp3',
  },
  {
    blocks: [
      [0, 4, 4, 5, 4, 4, 0],
      [3, 3, 3, 3, 3, 3, 3],
      [2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 5, 1, 1, 1],
    ],
    music: '/assets/sounds/NEFFEX_Numb.mp3',
  },
  {
    blocks: [
      [ 4, 4, 4, 4, 4, 4, 4 ],
      [ 4, 4, 3, 5, 3, 4, 4 ],
      [ 1, 2, 3, 3, 3, 2, 1 ],
      [ 1, 2, 2, 2, 2, 2, 1 ],
      [ 1, 1, 1, 1, 1, 1, 1 ],
    ],
    music: '/assets/sounds/NEFFEX_Pro.mp3',
  },
];

const GameCanvas = () => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const ballOnPaddleRef = useRef(true);
  const bricksRef = useRef([]); // Храним кирпичи в useRef
  const isGameRunningRef = useRef(true); // Для остановки игры при 0 жизнях

  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [musicMuted, setMusicMuted] = useState(false);

  const canvasWidth = 380;
  const canvasHeight = 640;
  const wallSize = 10;
  const brickWidth = 52;
  const brickHeight = 22;
  const brickGap = 2;

  const paddle = useRef({ x: 128, y: 600, width: 104, height: 20, dx: 0, speed: 2 }).current;
  const ball = useRef({ x: 180, y: 580, radius: 13, dx: 0, dy: 0, speed: 2 }).current;

  const sounds = useRef({
    bounce: new Audio(bounceSound),
    destroy: new Audio(destroySound),
    explosion: new Audio(explosionSound),
    music: new Audio(levels[0].music),
  }).current;

  const blockImages = [null, new Image(), new Image(), new Image(), new Image(), new Image()];
  blockImages[1].src = blockSvg1;
  blockImages[2].src = blockSvg2;
  blockImages[3].src = blockSvg3;
  blockImages[4].src = blockSvg4;
  blockImages[5].src = blockSvg5;

  const paddleImage = new Image();
  paddleImage.src = paddleSvg;

  const ballImage = new Image();
  ballImage.src = ballSvg;

  const loadLevel = () => {
    const level = levels[currentLevel];
    const cols = level.blocks[0].length;
    const totalBrickWidth = cols * (brickWidth + brickGap) - brickGap;
    const startX = (canvasWidth - totalBrickWidth) / 2;
  
    bricksRef.current = [];
    level.blocks.forEach((row, rowIndex) => {
      row.forEach((strength, colIndex) => {
        if (strength > 0) {
          bricksRef.current.push({
            x: startX + (brickWidth + brickGap) * colIndex,
            y: wallSize + (brickHeight + brickGap) * rowIndex,
            width: brickWidth,
            height: brickHeight,
            strength,
          });
        }
      });
    });
  };

  const resetBall = () => {
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius;
    ball.dx = 0;
    ball.dy = 0;
    ballOnPaddleRef.current = true;
  };

  const checkLevelCompletion = () => {
    if (bricksRef.current.every((brick) => brick.strength <= 0)) {
      setLives(3);
      sounds.music.pause();
      setCurrentLevel((prevLevel) => {
        const nextLevel = prevLevel + 1;
        if (nextLevel < levels.length) {
          sounds.music.pause(); // Останавливаем текущую музыку
          sounds.music = new Audio(levels[nextLevel].music);
          sounds.music.loop = true;
          if (!musicMuted) sounds.music.play();
          loadLevel(); // Загружаем следующий уровень
        } else {
          isGameRunningRef.current = false; // Игра завершена
        }
        return nextLevel;
      });
    }
  };

  const loseLife = () => {
    setLives((prevLives) => {
      const newLives = prevLives - 1;
      if (newLives > 0) {
        resetBall(); // Перезапуск мяча только при оставшихся жизнях
      } else {
        isGameRunningRef.current = false; // Остановка игры при 0 жизнях
      }
      return newLives;
    });
  };

  const toggleMusic = () => {
    setMusicMuted((prevMuted) => {
      sounds.music.muted = !prevMuted;
      return !prevMuted;
    });
  };

  const applyExplosion = (brickIndex) => {
    const explosionTargets = [-1, 1, -7, 7, -8, -6, 6, 8];
    const newBricks = [...bricksRef.current];

    const explode = (index) => {
      const brick = newBricks[index];
      if (brick && brick.strength > 0) {
        brick.strength = 0; // Уничтожаем взрывной блок
        setScore((prev) => prev + 10);
        explosionTargets.forEach(offset => {
          const neighborIndex = index + offset;
          const neighborBrick = newBricks[neighborIndex];
          if (neighborBrick && neighborBrick.strength > 0) {
            neighborBrick.strength -= 1;
            if (neighborBrick.strength === 0) {
              setScore((prev) => prev + 10);
            }
          }
        });
      }
    };

    explode(brickIndex);
    bricksRef.current = newBricks;
    sounds.explosion.play();
  };

  const loop = () => {
    const context = contextRef.current;
  
    // Очищаем экран
    context.clearRect(0, 0, canvasWidth, canvasHeight);
  
    // Обновление платформы
    paddle.x += paddle.dx;
    if (paddle.x < wallSize) paddle.x = wallSize;
    if (paddle.x + paddle.width > canvasWidth - wallSize)
      paddle.x = canvasWidth - wallSize - paddle.width;
  
    // Логика мяча
    if (!ballOnPaddleRef.current) {
      ball.x += ball.dx;
      ball.y += ball.dy;
  
      // Столкновение со стенами
      if (ball.x - ball.radius < wallSize || ball.x + ball.radius > canvasWidth - wallSize) {
        ball.dx *= -1;
      }
      if (ball.y - ball.radius < wallSize) {
        ball.dy *= -1;
      }
      if (ball.y > canvasHeight) {
        loseLife(); // Потеря жизни
        resetBall(); // сбрасываем мяч на платформу
        return; // Выходим из текущего кадра для запуска новой итерации цикла в случае потери жизни
      }
  
      // Столкновение с платформой
      if (
        ball.y + ball.radius > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width
      ) {
        const hitPosition = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        const angle = hitPosition * Math.PI / 3; // Максимальный угол отражения 60 градусов
        ball.dy = -ball.speed * Math.cos(angle);
        ball.dx = ball.speed * Math.sin(angle);
        sounds.bounce.currentTime = 0;
        sounds.bounce.play();
      }
  
      // Столкновение с блоками
      bricksRef.current.forEach((brick, index) => {
        if (
          brick.strength > 0 &&
          ball.x > brick.x &&
          ball.x < brick.x + brick.width &&
          ball.y > brick.y &&
          ball.y < brick.y + brick.height
        ) {
          ball.dy *= -1;
          if (brick.strength === 5) {
            applyExplosion(index); // Передаем индекс текущего кирпича
          } else {
            sounds.destroy.currentTime = 0;
            sounds.destroy.play();
          }
          brick.strength -= 1; // Уменьшаем прочность текущего блока
          if (brick.strength === 0) setScore((prev) => prev + 10);
          checkLevelCompletion();
        }
      });
    } else {
      // Мяч привязан к платформе
      ball.x = paddle.x + paddle.width / 2;
      ball.y = paddle.y - ball.radius;
    }
  
    // Рисуем стены
    context.fillStyle = "grey";
    context.fillRect(0, 0, canvasWidth, wallSize);
  
    // Рисуем блоки
    bricksRef.current.forEach((brick) => {
      if (brick.strength > 0) {
        context.drawImage(blockImages[brick.strength], brick.x, brick.y, brick.width, brick.height);
      }
    });
  
    // Рисуем платформу и мяч
    context.drawImage(paddleImage, paddle.x, paddle.y, paddle.width, paddle.height);
    context.drawImage(
      ballImage,
      ball.x - ball.radius,
      ball.y - ball.radius,
      ball.radius * 2,
      ball.radius * 2
    );
  
    // Завершаем игру при жизнях 0
    if (isGameRunningRef.current) {
      requestAnimationFrame(loop); // Продолжаем цикл
    } else {
      context.fillStyle = "black";
      context.fillRect(0, 0, canvasWidth, canvasHeight);
      context.fillStyle = "white";
      context.font = "24px Arial";
      context.textAlign = "center";
      context.fillText("Игре конец!", canvasWidth / 2, canvasHeight / 2);
      
      return;
    }
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    contextRef.current = canvas.getContext("2d");
  
    sounds.music.loop = true;
    if (!musicMuted) sounds.music.play();
  
    if (lives === 3) loadLevel();
    resetBall();
  
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") paddle.dx = -paddle.speed;
      if (e.key === "ArrowRight") paddle.dx = paddle.speed;
      if (e.key === " " && ballOnPaddleRef.current) {
        ball.dy = -ball.speed;
        ballOnPaddleRef.current = false;
      }
    };
  
    const handleKeyUp = () => {
      paddle.dx = 0;
    };
  
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
  
    loop();
  
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [currentLevel, lives]);

  return (
    <div>
      <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} />
      <div>Жизни: {lives}</div>
      <div>Счет: {score}</div>
      <button onClick={toggleMusic}>{musicMuted ? "Включить музыку" : "Заглушить музыку"}</button>
    </div>
  );
};

export default GameCanvas;
