// === Neural-network-like animated background on canvas ===
(function () {
    const canvas = document.getElementById("nn-bg");
    const ctx = canvas.getContext("2d");

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const NODE_COUNT = Math.min(90, Math.floor((width * height) / 14000));
    const LINK_DISTANCE = 150;
    const nodes = [];

    function createNode() {
    const speedScale = 0.3;
    return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * speedScale,
        vy: (Math.random() - 0.5) * speedScale,
        r: 1.4 + Math.random() * 1.6
    };
    }

    function initNodes() {
    nodes.length = 0;
    for (let i = 0; i < NODE_COUNT; i++) {
        nodes.push(createNode());
    }
    }

    function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    }

    window.addEventListener("resize", () => {
    resize();
    initNodes();
    });

    initNodes();

    function step() {
    ctx.clearRect(0, 0, width, height);

    // subtle gradient background overlay
    const grad = ctx.createRadialGradient(
        width * 0.1,
        height * 0.0,
        0,
        width * 0.1,
        height * 0.0,
        width * 0.9
    );
    grad.addColorStop(0, "rgba(35, 25, 80, 0.75)");
    grad.addColorStop(1, "rgba(2, 3, 10, 1)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // update positions
    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        // soft wrap
        if (n.x < -50) n.x = width + 50;
        if (n.x > width + 50) n.x = -50;
        if (n.y < -50) n.y = height + 50;
        if (n.y > height + 50) n.y = -50;
    }

    // draw links
    ctx.lineWidth = 0.6;
    for (let i = 0; i < nodes.length; i++) {
        const ni = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
        const nj = nodes[j];
        const dx = ni.x - nj.x;
        const dy = ni.y - nj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DISTANCE) {
            const alpha = (1 - dist / LINK_DISTANCE) * 0.6;
            ctx.strokeStyle = "rgba(123, 92, 255," + alpha * 0.7 + ")";
            ctx.beginPath();
            ctx.moveTo(ni.x, ni.y);
            ctx.lineTo(nj.x, nj.y);
            ctx.stroke();
        }
        }
    }

    // draw nodes
    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const gradNode = ctx.createRadialGradient(
        n.x,
        n.y,
        0,
        n.x,
        n.y,
        n.r * 3
        );
        gradNode.addColorStop(0, "rgba(54, 226, 179, 0.85)");
        gradNode.addColorStop(1, "rgba(54, 226, 179, 0)");
        ctx.fillStyle = gradNode;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(2,10,18,0.9)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
    }

    requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
})();

// tilted cards (smoothed with a tiny spring-like lerp)
const researchCards = document.querySelectorAll(".item, .cert");

const tiltConfig = {
    maxRotation: 12, // degrees
    hoverScale: 1.03,
    easing: 0.14 // closer to 0 = slower smoothing, closer to 1 = snappier
};

researchCards.forEach((card) => {
    let targetRx = 0;
    let targetRy = 0;
    let targetScale = 1;

    let currentRx = 0;
    let currentRy = 0;
    let currentScale = 1;

    let rafId = null;

    card.style.willChange = "transform";

    function animate() {
        const { easing } = tiltConfig;

        currentRx += (targetRx - currentRx) * easing;
        currentRy += (targetRy - currentRy) * easing;
        currentScale += (targetScale - currentScale) * easing;

        card.style.transform = `perspective(1000px) rotateX(${currentRx}deg) rotateY(${currentRy}deg) scale3d(${currentScale}, ${currentScale}, ${currentScale})`;

        const isSettled =
            Math.abs(targetRx - currentRx) < 0.01 &&
            Math.abs(targetRy - currentRy) < 0.01 &&
            Math.abs(targetScale - currentScale) < 0.001;

        if (!isSettled) {
            rafId = requestAnimationFrame(animate);
        } else {
            rafId = null;
        }
    }

    function setTargets(rx, ry, scale) {
        targetRx = rx;
        targetRy = ry;
        targetScale = scale;
        if (!rafId) {
            rafId = requestAnimationFrame(animate);
        }
    }

    card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Normalised offsets between -1 and 1
        const normX = (x - centerX) / centerX;
        const normY = (y - centerY) / centerY;

        const rotateX = normY * tiltConfig.maxRotation * -1;
        const rotateY = normX * tiltConfig.maxRotation;

        setTargets(rotateX, rotateY, tiltConfig.hoverScale);
    });

    card.addEventListener("mouseleave", () => {
        setTargets(0, 0, 1);
    });
});

