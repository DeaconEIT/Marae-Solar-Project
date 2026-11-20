// Load the published Sigenergy recording; never substitute synthetic readings.
import { useEffect, useRef, useState } from 'react';
import { loadReadings } from './loadReadings';

export const POLL_INTERVAL_MS = 5 * 60 * 1000; // periodic report, not a live feed

export function useTrustData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    async function load() {
      try {
        const readings = await loadReadings();
        if (mounted.current) {
          setData(readings);
          setIsLive(true);
          setError(null);
        }
      } catch (err) {
        if (mounted.current) {
          setIsLive(false);
          setError('Unable to load the Sigenergy recording. Please reload to try again.');
        }
      }
    }

    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, []);

  return { data, isLive, error };
}
