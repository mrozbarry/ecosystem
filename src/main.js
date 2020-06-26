const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const cloudiness = document.getElementById('cloudiness');

const makeWave = (context) => ({
    x: context.canvas.width,
    speed: 0.04,
});

const animateWaves = (context, delta, waves) => waves
    .map((wave) => ({
        ...wave,
        x: wave.x - (wave.speed * delta),
    })).filter((wave) =>{
        return wave.x > context.canvas.width/2
    });


const makePlant = (context, parent = null) => ({
    x: parent
        ? parent.x + ((Math.random() * 100) - 50)
        : Math.random() * (context.canvas.width / 2),
    life: 0,
    sun: 1,
    water: 1,
    speed: 0.05,
    seeds: Math.floor(Math.max(2, Math.random() * 4)),
    hue: parent ? parent.hue + ((Math.random() * 30) - 15) : Math.random() * 360,
});

const animatePlants = (context, delta, isSunny, plants) => plants
  .map((plant) => {
    const sun = plant.sun + ((isSunny > 0.5 ? ((isSunny - 0.05) * 0.0000001) : 0) * delta);
    const water = plant.water;

    const growRate = sun > 0 && water > 0 ? 0.1 : 0;

    return {
      ...plant,
      sun: Math.max(0, Math.min(1, sun - 0.1)),
      water: Math.max(0, Math.min(1, water)),
      life: Math.min(150, plant.life + (plant.speed * growRate * delta)),
    }
  })
    .reduce((nextPlants, plant) => {
        const maxLife = plant.life >= 100;
        const nextPlant = { ...plant };
        let childPlants = [];
        if (maxLife && Math.random() < 0.05 && nextPlant.seeds > 0) {
            nextPlant.seeds -= 1;
            childPlants.push(makePlant(context, nextPlant));
        }
        return maxLife && nextPlant.seeds === 0
            ? [...nextPlants, ...childPlants]
            : [...nextPlants, nextPlant, ...childPlants];
    }, [])

const drawBackground = (context, rain, isSunny) => {
    context.fillStyle = isSunny ? '#87ceeb' : '#566671';
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    context.fillStyle = `hsla(100, 5%, 5%, ${1 - Math.max(0.4, isSunny)}`;
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    context.fillStyle = '#f9d71c';
    context.fillRect(50, 50, 50, 50);
    context.strokeStyle = '#f9d71c';
    context.strokeRect(45, 45, 60, 60);

    const x = (isSunny - 0.5) / 0.5 * (1280 - 600);
    context.fillStyle = `hsla(0, 100%, 100%, 0.8)`;
    context.fillRect(x, 70, 600, 100);
    context.fillStyle = 'black';
    context.fillText(`Rain: ${rain.length}`, x + 200, 90);
}

const drawDirt = (context, plants) => {
    context.fillStyle = '#70483c';
    context.fillRect(0, context.canvas.height - 20, context.canvas.width / 2, 20);
    context.fillStyle = 'green';
    context.fillRect(0, context.canvas.height - 25, context.canvas.width / 2, 5);

    plants.forEach((plant) => {
        context.save();
        context.fillStyle = '#84e424';
        context.fillRect(plant.x - 2, context.canvas.height - 15, 5, 5);

        const life = Math.min(plant.life, 50);
        const petals = plant.life < 50
          ? plant.life / 50 * 2
          : 2 + (Math.max(50, plant.life) - 50) / 50 * 15;

        //context.fillStyle = 'black';
        //context.fillText(`Life: ${plant.life.toFixed(1)} | Petals: ${petals.toFixed(1)}`, plant.x, context.canvas.height - 60)

        // Stalk
        context.strokeStyle = 'black';
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(plant.x, context.canvas.height - 15);
        context.lineTo(plant.x, context.canvas.height - 15 - life);
        context.stroke();
        context.strokeStyle = '#84e424';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(plant.x, context.canvas.height - 15);
        context.lineTo(plant.x, context.canvas.height - 15 - life);
        context.stroke();

        // Flower
        
        context.fillStyle = `hsla(${plant.hue}, 50%, 50%, 0.7)`;
        context.beginPath();
        context.arc(plant.x, context.canvas.height - 15 - life, petals, 0, 2 * Math.PI);
        context.fill();


        context.restore();
    });
}

const drawWater = (context, waves) => {
    context.fillStyle = '#0077be';
    context.fillRect(context.canvas.width/2, context.canvas.height - 20, context.canvas.width / 2, 20);

    waves.forEach((wave) => {
        context.save();

        const height = 5 + (Math.random() * 1);
        context.fillStyle = '#0077be';
        context.beginPath()
        context.moveTo(wave.x, context.canvas.height - 19);
        context.lineTo(wave.x + 10, context.canvas.height - 19 - height);
        context.lineTo(wave.x + 30, context.canvas.height - 19);
        context.closePath();
        context.fill();

        context.strokeStyle = 'white';
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(wave.x, context.canvas.height - 20);
        context.lineTo(wave.x + 10, context.canvas.height - 20 - height);
        //context.lineTo(wave.x - 5, context.canvas.height - 19);
        context.stroke();

        context.restore();
    })
}

const draw = (state) => {
    const now = performance.now();
    const delta = now - state.lastTimeWeRendered;
    state.lastTimeWeRendered = now;
    state.time += delta;
    state.nextWaveIn -= delta;
    state.isSunny = cloudiness.value;
    if (state.nextWaveIn <= 0) {
        state.nextWaveIn = 300 + (Math.random() * 2000);
        state.waves.push(makeWave(context))
    }
    state.waves = animateWaves(context, delta, state.waves);
    state.plants = animatePlants(context, delta, state.isSunny, state.plants);
    // Canvas code

    // Save the state of the canvas (initial/clean state)
    context.save();

    // Clean any previous drawings
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    drawBackground(context, state.rain, state.isSunny);
    drawWater(context, state.waves);
    drawDirt(context, state.plants);

    // Restore the state of the canvas (back to initial/clean state)
    context.restore();

    // Schedule next frame, v-synced
    requestAnimationFrame(() => draw(state));
};


draw({
    lastTimeWeRendered: performance.now(),
    time: 0,
    waves: [],
    nextWaveIn: 0,
    plants: [
        makePlant(context),
        makePlant(context),
    ],
    isSunny: cloudiness.value,
    rain: [],
});
