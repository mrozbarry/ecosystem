const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');


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


const makePlant = (context) => ({
    x: Math.random() * (context.canvas.width / 2),
    life: 0,
    sun: 0,
    water: 1,
    speed: Math.random() / 100,
    seeds: Math.floor(Math.max(1, Math.random() * 3))
});

const animatePlants = (context, delta, isSunny, plants) => plants
    .map((plant) => ({
        ...plant,
        sun: (isSunny ? 1 : -1) * (0.01 * delta),
        life: plant.life + (plant.speed * (plant.sun / 100 + plant.water / 100) * delta),
    }))
    .reduce((nextPlants, plant) => {
        const maxLife = plant.life >= 100;
        const nextPlant = { ...plant };
        let childPlants = [];
        if (maxLife && Math.random() < 0.05 && nextPlant.seeds > 0) {
            nextPlant.seeds -= 1;
            childPlants.push(makePlant(context));
        }
        return maxLife && nextPlant.seeds === 0
            ? [...nextPlants, ...childPlants]
            : [...nextPlants, nextPlant, ...childPlants];
    }, [])

const drawBackground = (context, isSunny) => {
    context.fillStyle = isSunny ? '#87ceeb' : '#566671';
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    context.fillStyle = '#f9d71c';
    context.fillRect(50, 50, 50, 50);
    context.strokeStyle = '#f9d71c';
    context.strokeRect(45, 45, 60, 60);
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

        context.strokeStyle = '#84e424';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(plant.x, context.canvas.height - 15);
        context.lineTo(plant.x, context.canvas.height - 15 - life);
        context.stroke();

        context.fillStyle = 'black';
        context.fillText(`Life: ${plant.life.toFixed(1)}`, plant.x, context.canvas.height - 60)

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

    drawBackground(context, state.isSunny);
    drawWater(context, state.waves);
    drawDirt(context, state.plants);


    // Your drawing code here...
    // Check out https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D

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
        makePlant(context),
        makePlant(context),
        makePlant(context),
    ],
    isSunny: true,
    rain: 0,
});
