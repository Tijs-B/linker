import {memo, useEffect} from 'react';
import { useMap } from 'react-map-gl/maplibre';

const MapPadding = memo(function MapPadding({ top, right, bottom, left }) {
  const { mainMap } = useMap();

  useEffect(() => {
    mainMap.setPadding({
      top,
      right,
      bottom,
      left,
    });
    return () => {
      mainMap.setPadding({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      });
    };
  }, [top, right, bottom, left, mainMap]);

  return null;
});

export default MapPadding;
