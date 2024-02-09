import {Route, Routes} from 'react-router-dom';

import App from './App';
import MainPage from './pages/MainPage.jsx';
import TeamPage from './pages/TeamPage.jsx';
import TracingPage from "./pages/TracingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";

export default function Navigation() {
    return (
        <Routes>
            <Route path="/" element={<App/>}>
                <Route index element={<MainPage/>}/>
                <Route path="team/:teamId" element={<TeamPage/>}/>
                <Route path="tracing" element={<TracingPage/>}/>
                <Route path="login" element={<LoginPage/>}/>
            </Route>
        </Routes>
    );
}
