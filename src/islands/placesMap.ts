// The optional Places map (README:209), loaded only when "Map" is chosen. Leaflet 1.9.4 is
// bundled from npm and served from our origin (D23), so the only outside host is the
// OpenStreetMap tile server (Q5), which the CSP allows for images. Leaflet loads as a
// classic script, as in the prototype: after a failed load a new <script> retries, where a
// failed import() stays failed in Safari. Tiles are never cached by the service worker.
import type * as Leaflet from 'leaflet';
import leafletCss from 'leaflet/dist/leaflet.css?url';
import leafletJs from 'leaflet/dist/leaflet.js?url';
import type { Point } from '../lib/core/geo.ts';
import type { Listed } from '../lib/core/places.ts';

type LeafletApi = typeof Leaflet;

let loading: Promise<LeafletApi> | null = null;

/** Adds Leaflet's stylesheet and script once; a failure clears the way for "Try again". */
export function loadLeaflet(): Promise<LeafletApi> {
  const w = window as unknown as { L?: LeafletApi };
  if (w.L) return Promise.resolve(w.L);
  if (!loading) {
    loading = new Promise<LeafletApi>((resolve, reject) => {
      if (!document.querySelector(`link[href="${leafletCss}"]`)) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = leafletCss;
        document.head.append(css);
      }
      const script = document.createElement('script');
      script.src = leafletJs;
      script.onload = () => (w.L ? resolve(w.L) : reject(new Error('Leaflet missing')));
      script.onerror = () => {
        script.remove();
        reject(new Error('Leaflet failed to load'));
      };
      document.head.append(script);
    });
    loading.catch(() => {
      loading = null;
    });
  }
  return loading;
}

// Markers stay the same in light and dark mode (V2), so they aren't themed tokens.
const MARKER = { fill: '#1E6B70', stroke: '#FFFFFF', you: '#C42032' };
const PH_CENTRE: Leaflet.LatLngExpression = [12.88, 121.77];

export interface PlacesMap {
  show(rows: readonly Listed[], origin: Point | null, placeHref: (id: string) => string, lang: string): void;
  destroy(): void;
}

const BLANK = '/icons/empty.gif';

/* eslint-disable @typescript-eslint/no-explicit-any -- Leaflet's private tile methods aren't typed. */
/**
 * Leaflet 1.9.4 blanks tiles it abandons with a data: GIF, which the CSP's img-src doesn't
 * allow (Q5 adds only the tile host). These are its three methods that use that URL
 * (leaflet-src.js, TileLayer), unchanged except for our own blank GIF.
 */
function tileLayerClass(L: LeafletApi) {
  return L.TileLayer.extend({
    _abortLoading(this: any) {
      for (const i in this._tiles) {
        if (this._tiles[i].coords.z !== this._tileZoom) {
          const tile = this._tiles[i].el;
          tile.onload = L.Util.falseFn;
          tile.onerror = L.Util.falseFn;
          if (!tile.complete) {
            tile.src = BLANK;
            const coords = this._tiles[i].coords;
            L.DomUtil.remove(tile);
            delete this._tiles[i];
            this.fire('tileabort', { tile, coords });
          }
        }
      }
    },
    _removeTile(this: any, key: string) {
      const tile = this._tiles[key];
      if (!tile) return;
      tile.el.setAttribute('src', BLANK);
      return (L.GridLayer.prototype as any)._removeTile.call(this, key);
    },
    _tileReady(this: any, coords: unknown, err: unknown, tile: HTMLImageElement | undefined) {
      if (!this._map || (tile && tile.getAttribute('src') === BLANK)) return;
      return (L.GridLayer.prototype as any)._tileReady.call(this, coords, err, tile);
    },
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function createMap(L: LeafletApi, el: HTMLElement): PlacesMap {
  // Canvas markers: every located center is drawn, even at 2,000+ (audit B7). With reduced
  // motion, no zoom, fade or marker animation (audit B12). On a touch screen, no one-finger
  // drag: one finger scrolls the page past the map, which is most of a phone's screen with the
  // list below it, and two fingers pan and zoom it (audit O9, V22). Leaflet's CSS then gives
  // the map touch-action: pan-x pan-y, not none. Read by capability, as the map is made; a
  // mouse or trackpad drags it as before.
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const map = L.map(el, { scrollWheelZoom: false, dragging: !matchMedia('(pointer: coarse)').matches, preferCanvas: true, zoomAnimation: !still, fadeAnimation: !still, markerZoomAnimation: !still });
  const Tiles = tileLayerClass(L) as unknown as typeof L.TileLayer;
  new Tiles('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  const layer = L.layerGroup().addTo(map);
  let signature = '';
  // Whether the view holds every marker once it settles, and whether it is still moving
  // (tests read them: canvas markers aren't elements, and a refit cut short would leave some
  // out, B12, B70).
  let shown: Leaflet.LatLngTuple[] = [];
  map.on('movestart', () => (el.dataset.moving = 'true'));
  map.on('moveend', () => {
    delete el.dataset.moving;
    el.dataset.fit = String(!shown.length || map.getBounds().contains(L.latLngBounds(shown)));
  });

  return {
    show(rows, origin, placeHref, lang) {
      const next = `${rows.map((r) => r.p.id).join(',')}|${origin ? `${origin.lat},${origin.lng}` : ''}|${lang}`;
      if (next === signature) return;
      signature = next;
      layer.clearLayers();
      const points: Leaflet.LatLngTuple[] = [];
      for (const { p } of rows) {
        if (p.lat === null || p.lng === null) continue;
        // Built when opened, with textContent: names and addresses come from the data file.
        const popup = () => {
          const box = document.createElement('div');
          const link = document.createElement('a');
          link.className = 'map-popup-name';
          link.href = placeHref(p.id);
          link.textContent = p.name;
          const address = document.createElement('div');
          address.className = 'map-popup-address';
          address.textContent = p.address;
          box.append(link, address);
          return box;
        };
        L.circleMarker([p.lat, p.lng], { radius: 9, color: MARKER.stroke, weight: 2, fillColor: MARKER.fill, fillOpacity: 0.9 }).bindPopup(popup).addTo(layer);
        points.push([p.lat, p.lng]);
      }
      shown = points;
      const centers = points.length;
      if (origin) {
        L.circleMarker([origin.lat, origin.lng], { radius: 10, color: MARKER.stroke, weight: 3, fillColor: MARKER.you, fillOpacity: 1 }).addTo(layer);
        points.push([origin.lat, origin.lng]);
      }
      // Instant: a refit while the last one animates could stop short of the new markers.
      if (points.length) map.fitBounds(points, { padding: [36, 36], maxZoom: 13, animate: false });
      else map.setView(PH_CENTRE, 5, { animate: false });
      // How many centers are on the map, once it has been fitted to them (tests read it).
      el.dataset.markers = String(centers);
      setTimeout(() => map.invalidateSize(), 60);
    },
    destroy() {
      map.remove();
    },
  };
}
