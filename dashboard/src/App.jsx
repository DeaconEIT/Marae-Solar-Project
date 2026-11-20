import { useEffect, useState } from 'react';
import { useTrustData } from './data/useTrustData';
import Sidebar from './components/Sidebar';
import Overview from './screens/Overview';
import Generation from './screens/Generation';
import DealModel from './screens/DealModel';
import RawData from './screens/RawData';

export default function App() {
  const { data, isLive, error } = useTrustData();
  const [screen, setScreen] = useState('overview');
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (!data) return <main className="app-main" style={{ padding: 32 }} role="status">{error || 'Loading Sigenergy recording…'}</main>;

  return (
    <div className="app-shell">
      <Sidebar
        screen={screen}
        onChange={setScreen}
        isLive={isLive}
        lastDate={data.daily[data.daily.length - 1]?.date}
        theme={theme}
        onThemeChange={setTheme}
      />
      <main className="app-main">
        <p role="status" style={{ margin: '20px 24px 0', lineHeight: 1.6 }}>
          <strong>Actual Sigenergy recording · partial day.</strong>{' '}
          {data.recording.start.replace('T', ' ')} to {data.recording.end.slice(11)}{' '}
          ({data.recording.sampleCount} readings, {Math.floor(data.recording.durationSeconds / 60)} min {data.recording.durationSeconds % 60} sec).{' '}
          Energy is estimated from measured power over this recorded window only. Times are as recorded in the workbook.
        </p>
        {error && <p role="alert" style={{ margin: 24 }}>{error} Showing the last successfully loaded recording.</p>}
        {screen === 'overview' && <Overview data={data} />}
        {screen === 'generation' && <Generation data={data} />}
        {screen === 'deals' && <DealModel data={data} />}
        {screen === 'raw' && <RawData data={data} />}
      </main>
    </div>
  );
}
