import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileDown, Loader2 } from 'lucide-react';

// Import libraries for exporting
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

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

export default function ReviewLessonPlan() {
    const location = useLocation();
    const navigate = useNavigate();
    const contentRef = useRef<HTMLDivElement>(null);

    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isExportingDocx, setIsExportingDocx] = useState(false);

    const plan = location.state?.lessonPlan as LessonPlan | null;

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

            pdf.save(`lesson-plan-${plan?.subject}-${plan?.class_level}.pdf`);
        } catch (error) {
            console.error('Failed to export PDF:', error);
            alert('Could not export to PDF. Please try again.');
        } finally {
            setIsExportingPdf(false);
        }
    };

    const handleExportDOCX = async () => {
        if (!plan) return;
        setIsExportingDocx(true);

        try {
            const docChildren = [];

            // Title Page
            docChildren.push(new Paragraph({
                text: "LESSON PLAN",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
            }));

            docChildren.push(new Paragraph({
                text: `School: ${plan.school_name}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
            }));

            docChildren.push(new Paragraph({
                text: `Subject: ${plan.subject}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
            }));

            docChildren.push(new Paragraph({
                text: `Class: ${plan.class_level}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
            }));

            docChildren.push(new Paragraph({
                text: `Term: ${plan.term}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
            }));

            docChildren.push(new Paragraph({
                text: `State: ${plan.state}${plan.lga ? `, ${plan.lga}` : ''}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
            }));

            docChildren.push(new Paragraph({
                text: `Resumption Date: ${plan.resumption_date}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
            }));

            docChildren.push(new Paragraph({
                text: `Duration: ${plan.duration_weeks} weeks`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
            }));

            // Weekly Breakdown
            plan.weeks.forEach((week, idx) => {
                if (idx > 0) {
                    docChildren.push(new Paragraph({ children: [new PageBreak()] }));
                }

                docChildren.push(new Paragraph({
                    text: `WEEK ${week.week_number}`,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 200, after: 200 },
                }));

                docChildren.push(new Paragraph({
                    children: [
                        new TextRun({ text: "Date: ", bold: true }),
                        new TextRun(week.start_date),
                    ],
                    spacing: { after: 100 },
                }));

                docChildren.push(new Paragraph({
                    children: [
                        new TextRun({ text: "Topic: ", bold: true }),
                        new TextRun(week.topic),
                    ],
                    spacing: { after: 100 },
                }));

                docChildren.push(new Paragraph({
                    children: [
                        new TextRun({ text: "Period: ", bold: true }),
                        new TextRun(week.period),
                    ],
                    spacing: { after: 100 },
                }));

                docChildren.push(new Paragraph({
                    children: [
                        new TextRun({ text: "Duration: ", bold: true }),
                        new TextRun(week.duration),
                    ],
                    spacing: { after: 200 },
                }));

                // Objectives
                docChildren.push(new Paragraph({
                    text: "OBJECTIVES",
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 },
                }));
                week.objectives.forEach(obj => {
                    docChildren.push(new Paragraph({
                        text: `• ${obj}`,
                        spacing: { after: 50 },
                    }));
                });

                // Instructional Materials
                docChildren.push(new Paragraph({
                    text: "INSTRUCTIONAL MATERIALS",
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 },
                }));
                docChildren.push(new Paragraph({
                    text: week.instructional_materials.join(', '),
                    spacing: { after: 200 },
                }));

                // Activities
                docChildren.push(new Paragraph({
                    text: "ACTIVITIES",
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 },
                }));

                docChildren.push(new Paragraph({
                    children: [
                        new TextRun({ text: "Introduction: ", bold: true }),
                        new TextRun(week.activities.introduction),
                    ],
                    spacing: { after: 100 },
                }));

                docChildren.push(new Paragraph({
                    children: [
                        new TextRun({ text: "Explanation: ", bold: true }),
                        new TextRun(week.activities.explanation),
                    ],
                    spacing: { after: 100 },
                }));

                docChildren.push(new Paragraph({
                    children: [
                        new TextRun({ text: "Guided Practice: ", bold: true }),
                        new TextRun(week.activities.guided_practice),
                    ],
                    spacing: { after: 100 },
                }));

                docChildren.push(new Paragraph({
                    children: [
                        new TextRun({ text: "Independent Practice: ", bold: true }),
                        new TextRun(week.activities.independent_practice),
                    ],
                    spacing: { after: 100 },
                }));

                docChildren.push(new Paragraph({
                    children: [
                        new TextRun({ text: "Practical: ", bold: true }),
                        new TextRun(week.activities.practical),
                    ],
                    spacing: { after: 200 },
                }));

                // Assessment
                docChildren.push(new Paragraph({
                    text: "ASSESSMENT",
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 },
                }));
                docChildren.push(new Paragraph({
                    text: week.assessment,
                    spacing: { after: 200 },
                }));

                // Assignment
                docChildren.push(new Paragraph({
                    text: "ASSIGNMENT",
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 },
                }));
                week.assignment.forEach(assg => {
                    docChildren.push(new Paragraph({
                        text: `• ${assg}`,
                        spacing: { after: 50 },
                    }));
                });

                // Summary
                docChildren.push(new Paragraph({
                    text: "SUMMARY",
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 },
                }));
                docChildren.push(new Paragraph({
                    text: week.summary,
                    spacing: { after: 200 },
                }));

                // Board Summary
                docChildren.push(new Paragraph({
                    text: "BOARD SUMMARY",
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 },
                }));
                docChildren.push(new Paragraph({
                    text: week.board_summary,
                    spacing: { after: 200 },
                }));

                // Possible Difficulties
                if (week.possible_difficulties.length > 0) {
                    docChildren.push(new Paragraph({
                        text: "POSSIBLE DIFFICULTIES",
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 200, after: 100 },
                    }));
                    week.possible_difficulties.forEach(diff => {
                        docChildren.push(new Paragraph({
                            text: `• ${diff}`,
                            spacing: { after: 50 },
                        }));
                    });
                }
            });

            const doc = new Document({ sections: [{ children: docChildren }] });
            const blob = await Packer.toBlob(doc);
            saveAs(blob, `lesson-plan-${plan.subject}-${plan.class_level}.docx`);
        } catch (error) {
            console.error('Failed to export DOCX:', error);
            alert('Could not export to DOCX. Please try again.');
        } finally {
            setIsExportingDocx(false);
        }
    };

    if (!plan) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 text-center">
                <h1 className="mt-4 text-2xl font-bold text-gray-800">No Lesson Plan Found</h1>
                <p className="mt-2 text-gray-600">Please generate a lesson plan first.</p>
                <button
                    onClick={() => navigate('/lessons')}
                    className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Generator
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                                <BookOpen className="w-7 h-7 text-indigo-600" />
                                Review Lesson Plan
                            </h1>
                            <p className="text-gray-500 mt-1">Review and export your generated lesson plan.</p>
                        </div>
                        <button
                            onClick={() => navigate('/lessons')}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 text-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Generator
                        </button>
                    </div>

                    {/* Export Buttons */}
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

                    {/* Content to be Exported */}
                    <div ref={contentRef} className="space-y-8 p-6 border rounded-lg bg-white">
                        {/* Header Info */}
                        <div className="text-center border-b pb-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">LESSON PLAN</h2>
                            <div className="space-y-1 text-gray-600">
                                <p className="font-semibold">{plan.school_name}</p>
                                <p>Subject: <span className="font-semibold text-indigo-700">{plan.subject}</span></p>
                                <p>Class: {plan.class_level} | Term: {plan.term}</p>
                                <p>State: {plan.state}{plan.lga ? `, ${plan.lga}` : ''}</p>
                                <p>Resumption Date: {plan.resumption_date} | Duration: {plan.duration_weeks} weeks</p>
                            </div>
                        </div>

                        {/* Weekly Breakdown */}
                        {plan.weeks.map((week, idx) => (
                            <div key={week.week_number} className={`${idx > 0 ? 'border-t pt-6' : ''}`}>
                                <div className="bg-indigo-50 p-4 rounded-lg mb-4">
                                    <h3 className="text-xl font-bold text-indigo-800">WEEK {week.week_number}</h3>
                                    <p className="text-sm text-gray-600 mt-1">Date: {week.start_date}</p>
                                    <p className="text-sm text-gray-600">Period: {week.period} | Duration: {week.duration}</p>
                                </div>

                                <div className="space-y-4 ml-4">
                                    <div>
                                        <h4 className="font-bold text-gray-800 mb-2">TOPIC</h4>
                                        <p className="text-gray-700">{week.topic}</p>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-gray-800 mb-2">OBJECTIVES</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            {week.objectives.map((obj, i) => (
                                                <li key={i} className="text-gray-700">{obj}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-gray-800 mb-2">INSTRUCTIONAL MATERIALS</h4>
                                        <p className="text-gray-700">{week.instructional_materials.join(', ')}</p>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-gray-800 mb-2">ACTIVITIES</h4>
                                        <div className="space-y-2 ml-4">
                                            <p className="text-gray-700"><span className="font-semibold">Introduction:</span> {week.activities.introduction}</p>
                                            <p className="text-gray-700"><span className="font-semibold">Explanation:</span> {week.activities.explanation}</p>
                                            <p className="text-gray-700"><span className="font-semibold">Guided Practice:</span> {week.activities.guided_practice}</p>
                                            <p className="text-gray-700"><span className="font-semibold">Independent Practice:</span> {week.activities.independent_practice}</p>
                                            <p className="text-gray-700"><span className="font-semibold">Practical:</span> {week.activities.practical}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-gray-800 mb-2">ASSESSMENT</h4>
                                        <p className="text-gray-700">{week.assessment}</p>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-gray-800 mb-2">ASSIGNMENT</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            {week.assignment.map((assg, i) => (
                                                <li key={i} className="text-gray-700">{assg}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-gray-800 mb-2">SUMMARY</h4>
                                        <p className="text-gray-700">{week.summary}</p>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-gray-800 mb-2">BOARD SUMMARY</h4>
                                        <p className="text-gray-700 whitespace-pre-wrap">{week.board_summary}</p>
                                    </div>

                                    {week.possible_difficulties.length > 0 && (
                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-2">POSSIBLE DIFFICULTIES</h4>
                                            <ul className="list-disc list-inside space-y-1">
                                                {week.possible_difficulties.map((diff, i) => (
                                                    <li key={i} className="text-gray-700">{diff}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}