import {cloneElement, useState} from 'react';
import {createPortal} from 'react-dom';
import {useControl} from 'react-map-gl/maplibre';

class OverlayControl {
    _map = null;
    _container = null;
    _redraw = null;

    constructor(redraw) {
        this._redraw = redraw;
    }

    onAdd(map) {
        this._map = map;
        map.on('move', this._redraw);
        this._container = document.createElement('div');
        this._container.style = {pointerEvents: 'all'};
        this._redraw();
        return this._container;
    }

    onRemove() {
        this._container.remove();
        this._map.off('move', this._redraw);
        this._map = null;
    }

    getMap() {
        return this._map;
    }

    getElement() {
        return this._container;
    }
}

export default function CustomOverlay({children, position}) {
    const [, setVersion] = useState(0);
    const ctrl = useControl(() => {
        const forceUpdate = () => setVersion((v) => v + 1);
        return new OverlayControl(forceUpdate);
    }, {position});

    const map = ctrl.getMap();
    return map && createPortal(cloneElement(children, {map}), ctrl.getElement());
}