// === Glass surface (vanilla port of React component) ===
(function () {
    const defaults = {
        borderRadius: 20,
        borderWidth: 0.07,
        brightness: 50,
        opacity: 0.93,
        blur: 11,
        displace: 0,
        backgroundOpacity: 0,
        saturation: 1,
        distortionScale: -180,
        redOffset: 0,
        greenOffset: 10,
        blueOffset: 20,
        xChannel: "R",
        yChannel: "G",
        mixBlendMode: "difference"
    };

    function supportsSVGFilters(id) {
        const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        const isFirefox = /Firefox/.test(navigator.userAgent);
        if (isWebkit || isFirefox) return false;

        const div = document.createElement("div");
        div.style.backdropFilter = `url(#${id})`;
        return div.style.backdropFilter !== "";
    }

    function createGlassSurface(element, options = {}) {
        const config = { ...defaults, ...options };
        const uniqueId = `glass-${Math.random().toString(36).slice(2)}`;
        const filterId = `glass-filter-${uniqueId}`;
        const redGradId = `red-grad-${uniqueId}`;
        const blueGradId = `blue-grad-${uniqueId}`;

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("class", "glass-surface__filter");
        svg.setAttribute("xmlns", svgNS);

        const defs = document.createElementNS(svgNS, "defs");
        const filter = document.createElementNS(svgNS, "filter");
        filter.setAttribute("id", filterId);
        filter.setAttribute("colorInterpolationFilters", "sRGB");
        filter.setAttribute("x", "0%");
        filter.setAttribute("y", "0%");
        filter.setAttribute("width", "100%");
        filter.setAttribute("height", "100%");

        const feImage = document.createElementNS(svgNS, "feImage");
        feImage.setAttribute("x", "0");
        feImage.setAttribute("y", "0");
        feImage.setAttribute("width", "100%");
        feImage.setAttribute("height", "100%");
        feImage.setAttribute("preserveAspectRatio", "none");
        feImage.setAttribute("result", "map");

        const redChannel = document.createElementNS(svgNS, "feDisplacementMap");
        redChannel.setAttribute("in", "SourceGraphic");
        redChannel.setAttribute("in2", "map");
        redChannel.setAttribute("id", "redchannel");
        redChannel.setAttribute("result", "dispRed");

        const redMatrix = document.createElementNS(svgNS, "feColorMatrix");
        redMatrix.setAttribute("in", "dispRed");
        redMatrix.setAttribute("type", "matrix");
        redMatrix.setAttribute(
            "values",
            `1 0 0 0 0
             0 0 0 0 0
             0 0 0 0 0
             0 0 0 1 0`
        );
        redMatrix.setAttribute("result", "red");

        const greenChannel = document.createElementNS(svgNS, "feDisplacementMap");
        greenChannel.setAttribute("in", "SourceGraphic");
        greenChannel.setAttribute("in2", "map");
        greenChannel.setAttribute("id", "greenchannel");
        greenChannel.setAttribute("result", "dispGreen");

        const greenMatrix = document.createElementNS(svgNS, "feColorMatrix");
        greenMatrix.setAttribute("in", "dispGreen");
        greenMatrix.setAttribute("type", "matrix");
        greenMatrix.setAttribute(
            "values",
            `0 0 0 0 0
             0 1 0 0 0
             0 0 0 0 0
             0 0 0 1 0`
        );
        greenMatrix.setAttribute("result", "green");

        const blueChannel = document.createElementNS(svgNS, "feDisplacementMap");
        blueChannel.setAttribute("in", "SourceGraphic");
        blueChannel.setAttribute("in2", "map");
        blueChannel.setAttribute("id", "bluechannel");
        blueChannel.setAttribute("result", "dispBlue");

        const blueMatrix = document.createElementNS(svgNS, "feColorMatrix");
        blueMatrix.setAttribute("in", "dispBlue");
        blueMatrix.setAttribute("type", "matrix");
        blueMatrix.setAttribute(
            "values",
            `0 0 0 0 0
             0 0 0 0 0
             0 0 1 0 0
             0 0 0 1 0`
        );
        blueMatrix.setAttribute("result", "blue");

        const blendRG = document.createElementNS(svgNS, "feBlend");
        blendRG.setAttribute("in", "red");
        blendRG.setAttribute("in2", "green");
        blendRG.setAttribute("mode", "screen");
        blendRG.setAttribute("result", "rg");

        const blendRGB = document.createElementNS(svgNS, "feBlend");
        blendRGB.setAttribute("in", "rg");
        blendRGB.setAttribute("in2", "blue");
        blendRGB.setAttribute("mode", "screen");
        blendRGB.setAttribute("result", "output");

        const gaussianBlur = document.createElementNS(svgNS, "feGaussianBlur");
        gaussianBlur.setAttribute("in", "output");
        gaussianBlur.setAttribute("stdDeviation", "0.7");

        filter.append(
            feImage,
            redChannel,
            redMatrix,
            greenChannel,
            greenMatrix,
            blueChannel,
            blueMatrix,
            blendRG,
            blendRGB,
            gaussianBlur
        );
        defs.appendChild(filter);

        // gradients for the displacement map
        const redGrad = document.createElementNS(svgNS, "linearGradient");
        redGrad.setAttribute("id", redGradId);
        redGrad.setAttribute("x1", "100%");
        redGrad.setAttribute("y1", "0%");
        redGrad.setAttribute("x2", "0%");
        redGrad.setAttribute("y2", "0%");
        const redStop1 = document.createElementNS(svgNS, "stop");
        redStop1.setAttribute("offset", "0%");
        redStop1.setAttribute("stop-color", "#0000");
        const redStop2 = document.createElementNS(svgNS, "stop");
        redStop2.setAttribute("offset", "100%");
        redStop2.setAttribute("stop-color", "red");
        redGrad.append(redStop1, redStop2);

        const blueGrad = document.createElementNS(svgNS, "linearGradient");
        blueGrad.setAttribute("id", blueGradId);
        blueGrad.setAttribute("x1", "0%");
        blueGrad.setAttribute("y1", "0%");
        blueGrad.setAttribute("x2", "0%");
        blueGrad.setAttribute("y2", "100%");
        const blueStop1 = document.createElementNS(svgNS, "stop");
        blueStop1.setAttribute("offset", "0%");
        blueStop1.setAttribute("stop-color", "#0000");
        const blueStop2 = document.createElementNS(svgNS, "stop");
        blueStop2.setAttribute("offset", "100%");
        blueStop2.setAttribute("stop-color", "blue");
        blueGrad.append(blueStop1, blueStop2);

        defs.append(redGrad, blueGrad);
        svg.appendChild(defs);

        // Wrap existing children in a content container to layer correctly
        const contentWrapper = document.createElement("div");
        contentWrapper.className = "glass-surface__content";
        while (element.firstChild) {
            contentWrapper.appendChild(element.firstChild);
        }

        element.classList.add("glass-surface");
        element.appendChild(svg);
        element.appendChild(contentWrapper);

        const applyChannelSettings = () => {
            [
                { node: redChannel, offset: config.redOffset },
                { node: greenChannel, offset: config.greenOffset },
                { node: blueChannel, offset: config.blueOffset }
            ].forEach(({ node, offset }) => {
                node.setAttribute("scale", (config.distortionScale + offset).toString());
                node.setAttribute("xChannelSelector", config.xChannel);
                node.setAttribute("yChannelSelector", config.yChannel);
            });
            gaussianBlur.setAttribute("stdDeviation", config.displace.toString());
        };

        const generateDisplacementMap = () => {
            const rect = element.getBoundingClientRect();
            const actualWidth = rect.width || 400;
            const actualHeight = rect.height || 200;
            const edgeSize = Math.min(actualWidth, actualHeight) * (config.borderWidth * 0.5);
            const svgContent = `
<svg viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#0000"/>
      <stop offset="100%" stop-color="red"/>
    </linearGradient>
    <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0000"/>
      <stop offset="100%" stop-color="blue"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="black"></rect>
  <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${config.borderRadius}" fill="url(#${redGradId})" />
  <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${config.borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${config.mixBlendMode}" />
  <rect x="${edgeSize}" y="${edgeSize}" width="${actualWidth - edgeSize * 2}" height="${actualHeight - edgeSize * 2}" rx="${config.borderRadius}" fill="hsl(0 0% ${config.brightness}% / ${config.opacity})" style="filter:blur(${config.blur}px)" />
</svg>`;
            return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
        };

        const updateDisplacementMap = () => {
            feImage.setAttribute("href", generateDisplacementMap());
        };

        applyChannelSettings();
        updateDisplacementMap();

        const ro = new ResizeObserver(() => {
            requestAnimationFrame(updateDisplacementMap);
        });
        ro.observe(element);

        element.style.setProperty("--glass-frost", config.backgroundOpacity);
        element.style.setProperty("--glass-saturation", config.saturation);

        const hasSupport = supportsSVGFilters(filterId);
        if (hasSupport) {
            element.classList.add("glass-surface--svg");
            element.style.setProperty("--filter-id", `url(#${filterId})`);
        } else {
            element.classList.add("glass-surface--fallback");
        }

        return {
            destroy() {
                ro.disconnect();
            }
        };
    }

    document.addEventListener("DOMContentLoaded", () => {
    const navLinks = document.querySelectorAll(".nav-dock");
    if (!navLinks.length) return;

        navLinks.forEach((link) => link.classList.add("glass-surface-host"));
        navLinks.forEach((link) => createGlassSurface(link, {
            borderRadius: 50,
            // Give the glass a subtle frosted layer so the backdrop does not echo the page
            backgroundOpacity: 0.03,
            saturation: 1.1,
            brightness: 0,
            opacity: 0.92,
            blur: 7,
            displace: 2,
            distortionScale: -60,
            redOffset: 0,
            greenOffset: 5,
            blueOffset: 5,
            mixBlendMode: "screen"
        }));
    });
})();
