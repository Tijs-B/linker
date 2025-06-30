import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';

interface MapPaddingProps {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export default function MapPadding({ top = 0, right = 0, bottom = 0, left = 0 }: MapPaddingProps) {
  const { mainMap } = useMap();

  useEffect(() => {
    console.log(top, right, bottom, left);
    if (!mainMap) {
      return;
    }

    mainMap.setPadding({ top, right, bottom, left });
    return () => {
      mainMap.setPadding({ top: 0, right: 0, bottom: 0, left: 0 });
    };
  }, [top, right, bottom, left, mainMap]);

  return null;
}
