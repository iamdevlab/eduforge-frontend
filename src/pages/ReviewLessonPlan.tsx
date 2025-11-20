import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileDown, Loader2, AlertTriangle } from 'lucide-react';

// Import libraries for exporting
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    PageBreak,
    AlignmentType,
    Header,
    Footer,
    PageNumber,
    BorderStyle
} from 'docx';
import { saveAs } from 'file-saver';

// --- UTILITIES ---

// Helper to ensure we never pass null/undefined to DOCX TextRun
const safeText = (text: any): string => {
    if (text === null || text === undefined) return "";
    return String(text);
};

// --- INTERFACES ---

interface WeekSuccess {
    status: 'success';
    week_number: number;
    start_date: string;
    end_date: string;
    topic: string;
    subtopic?: string;
    objectives: string[];
    instructional_materials: string[];
    prerequisite_knowledge?: string;
    activities: {
        introduction: string;
        explanation: string;
        guided_practice: string;
        independent_practice: string;
        practical: string;
    };
    assessment: string;
    assignment: string;
    summary: string;
    possible_difficulties: string;
    remarks?: string;
    period: string;
    duration_minutes: number;
}

interface WeekError {
    status: 'failed';
    week_number: number;
    start_date: string;
    end_date: string;
    topic: string;
    error_message: string;
}

