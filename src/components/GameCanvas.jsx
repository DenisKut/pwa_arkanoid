import { useEffect, useRef, useState } from 'react';
import ballSvg from "/assets/gameTextures/ball.svg";
import blockSvg5 from "/assets/gameTextures/brick_bomb.svg";
import blockSvg3 from "/assets/gameTextures/brick_cyan.svg";
import blockSvg4 from "/assets/gameTextures/brick_green.svg";
import blockSvg1 from "/assets/gameTextures/brick_orange.svg";
import blockSvg2 from "/assets/gameTextures/brick_purple.svg";
import paddleSvg from "/assets/gameTextures/paddle.svg";
import explosionSound from '/assets/sounds/boom.wav';
import bounceSound from '/assets/sounds/bounce.wav';
import destroySound from '/assets/sounds/destroy.wav';
import backgroundMusic from '/assets/sounds/NEFFEX_Numb.mp3';

const levels = [
  [
    [0, 4, 4, 5, 4, 4, 0],
    [3, 3, 3, 3, 3, 3, 3],
    [2, 2, 2, 2, 2, 2, 2],
    [1, 1, 1, 1, 1, 1, 1],
  ],
];

const GameCanvas = () => {
  const canvasRef = useRef(null);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [musicMuted, setMusicMuted] = useState(false);

  let context;
  const canvasWidth = 360;
  const canvasHeight = 640;
  const wallSize = 10;
  const brickWidth = 45;
  const brickHeight = 20;
  const brickGap = 1;

  let ballOnPaddle = true;
  let bricks = [];
  const paddle = { x: 128, y: 600, width: 104, height: 24, dx: 0, speed: 4 };
  const ball = { x: 180, y: 580, radius: 10, dx: 0, dy: 0, speed: 6 };

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
    bricks = [];
    const cols = levels[0][0].length;
    const totalBrickWidth = cols * (brickWidth + brickGap) - brickGap;
    const startX = (canvasWidth - totalBrickWidth) / 2;

    levels[0].forEach((row, rowIndex) => {
      row.forEach((strength, colIndex) => {
        if (strength > 0) {
          bricks.push({
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
    ballOnPaddle = true;
  };

  const toggleMusic = () => {
    setMusicMuted(!musicMuted);
    sounds.music.muted = !musicMuted;
  };

  const applyExplosion = (brickIndex) => {
    const explosionTargets = [-1, 1, -7, 7, -8, -6, 6, 8];
    explosionTargets.forEach((offset) => {
      const neighbor = bricks[brickIndex + offset];
      if (neighbor && neighbor.strength > 0) {
        neighbor.strength -= 1;
        if (neighbor.strength === 0) setScore((prev) => prev + 10);
      }
    });
  };

  const loop = () => {
    if (lives <= 0) return; // Окончание игры если жизней нет

    context.clearRect(0, 0, canvasWidth, canvasHeight);

    // Движение платформы
    paddle.x += paddle.dx;
    if (paddle.x < wallSize) paddle.x = wallSize;
    if (paddle.x + paddle.width > canvasWidth - wallSize)
      paddle.x = canvasWidth - wallSize - paddle.width;

    // Движение мяча
    if (!ballOnPaddle) {
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Столкновение со стенами
      if (ball.x - ball.radius < wallSize || ball.x + ball.radius > canvasWidth - wallSize) {
        ball.dx *= -1;
      }
      if (ball.y - ball.radius < wallSize) {
        ball.dy *= -1;
      }

      // Потеря жизни
      if (ball.y > canvasHeight) {
        setLives((prev) => prev - 1);
        resetBall(); // Сбросить мяч и скорость платформы, если осталось жизни
        return;
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
      bricks.forEach((brick, index) => {
        if (
          brick.strength > 0 &&
          ball.x > brick.x &&
          ball.x < brick.x + brick.width &&
          ball.y > brick.y &&
          ball.y < brick.y + brick.height
        ) {
          ball.dy *= -1;
          if (brick.strength === 5) {
            sounds.explosion.currentTime = 0;
            sounds.explosion.play();
            applyExplosion(index);
          } else {
            sounds.destroy.currentTime = 0;
            sounds.destroy.play();
          }

          brick.strength -= 1;
          if (brick.strength === 0) setScore((prev) => prev + 10);
        }
      });
    } else {
      ball.x = paddle.x + paddle.width / 2;
      ball.y = paddle.y - ball.radius;
    }

    // Рисуем стены
    context.fillStyle = "grey";
    context.fillRect(0, 0, canvasWidth, wallSize);

    // Рисуем блоки
    bricks.forEach((brick) => {
      if (brick.strength > 0) {
        context.drawImage(
          blockImages[brick.strength],
          brick.x,
          brick.y,
          brick.width,
          brick.height
        );
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

    requestAnimationFrame(loop);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    context = canvas.getContext("2d");
    loadLevel();
    resetBall();
    sounds.music.volume = 0.5;
    sounds.music.loop = true;
    sounds.music.play();

    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") paddle.dx = -paddle.speed;
      if (e.key === "ArrowRight") paddle.dx = paddle.speed;
      if (e.key === " " && ballOnPaddle) {
        ball.dx = 0;
        ball.dy = -ball.speed;
        ballOnPaddle = false;
      }
    });

    document.addEventListener("keyup", () => (paddle.dx = 0));

    loop();
  }, []);

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
