import React, { useState, useCallback, useMemo } from 'react';
import { RefreshCw, Zap, BookOpen, ChevronDown, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

// --- INTERFACES ---

/** Defines the structure for the request payload based on lesson_plan.py */
interface LessonPlanRequest {
    school_name: string;
    state: string;
    lga?: string;
    subject: string;
    class_level: string;
    term: string;
    resumption_date: string;
    duration_weeks: number;
    topics: string[];
}

/** Backend response structure */
interface Week {
    week_number: number;
    start_date: string;
    topic: string;
    objectives: string[];
    instructional_materials: string[];
    activities: {
        introduction: string;
        explanation: string;
        guided_practice: string;
        independent_practice: string;
        practical: string;
    };
    assessment: string;
    assignment: string[];
    summary: string;
    board_summary: string;
    possible_difficulties: string[];
    period: string;
    duration: string;
}

interface LessonPlan {
    school_name: string;
    state: string;
    lga?: string;
    subject: string;
    class_level: string;
    term: string;
    resumption_date: string;
    duration_weeks: number;
    weeks: Week[];
}

interface LessonPlanResponse {
    plan: LessonPlan;
}

// --- CONSTANTS ---

const CLASS_LEVELS = [
    'Basic 1 (Pry 1)',
    'Basic 2 (Pry 2)',
    'Basic 3 (Pry 3)',
    'Basic 4 (Pry 4)',
    'Basic 5 (Pry 5)',
    'Basic 6 (Pry 6)',
    'Basic 7 (JSS 1)',
    'Basic 8 (JSS 2)',
    'Basic 9 (JSS 3)',
    'SS1',
    'SS2',
    'SS3',
];

const TERM_OPTIONS = ['First Term', 'Second Term', 'Third Term'];
const DEFAULT_DURATION = 10;
const MAX_DURATION = 10;

const getSubjectsForClass = (classLevel: string): string[] => {
    if (!classLevel) return [];

    if (['Basic 1 (Pry 1)', 'Basic 2 (Pry 2)', 'Basic 3 (Pry 3)', 'Basic 4 (Pry 4)', 'Basic 5 (Pry 5)'].includes(classLevel)) {
        return [
            'Mathematics',
            'English Language',
            'Basic Science',
            'Social Studies',
            'Physical and Health Education',
            'Christian Religious Studies',
            'Home Economics',
            'Agricultural Science',
            'Cultural and Creative Art',
            'Verbal Reasoning',
            'Quantitative Reasoning',
            'Civic Education',
            'Handwriting',
            'Computer Studies'
        ];
    }

    if (classLevel === 'Basic 6 (Pry 6)') {
        return [
            'Mathematics',
            'English Language',
            'Basic Science',
            'Social Studies',
            'Physical and Health Education',
            'Christian Religious Studies',
            'Home Economics',
            'Agricultural Science',
            'Cultural and Creative Art',
            'Verbal Reasoning',
            'Quantitative Reasoning',
            'Civic Education',
            'Computer Studies'
        ];
    }

    if (['Basic 7 (JSS 1)', 'Basic 8 (JSS 2)', 'Basic 9 (JSS 3)'].includes(classLevel)) {
        return [
            'Mathematics',
            'English Language',
            'Civic Education',
            'Social Studies',
            'Basic Science',
            'Basic Technology',
            'Computer Studies',
            'Christian Religious Studies',
            'Business Studies',
            'Agricultural Science',
            'Home Economics',
            'Physical and Health Education',
            'Cultural and Creative Art',
            'History'
        ];
    }

    if (['SS1', 'SS2', 'SS3'].includes(classLevel)) {
        return [
            'Accounting',
            'Agricultural Science',
            'Biology',
            'Chemistry',
            'Christian Religious Studies',
            'Civic Education',
            'Commerce',
            'Computer Studies/ICT',
            'Data Processing',
            'Economics',
            'English Language',
            'Entrepreneurship',
            'Fine Arts/Visual Arts',
            'French',
            'Further Mathematics',
            'General Mathematics',
            'Government',
            'History',
            'Literature-in-English',
            'Physics',
            'Technical Drawing',
            'Music',
            'Yoruba',
            'Igbo',
            'Hausa'
        ];
    }

    return [];
};

// --- COMPONENTS ---

const InputField: React.FC<{
    id: string;
    label: string;
    type: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    options?: string[];
    required?: boolean;
    min?: number;
    max?: number;
    placeholder?: string;
    disabled?: boolean;
}> = ({ id, label, type, value, onChange, options, required = false, min, max, placeholder, disabled = false }) => (
    <div className="flex flex-col space-y-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {type === 'select' ? (
            <select
                id={id}
                name={id}
                value={value}
                onChange={onChange}
                required={required}
                disabled={disabled}
                className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
                <option value="">{disabled ? `Select ${options?.length ? 'Subject' : 'Class Level First'}` : `Select ${label}`}</option>
                {options?.map(option => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
        ) : type === 'textarea' ? (
            <textarea
                id={id}
                name={id}
                value={value}
                onChange={onChange}
                required={required}
                rows={4}
                placeholder={placeholder}
                className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out resize-none"
            />
        ) : (
            <input
                id={id}
                name={id}
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                min={min}
                max={max}
                placeholder={placeholder}
                className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
            />
        )}
    </div>
);

const PlanViewer: React.FC<{ plan: LessonPlan }> = ({ plan }) => {
    const [openWeek, setOpenWeek] = useState<number | null>(null);

    const toggleWeek = useCallback((week: number) => {
        setOpenWeek(prev => (prev === week ? null : week));
    }, []);

    return (
        <div className="bg-white p-6 rounded-xl shadow-2xl mt-8 ring-4 ring-indigo-500/10">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
                <h2 className="text-3xl font-extrabold text-indigo-700 flex items-center">
                    <BookOpen className="w-8 h-8 mr-3" />
                    Generated Lesson Plan Preview
                </h2>
                <div className="text-sm font-medium text-gray-500">
                    <p>{plan.school_name} | {plan.class_level}, {plan.term}</p>
                    <p>Subject: <span className="font-semibold text-indigo-600">{plan.subject}</span></p>
                </div>
            </div>

            <div className="space-y-4">
                {plan.weeks.slice(0, 2).map(week => (
                    <div key={week.week_number} className="border border-gray-200 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition duration-300">
                        <button
                            className="w-full flex justify-between items-center p-4 bg-indigo-50 hover:bg-indigo-100 transition duration-200 focus:outline-none"
                            onClick={() => toggleWeek(week.week_number)}
                            aria-expanded={openWeek === week.week_number}
                        >
                            <span className="text-lg font-semibold text-indigo-800">
                                Week {week.week_number}: {week.topic}
                            </span>
                            <ChevronDown className={`w-5 h-5 text-indigo-600 transform transition-transform ${openWeek === week.week_number ? 'rotate-180' : 'rotate-0'}`} />
                        </button>

                        {openWeek === week.week_number && (
                            <div className="p-4 bg-white border-t border-gray-200">
                                <p className="text-sm text-gray-600 mb-4 font-medium">
                                    Starting Date: <span className="font-mono text-gray-800">{week.start_date}</span>
                                </p>
                                <div className="space-y-2">
                                    <p className="text-sm"><span className="font-semibold">Objectives:</span> {week.objectives.join(', ')}</p>
                                    <p className="text-sm"><span className="font-semibold">Materials:</span> {week.instructional_materials.join(', ')}</p>
                                    <p className="text-sm"><span className="font-semibold">Assessment:</span> {week.assessment}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {plan.weeks.length > 2 && (
                    <p className="text-center text-gray-500 text-sm">... and {plan.weeks.length - 2} more weeks. View full plan after generation.</p>
                )}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const LessonPlanner: React.FC = () => {
    const navigate = useNavigate();

    const initialFormState: LessonPlanRequest = useMemo(() => ({
        school_name: '',
        state: '',
        lga: '',
        subject: '',
        class_level: '',
        term: '',
        resumption_date: new Date().toISOString().split('T')[0],
        duration_weeks: DEFAULT_DURATION,
        topics: [],
    }), []);

    const [formData, setFormData] = useState<LessonPlanRequest>(initialFormState);
    const [rawTopics, setRawTopics] = useState<string>('');
    const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);

    const subjects = useMemo(() => getSubjectsForClass(formData.class_level), [formData.class_level]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        setFormData(prev => {
            if (name === 'class_level') {
                return {
                    ...prev,
                    class_level: value,
                    subject: '',
                };
            }

            return {
                ...prev,
                [name]: type === 'number' ? parseInt(value) || 0 : value,
            };
        });
    }, []);

    const handleTopicsChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setRawTopics(e.target.value);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setIsSuccess(false);
        setLessonPlan(null);

        const processedTopics = rawTopics
            .split(/[\n,]+/)
            .map(topic => topic.trim())
            .filter(topic => topic.length > 0);

        if (!formData.school_name || !formData.state || !formData.subject || !formData.class_level || !formData.term || !formData.resumption_date) {
            setError("Please fill in all required fields (marked with *) before generating.");
            setIsLoading(false);
            return;
        }

        const requestPayload: LessonPlanRequest = {
            ...formData,
            topics: processedTopics.slice(0, formData.duration_weeks),
        };

        try {
            const token = localStorage.getItem('token');
            const response = await apiClient.post<LessonPlanResponse>(
                'api/lesson-plan',
                requestPayload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setLessonPlan(response.data.plan);
            setIsSuccess(true);

            // Navigate to review page after successful generation
            setTimeout(() => {
                navigate('/lessons/review', { state: { lessonPlan: response.data.plan } });
            }, 1500);
        } catch (err: unknown) {
            console.error(err);
            let errorMsg = 'Failed to generate lesson plan. Please check your inputs and try again.';
            if (typeof err === 'object' && err !== null && 'response' in err) {
                const response = (err as { response?: { data?: { detail?: string } } }).response;
                if (response && response.data && response.data.detail) {
                    errorMsg = response.data.detail;
                }
            }
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-['Inter']">
            <div className="max-w-4xl mx-auto">
                <header className="text-center py-6">
                    <h1 className="text-4xl font-extrabold text-gray-900 flex items-center justify-center">
                        <Zap className="w-8 h-8 text-indigo-600 mr-2" />
                        AI Lesson Plan Generator
                    </h1>
                    <p className="mt-2 text-lg text-gray-500">
                        Effortlessly create a comprehensive, week-by-week lesson plan.
                    </p>
                </header>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center shadow-md" role="alert">
                        <XCircle className="w-5 h-5 mr-3" />
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                {isSuccess && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-4 flex items-center shadow-md" role="alert">
                        <CheckCircle className="w-5 h-5 mr-3" />
                        <span className="block sm:inline">Lesson plan successfully generated! Redirecting to review page...</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-xl space-y-6 border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800 border-b pb-3">1. School & Context Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                            id="school_name"
                            label="School Name"
                            type="text"
                            value={formData.school_name}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Global High School"
                        />
                        <InputField
                            id="state"
                            label="State/Region"
                            type="text"
                            value={formData.state}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Lagos"
                        />
                        <InputField
                            id="lga"
                            label="LGA / City (Optional)"
                            type="text"
                            value={formData.lga || ''}
                            onChange={handleChange}
                            placeholder="e.g., Ikeja"
                        />
                        <InputField
                            id="resumption_date"
                            label="Term Resumption Date"
                            type="date"
                            value={formData.resumption_date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 pt-4">2. Curriculum Details</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <InputField
                            id="class_level"
                            label="Class Level"
                            type="select"
                            value={formData.class_level}
                            onChange={handleChange}
                            options={CLASS_LEVELS}
                            required
                        />
                        <InputField
                            id="subject"
                            label="Subject"
                            type="select"
                            value={formData.subject}
                            onChange={handleChange}
                            options={subjects}
                            disabled={subjects.length === 0}
                            required
                        />
                        <InputField
                            id="term"
                            label="Term"
                            type="select"
                            value={formData.term}
                            onChange={handleChange}
                            options={TERM_OPTIONS}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                            id="duration_weeks"
                            label={`Duration (Weeks, Max ${MAX_DURATION})`}
                            type="number"
                            value={formData.duration_weeks}
                            onChange={handleChange}
                            required
                            min={1}
                            max={MAX_DURATION}
                        />
                        <InputField
                            id="topics"
                            label={`Topics (List one per line, up to ${formData.duration_weeks})`}
                            type="textarea"
                            value={rawTopics}
                            onChange={handleTopicsChange}
                            required={false}
                            placeholder="Enter main topics, one per line or separated by commas. (e.g.,&#10;1. Set Theory&#10;2. Algebraic Expressions&#10;3. Linear Equations)"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || subjects.length === 0 || !formData.class_level}
                        className={`w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg transition duration-300 ease-in-out ${isLoading || subjects.length === 0 || !formData.class_level
                            ? 'bg-indigo-300 text-white cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 transform hover:scale-[1.01]'
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                                Generating Plan...
                            </>
                        ) : (
                            <>
                                <Zap className="w-5 h-5 mr-3" />
                                Generate Lesson Plan
                            </>
                        )}
                    </button>
                </form>

                {lessonPlan && <PlanViewer plan={lessonPlan} />}

                <footer className="text-center mt-12 text-gray-400 text-sm">
                    <p>&copy; {new Date().getFullYear()} AI Lesson Planner. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default LessonPlanner;