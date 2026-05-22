import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import FloatChat from './components/FloatChat';
import DashboardLayout from './layouts/DashboardLayout';
import MainLayout from './layouts/MainLayout';
import Games from './pages/dashboard/Games';
import CourseTopics from './pages/dashboard/CourseTopics';
import Courses from './pages/dashboard/Courses';
import Overview from './pages/dashboard/Overview';
import Settings from './pages/dashboard/Settings';
import Stats from './pages/dashboard/Stats';
import TopicWords from './pages/dashboard/TopicWords';
import TOEIC from './pages/dashboard/TOEIC';
import LandingPage from './pages/landingPage/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import { initializeTheme } from './utils/theme';

function App() {
    useEffect(() => {
        initializeTheme();
    }, []);

    return (
        <>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                </Route>

                <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<Overview />} />
                    <Route path="courses">
                        <Route index element={<Courses />} />
                        <Route path=":courseId" element={<CourseTopics />} />
                        <Route path=":courseId/topic/:topicId" element={<TopicWords />} />
                        <Route path="custom/topic/:topicId" element={<TopicWords />} />
                    </Route>
                    <Route path="games" element={<Games />} />
                    <Route path="toeic" element={<TOEIC />} />
                    <Route path="stats" element={<Stats />} />
                    <Route path="settings" element={<Settings />} />
                </Route>
            </Routes>
            <FloatChat />
        </>
    );
}

export default App;
