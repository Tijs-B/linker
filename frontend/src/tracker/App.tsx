import { useCallback, useEffect, useRef, useState } from 'react';

import { useCreatePhoneGpsPositionMutation, useGetPhoneGpsInfoQuery } from '../services/linker';

const token = new URLSearchParams(window.location.search).get('token');

type UploadResult =
  { ok: true; time: Date; count: number } | { ok: false; invalidToken: boolean; time: Date };

export default function App() {
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const uploadCount = useRef(0);
  const watchId = useRef<number | null>(null);
  const watchdogId = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: info } = useGetPhoneGpsInfoQuery(token ?? '', { skip: !token });
  const [createPosition] = useCreatePhoneGpsPositionMutation();

  const upload = useCallback(
    async (pos: GeolocationPosition) => {
      if (!token) return;
      try {
        await createPosition({
          token,
          timestamp: new Date(pos.timestamp).toISOString(),
          point: { type: 'Point', coordinates: [pos.coords.longitude, pos.coords.latitude] },
        }).unwrap();
        uploadCount.current += 1;
        setUploadResult({ ok: true, time: new Date(), count: uploadCount.current });
      } catch (e: unknown) {
        const invalidToken =
          typeof e === 'object' &&
          e !== null &&
          'status' in e &&
          e.status === 400 &&
          'data' in e &&
          typeof e.data === 'object' &&
          e.data !== null &&
          'token' in e.data;
        setUploadResult({ ok: false, invalidToken: Boolean(invalidToken), time: new Date() });
        if (invalidToken) setActive(false);
      }
    },
    [createPosition],
  );

  const uploadRef = useRef(upload);
  useEffect(() => {
    uploadRef.current = upload;
  }, [upload]);

  useEffect(() => {
    if (!active) {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      if (watchdogId.current !== null) {
        clearTimeout(watchdogId.current);
        watchdogId.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setGeoError('Je browser ondersteunt geen locatie delen. Probeer een andere browser.');
      setActive(false);
      return;
    }

    function startWatch() {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      if (watchdogId.current !== null) clearTimeout(watchdogId.current);

      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          clearTimeout(watchdogId.current!);
          watchdogId.current = setTimeout(startWatch, 15_000);
          setPosition(pos);
          setGeoError(null);
          uploadRef.current(pos);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setGeoError(
              'Je hebt locatietoegang geweigerd. Geef toestemming in je browserinstellingen en probeer opnieuw.',
            );
          } else {
            setGeoError('Kon je locatie niet ophalen. Zorg dat je GPS aan staat.');
          }
        },
        { enableHighAccuracy: true },
      );
    }

    setGeoError(null);
    startWatch();

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      if (watchdogId.current !== null) {
        clearTimeout(watchdogId.current);
        watchdogId.current = null;
      }
    };
  }, [active, upload]);

  if (!token) {
    return (
      <div className="page">
        <h1>📍 Locatie delen</h1>
        <div className="banner error">
          Deze link is ongeldig. Vraag een nieuwe link aan de Basisbitch.
        </div>
        <p className="xoxo">xoxo</p>
      </div>
    );
  }

  const accuracyLabel = position
    ? position.coords.accuracy < 20
      ? '🟢 Uitstekend'
      : position.coords.accuracy < 60
        ? '🟡 Redelijk'
        : '🔴 Slecht'
    : null;

  return (
    <div className="page">
      <h1>📍 Locatie delen</h1>
      {info && <p className="tracker-label">{info.label}</p>}
      <p className="subtitle">Druk op de knop en de Basisbitch ziet waar je bent.</p>

      <button
        className={`btn-toggle ${active ? 'stop' : 'start'}`}
        onClick={() => setActive((a) => !a)}
      >
        {active ? '🛑 Stop met delen' : '📡 Deel mijn locatie'}
      </button>

      <div className="status-row">
        <span className={`dot ${active ? 'active' : ''}`} />
        <span>
          {active ? 'Bezig met doorsturen naar de Basisbitch…' : 'Locatie delen staat uit'}
        </span>
      </div>

      {geoError && <div className="banner error">⚠️ {geoError}</div>}

      {uploadResult && !geoError && (
        <div className={`banner ${uploadResult.ok ? 'ok' : 'error'}`}>
          {uploadResult.ok
            ? `✅ Locatie doorgestuurd! (${uploadResult.count}× gestuurd, laatste om ${uploadResult.time.toLocaleTimeString('nl-BE')})`
            : uploadResult.invalidToken
              ? `❌ Ongeldige link. Vraag een nieuwe link aan de Basisbitch.`
              : `❌ Oeps! Kon je locatie niet doorsturen om ${uploadResult.time.toLocaleTimeString('nl-BE')}. Probeer opnieuw.`}
        </div>
      )}

      {position && (
        <div className="info-table">
          <div className="info-row">
            <span className="label">Nauwkeurigheid</span>
            <span className="value">
              {accuracyLabel} (±{position.coords.accuracy.toFixed(0)} m)
            </span>
          </div>
          <div className="info-row">
            <span className="label">Laatste update</span>
            <span className="value">
              {new Date(position.timestamp).toLocaleTimeString('nl-BE')}
            </span>
          </div>
        </div>
      )}

      <p className="xoxo">xoxo</p>
    </div>
  );
}
