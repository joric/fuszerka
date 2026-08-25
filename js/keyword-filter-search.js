/*!
 * Leaflet.KeywordFilter
 * A reusable Leaflet control that filters markers by keyword (AND-of-tokens
 * substring match) instead of jumping to a single result. Press Enter to
 * apply the filter; only matching markers stay on the map.
 *
 * Usage:
 *   const filter = L.control.keywordFilter({
 *     getMarkers: () => allMarkers,               // array of L.Marker
 *     getSearchableText: (marker) => marker.feature.properties.title,
 *     targetLayer: markersLayer,                  // any layer with clearLayers()/addLayer()
 *   }).addTo(map);
 *
 * Requires Leaflet (https://leafletjs.com) to be loaded first.
 */
(function (global, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('leaflet'));
  } else if (typeof define === 'function' && define.amd) {
    define(['leaflet'], factory);
  } else {
    factory(global.L);
  }
}(typeof window !== 'undefined' ? window : this, function (L) {

  if (!L) {
    throw new Error('Leaflet.KeywordFilter requires Leaflet to be loaded first');
  }

  const STYLE_ID = 'leaflet-keyword-filter-style';

  function injectStyleOnce() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
.keyword-filter-control {
  background: #fff;
  display: flex;
  align-items: center;
  overflow: hidden;
  border-radius: 8px;
}

.keyword-filter-control .keyword-filter-input {
  border: none;
  outline: none;
  padding: 8px 12px;
  font-size: 14px;
  font-family: inherit;
  width: 80px;
  transition: all 0.3s ease;
}

.keyword-filter-control .keyword-filter-input:focus {
  width: 200px;
}

.keyword-filter-control .keyword-filter-count {
  font-size: 14px;
  color: #888;
  padding: 0 6px;
  white-space: nowrap;
}

.keyword-filter-control .keyword-filter-clear {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 8px 10px;
  color: #666;
}

.keyword-filter-control .keyword-filter-clear:hover {
  color: #000;
  background: #f2f2f2;
}

@media (max-width: 480px) {
  .keyword-filter-control .keyword-filter-count {
    display: none;
  }
  .keyword-filter-control .keyword-filter-input {
    width: 45vw;
  }
}
`;
    document.head.appendChild(style);
  }

  L.Control.KeywordFilter = L.Control.extend({
    options: {
      position: 'topleft',
      placeholder: 'Search by keywords...',
      clearTitle: 'Clear',
      autofocus: false,
      enableShortcut: true,     // Ctrl+F focuses the input
      shortcutKey: 'KeyF',
      getMarkers: () => [],                       // () => Array<L.Layer>
      getSearchableText: () => '',                // (marker) => string
      targetLayer: null,                          // layer with clearLayers()/addLayer()
      onFilter: null,                              // (keywords, matchCount) => void
    },

    onAdd: function (map) {
      this._map = map;
      injectStyleOnce();

      const container = L.DomUtil.create('div', 'leaflet-control keyword-filter-control leaflet-bar');
      container.innerHTML =
        '<input type="text" class="keyword-filter-input" autocomplete="off" placeholder="' +
        this.options.placeholder + '">' +
        '<span class="keyword-filter-count"></span>' +
        '<button type="button" class="keyword-filter-clear" title="' +
        this.options.clearTitle + '">&#10005;</button>';

      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);

      this._input = container.querySelector('.keyword-filter-input');
      this._count = container.querySelector('.keyword-filter-count');
      this._clearBtn = container.querySelector('.keyword-filter-clear');

      L.DomEvent.on(this._input, 'keydown', (e) => {
        if (e.key === 'Enter') {
          this.applyFilter(this._input.value);
          e.preventDefault();
        }
      });

      L.DomEvent.on(this._clearBtn, 'click', () => {
        this._input.value = '';
        this.applyFilter('');
        this._input.focus();
      });

      if (this.options.enableShortcut) {
        this._onShortcut = (e) => {
          if (document.activeElement === this._input) return;
          if (e.code === this.options.shortcutKey && e.ctrlKey) {
            e.preventDefault();
            this._input.focus();
            this._input.select();
          }
        };
        document.addEventListener('keydown', this._onShortcut);
      }

      // Dynamic resize: recompute compact/full layout whenever the viewport changes.
      this._onResize = () => this._handleResize();
      window.addEventListener('resize', this._onResize);
      this._handleResize();

      if (this.options.autofocus) {
        // Defer until the control is actually in the DOM.
        setTimeout(() => this._input && this._input.focus(), 0);
      }

      return container;
    },

    onRemove: function () {
      if (this._onShortcut) document.removeEventListener('keydown', this._onShortcut);
      if (this._onResize) window.removeEventListener('resize', this._onResize);
    },

    _handleResize: function () {
      if (!this._count) return;
      const compact = window.innerWidth < 480;
      this._count.style.display = compact ? 'none' : '';
    },

    // Splits the query into whitespace-separated keywords and keeps only the
    // markers whose searchable text contains every keyword (AND-of-tokens
    // substring match, case-insensitive) — the standard approach for a
    // simple keyword-filter search box.
    applyFilter: function (text) {
      text = (text || '').toLowerCase().trim();
      const keywords = text.split(/\s+/).filter(Boolean);
      const markers = this.options.getMarkers() || [];
      const target = this.options.targetLayer;

      if (target && target.clearLayers) target.clearLayers();

      let matchCount = 0;
      markers.forEach((marker) => {
        const isMatch = keywords.length === 0 ||
          keywords.every((k) => (this.options.getSearchableText(marker) || '').toLowerCase().includes(k));
        if (isMatch) {
          matchCount++;
          if (target && target.addLayer) target.addLayer(marker);
        }
      });

      if (this._count) {
        this._count.textContent = keywords.length === 0 ? '' : matchCount;
      }

      if (typeof this.options.onFilter === 'function') {
        this.options.onFilter(keywords, matchCount);
      }

      return matchCount;
    },

    focus: function () {
      if (this._input) this._input.focus();
    },
  });

  L.control.keywordFilter = function (options) {
    return new L.Control.KeywordFilter(options);
  };

  return L.Control.KeywordFilter;
}));
