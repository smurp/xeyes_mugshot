`pbpaste > xeyes_mugshot/README.md`

```markdown
# XEyes Mugshot

Googly eyes overlay for any photo. Mouse-tracking pupils, scroll-wheel parallax,
device-motion wobble, and built-in video recording with dual-format export.

## Quick Start

```bash
cd xeyes_mugshot
cp /path/to/your/photo.jpeg mugshot.jpeg
npx serve .
```

Open http://localhost:3000

## Files

| File | Description |
|------|-------------|
| `xeyes_overlay.js` | SVG eye overlay with mouse/touch tracking, scroll-wheel convergence, and accelerometer wobble |
| `div_recorder.js` | `DivRecorder` — records any DOM element (img + svg + canvas) to video via canvas compositing |
| `recording_shelf.js` | `RecordingShelf` — thumbnail strip with playback overlay and download buttons |
| `index.html` | Demo page wiring it all together |

## Usage

### XEyes

Add `data-xeyes` to any element containing an `<img>`:

```html
<div class="portrait"
     data-xeyes
     data-xeyes-radius="10"
     data-xeyes-ipd="85"
     data-xeyes-voffset="-47"
     data-xeyes-hoffset="7.5">
  <img src="face.jpeg">
</div>
```

Include the script:

```html
<script src="xeyes_overlay.js"></script>
```

Eyes auto-initialize on `DOMContentLoaded` for all `[data-xeyes]` elements.

### Data Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-xeyes-radius` | 40 | Vertical eye radius (ry for ellipse, r for circle) |
| `data-xeyes-lateral-radius` | — | Horizontal eye radius; if set, eyes are elliptical |
| `data-xeyes-pupil-radius` | radius/2 | Pupil size |
| `data-xeyes-iris-radius` | — | If set, draws an iris ring between white and pupil |
| `data-xeyes-iris-color` | DarkBlue | Iris fill color |
| `data-xeyes-ipd` | 120 | Interpupillary distance (px in image space) |
| `data-xeyes-voffset` | 0 | Vertical offset from image center (negative = up) |
| `data-xeyes-hoffset` | 0 | Horizontal offset from image center (positive = right) |
| `data-xeyes-fill` | white | Eye white fill (`transparent` hides it) |
| `data-xeyes-stroke` | black | Eye outline color (`none` hides it) |
| `data-xeyes-stroke-width` | 2 | Eye outline width (0 for none) |
| `data-xeyes-pupil-fill` | black | Pupil color |
| `data-xeyes-motion` | true | Enable accelerometer wobble (`false` to disable) |
| `data-xeyes-motion-sensitivity` | 1.0 | Accelerometer multiplier |

### Interactions

- **Mouse/touch** — eyes follow the pointer
- **Scroll wheel** — adjusts perceived depth (convergence/divergence)
- **Device shake** — googly wobble via accelerometer (iOS requires a tap to grant permission)
- **Pinch (mobile)** — adjusts depth like scroll wheel

### DivRecorder

Records any element's visual children to video:

```javascript
var recorder = new DivRecorder({ target: '.mugshot', fps: 30 });

await recorder.start();
// ... user does stuff ...
var result = await recorder.stop();
// result = { name: "rec-20260223-153012", blobs: { webm: Blob, mp4?: Blob } }
```

Dual-records webm and mp4 simultaneously (mp4 if browser supports it).
No external dependencies — uses native `MediaRecorder` and `captureStream`.

### RecordingShelf

Displays recorded clips as thumbnails with download and playback:

```javascript
var shelf = new RecordingShelf({
  container: document.querySelector('.shelf-mount'),
  target: document.querySelector('.mugshot'),
});

shelf.addRecording(result.blobs, result.name);
```

Thumbnail features:
- Click preview area to play in an overlay
- `.webm` / `.mp4` buttons to download (click or drag)
- Red ✕ (upper left, on hover) to delete
- Escape or close button dismisses playback overlay

## Tuning Eyes to a Photo

All coordinates are in the image's native pixel space. To align eyes:

1. Open the image in any editor and note the pixel coordinates of each eye
2. The image center is `(width/2, height/2)`
3. `ipd` = horizontal distance between the eyes
4. `hoffset` = midpoint of eyes minus image center, horizontally
5. `voffset` = midpoint of eyes minus image center, vertically
6. `radius` = roughly the visible eye radius in pixels
7. Set `lateral-radius` wider than `radius` for realistic elliptical eyes

## Integration with ThinkerToys

These modules are designed for reuse in ThinkerToys (apps/nooviz):

- `xeyes_overlay.js` — attach to profile picture elements via `data-xeyes`
- `div_recorder.js` — record activity in any panel's DOM element
- `recording_shelf.js` — will evolve into a companion panel visualization

No build step, no dependencies, plain browser JS with prototype-based classes.
```