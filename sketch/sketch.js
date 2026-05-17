let img = [];
let mask1 = [];
let img1, img2;
let font1, font2;
let name = ["0","1","2","3","0","4","5","6"];
let txtTeam = ["*NORMAL","*SNOWFLAKE SCREEN","*BRONZE","*NORMAL","*BE SICK","*GO MOULDY","*METAL","*RAINBOW"];
let novel = [
    "Press & move your mouse",
    "The plants from left to right are",
    "Plectranthus hadiensis var. tomentosus (Benth.) Codd",
    "Arabidopsis thaliana (L.) Heynh.",
    "Cuscuta chinensis Lam.",
    "Impatiens balsamina L.",
    "Colocasia antiquorum Schott.",
];
let txtFinal = [
    "\"作为生物，植物会不断感知生活的环境， \n 具有各种信息收集终端，\n 在我们无法聆听的植物世界， \n 他们有自己的方式感知世界。\n\n 植觉派对利用可视化将生物电信号转化为 \n 可感知的媒介，\n 通过植物的五感尝试与植物对话，\n 放大微观世界植物行为，\n 创造一个奇妙的植物感官世界，\n 在对话中体会植物的情绪，\n 了解植物感官的运作机制，\n 增强人类和植物的情感联系，达到和植物共情。\" \n\n\n /// PARTY SENSE PARTY"
];
let size1 = 170;
let x = 0;

// External mouse state (from parent page overlay via postMessage)
let extMouse = { x: 0, y: 0, pressed: false, active: false };

window.addEventListener('message', function (e) {
    if (!e.data || !e.data.type) return;
    if (e.data.type === 'mousemove') {
        extMouse.x = e.data.x;
        extMouse.y = e.data.y;
        extMouse.active = true;
    } else if (e.data.type === 'mousedown') {
        extMouse.x = e.data.x;
        extMouse.y = e.data.y;
        extMouse.pressed = true;
        extMouse.active = true;
        x++;
    } else if (e.data.type === 'mouseup') {
        extMouse.pressed = false;
    }
});

function preload() {
    for (let i = 0; i < name.length; i++) {
        img[i] = loadImage(name[i] + ".jpg");
    }
    font1 = loadFont('1.otf');
    img1 = loadImage('02.png');
    img2 = loadImage('33-03.png');
    font2 = loadFont('Canobis Regular.otf');
}

function setup() {
    createCanvas(1495, 785);
    background(0);

    let button1 = createButton('CLICK AND SAVE YOUR WORK');
    button1.position(1250, 28);
    button1.size(200);
    button1.mousePressed(() => { save('1.png'); });

    image(img[0], 0, 0);

    mask1[1] = createGraphics(1495, 785);
    mask1[1].fill(255);
    mask1[1].noStroke();
    mask1[1].rect(size1/2, size1/2, size1);

    textFont(font2);
    textSize(20);
    fill(0);
    rectMode(CORNER);
    rect(15, 15, 30, 24);
    rect(318, 15, 190, 24);
    rect(600, 15, 625, 26);
    fill(255);
    textAlign(LEFT, TOP);
    text(1 + '/6', 15, 15);
    text(txtTeam[0], 318, 15);
    text(novel[0], 600, 15);
}

function draw() {
    // Use external mouse if overlay is active, otherwise use p5 native mouse
    let mx = extMouse.active ? extMouse.x : mouseX;
    let my = extMouse.active ? extMouse.y : mouseY;
    let mp = extMouse.active ? extMouse.pressed : mouseIsPressed;

    if (mp) {
        if (x < 8) {
            let fake = [];
            fake[x] = createImage(1495, 785);
            fake[x].copy(img[x], mx - size1/2, my - size1/2, size1, size1, 0, 0, size1, size1);
            fake[x].mask(mask1[1]);
            image(fake[x], mx - size1/2, my - size1/2);
            txt();
        } else {
            x = 0;
        }
    }
}

function mousePressed() {
    // Only use native mousePressed when overlay is NOT active
    if (!extMouse.active) {
        x++;
    }
}

function txt() {
    push();
    fill(0);
    rectMode(CORNER);
    rect(15, 15, 30, 24);
    rect(318, 15, 190, 24);
    rect(600, 15, 606, 26);
    fill(255);
    textAlign(LEFT, TOP);
    text((x+1) + '/8', 15, 15);
    text(txtTeam[x], 318, 15);
    text(novel[x], 600, 15);
    if (x == 4) {
        textFont(font1);
        textSize(14);
        textLeading(19);
        noStroke();
        fill('#f1f1f1');
        rect(0, 70, 325, 340);
        fill(0);
        text(txtFinal[0], 0, 78);
        image(img1, 415, 210, 150, 40);
        image(img2, 415, 250, 900, 150);
    }
    pop();
}
