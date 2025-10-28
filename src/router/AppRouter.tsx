import { BrowserRouter as Router, Routes, Route, } from "react-router-dom";

// Components
import Layout from "../components/Layout";

// Pages
import LandingPage from "../pages/LandingPage";
import LessonPlanner from "../pages/LessonPlanner";
import ExamQuestions from "../pages/ExamQuestions";
import NotFound from "../pages/NotFound";
import LoginPage from "../pages/LoginPage";
import ReviewQuestions from "../pages/ReviewQuestions";
import ReviewLessonPlan from "../pages/ReviewLessonPlan";
import { UpgradeModal } from "../components/UpgradeModal";
import PricingPage from "../pages/PricingPage";


function AppRouter() {
    return (
        <Router>
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Protected routes */}
                <Route element={<Layout />}>
                    {/* Default redirect once inside app */}
                    {/* <Route index element={<Navigate to="lessons" replace />} /> */}
                    <Route path="lessons" element={<LessonPlanner />} />
                    <Route path="exams" element={<ExamQuestions />} />
                    <Route path="exams/review" element={<ReviewQuestions />} />
                    <Route path="pricing" element={<PricingPage />} />
                    <Route path="lessons/review" element={<ReviewLessonPlan />} />
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
            <UpgradeModal />
        </Router>
    );
}

export default AppRouter;
