(function() {
  'use strict';

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const playBtn = document.getElementById('play-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resetBtn = document.getElementById('reset-btn');
  const speedSlider = document.getElementById('speed-slider');
  const speedValue = document.getElementById('speed-value');
  const planetBtns = document.querySelectorAll('.planet-btn');
  const planetNameEl = document.getElementById('planet-name');
  const diameterEl = document.getElementById('diameter');
  const massEl = document.getElementById('mass');
  const orbitPeriodEl = document.getElementById('orbit-period');
  const rotationPeriodEl = document.getElementById('rotation-period');
  const temperatureEl = document.getElementById('temperature');
  const moonsEl = document.getElementById('moons');
  const descriptionEl = document.getElementById('description');

  let animationId = null;
  let isPlaying = true;
  let speed = 1;
  let time = 0;

  const planetsData = {
    sun: {
      name: '太陽',
      diameter: '1,392,700 km',
      mass: '1.989 × 10³⁰ kg',
      orbitPeriod: '-',
      rotationPeriod: '約25日',
      temperature: '5,500°C (表面)',
      moons: '0',
      description: '太陽系の中心にある恒星。太陽系の全質量の99.86%を占め、その重力によって惑星や小惑星を引き付けています。',
      color: '#FDB813',
      size: 30,
      distance: 0,
      speed: 0
    },
    mercury: {
      name: '水星',
      diameter: '4,879 km',
      mass: '3.285 × 10²³ kg',
      orbitPeriod: '88日',
      rotationPeriod: '59日',
      temperature: '167°C (平均)',
      moons: '0',
      description: '太陽に最も近い惑星。大気がほとんどなく、昼夜の温度差が激しい。表面はクレーターだらけです。',
      color: '#8C7853',
      size: 4,
      distance: 60,
      speed: 0.04
    },
    venus: {
      name: '金星',
      diameter: '12,104 km',
      mass: '4.867 × 10²⁴ kg',
      orbitPeriod: '225日',
      rotationPeriod: '243日',
      temperature: '464°C',
      moons: '0',
      description: '地球の姉妹惑星。厚い二酸化炭素の大気により温室効果が極端で、太陽系で最も高温の惑星です。',
      color: '#FFC649',
      size: 9,
      distance: 90,
      speed: 0.015
    },
    earth: {
      name: '地球',
      diameter: '12,742 km',
      mass: '5.972 × 10²⁴ kg',
      orbitPeriod: '365日',
      rotationPeriod: '24時間',
      temperature: '15°C (平均)',
      moons: '1',
      description: '私たちの住む惑星。液体の水が存在し、生命を育む唯一知られている天体です。',
      color: '#4A90E2',
      size: 10,
      distance: 120,
      speed: 0.01
    },
    mars: {
      name: '火星',
      diameter: '6,779 km',
      mass: '6.39 × 10²³ kg',
      orbitPeriod: '687日',
      rotationPeriod: '24.6時間',
      temperature: '-63°C (平均)',
      moons: '2',
      description: '赤い惑星。酸化鉄を含む土壌が赤く見えます。過去に液体の水が存在した証拠があり、生命探査の対象です。',
      color: '#E27B58',
      size: 5,
      distance: 150,
      speed: 0.008
    },
    jupiter: {
      name: '木星',
      diameter: '139,820 km',
      mass: '1.898 × 10²⁷ kg',
      orbitPeriod: '12年',
      rotationPeriod: '10時間',
      temperature: '-110°C',
      moons: '95',
      description: '太陽系最大の惑星。大赤斑と呼ばれる巨大な嵐が特徴的。強力な磁場を持ちます。',
      color: '#C88B3A',
      size: 22,
      distance: 200,
      speed: 0.002
    },
    saturn: {
      name: '土星',
      diameter: '116,460 km',
      mass: '5.683 × 10²⁶ kg',
      orbitPeriod: '29年',
      rotationPeriod: '10.7時間',
      temperature: '-140°C',
      moons: '146',
      description: '美しい環を持つ惑星。環は氷や岩石の粒子で構成されています。密度が低く、水に浮くほどです。',
      color: '#FAD5A5',
      size: 18,
      distance: 250,
      speed: 0.0009
    },
    uranus: {
      name: '天王星',
      diameter: '50,724 km',
      mass: '8.681 × 10²⁵ kg',
      orbitPeriod: '84年',
      rotationPeriod: '17時間',
      temperature: '-195°C',
      moons: '27',
      description: '横倒しに自転する惑星。メタンを含む大気により青緑色に見えます。',
      color: '#4FD0E7',
      size: 12,
      distance: 290,
      speed: 0.0004
    },
    neptune: {
      name: '海王星',
      diameter: '49,244 km',
      mass: '1.024 × 10²⁶ kg',
      orbitPeriod: '165年',
      rotationPeriod: '16時間',
      temperature: '-200°C',
      moons: '14',
      description: '太陽系で最も遠い惑星。強風が吹き荒れ、大暗斑と呼ばれる嵐が観測されています。',
      color: '#4166F5',
      size: 12,
      distance: 330,
      speed: 0.0001
    }
  };

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  function drawPlanet(x, y, size, color, name) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawOrbit(distance) {
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, distance, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    drawPlanet(centerX, centerY, planetsData.sun.size, planetsData.sun.color, '太陽');

    Object.entries(planetsData).forEach(([key, planet]) => {
      if (key === 'sun') return;

      drawOrbit(planet.distance);

      const angle = time * planet.speed;
      const x = centerX + Math.cos(angle) * planet.distance;
      const y = centerY + Math.sin(angle) * planet.distance;

      drawPlanet(x, y, planet.size, planet.color, planet.name);
    });
  }

  function animate() {
    if (isPlaying) {
      time += speed * 0.01;
      draw();
    }
    animationId = requestAnimationFrame(animate);
  }

  function updateInfo(planetKey) {
    const planet = planetsData[planetKey];
    planetNameEl.textContent = planet.name;
    diameterEl.textContent = planet.diameter;
    massEl.textContent = planet.mass;
    orbitPeriodEl.textContent = planet.orbitPeriod;
    rotationPeriodEl.textContent = planet.rotationPeriod;
    temperatureEl.textContent = planet.temperature;
    moonsEl.textContent = planet.moons;
    descriptionEl.textContent = planet.description;
  }

  playBtn.addEventListener('click', () => {
    isPlaying = true;
  });

  pauseBtn.addEventListener('click', () => {
    isPlaying = false;
  });

  resetBtn.addEventListener('click', () => {
    time = 0;
    draw();
  });

  speedSlider.addEventListener('input', () => {
    speed = parseFloat(speedSlider.value);
    speedValue.textContent = speed.toFixed(1) + 'x';
  });

  planetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      planetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateInfo(btn.dataset.planet);
    });
  });

  window.addEventListener('resize', resizeCanvas);

  resizeCanvas();
  updateInfo('sun');
  animate();

  function cleanup() {
    cancelAnimationFrame(animationId);
    window.removeEventListener('resize', resizeCanvas);
  }

  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);
})();
