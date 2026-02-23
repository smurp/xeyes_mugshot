function xeyes(params = {}) {
  const overlayOn = typeof params.overlayOn === 'string'
    ? document.querySelector(params.overlayOn)
    : params.overlayOn;
  const watchMotionOn = params.watchMotionOn || document.body;
  const eyeRadius = params.eyeRadius ?? 40;
  const lateralRadius = params.lateralRadius ?? null;
  const interpupilaryDistance = params.interpupilaryDistance ?? 120;
  const verticalOffset = params.verticalOffset ?? 0;
  const horizontalOffset = params.horizontalOffset ?? 0;
  const pupilRadius = params.pupilRadius ?? eyeRadius / 2;
  const irisRadius = params.irisRadius ?? null;
  const irisColor = params.irisColor || "DarkBlue";
  const eyeFill = params.eyeFill || "white";
  const eyeStroke = params.eyeStroke || "black";
  const eyeStrokeWidth = params.eyeStrokeWidth ?? 2;
  const pupilFill = params.pupilFill || "black";
  const motionEnabled = params.motionEnabled ?? true;
  const motionSensitivity = params.motionSensitivity ?? 1.0;

  const a = lateralRadius ?? eyeRadius;
  const b = eyeRadius;
  const isElliptical = lateralRadius !== null;

  const svgNamespace = "http://www.w3.org/2000/svg";

  const overlayRect = overlayOn.getBoundingClientRect();
  const overlayWidth = overlayRect.width;
  const overlayHeight = overlayRect.height;

  const eye1X = overlayWidth / 2 - interpupilaryDistance / 2 + horizontalOffset;
  const eye1Y = overlayHeight / 2 + verticalOffset;
  const eye2X = overlayWidth / 2 + interpupilaryDistance / 2 + horizontalOffset;
  const eye2Y = overlayHeight / 2 + verticalOffset;
  const midX = (eye1X + eye2X) / 2;
  const midY = (eye1Y + eye2Y) / 2;

  const svg = document.createElementNS(svgNamespace, "svg");
  svg.setAttribute("viewBox", `0 0 ${overlayWidth} ${overlayHeight}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.position = 'absolute';
  svg.style.top = '0';
  svg.style.left = '0';
  svg.style.pointerEvents = 'none';

  const defs = document.createElementNS(svgNamespace, "defs");
  svg.appendChild(defs);

  const uid = 'xeyes-' + Math.random().toString(36).slice(2, 8);

  function createClipPath(id, cx, cy) {
    const clip = document.createElementNS(svgNamespace, "clipPath");
    clip.setAttribute("id", id);
    if (isElliptical) {
      const shape = document.createElementNS(svgNamespace, "ellipse");
      shape.setAttribute("cx", cx);
      shape.setAttribute("cy", cy);
      shape.setAttribute("rx", a);
      shape.setAttribute("ry", b);
      clip.appendChild(shape);
    } else {
      const shape = document.createElementNS(svgNamespace, "circle");
      shape.setAttribute("cx", cx);
      shape.setAttribute("cy", cy);
      shape.setAttribute("r", eyeRadius);
      clip.appendChild(shape);
    }
    return clip;
  }

  function createEye(cx, cy) {
    if (isElliptical) {
      const eye = document.createElementNS(svgNamespace, "ellipse");
      eye.setAttribute("cx", cx);
      eye.setAttribute("cy", cy);
      eye.setAttribute("rx", a);
      eye.setAttribute("ry", b);
      eye.setAttribute("fill", eyeFill);
      eye.setAttribute("stroke", eyeStroke);
      eye.setAttribute("stroke-width", eyeStrokeWidth);
      return eye;
    }
    const eye = document.createElementNS(svgNamespace, "circle");
    eye.setAttribute("cx", cx);
    eye.setAttribute("cy", cy);
    eye.setAttribute("r", eyeRadius);
    eye.setAttribute("fill", eyeFill);
    eye.setAttribute("stroke", eyeStroke);
    eye.setAttribute("stroke-width", eyeStrokeWidth);
    return eye;
  }

  function createIris(cx, cy) {
    const iris = document.createElementNS(svgNamespace, "circle");
    iris.setAttribute("cx", cx);
    iris.setAttribute("cy", cy);
    iris.setAttribute("r", irisRadius);
    iris.setAttribute("fill", irisColor);
    return iris;
  }

  function createPupil(cx, cy) {
    const pupil = document.createElementNS(svgNamespace, "circle");
    pupil.setAttribute("cx", cx);
    pupil.setAttribute("cy", cy);
    pupil.setAttribute("r", pupilRadius);
    pupil.setAttribute("fill", pupilFill);
    return pupil;
  }

  function buildEye(cx, cy, index) {
    const eye = createEye(cx, cy);
    svg.appendChild(eye);

    const clipId = `${uid}-clip-${index}`;
    defs.appendChild(createClipPath(clipId, cx, cy));

    const g = document.createElementNS(svgNamespace, "g");
    g.setAttribute("clip-path", `url(#${clipId})`);

    let iris = null;
    if (irisRadius) {
      iris = createIris(cx, cy);
      g.appendChild(iris);
    }
    const pupil = createPupil(cx, cy);
    g.appendChild(pupil);

    svg.appendChild(g);
    return { pupil, iris };
  }

  const e1 = buildEye(eye1X, eye1Y, 1);
  const e2 = buildEye(eye2X, eye2Y, 2);

  overlayOn.appendChild(svg);
  overlayOn.style.position = 'relative';

  function screenToViewBox(clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
    return svgPt;
  }

  function maxDistAtAngle(angle) {
    if (!isElliptical) {
      return eyeRadius - pupilRadius - (eyeStrokeWidth / 2);
    }
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const edgeDist = (a * b) / Math.sqrt(
      (b * cosA) * (b * cosA) + (a * sinA) * (a * sinA)
    );
    return edgeDist - pupilRadius - (eyeStrokeWidth / 2);
  }

  function positionParts(eyeX, eyeY, targetX, targetY, parts) {
    const dx = targetX - eyeX;
    const dy = targetY - eyeY;
    const angle = Math.atan2(dy, dx);
    const maxDist = maxDistAtAngle(angle);
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
    const cx = eyeX + Math.cos(angle) * distance;
    const cy = eyeY + Math.sin(angle) * distance;
    parts.pupil.setAttribute('cx', cx);
    parts.pupil.setAttribute('cy', cy);
    if (parts.iris) {
      parts.iris.setAttribute('cx', cx);
      parts.iris.setAttribute('cy', cy);
    }
  }

  // -- Depth / convergence --
  let depth = 0;
  const depthStep = 0.1;
  const minDepth = -1;
  const maxDepth = 7;
  let lastClientX = null;
  let lastClientY = null;

  function getConvergence() { return 1 - depth; }

  // -- Wobble physics (spring-damper per eye) --
  // Each eye has independent wobble so shaking makes them rattle differently
  const wobble = [
    { x: 0, y: 0, vx: 0, vy: 0 },  // left eye
    { x: 0, y: 0, vx: 0, vy: 0 },  // right eye
  ];
  const spring = 0.15;    // pull back toward gaze target
  const damping = 0.75;   // friction (1 = no friction, 0 = instant stop)
  const accelScale = 0.8 * motionSensitivity;  // how much device motion displaces
  let accelX = 0, accelY = 0;  // latest device acceleration
  let animating = false;

  function gazeTarget(eyeX) {
    if (lastClientX == null) return { x: eyeX, y: eyeRadius };
    const mouse = screenToViewBox(lastClientX, lastClientY);
    const c = getConvergence();
    return {
      x: mouse.x + (midX - eyeX) * (1 - c),
      y: mouse.y,
    };
  }

  function tick() {
    const eyes = [
      { ex: eye1X, ey: eye1Y, parts: e1, w: wobble[0] },
      { ex: eye2X, ey: eye2Y, parts: e2, w: wobble[1] },
    ];

    let totalEnergy = 0;
    for (const { ex, ey, parts, w } of eyes) {
      const target = gazeTarget(ex);

      // Acceleration kicks the wobble (device tilts right = eyes lag left)
      w.vx -= accelX * accelScale;
      w.vy -= accelY * accelScale;

      // Spring pulls wobble back toward zero
      w.vx -= w.x * spring;
      w.vy -= w.y * spring;

      // Damping
      w.vx *= damping;
      w.vy *= damping;

      // Integrate
      w.x += w.vx;
      w.y += w.vy;

      // Apply wobble offset to gaze target
      positionParts(ex, ey, target.x + w.x, target.y + w.y, parts);

      totalEnergy += Math.abs(w.vx) + Math.abs(w.vy) + Math.abs(w.x) + Math.abs(w.y);
    }

    // Keep animating while there's wobble energy, or while accel is active
    if (totalEnergy > 0.01 || Math.abs(accelX) + Math.abs(accelY) > 0.1) {
      requestAnimationFrame(tick);
    } else {
      // Settle exactly
      for (const w of wobble) { w.x = w.y = w.vx = w.vy = 0; }
      for (const { ex, ey, parts } of eyes) {
        const target = gazeTarget(ex);
        positionParts(ex, ey, target.x, target.y, parts);
      }
      animating = false;
    }
  }

  function ensureAnimating() {
    if (!animating) {
      animating = true;
      requestAnimationFrame(tick);
    }
  }

  function recompute() {
    if (!animating) {
      // No wobble active, just position directly
      const eyes = [
        { ex: eye1X, ey: eye1Y, parts: e1 },
        { ex: eye2X, ey: eye2Y, parts: e2 },
      ];
      for (const { ex, ey, parts } of eyes) {
        const target = gazeTarget(ex);
        positionParts(ex, ey, target.x, target.y, parts);
      }
    }
    // If animating, tick() will pick up new gaze target automatically
  }

  function updateFromEvent(clientX, clientY) {
    lastClientX = clientX;
    lastClientY = clientY;
    recompute();
  }

  watchMotionOn.addEventListener('mousemove', (evt) => {
    updateFromEvent(evt.clientX, evt.clientY);
  });

  watchMotionOn.addEventListener('wheel', (evt) => {
    evt.preventDefault();
    const delta = evt.deltaY < 0 ? depthStep : -depthStep;
    depth = Math.max(minDepth, Math.min(maxDepth, depth + delta));
    recompute();
  }, { passive: false });

  let lastPinchDist = null;

  watchMotionOn.addEventListener('touchmove', (evt) => {
    if (evt.touches.length === 1) {
      const touch = evt.touches[0];
      updateFromEvent(touch.clientX, touch.clientY);
    } else if (evt.touches.length === 2) {
      evt.preventDefault();
      const dx = evt.touches[0].clientX - evt.touches[1].clientX;
      const dy = evt.touches[0].clientY - evt.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDist !== null) {
        const scale = (lastPinchDist - dist) * 0.008;
        depth = Math.max(minDepth, Math.min(maxDepth, depth + scale));
        const mx = (evt.touches[0].clientX + evt.touches[1].clientX) / 2;
        const my = (evt.touches[0].clientY + evt.touches[1].clientY) / 2;
        lastClientX = mx;
        lastClientY = my;
        recompute();
      }
      lastPinchDist = dist;
    }
  }, { passive: false });

  watchMotionOn.addEventListener('touchend', () => {
    lastPinchDist = null;
  });

  // -- Device motion: accelerometer --
  if (motionEnabled && typeof DeviceMotionEvent !== 'undefined') {
    function startListening() {
      window.addEventListener('devicemotion', (evt) => {
        const acc = evt.accelerationIncludingGravity;
        if (!acc) return;
        // acc.x: positive = tilt right; acc.y: positive = tilt back
        // We want: tilt right → eyes lag left (negative x wobble)
        // Portrait orientation assumed; works for laptop too
        accelX = (acc.x || 0);
        accelY = -(acc.y || 0);  // screen Y is inverted from gravity Y
        if (Math.abs(accelX) + Math.abs(accelY) > 0.3) {
          ensureAnimating();
        }
      });
    }

    // iOS 13+ requires permission request
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      // Need user gesture — add a one-time click handler
      const requestOnClick = () => {
        DeviceMotionEvent.requestPermission().then(state => {
          if (state === 'granted') startListening();
        }).catch(() => {});
        document.removeEventListener('click', requestOnClick);
      };
      document.addEventListener('click', requestOnClick);
    } else {
      startListening();
    }
  }
}

