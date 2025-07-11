import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { ControlPosition, IControl, MapInstance } from 'react-map-gl/maplibre';
import { useControl } from 'react-map-gl/maplibre';

class OverlayControl implements IControl {
  _map: MapInstance | null = null;
  _container: HTMLElement | null = null;
  _redraw: (_: void) => void;

  constructor(redraw: (_: void) => void) {
    this._redraw = redraw;
  }

  onAdd(map: MapInstance) {
    this._map = map;
    map.on('move', this._redraw);
    this._container = document.createElement('div');
    this._container.setAttribute('style', 'pointer-events: all;');
    this._redraw();
    return this._container;
  }

  onRemove() {
    this._container?.remove();
    this._map?.off('move', this._redraw);
    this._map = null;
  }

  getMap() {
    return this._map;
  }

  getElement() {
    return this._container!;
  }
}

interface CustomOverlayProps {
  children: React.ReactNode;
  position?: ControlPosition;
}

export default function CustomOverlay({ children, position = 'top-right' }: CustomOverlayProps) {
  // eslint-disable-next-line
  'use no memo';

  const [, setVersion] = useState(0);
  const ctrl = useControl(
    () => {
      const forceUpdate = () => setVersion((v) => v + 1);
      return new OverlayControl(forceUpdate);
    },
    { position },
  );

  const map = ctrl.getMap();
  return (
    map &&
    createPortal(
      <div className="maplibregl-ctrl maplibregl-ctrl-group">{children}</div>,
      ctrl.getElement(),
    )
  );
}
