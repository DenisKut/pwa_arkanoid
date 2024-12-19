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
import backgroundMusic from '/assets/sounds/NEFFEX_Numb.mp3'

const levels = [
  [
    [0, 4, 4, 5, 4, 4, 0],
    [3, 3, 3, 3, 3, 3, 3],
    [2, 2, 2, 2, 2, 2, 2],
    [1, 1, 1, 5, 1, 1, 1],
  ],
];

const GameCanvas = () => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const ballOnPaddleRef = useRef(true);
  const bricksRef = useRef([]); // Храним кирпичи в useRef
  const isGameRunningRef = useRef(true); // Для остановки игры при 0 жизнях

  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [musicMuted, setMusicMuted] = useState(false);

  const canvasWidth = 360;
  const canvasHeight = 640;
  const wallSize = 10;
  const brickWidth = 45;
  const brickHeight = 20;
  const brickGap = 1;

  const paddle = useRef({ x: 128, y: 600, width: 104, height: 24, dx: 0, speed: 4 }).current;
  const ball = useRef({ x: 180, y: 580, radius: 10, dx: 0, dy: 0, speed: 6 }).current;

  const sounds = {
    bounce: new Audio(bounceSound),
    destroy: new Audio(destroySound),
    explosion: new Audio(explosionSound),
    music: new Audio(backgroundMusic),
  };

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
    const cols = levels[0][0].length;
    const totalBrickWidth = cols * (brickWidth + brickGap) - brickGap;
    const startX = (canvasWidth - totalBrickWidth) / 2;

    bricksRef.current = [];
    levels[0].forEach((row, rowIndex) => {
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

  const toggleMusic = () => {
    setMusicMuted((prevMuted) => {
      sounds.music.muted = !prevMuted;
      return !prevMuted;
    });
  };

  const loseLife = () => {
    setLives(() => {
      const newLives = lives - 1;
      if (newLives > 0) {
        resetBall(); // Перезапуск мяча только при оставшихся жизнях
      } else {
        isGameRunningRef.current = false; // Остановка игры при 0 жизнях
      }
      return newLives;
    });
  };

  const applyExplosion = (brickIndex) => {
    const explosionTargets = [-1, 1, -7, 7, -8, -6, 6, 8];
    explosionTargets.forEach((offset) => {
      const neighbor = bricksRef.current[brickIndex + offset];
      if (neighbor && neighbor.strength > 0) {
        neighbor.strength -= 1;
        if (neighbor.strength === 0) 
          setScore((prev) => lives === 3 ? prev + 20 : prev + 10);
      }
    });
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
        return; // Выходим из текущего кадра для запуска новой итерации цикла в случае потери жизни
      }
  
      // Столкновение с платформой
      if (
        ball.y + ball.radius > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width
      ) {
        const hitPosition = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        ball.dy = -Math.abs(ball.dy);
        ball.dx = hitPosition * ball.speed;
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
            applyExplosion(index);
            sounds.explosion.play();
          } else {
            sounds.destroy.currentTime = 0;
            sounds.destroy.play();
          }
          brick.strength -= 1;
          if (brick.strength === 0) setScore((prev) => prev + 10);
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
      // Добавить экран завершения игры
      context.fillStyle = "black";
      context.fillRect(0, 0, canvasWidth, canvasHeight);
      context.fillStyle = "white";
      context.font = "24px Arial";
      context.textAlign = "center";
      context.fillText("Игра окончена!", canvasWidth / 2, canvasHeight / 2);
      return;
    }
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    contextRef.current = canvas.getContext("2d");
    
    if(lives === 3)
      loadLevel();

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
  }, [lives]);

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