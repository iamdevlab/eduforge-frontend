import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { AlertCircle, BookOpen, Plus, X, Loader2 } from 'lucide-react';
import axios from 'axios';

interface FormData {
    region: string;
    subject: string;
    class_level: string;
    topics: string[];
    difficulty: string;
    num_objectives: number;
    num_essays: number;
    essay_style: string;
}

interface Objective {
    question: string;
    options: Record<string, string>;
}

interface Essay {
    question: string;
    sub_questions: string[];
}

interface Answer {
    type: "objective" | "essay";
    answer: string;
}

interface QuestionResponse {
    objectives: Objective[];
    essays: Essay[];
    answers: Answer[];
}

export default function ExamQuestions() {
    const [formData, setFormData] = useState<FormData>({
        region: '',
        subject: '',
        class_level: '',
        topics: [],
        difficulty: 'medium',
        num_objectives: 0,
        num_essays: 0,
        essay_style: 'single'
    });

    const [currentTopic, setCurrentTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [response, setResponse] = useState<QuestionResponse | null>(null);
    const navigate = useNavigate();

    const regions = ['Nigeria', 'Ghana', 'Kenya', 'South Africa',];

    const classLevels = [
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

    const difficulties = ['easy', 'medium', 'hard'];

    const getSubjectsForClass = (classLevel: string): string[] => {
        if (!classLevel) return [];

        // Basic 1-5
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

        // Basic 6
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

        // Basic 7-9 (JSS)
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

        // SS 1-3
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

    const subjects = getSubjectsForClass(formData.class_level);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // If class level changes, reset subject
        if (name === 'class_level') {
            setFormData(prev => ({
                ...prev,
                class_level: value,
                subject: '' // Reset subject when class level changes
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name.includes('num_') ? parseInt(value) || 0 : value
            }));
        }
    };

    const addTopic = () => {
        if (currentTopic.trim() && !formData.topics.includes(currentTopic.trim())) {
            setFormData(prev => ({
                ...prev,
                topics: [...prev.topics, currentTopic.trim()]
            }));
            setCurrentTopic('');
        }
    };

    const removeTopic = (topic: string) => {
        setFormData(prev => ({
            ...prev,
            topics: prev.topics.filter(t => t !== topic)
        }));
    };

    const handleSubmit = async () => {
        setError('');
        setResponse(null);

        if (!formData.region || !formData.subject || !formData.class_level) {
            setError('Please fill in all required fields');
            return;
        }

        if (formData.topics.length === 0) {
            setError('Please add at least one topic');
            return;
        }

        if (formData.num_objectives === 0 && formData.num_essays === 0) {
            setError('Please specify at least one objective or essay question');
            return;
        }

        setLoading(true);

        try {
            // const token = localStorage.getItem('token');

            // const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            // if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await apiClient.post('/questions/generate', formData);

            const data = res.data;
            setResponse(data);

            // On successful generation, navigate to the review page and pass the generated data
            try {
                navigate('/exams/review', { state: { generatedData: data } });
            } catch (navErr) {
                console.error('Navigation to review page failed', navErr);
            }
        } catch (err: unknown) {
            console.error("Error generating questions:", err); // Log the full error

            if (axios.isAxiosError(err)) {
                if (err.response?.status === 401) {
                    // 401 Unauthorized (Token expired or invalid)
                    setError("Your session has expired. Redirecting to login...");
                    // The apiClient interceptor already handled the logout.
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                } else if (err.response?.status === 402) {
                    // 402 Payment Required (Free limit hit)
                    // The apiClient interceptor handles showing the modal.
                    // We just show the error message from the backend.
                    const detail = err.response.data?.detail || "You have reached your free generation limit. Please upgrade.";
                    setError(detail);
                } else {
                    // Other server error (e.g., 400 Validation, 500 Internal)
                    const detail = err.response?.data?.detail || "An unexpected error occurred. Please try again.";
                    setError(detail);
                }
            } else {
                // Not an axios error (e.g., network error, client-side bug)
                setError("An error occurred. Please check your connection and try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <BookOpen className="w-8 h-8 text-indigo-600" />
                        <h1 className="text-3xl font-bold text-gray-800">Generate Exam Questions</h1>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Region <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="region"
                                    value={formData.region}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="">Select Region</option>
                                    {regions.map(region => (
                                        <option key={region} value={region}>{region}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Class Level <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="class_level"
                                    value={formData.class_level}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="">Select Class</option>
                                    {classLevels.map(level => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    disabled={!formData.class_level}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    <option value="">
                                        {formData.class_level ? 'Select Subject' : 'Select Class Level First'}
                                    </option>
                                    {subjects.map(subject => (
                                        <option key={subject} value={subject}>{subject}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Topics <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={currentTopic}
                                    onChange={(e) => setCurrentTopic(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTopic();
                                        }
                                    }}
                                    placeholder="Enter a topic and press Add"
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <button
                                    type="button"
                                    onClick={addTopic}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add
                                </button>
                            </div>

                            {formData.topics.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.topics.map(topic => (
                                        <span
                                            key={topic}
                                            className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                                        >
                                            {topic}
                                            <button
                                                type="button"
                                                onClick={() => removeTopic(topic)}
                                                className="hover:text-indigo-900"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Difficulty
                                </label>
                                <select
                                    name="difficulty"
                                    value={formData.difficulty}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    {difficulties.map(diff => (
                                        <option key={diff} value={diff}>
                                            {diff}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Objective Questions
                                </label>
                                <input
                                    type="number"
                                    name="num_objectives"
                                    value={formData.num_objectives}
                                    onChange={handleInputChange}
                                    min="0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Essay Questions
                                </label>
                                <input
                                    type="number"
                                    name="num_essays"
                                    value={formData.num_essays}
                                    onChange={handleInputChange}
                                    min="0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {formData.num_essays > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Essay Style
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="essay_style"
                                            value="single"
                                            checked={formData.essay_style === 'single'}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700">Single (Flat questions)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="essay_style"
                                            value="nested"
                                            checked={formData.essay_style === 'nested'}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700">Nested (1a, 1b, 1c style)</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Requesting Questions...
                                </>
                            ) : (
                                'Request Questions'
                            )}
                        </button>
                    </div>

                    {response && (
                        <div className="mt-8 space-y-6">
                            <div className="border-t pt-6">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">Examination Questions</h2>

                                {response.objectives && response.objectives.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-xl font-semibold text-gray-700 mb-3">Objective Questions</h3>
                                        <div className="space-y-4">
                                            {response.objectives.map((obj, idx) => (
                                                <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                                                    <p className="font-medium text-gray-800 mb-2">{idx + 1}. {obj.question}</p>
                                                    <div className="ml-4 space-y-1">
                                                        {Object.entries(obj.options).map(([key, value]) => (
                                                            <p key={key} className="text-sm text-gray-600">
                                                                {key}. {value}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {response.essays && response.essays.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-xl font-semibold text-gray-700 mb-3">Essay Questions</h3>
                                        <div className="space-y-4">
                                            {response.essays.map((essay, idx) => (
                                                <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                                                    <p className="font-medium text-gray-800 mb-2">{idx + 1}. {essay.question}</p>
                                                    {essay.sub_questions && essay.sub_questions.length > 0 && (
                                                        <div className="ml-4 mt-2 space-y-1">
                                                            {essay.sub_questions.map((sub, subIdx) => (
                                                                <p key={subIdx} className="text-sm text-gray-600">
                                                                    {String.fromCharCode(97 + subIdx)}. {sub}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {response.answers && response.answers.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-700 mb-3">Answers</h3>
                                        <div className="space-y-2">
                                            {response.answers.map((ans, idx) => (
                                                <div key={idx} className="p-3 bg-green-50 rounded-lg">
                                                    <p className="text-sm">
                                                        <span className="font-medium text-gray-700">{idx + 1}. </span>
                                                        <span className="text-gray-600">{ans.answer}</span>
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}