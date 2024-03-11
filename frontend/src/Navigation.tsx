import { Route, Routes } from 'react-router-dom';

import App from './App';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import TeamPage from './pages/TeamPage';
import TracingPage from './pages/TracingPage';

export default function Navigation() {
  return (
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<MainPage />} />
        <Route path="team/:teamId" element={<TeamPage />} />
        <Route path="tracing" element={<TracingPage />} />
        <Route path="login" element={<LoginPage />} />
      </Route>
    </Routes>
  );
}