type Week = WeekSuccess | WeekError;

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

    // --- ENHANCED PDF EXPORTER ---
    const handleExportPDF = async () => {
        const input = contentRef.current;
        if (!input) return;

        setIsExportingPdf(true);
        try {
            // 1. Wait for fonts/images to load to avoid "Slow Network" issues affecting render
            await document.fonts.ready;

            // 2. Generate Canvas
            const canvas = await html2canvas(input, {
                scale: 2,
                useCORS: true,
                windowWidth: input.scrollWidth,
                windowHeight: input.scrollHeight
            });

            // 3. Sanity check: if canvas is 0x0 (happens if content is hidden), stop.
            if (canvas.width === 0 || canvas.height === 0) {
                throw new Error("Canvas generation failed (empty dimensions).");
            }

            const imgData = canvas.toDataURL('image/png');

            // 4. Check if data URL is valid
            if (imgData === 'data:,') {
                throw new Error("Canvas returned empty data.");
            }

            const pdf = new jsPDF('p', 'mm', 'a4', true);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
                heightLeft -= pdfHeight;
            }

            pdf.save(`lesson-plan-${plan?.subject}-${plan?.class_level}.pdf`);
        } catch (error) {
            console.error('Failed to export PDF:', error);
            alert('PDF Export Failed. This usually happens if the document is too long for the browser to render as an image. Please use the DOCX export instead.');
        } finally {
            setIsExportingPdf(false);
        }
    };

    // --- DOCX EXPORTER (Safe Mode) ---
    const handleExportDOCX = async () => {
        if (!plan) return;
        setIsExportingDocx(true);

        const createParagraphsFromText = (text: string | null | undefined) => {
            const safeTxt = safeText(text);
            if (!safeTxt) return [new Paragraph({ text: "N/A" })];
            return safeTxt.split('\n').map(line => new Paragraph({ text: line, spacing: { after: 100 } }));
        };

        try {
            const docChildren: Paragraph[] = [];

            // Title Page
            docChildren.push(new Paragraph({ text: "LESSON PLAN", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 300 } }));
            docChildren.push(new Paragraph({ text: safeText(plan.school_name), heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER, spacing: { after: 100 } }));
            docChildren.push(new Paragraph({ text: `${safeText(plan.subject)} - ${safeText(plan.class_level)}`, heading: HeadingLevel.HEADING_3, alignment: AlignmentType.CENTER, spacing: { after: 50 } }));
            docChildren.push(new Paragraph({ text: safeText(plan.term), alignment: AlignmentType.CENTER, spacing: { after: 500 } }));
            docChildren.push(new Paragraph({ children: [new PageBreak()] }));

            // Iterate Weeks
            plan.weeks.forEach((week) => {
                // --- HANDLE FAILED WEEK ---
                if (week.status === 'failed') {
                    docChildren.push(new Paragraph({
                        children: [
                            new TextRun({
                                text: `WEEK ${week.week_number}: ${safeText(week.topic)} (GENERATION FAILED)`,
                                color: "FF0000",
                                bold: true
                            })
                        ],
                        spacing: { before: 200, after: 200 }
                    }));
                    docChildren.push(new Paragraph({
                        children: [
                            new TextRun({ text: "Error Message: ", bold: true }),
                            new TextRun({ text: safeText(week.error_message), color: "FF0000" })
                        ],
                        spacing: { after: 200 }
                    }));
                    docChildren.push(new Paragraph({ children: [new PageBreak()] }));
                    return;
                }

                // --- HANDLE SUCCESS WEEK ---
                // Note: We do not mix 'heading' property with complex 'children' arrays to avoid library bugs
                docChildren.push(new Paragraph({
                    text: `WEEK ${week.week_number}: ${safeText(week.topic)}`,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 200, after: 200 },
                    border: { bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } }
                }));

                const metaText = `Date: ${safeText(week.start_date)} | Period: ${safeText(week.period)} | Duration: ${safeText(week.duration_minutes)} mins`;
                docChildren.push(new Paragraph({ text: metaText, spacing: { after: 200 } }));

                // Objectives
                docChildren.push(new Paragraph({ text: "OBJECTIVES", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
                if (week.objectives && week.objectives.length > 0) {
                    week.objectives.forEach(obj => {
                        docChildren.push(new Paragraph({ text: safeText(obj), bullet: { level: 0 }, spacing: { after: 50 } }));
                    });
                } else {
                    docChildren.push(new Paragraph({ text: "None listed." }));
                }

                // Instructional Materials
                docChildren.push(new Paragraph({ text: "INSTRUCTIONAL MATERIALS", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
                const materials = week.instructional_materials && week.instructional_materials.length > 0
                    ? week.instructional_materials.join(', ')
                    : "None listed";
                docChildren.push(new Paragraph({ text: safeText(materials), spacing: { after: 200 } }));

                // Activities
                docChildren.push(new Paragraph({ text: "ACTIVITIES", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
                if (week.activities) {
                    Object.entries(week.activities).forEach(([key, value]) => {
                        const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
                        docChildren.push(new Paragraph({
                            children: [
                                new TextRun({ text: `${formattedKey}: `, bold: true }),
                                new TextRun(safeText(value)) // Crucial Safe Text usage
                            ],
                            spacing: { after: 100 }
                        }));
                    });
                }

                // Assessment & Assignment & Summary
                docChildren.push(new Paragraph({ text: "ASSESSMENT", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
                docChildren.push(...createParagraphsFromText(week.assessment));

                docChildren.push(new Paragraph({ text: "ASSIGNMENT", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
                docChildren.push(...createParagraphsFromText(week.assignment));

                docChildren.push(new Paragraph({ text: "SUMMARY", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
                docChildren.push(...createParagraphsFromText(week.summary));

                if (week.possible_difficulties) {
                    docChildren.push(new Paragraph({ text: "POSSIBLE DIFFICULTIES", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
                    docChildren.push(...createParagraphsFromText(week.possible_difficulties));
                }

                docChildren.push(new Paragraph({ children: [new PageBreak()] }));
            });

            const doc = new Document({
                sections: [{
                    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun(safeText(plan.school_name))] })] }) },
                    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT] })] })] }) },
                    children: docChildren,
                }],
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, `lesson-plan-${safeText(plan.subject)}.docx`);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Check console for details.');
        } finally {
            setIsExportingDocx(false);
        }
    };

    if (!plan) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 text-center">
                <h1 className="mt-4 text-2xl font-bold text-gray-800">No Lesson Plan Found</h1>
                <button onClick={() => navigate('/lessons')} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Generator
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                                <BookOpen className="w-7 h-7 text-indigo-600" />
                                Review Lesson Plan
                            </h1>
                            <p className="text-gray-500 mt-1">Review content before exporting.</p>
                        </div>
                        <button onClick={() => navigate('/lessons')} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 text-sm">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <button onClick={handleExportDOCX} disabled={isExportingDocx} className="w-full sm:w-auto flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2 font-medium">
                            {isExportingDocx ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
                            <span>Export to DOCX</span>
                        </button>
                        <button onClick={handleExportPDF} disabled={isExportingPdf} className="w-full sm:w-auto flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2 font-medium">
                            {isExportingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
                            <span>Export to PDF</span>
                        </button>
                    </div>

                    <div ref={contentRef} className="space-y-8 p-6 border rounded-lg bg-white">
                        <div className="text-center border-b pb-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">LESSON PLAN</h2>
                            <div className="space-y-1 text-gray-600">
                                <p className="font-semibold">{plan.school_name}</p>
                                <p>Subject: <span className="font-semibold text-indigo-700">{plan.subject}</span></p>
                                <p>Class: {plan.class_level} | Term: {plan.term}</p>
                            </div>
                        </div>

                        {plan.weeks.map((week, idx) => (
                            <div key={week.week_number} className={`${idx > 0 ? 'border-t pt-6' : ''}`}>
                                {week.status === 'failed' ? (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                                            <AlertTriangle className="w-5 h-5" />
                                            <h3>WEEK {week.week_number}: {week.topic} (Failed to Generate)</h3>
                                        </div>
                                        <p className="text-red-600 text-sm">{week.error_message}</p>
                                        <p className="text-gray-500 text-xs mt-2">Please try regenerating this specific week or reducing the batch size.</p>
                                    </div>
                                ) : (
                                    // SUCCESS RENDER
                                    <>
                                        <div className="bg-indigo-50 p-4 rounded-lg mb-4">
                                            <h3 className="text-xl font-bold text-indigo-800">WEEK {week.week_number}</h3>
                                            <p className="text-sm text-gray-600 mt-1">Topic: {week.topic}</p>
                                            <p className="text-sm text-gray-600">Date: {week.start_date} | {week.period}</p>
                                        </div>

                                        <div className="space-y-4 ml-4">
                                            <div>
                                                <h4 className="font-bold text-gray-800 mb-2">OBJECTIVES</h4>
                                                <ul className="list-disc list-inside space-y-1">
                                                    {week.objectives.map((obj, i) => (
                                                        <li key={i} className="text-gray-700">{obj}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div>
                                                <h4 className="font-bold text-gray-800 mb-2">ACTIVITIES</h4>
                                                <div className="space-y-2 ml-4">
                                                    {Object.entries(week.activities).map(([key, value]) => (
                                                        <p key={key} className="text-gray-700">
                                                            <span className="font-semibold">{key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}:</span> {value}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-bold text-gray-800 mb-2">SUMMARY</h4>
                                                <p className="text-gray-700 whitespace-pre-wrap">{week.summary}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
// import { useRef, useState } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { ArrowLeft, BookOpen, FileDown, Loader2, AlertTriangle } from 'lucide-react';

// // Import libraries for exporting
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';
// import {
//     Document,
//     Packer,
//     Paragraph,
//     TextRun,
//     HeadingLevel,
//     PageBreak,
//     AlignmentType,
//     Header,
//     Footer,
//     PageNumber,
//     BorderStyle
// } from 'docx';
// import { saveAs } from 'file-saver';

// // --- UPDATED INTERFACES ---

// // 1. Success Interface
// interface WeekSuccess {
//     status: 'success'; // Discriminator
//     week_number: number;
//     start_date: string;
//     end_date: string;
//     topic: string;
//     subtopic?: string;
//     objectives: string[];
//     instructional_materials: string[];
//     prerequisite_knowledge?: string;
//     activities: {
//         introduction: string;
//         explanation: string;
//         guided_practice: string;
//         independent_practice: string;
//         practical: string;
//     };
//     assessment: string;
//     assignment: string;
//     summary: string;
//     possible_difficulties: string;
//     remarks?: string;
//     period: string;
//     duration_minutes: number;
// }

// // 2. Error Interface
// interface WeekError {
//     status: 'failed'; // Discriminator
//     week_number: number;
//     start_date: string;
//     end_date: string;
//     topic: string;
//     error_message: string;
// }

// // 3. Union Type
// type Week = WeekSuccess | WeekError;

// interface LessonPlan {
//     school_name: string;
//     state: string;
//     lga?: string;
//     subject: string;
//     class_level: string;
//     term: string;
//     resumption_date: string;
//     duration_weeks: number;
//     weeks: Week[];
// }

// export default function ReviewLessonPlan() {
//     const location = useLocation();
//     const navigate = useNavigate();
//     const contentRef = useRef<HTMLDivElement>(null);

//     const [isExportingPdf, setIsExportingPdf] = useState(false);
//     const [isExportingDocx, setIsExportingDocx] = useState(false);

//     const plan = location.state?.lessonPlan as LessonPlan | null;

//     // --- ENHANCED PDF EXPORTER ---
//     const handleExportPDF = async () => {
//         const input = contentRef.current;
//         if (!input) return;

//         setIsExportingPdf(true);
//         try {
//             const canvas = await html2canvas(input, {
//                 scale: 2,
//                 useCORS: true,
//                 windowWidth: input.scrollWidth,
//                 windowHeight: input.scrollHeight
//             });

//             const imgData = canvas.toDataURL('image/png');
//             const pdf = new jsPDF('p', 'mm', 'a4', true);
//             const pdfWidth = pdf.internal.pageSize.getWidth();
//             const pdfHeight = pdf.internal.pageSize.getHeight();
//             const imgProps = pdf.getImageProperties(imgData);
//             const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

//             let heightLeft = imgHeight;
//             let position = 0;

//             pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
//             heightLeft -= pdfHeight;

//             while (heightLeft > 0) {
//                 position = heightLeft - imgHeight;
//                 pdf.addPage();
//                 pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
//                 heightLeft -= pdfHeight;
//             }

//             pdf.save(`lesson-plan-${plan?.subject}-${plan?.class_level}.pdf`);
//         } catch (error) {
//             console.error('Failed to export PDF:', error);
//             alert('Could not export to PDF.');
//         } finally {
//             setIsExportingPdf(false);
//         }
//     };

//     // --- DOCX EXPORTER (Safe for Errors) ---
//     const handleExportDOCX = async () => {
//         if (!plan) return;
//         setIsExportingDocx(true);

//         const createParagraphsFromText = (text: string) => {
//             if (!text) return [new Paragraph({ text: "" })];
//             return text.split('\n').map(line => new Paragraph({ text: line, spacing: { after: 100 } }));
//         };

//         try {
//             const docChildren: Paragraph[] = [];

//             // Title Page
//             docChildren.push(new Paragraph({ text: "LESSON PLAN", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 300 } }));
//             docChildren.push(new Paragraph({ text: plan.school_name, heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER, spacing: { after: 100 } }));
//             docChildren.push(new Paragraph({ text: `${plan.subject} - ${plan.class_level}`, heading: HeadingLevel.HEADING_3, alignment: AlignmentType.CENTER, spacing: { after: 50 } }));
//             docChildren.push(new Paragraph({ text: plan.term, alignment: AlignmentType.CENTER, spacing: { after: 500 } }));
//             docChildren.push(new Paragraph({ children: [new PageBreak()] }));

//             // Iterate Weeks
//             plan.weeks.forEach((week) => {
//                 // Check for failure
//                 if (week.status === 'failed') {
//                     docChildren.push(new Paragraph({
//                         children: [
//                             new TextRun({
//                                 text: `WEEK ${week.week_number}: ${week.topic} (GENERATION FAILED)`,
//                                 color: "FF0000" // Apply color to the TextRun
//                             })
//                         ],
//                         heading: HeadingLevel.HEADING_2,
//                     }));
//                     docChildren.push(new Paragraph({ text: `Error: ${week.error_message}`, spacing: { after: 200 } }));
//                     docChildren.push(new Paragraph({ children: [new PageBreak()] }));
//                     return; // Skip the rest for this week
//                 }

//                 // SUCCESS LOGIC
//                 docChildren.push(new Paragraph({ text: `WEEK ${week.week_number}: ${week.topic}`, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 200 }, border: { bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } } }));

//                 const metaText = `Date: ${week.start_date} | Period: ${week.period} | Duration: ${week.duration_minutes} mins`;
//                 docChildren.push(new Paragraph({ text: metaText, spacing: { after: 200 } }));

//                 // Objectives
//                 docChildren.push(new Paragraph({ text: "OBJECTIVES", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
//                 week.objectives.forEach(obj => {
//                     docChildren.push(new Paragraph({ text: obj, bullet: { level: 0 }, spacing: { after: 50 } }));
//                 });

//                 // Instructional Materials
//                 docChildren.push(new Paragraph({ text: "INSTRUCTIONAL MATERIALS", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
//                 docChildren.push(new Paragraph({ text: week.instructional_materials.join(', '), spacing: { after: 200 } }));

//                 // Activities
//                 docChildren.push(new Paragraph({ text: "ACTIVITIES", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
//                 Object.entries(week.activities).forEach(([key, value]) => {
//                     const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
//                     docChildren.push(new Paragraph({ children: [new TextRun({ text: `${formattedKey}: `, bold: true }), new TextRun(value)], spacing: { after: 100 } }));
//                 });

//                 // Assessment & Assignment & Summary
//                 docChildren.push(new Paragraph({ text: "ASSESSMENT", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
//                 docChildren.push(...createParagraphsFromText(week.assessment));

//                 docChildren.push(new Paragraph({ text: "ASSIGNMENT", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
//                 docChildren.push(...createParagraphsFromText(week.assignment));

//                 docChildren.push(new Paragraph({ text: "SUMMARY", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
//                 docChildren.push(...createParagraphsFromText(week.summary));

//                 if (week.possible_difficulties) {
//                     docChildren.push(new Paragraph({ text: "POSSIBLE DIFFICULTIES", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
//                     docChildren.push(...createParagraphsFromText(week.possible_difficulties));
//                 }

//                 docChildren.push(new Paragraph({ children: [new PageBreak()] }));
//             });

//             const doc = new Document({
//                 sections: [{
//                     headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun(`${plan.school_name}`)] })] }) },
//                     footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT] })] })] }) },
//                     children: docChildren,
//                 }],
//             });

//             const blob = await Packer.toBlob(doc);
//             saveAs(blob, `lesson-plan-${plan.subject}.docx`);
//         } catch (error) {
//             console.error('Export failed:', error);
//             alert('Export failed.');
//         } finally {
//             setIsExportingDocx(false);
//         }
//     };

//     if (!plan) {
//         return (
//             <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 text-center">
//                 <h1 className="mt-4 text-2xl font-bold text-gray-800">No Lesson Plan Found</h1>
//                 <button onClick={() => navigate('/lessons')} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
//                     <ArrowLeft className="w-4 h-4" /> Back to Generator
//                 </button>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
//             <div className="max-w-6xl mx-auto">
//                 <div className="bg-white rounded-2xl shadow-xl p-8">
//                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
//                         <div>
//                             <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
//                                 <BookOpen className="w-7 h-7 text-indigo-600" />
//                                 Review Lesson Plan
//                             </h1>
//                             <p className="text-gray-500 mt-1">Review content before exporting.</p>
//                         </div>
//                         <button onClick={() => navigate('/lessons')} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 text-sm">
//                             <ArrowLeft className="w-4 h-4" /> Back
//                         </button>
//                     </div>

//                     <div className="flex flex-col sm:flex-row gap-4 mb-8">
//                         <button onClick={handleExportDOCX} disabled={isExportingDocx} className="w-full sm:w-auto flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2 font-medium">
//                             {isExportingDocx ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
//                             <span>Export to DOCX</span>
//                         </button>
//                         <button onClick={handleExportPDF} disabled={isExportingPdf} className="w-full sm:w-auto flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2 font-medium">
//                             {isExportingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
//                             <span>Export to PDF</span>
//                         </button>
//                     </div>

//                     <div ref={contentRef} className="space-y-8 p-6 border rounded-lg bg-white">
//                         <div className="text-center border-b pb-6">
//                             <h2 className="text-2xl font-bold text-gray-800 mb-2">LESSON PLAN</h2>
//                             <div className="space-y-1 text-gray-600">
//                                 <p className="font-semibold">{plan.school_name}</p>
//                                 <p>Subject: <span className="font-semibold text-indigo-700">{plan.subject}</span></p>
//                                 <p>Class: {plan.class_level} | Term: {plan.term}</p>
//                             </div>
//                         </div>

//                         {plan.weeks.map((week, idx) => (
//                             <div key={week.week_number} className={`${idx > 0 ? 'border-t pt-6' : ''}`}>
//                                 {week.status === 'failed' ? (
//                                     <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//                                         <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
//                                             <AlertTriangle className="w-5 h-5" />
//                                             <h3>WEEK {week.week_number}: {week.topic} (Failed to Generate)</h3>
//                                         </div>
//                                         <p className="text-red-600 text-sm">{week.error_message}</p>
//                                         <p className="text-gray-500 text-xs mt-2">Please try regenerating this specific week or reducing the batch size.</p>
//                                     </div>
//                                 ) : (
//                                     // SUCCESS RENDER
//                                     <>
//                                         <div className="bg-indigo-50 p-4 rounded-lg mb-4">
//                                             <h3 className="text-xl font-bold text-indigo-800">WEEK {week.week_number}</h3>
//                                             <p className="text-sm text-gray-600 mt-1">Topic: {week.topic}</p>
//                                             <p className="text-sm text-gray-600">Date: {week.start_date} | {week.period}</p>
//                                         </div>

//                                         <div className="space-y-4 ml-4">
//                                             <div>
//                                                 <h4 className="font-bold text-gray-800 mb-2">OBJECTIVES</h4>
//                                                 <ul className="list-disc list-inside space-y-1">
//                                                     {week.objectives.map((obj, i) => (
//                                                         <li key={i} className="text-gray-700">{obj}</li>
//                                                     ))}
//                                                 </ul>
//                                             </div>

//                                             <div>
//                                                 <h4 className="font-bold text-gray-800 mb-2">ACTIVITIES</h4>
//                                                 <div className="space-y-2 ml-4">
//                                                     {Object.entries(week.activities).map(([key, value]) => (
//                                                         <p key={key} className="text-gray-700">
//                                                             <span className="font-semibold">{key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}:</span> {value}
//                                                         </p>
//                                                     ))}
//                                                 </div>
//                                             </div>

//                                             <div>
//                                                 <h4 className="font-bold text-gray-800 mb-2">SUMMARY</h4>
//                                                 <p className="text-gray-700 whitespace-pre-wrap">{week.summary}</p>
//                                             </div>
//                                         </div>
//                                     </>
//                                 )}
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }


