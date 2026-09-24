import { useEffect, useState } from 'react';
import { useTrustData } from './data/useTrustData';
import Sidebar from './components/Sidebar';
import Overview from './screens/Overview';
import Generation from './screens/Generation';
import DealModel from './screens/DealModel';
import RawData from './screens/RawData';

export default function App() {
  const { data, isLive } = useTrustData();
  const [screen, setScreen] = useState('overview');
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
        {screen === 'overview' && <Overview data={data} />}
        {screen === 'generation' && <Generation data={data} />}
        {screen === 'deals' && <DealModel data={data} />}
        {screen === 'raw' && <RawData data={data} />}
      </main>
    </div>
  );
}
