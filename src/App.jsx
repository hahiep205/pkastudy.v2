import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import FloatChat from './components/FloatChat';
import RequireAdmin from './components/manager/RequireAdmin';
import DashboardLayout from './layouts/DashboardLayout';
import ManagerLayout from './layouts/ManagerLayout';
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
import ManagerCourses from './pages/manager/Courses';
import ManagerOverview from './pages/manager/Overview';
import ManagerSupport from './pages/manager/Support';
import ManagerToeic from './pages/manager/Toeic';
import ManagerToeicBuilder from './pages/manager/ToeicBuilder';
import ManagerTopics from './pages/manager/Topics';
import ManagerUsers from './pages/manager/Users';
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

                <Route element={<RequireAdmin />}>
                    <Route path="/manager" element={<ManagerLayout />}>
                        <Route index element={<ManagerOverview />} />
                        <Route path="users" element={<ManagerUsers />} />
                        <Route path="support" element={<ManagerSupport />} />
                        <Route path="courses" element={<ManagerCourses />} />
                        <Route path="courses/:courseId/topics" element={<ManagerTopics />} />
                        <Route path="toeic" element={<ManagerToeic />} />
                        <Route path="toeic/:testId" element={<ManagerToeicBuilder />} />
                    </Route>
                </Route>
            </Routes>
            <FloatChat />
        </>
    );
}

export default App;