function parseNumAttr(val, fallback) {
  if (val == null) return fallback;
  const n = parseFloat(val);
  return isNaN(n) ? fallback : n;
}

// Auto-initialize any element with data-xeyes attribute
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-xeyes]').forEach(el => {
    xeyes({
      overlayOn: el,
      watchMotionOn: document.body,
      eyeRadius: parseNumAttr(el.dataset.xeyesRadius, 40),
      lateralRadius: el.dataset.xeyesLateralRadius != null
        ? parseFloat(el.dataset.xeyesLateralRadius) : null,
      pupilRadius: parseNumAttr(el.dataset.xeyesPupilRadius, undefined),
      irisRadius: el.dataset.xeyesIrisRadius != null
        ? parseFloat(el.dataset.xeyesIrisRadius) : null,
      irisColor: el.dataset.xeyesIrisColor || "DarkBlue",
      interpupilaryDistance: parseNumAttr(el.dataset.xeyesIpd, 120),
      verticalOffset: parseNumAttr(el.dataset.xeyesVoffset, 0),
      horizontalOffset: parseNumAttr(el.dataset.xeyesHoffset, 0),
      eyeFill: el.dataset.xeyesFill || "white",
      eyeStroke: el.dataset.xeyesStroke || "black",
      eyeStrokeWidth: parseNumAttr(el.dataset.xeyesStrokeWidth, 2),
      pupilFill: el.dataset.xeyesPupilFill || "black",
      motionEnabled: el.dataset.xeyesMotion !== 'false',
      motionSensitivity: parseNumAttr(el.dataset.xeyesMotionSensitivity, 1.0),
    });
  });
});