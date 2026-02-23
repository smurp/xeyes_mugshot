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
  svg.setAttribute("viewBox", "0 0 " + overlayWidth + " " + overlayHeight);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.position = 'absolute';
  svg.style.top = '0';
  svg.style.left = '0';
  svg.style.pointerEvents = 'none';

  var defs = document.createElementNS(svgNamespace, "defs");
  svg.appendChild(defs);

  var uid = 'xeyes-' + Math.random().toString(36).slice(2, 8);

  function createClipPath(id, cx, cy) {
    var clip = document.createElementNS(svgNamespace, "clipPath");
    clip.setAttribute("id", id);
    if (isElliptical) {
      var shape = document.createElementNS(svgNamespace, "ellipse");
      shape.setAttribute("cx", cx);
      shape.setAttribute("cy", cy);
      shape.setAttribute("rx", a);
      shape.setAttribute("ry", b);
      clip.appendChild(shape);
    } else {
      var shape = document.createElementNS(svgNamespace, "circle");
      shape.setAttribute("cx", cx);
      shape.setAttribute("cy", cy);
      shape.setAttribute("r", eyeRadius);
      clip.appendChild(shape);
    }
    return clip;
  }

  function createEye(cx, cy) {
    if (isElliptical) {
      var eye = document.createElementNS(svgNamespace, "ellipse");
      eye.setAttribute("cx", cx);
      eye.setAttribute("cy", cy);
      eye.setAttribute("rx", a);
      eye.setAttribute("ry", b);
      eye.setAttribute("fill", eyeFill);
      eye.setAttribute("stroke", eyeStroke);
      eye.setAttribute("stroke-width", eyeStrokeWidth);
      return eye;
    }
    var eye = document.createElementNS(svgNamespace, "circle");
    eye.setAttribute("cx", cx);
    eye.setAttribute("cy", cy);
    eye.setAttribute("r", eyeRadius);
    eye.setAttribute("fill", eyeFill);
    eye.setAttribute("stroke", eyeStroke);
    eye.setAttribute("stroke-width", eyeStrokeWidth);
    return eye;
  }

  function createIris(cx, cy) {
    var iris = document.createElementNS(svgNamespace, "circle");
    iris.setAttribute("cx", cx);
    iris.setAttribute("cy", cy);
    iris.setAttribute("r", irisRadius);
    iris.setAttribute("fill", irisColor);
    return iris;
  }

  function createPupil(cx, cy) {
    var pupil = document.createElementNS(svgNamespace, "circle");
    pupil.setAttribute("cx", cx);
    pupil.setAttribute("cy", cy);
    pupil.setAttribute("r", pupilRadius);
    pupil.setAttribute("fill", pupilFill);
    return pupil;
  }

  function buildEye(cx, cy, index) {
    var eye = createEye(cx, cy);
    svg.appendChild(eye);

    var clipId = uid + '-clip-' + index;
    defs.appendChild(createClipPath(clipId, cx, cy));

    var g = document.createElementNS(svgNamespace, "g");
    g.setAttribute("clip-path", "url(#" + clipId + ")");

    var iris = null;
    if (irisRadius) {
      iris = createIris(cx, cy);
      g.appendChild(iris);
    }
    var pupil = createPupil(cx, cy);
    g.appendChild(pupil);

    svg.appendChild(g);
    return { pupil: pupil, iris: iris };
  }

  var e1 = buildEye(eye1X, eye1Y, 1);
  var e2 = buildEye(eye2X, eye2Y, 2);

  overlayOn.appendChild(svg);
  overlayOn.style.position = 'relative';

  function screenToViewBox(clientX, clientY) {
    var pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    var svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
    return svgPt;
  }

  function maxDistAtAngle(angle) {
    if (!isElliptical) {
      return eyeRadius - pupilRadius - (eyeStrokeWidth / 2);
    }
    var cosA = Math.cos(angle);
    var sinA = Math.sin(angle);
    var edgeDist = (a * b) / Math.sqrt(
      (b * cosA) * (b * cosA) + (a * sinA) * (a * sinA)
    );
    return edgeDist - pupilRadius - (eyeStrokeWidth / 2);
  }

  function positionParts(eyeX, eyeY, targetX, targetY, parts) {
    var dx = targetX - eyeX;
    var dy = targetY - eyeY;
    var angle = Math.atan2(dy, dx);
    var maxDist = maxDistAtAngle(angle);
    var distance = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
    var cx = eyeX + Math.cos(angle) * distance;
    var cy = eyeY + Math.sin(angle) * distance;
    parts.pupil.setAttribute('cx', cx);
    parts.pupil.setAttribute('cy', cy);
    if (parts.iris) {
      parts.iris.setAttribute('cx', cx);
      parts.iris.setAttribute('cy', cy);
    }
  }

  var depth = 0;
  var depthStep = 0.1;
  var minDepth = -1;
  var maxDepth = 7;
  var lastClientX = null;
  var lastClientY = null;

  function getConvergence() { return 1 - depth; }

  var wobble = [
    { x: 0, y: 0, vx: 0, vy: 0 },
    { x: 0, y: 0, vx: 0, vy: 0 },
  ];
  var spring = 0.15;
  var damping = 0.75;
  var accelScale = 0.8 * motionSensitivity;
  var accelX = 0, accelY = 0;
  var animating = false;

  function gazeTarget(eyeX) {
    if (lastClientX == null) return { x: eyeX, y: eyeRadius };
    var mouse = screenToViewBox(lastClientX, lastClientY);
    var c = getConvergence();
    return {
      x: mouse.x + (midX - eyeX) * (1 - c),
      y: mouse.y,
    };
  }

  function tick() {
    var eyes = [
      { ex: eye1X, ey: eye1Y, parts: e1, w: wobble[0] },
      { ex: eye2X, ey: eye2Y, parts: e2, w: wobble[1] },
    ];

    var totalEnergy = 0;
    for (var i = 0; i < eyes.length; i++) {
      var eye = eyes[i];
      var target = gazeTarget(eye.ex);
      var w = eye.w;

      w.vx -= accelX * accelScale;
      w.vy -= accelY * accelScale;
      w.vx -= w.x * spring;
      w.vy -= w.y * spring;
      w.vx *= damping;
      w.vy *= damping;
      w.x += w.vx;
      w.y += w.vy;

      positionParts(eye.ex, eye.ey, target.x + w.x, target.y + w.y, eye.parts);
      totalEnergy += Math.abs(w.vx) + Math.abs(w.vy) + Math.abs(w.x) + Math.abs(w.y);
    }

    if (totalEnergy > 0.01 || Math.abs(accelX) + Math.abs(accelY) > 0.1) {
      requestAnimationFrame(tick);
    } else {
      for (var j = 0; j < wobble.length; j++) {
        wobble[j].x = wobble[j].y = wobble[j].vx = wobble[j].vy = 0;
      }
      for (var k = 0; k < eyes.length; k++) {
        var t = gazeTarget(eyes[k].ex);
        positionParts(eyes[k].ex, eyes[k].ey, t.x, t.y, eyes[k].parts);
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
      var eyes = [
        { ex: eye1X, ey: eye1Y, parts: e1 },
        { ex: eye2X, ey: eye2Y, parts: e2 },
      ];
      for (var i = 0; i < eyes.length; i++) {
        var target = gazeTarget(eyes[i].ex);
        positionParts(eyes[i].ex, eyes[i].ey, target.x, target.y, eyes[i].parts);
      }
    }
  }

  function updateFromEvent(clientX, clientY) {
    lastClientX = clientX;
    lastClientY = clientY;
    recompute();
  }

  watchMotionOn.addEventListener('mousemove', function(evt) {
    updateFromEvent(evt.clientX, evt.clientY);
  });

  watchMotionOn.addEventListener('wheel', function(evt) {
    evt.preventDefault();
    var delta = evt.deltaY < 0 ? depthStep : -depthStep;
    depth = Math.max(minDepth, Math.min(maxDepth, depth + delta));
    recompute();
  }, { passive: false });

  var lastPinchDist = null;

  watchMotionOn.addEventListener('touchmove', function(evt) {
    if (evt.touches.length === 1) {
      updateFromEvent(evt.touches[0].clientX, evt.touches[0].clientY);
    } else if (evt.touches.length === 2) {
      evt.preventDefault();
      var dx = evt.touches[0].clientX - evt.touches[1].clientX;
      var dy = evt.touches[0].clientY - evt.touches[1].clientY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDist !== null) {
        var scale = (lastPinchDist - dist) * 0.008;
        depth = Math.max(minDepth, Math.min(maxDepth, depth + scale));
        lastClientX = (evt.touches[0].clientX + evt.touches[1].clientX) / 2;
        lastClientY = (evt.touches[0].clientY + evt.touches[1].clientY) / 2;
        recompute();
      }
      lastPinchDist = dist;
    }
  }, { passive: false });

  watchMotionOn.addEventListener('touchend', function() {
    lastPinchDist = null;
  });

  if (motionEnabled && typeof DeviceMotionEvent !== 'undefined') {
    function startListening() {
      window.addEventListener('devicemotion', function(evt) {
        var acc = evt.accelerationIncludingGravity;
        if (!acc) return;
        accelX = (acc.x || 0);
        accelY = -(acc.y || 0);
        if (Math.abs(accelX) + Math.abs(accelY) > 0.3) {
          ensureAnimating();
        }
      });
    }

    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      var requestOnClick = function() {
        DeviceMotionEvent.requestPermission().then(function(state) {
          if (state === 'granted') startListening();
        }).catch(function() {});
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
  var n = parseFloat(val);
  return isNaN(n) ? fallback : n;
}

document.addEventListener('DOMContentLoaded', function() {
  var els = document.querySelectorAll('[data-xeyes]');
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
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
  }
});
