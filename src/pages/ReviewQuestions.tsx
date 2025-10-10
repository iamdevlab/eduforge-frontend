import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, FileDown, Loader2 } from 'lucide-react';

// Import libraries for exporting
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

// --- Type Definitions (from ExamQuestions.tsx) ---
// It's good practice to move these to a shared types file (e.g., types.ts)
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

export default function ReviewQuestions() {
    const location = useLocation();
    const navigate = useNavigate();
    const contentRef = useRef<HTMLDivElement>(null);

    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isExportingDocx, setIsExportingDocx] = useState(false);

    // Retrieve generated data from navigation state
    const generatedData = location.state?.generatedData as QuestionResponse | null;

    /**
     * Handles exporting the displayed content to a PDF file.
     * Uses html2canvas to capture the content as an image and jspdf to create the PDF.
     */
    const handleExportPDF = async () => {
        const input = contentRef.current;
        if (!input) return;

        setIsExportingPdf(true);
        try {
            const canvas = await html2canvas(input, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = pdfHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();

            while (heightLeft >= 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }

            pdf.save('exam-questions.pdf');
        } catch (error) {
            console.error('Failed to export PDF:', error);
            alert('Could not export to PDF. Please try again.');
        } finally {
            setIsExportingPdf(false);
        }
    };

    /**
     * Handles exporting the question data to a DOCX file.
     * Programmatically builds a .docx file using the 'docx' library.
     */
    const handleExportDOCX = async () => {
        if (!generatedData) return;
        setIsExportingDocx(true);

        try {
            const docChildren = [];

            // Add Title (using a placeholder)
            docChildren.push(new Paragraph({
                text: "Exam Question\nSubject: ......",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
            }));

            // Add Objective Questions
            if (generatedData.objectives.length > 0) {
                docChildren.push(new Paragraph({
                    text: "Objectives", // Changed heading
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 200, after: 100 },
                }));

                generatedData.objectives.forEach((obj, idx) => {
                    docChildren.push(new Paragraph({
                        children: [
                            new TextRun({ text: `${idx + 1}. `, bold: true }),
                            new TextRun(obj.question),
                        ],
                        spacing: { after: 100 },
                    }));
                    Object.entries(obj.options).forEach(([key, value]) => {
                        docChildren.push(new Paragraph({ text: `\t(${key}). ${value}` }));
                    });
                    docChildren.push(new Paragraph("")); // Add spacing after each question
                });
            }

            // Add Essay Questions
            if (generatedData.essays.length > 0) {
                docChildren.push(new Paragraph({
                    text: "Essay Part", // Changed heading
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 200, after: 50 },
                }));
                docChildren.push(new Paragraph({
                    text: "Section B(Theory)", // Added subtitle
                    heading: HeadingLevel.HEADING_3,
                    spacing: { after: 100 },
                }));

                generatedData.essays.forEach((essay, idx) => {
                    const qNum = idx + 1; // Essay numbering restarts at 1

                    if (essay.sub_questions?.length > 0) {
                        // Nested style (1a, 1b, etc.)
                        const allNested = [essay.question, ...essay.sub_questions];

                        // Skip generic header like "Question 1"
                        const firstQuestionLower = essay.question.toLowerCase().trim();
                        const isGenericHeader = firstQuestionLower.startsWith('question') ||
                            firstQuestionLower.startsWith('essay');

                        const questionsToRender = (isGenericHeader && allNested.length > 1)
                            ? allNested.slice(1)
                            : allNested;

                        questionsToRender.forEach((sub, subIdx) => {
                            const subLabel = String.fromCharCode(97 + subIdx); // 'a', 'b', 'c'

                            // FIX (1): Strip leading number/label from the sub-question text to prevent double numbering
                            const cleanedSub = sub.replace(/^(\d+\.?\s*|\d+[a-z]\.?\s*)/, '').trim();

                            docChildren.push(new Paragraph({
                                children: [
                                    new TextRun({ text: `${qNum}${subLabel}. `, bold: true }),
                                    new TextRun(cleanedSub),
                                ],
                                spacing: { after: 50 },
                            }));
                        });
                    } else {
                        // Single style (1., 2., etc.)
                        docChildren.push(new Paragraph({
                            children: [
                                new TextRun({ text: `${qNum}. `, bold: true }),
                                new TextRun(essay.question),
                            ],
                            spacing: { after: 100 },
                        }));
                    }
                    docChildren.push(new Paragraph("")); // Spacing
                });
            }

            // Add Answer Key on a new page
            if (generatedData.answers.length > 0) {
                docChildren.push(new Paragraph({ children: [new PageBreak()] }));
                docChildren.push(new Paragraph({
                    text: "Answer Key",
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 200, after: 100 },
                }));

                generatedData.answers.forEach((ans, idx) => {
                    docChildren.push(new Paragraph({
                        children: [
                            new TextRun({ text: `${idx + 1}. `, bold: true }),
                            new TextRun(ans.answer),
                        ],
                    }));
                });
            }

            const doc = new Document({ sections: [{ children: docChildren }] });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, 'exam-questions.docx');
        } catch (error) {
            console.error('Failed to export DOCX:', error);
            alert('Could not export to DOCX. Please try again.');
        } finally {
            setIsExportingDocx(false);
        }
    };

    // Render a fallback UI if the user navigates here directly without data
    if (!generatedData) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 text-center">
                <AlertTriangle className="mx-auto w-16 h-16 text-yellow-400" />
                <h1 className="mt-4 text-2xl font-bold text-gray-800">No Questions Found</h1>
                <p className="mt-2 text-gray-600">
                    Please generate a new set of questions first.
                </p>
                <button
                    onClick={() => navigate('/exams/generate')} // Adjust this path if necessary
                    className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Go to Generator
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* --- Header --- */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Review Exam Questions</h1>
                            <p className="text-gray-500 mt-1">Review the generated questions and export them.</p>
                        </div>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 text-sm self-start sm:self-center"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                    </div>

                    {/* --- Action Buttons --- */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <button
                            onClick={handleExportDOCX}
                            disabled={isExportingDocx}
                            className="w-full sm:w-auto flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                            {isExportingDocx ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
                            <span>Export to DOCX</span>
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={isExportingPdf}
                            className="w-full sm:w-auto flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                            {isExportingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
                            <span>Export to PDF</span>
                        </button>
                    </div>

                    {/* --- Content to be Exported (and displayed) --- */}
                    <div ref={contentRef} className="space-y-8 p-6 border rounded-lg bg-white">
                        {/* Objectives */}
                        {generatedData.objectives?.length > 0 && (
                            <section>
                                <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Objectives</h3> {/* FIX: Changed heading */}
                                <div className="space-y-5">
                                    {generatedData.objectives.map((obj, idx) => (
                                        <div key={`obj-${idx}`}>
                                            <p className="font-medium text-gray-800 mb-2">{idx + 1}. {obj.question}</p>
                                            <div className="ml-6 space-y-1">
                                                {Object.entries(obj.options).map(([key, value]) => (
                                                    <p key={key} className="text-gray-700">{key}. {value}</p>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Essays */}
                        {generatedData.essays?.length > 0 && (
                            <section>
                                <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Essay Part</h3> {/* FIX: Changed heading */}
                                <p className="text-lg font-medium text-gray-700 mb-4">Section B(Theory)</p> {/* FIX: Added subtitle */}
                                <div className="space-y-5">
                                    {generatedData.essays.map((essay, idx) => {
                                        const qNum = idx + 1; // FIX: Essay numbering restarts at 1

                                        if (essay.sub_questions?.length > 0) {
                                            // FIX: Logic for nested questions (1a, 1b, etc.)
                                            const allNested = [essay.question, ...essay.sub_questions];

                                            // Check if the first item is a generic header to be skipped
                                            const firstQuestionLower = essay.question.toLowerCase().trim();
                                            const isGenericHeader = firstQuestionLower.startsWith('question') ||
                                                firstQuestionLower.startsWith('essay');

                                            // If it's a generic header and there are other questions, slice from 1
                                            const questionsToRender = (isGenericHeader && allNested.length > 1)
                                                ? allNested.slice(1)
                                                : allNested;


                                            return (
                                                <div key={`essay-nested-${idx}`} className="ml-6 mt-2 space-y-1">
                                                    {questionsToRender.map((sub, subIdx) => {
                                                        // FIX (1): Strip leading number/label from the sub-question text to prevent double numbering
                                                        const cleanedSub = sub.replace(/^(\d+\.?\s*|\d+[a-z]\.?\s*)/, '').trim();

                                                        return (
                                                            <p key={subIdx} className="text-gray-700">
                                                                <span className="font-medium text-gray-800">{qNum}{String.fromCharCode(97 + subIdx)}. </span>
                                                                {cleanedSub}
                                                            </p>
                                                        )
                                                    })}
                                                </div>
                                            );
                                        } else {
                                            // Render single questions (1., 2., etc.)
                                            return (
                                                <div key={`essay-single-${idx}`}>
                                                    <p className="font-medium text-gray-800 mb-2">{qNum}. {essay.question}</p>
                                                </div>
                                            );
                                        }
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Answers */}
                        {generatedData.answers?.length > 0 && (
                            <section>
                                <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Answer Key</h3>

                                {/* 1. Objective Answers */}
                                {generatedData.answers.filter(a => a.type === "objective").length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-lg font-semibold text-gray-600 mb-2">Objectives Answers</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                            {generatedData.answers.filter(a => a.type === "objective").map((ans, idx) => (
                                                <div key={`ans-obj-${idx}`} className="p-2 bg-green-50 rounded border border-green-200 text-center">
                                                    <p className="text-sm text-green-900">
                                                        <span className="font-bold">{idx + 1}. </span>
                                                        <span>{ans.answer.toUpperCase()}</span> {/* Optional: Capitalize for clarity */}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 2. Essay Answers */}
                                {generatedData.answers.filter(a => a.type === "essay").length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-lg font-semibold text-gray-600 mb-2">Essay Answers</h4>
                                        {/* FIX: Use space-y-3 for separation between answers, ensuring each starts on a new line */}
                                        <div className="space-y-3">
                                            {generatedData.answers.filter(a => a.type === "essay").map((ans, idx) => {
                                                // Replace escaped newlines for proper display
                                                let formattedAnswer = ans.answer.replace(/\\n/g, '\n');

                                                // FIX (2): Remove the trailing placeholder text like " 1b. [Answer for sub-question 2]"
                                                formattedAnswer = formattedAnswer.replace(/\s+\d+[a-z]\.\s*\[Answer for sub-question \d+\]\s*$/, '').trim();

                                                return (
                                                    <div key={`ans-essay-${idx}`} className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded whitespace-pre-wrap">
                                                        {/* FIX: Print the formatted answer directly, assuming it contains the label (e.g., "1a. ") */}
                                                        <p className="text-sm text-gray-800">
                                                            {formattedAnswer}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}