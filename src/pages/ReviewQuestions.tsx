import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, FileDown, Loader2 } from 'lucide-react';

// --- Enhanced Export Libraries ---
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, AlignmentType, Table, TableRow, TableCell, WidthType, Header, Footer, PageNumber } from 'docx';
import { saveAs } from 'file-saver';

// --- Type Definitions (moved to top for clarity, ideally in a shared types.ts file) ---
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
    subject?: string; // Optional subject for dynamic naming
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

    const generatedData = location.state?.generatedData as QuestionResponse | null;

    const handleExportPDF = async () => {
        if (!generatedData) return;
        setIsExportingPdf(true);

        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const subject = generatedData.subject || "Exam Questions";
            const date = new Date().toISOString().split('T')[0];
            const fileName = `exam-${subject.toLowerCase().replace(/\s/g, '-')}-${date}.pdf`;

            const PAGE_WIDTH = pdf.internal.pageSize.getWidth();
            const MARGIN = 15;
            let yPosition = MARGIN;

            const checkPageBreak = (neededHeight: number) => {
                if (yPosition + neededHeight > pdf.internal.pageSize.getHeight() - MARGIN) {
                    pdf.addPage();
                    yPosition = MARGIN;
                }
            };

            // --- Document Header ---
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'bold');
            pdf.text(subject, PAGE_WIDTH / 2, yPosition, { align: 'center' });
            yPosition += 15;

            // --- Objectives Section ---
            if (generatedData.objectives.length > 0) {
                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                pdf.text("Objectives", MARGIN, yPosition);
                yPosition += 8;

                pdf.setFontSize(11);
                pdf.setFont('helvetica', 'normal');

                generatedData.objectives.forEach((obj, idx) => {
                    const questionText = `${idx + 1}. ${obj.question}`;
                    const splitQuestion = pdf.splitTextToSize(questionText, PAGE_WIDTH - MARGIN * 2);

                    checkPageBreak(splitQuestion.length * 5 + Object.keys(obj.options).length * 5 + 5);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(splitQuestion, MARGIN, yPosition);
                    yPosition += splitQuestion.length * 5;

                    pdf.setFont('helvetica', 'normal');
                    Object.entries(obj.options).forEach(([key, value]) => {
                        pdf.text(`   (${key}) ${value}`, MARGIN + 5, yPosition);
                        yPosition += 5;
                    });
                    yPosition += 3; // Space after question
                });
            }

            // --- Essay Section ---
            if (generatedData.essays.length > 0) {
                yPosition += 5;
                checkPageBreak(15);
                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                pdf.text("Essay Part", MARGIN, yPosition);
                yPosition += 8;
                
                pdf.setFontSize(12);
                pdf.text("Section B (Theory)", MARGIN, yPosition);
                yPosition += 10;


                generatedData.essays.forEach((essay, idx) => {
                    const qNum = idx + 1;
                    if (essay.sub_questions?.length > 0) {
                        const allNested = [essay.question, ...essay.sub_questions];
                        const isGenericHeader = essay.question.toLowerCase().trim().startsWith('question');
                        const questionsToRender = (isGenericHeader && allNested.length > 1) ? allNested.slice(1) : allNested;

                        questionsToRender.forEach((sub, subIdx) => {
                            const subLabel = String.fromCharCode(97 + subIdx);
                            const cleanedSub = sub.replace(/^(\d+\.?\s*|\d+[a-z]\.?\s*)/, '').trim();
                            const subQuestionText = `${qNum}${subLabel}. ${cleanedSub}`;
                            const splitSubQuestion = pdf.splitTextToSize(subQuestionText, PAGE_WIDTH - MARGIN * 2);
                            
                            checkPageBreak(splitSubQuestion.length * 5 + 5);
                            pdf.setFont('helvetica', 'bold');
                            pdf.text(splitSubQuestion, MARGIN, yPosition);
                            yPosition += splitSubQuestion.length * 5 + 3;
                        });

                    } else {
                        const questionText = `${qNum}. ${essay.question}`;
                        const splitQuestion = pdf.splitTextToSize(questionText, PAGE_WIDTH - MARGIN * 2);
                        checkPageBreak(splitQuestion.length * 5 + 5);
                        pdf.setFont('helvetica', 'bold');
                        pdf.text(splitQuestion, MARGIN, yPosition);
                        yPosition += splitQuestion.length * 5 + 3;
                    }
                });
            }
            
            // --- Answer Key Section (on a new page) ---
            if (generatedData.answers.length > 0) {
                pdf.addPage();
                yPosition = MARGIN;
                pdf.setFontSize(16);
                pdf.setFont('helvetica', 'bold');
                pdf.text("Answer Key", PAGE_WIDTH / 2, yPosition, { align: 'center' });
                yPosition += 15;

                // Objective Answers
                pdf.setFontSize(12);
                pdf.text("Objective Answers", MARGIN, yPosition);
                yPosition += 8;
                pdf.setFontSize(10);
                let xPos = MARGIN;
                const objectiveAnswers = generatedData.answers.filter(a => a.type === 'objective');
                objectiveAnswers.forEach((ans, idx) => {
                    const text = `${idx + 1}. ${ans.answer.toUpperCase()}`;
                    pdf.text(text, xPos, yPosition);
                    xPos += 30; // Column width
                    if ((idx + 1) % 5 === 0) { // 5 columns
                        xPos = MARGIN;
                        yPosition += 7;
                        checkPageBreak(7);
                    }
                });

                // Essay Answers
                yPosition += 15;
                checkPageBreak(15);
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'bold');
                pdf.text("Essay Answers", MARGIN, yPosition);
                yPosition += 8;
                pdf.setFontSize(11);
                pdf.setFont('helvetica', 'normal');
                generatedData.answers.filter(a => a.type === 'essay').forEach((ans) => {
                    const formattedAnswer = ans.answer.replace(/\\n/g, '\n').replace(/\s+\d+[a-z]\.\s*\[Answer for sub-question \d+\]\s*$/, '').trim();
                    const splitAnswer = pdf.splitTextToSize(formattedAnswer, PAGE_WIDTH - MARGIN * 2);
                    checkPageBreak(splitAnswer.length * 5 + 5);
                    pdf.text(splitAnswer, MARGIN, yPosition);
                    yPosition += splitAnswer.length * 5 + 5; // Add space between answers
                });
            }


            pdf.save(fileName);
        } catch (error) {
            console.error('Failed to export PDF:', error);
            alert('Could not export to PDF. Please try again.');
        } finally {
            setIsExportingPdf(false);
        }
    };

    const handleExportDOCX = async () => {
        if (!generatedData) return;
        setIsExportingDocx(true);

        try {
            const subject = generatedData.subject || "General";
            const date = new Date().toISOString().split('T')[0];
            const fileName = `exam-${subject.toLowerCase().replace(/\s/g, '-')}-${date}.docx`;
            const docChildren = [];

            // --- Main Title ---
            docChildren.push(new Paragraph({
                text: `Exam Questions: ${subject}`,
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
            }));

            // --- Objective Questions ---
            if (generatedData.objectives.length > 0) {
                docChildren.push(new Paragraph({ text: "Objectives", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
                generatedData.objectives.forEach((obj, idx) => {
                    docChildren.push(new Paragraph({ children: [new TextRun({ text: `${idx + 1}. `, bold: true }), new TextRun(obj.question)], spacing: { after: 100 } }));
                    Object.entries(obj.options).forEach(([key, value]) => {
                        docChildren.push(new Paragraph({ text: `\t(${key}). ${value}` }));
                    });
                    docChildren.push(new Paragraph(""));
                });
            }

            // --- Essay Questions ---
            if (generatedData.essays.length > 0) {
                docChildren.push(new Paragraph({ text: "Essay Part", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 50 } }));
                docChildren.push(new Paragraph({ text: "Section B (Theory)", heading: HeadingLevel.HEADING_3, spacing: { after: 100 } }));
                generatedData.essays.forEach((essay, idx) => {
                    const qNum = idx + 1;
                    if (essay.sub_questions?.length > 0) {
                        const allNested = [essay.question, ...essay.sub_questions];
                        const isGenericHeader = essay.question.toLowerCase().trim().startsWith('question');
                        const questionsToRender = (isGenericHeader && allNested.length > 1) ? allNested.slice(1) : allNested;
                        questionsToRender.forEach((sub, subIdx) => {
                            const subLabel = String.fromCharCode(97 + subIdx);
                            const cleanedSub = sub.replace(/^(\d+\.?\s*|\d+[a-z]\.?\s*)/, '').trim();
                            docChildren.push(new Paragraph({ children: [new TextRun({ text: `${qNum}${subLabel}. `, bold: true }), new TextRun(cleanedSub)], spacing: { after: 50 } }));
                        });
                    } else {
                        docChildren.push(new Paragraph({ children: [new TextRun({ text: `${qNum}. `, bold: true }), new TextRun(essay.question)], spacing: { after: 100 } }));
                    }
                    docChildren.push(new Paragraph(""));
                });
            }

            // --- Answer Key (on a new page) ---
            if (generatedData.answers.length > 0) {
                docChildren.push(new Paragraph({ children: [new PageBreak()] }));
                docChildren.push(new Paragraph({ text: "Answer Key", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 200 } }));
                
                // Objective Answers in a Table
                const objectiveAnswers = generatedData.answers.filter(a => a.type === 'objective');
                if(objectiveAnswers.length > 0) {
                    docChildren.push(new Paragraph({ text: "Objective Answers", heading: HeadingLevel.HEADING_3, spacing: { after: 100 } }));
                    const rows = [];
                    const numCols = 5;
                    for (let i = 0; i < objectiveAnswers.length; i += numCols) {
                        const cells = [];
                        for (let j = 0; j < numCols; j++) {
                            const ansIndex = i + j;
                            if (ansIndex < objectiveAnswers.length) {
                                const cleanAnswer = objectiveAnswers[ansIndex].answer.replace(/^\d+\.\s*/, '').trim().toUpperCase();
                                cells.push(new TableCell({ children: [new Paragraph(`${ansIndex + 1}. ${cleanAnswer}`)]}));
                            } else {
                                cells.push(new TableCell({ children: [new Paragraph("")]}));
                            }
                        }
                        rows.push(new TableRow({ children: cells }));
                    }
                    const answerTable = new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } });
                    docChildren.push(answerTable);
                }

                // Essay Answers
                const essayAnswers = generatedData.answers.filter(a => a.type === 'essay');
                if(essayAnswers.length > 0) {
                    docChildren.push(new Paragraph({ text: "Essay Answers", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
                    essayAnswers.forEach((ans) => {
                        let cleanedText = ans.answer
                            .replace(/^\d+\.\s*/, '')
                            .replace(/^\d+[a-z]\.\s*\d+[a-z]\.\s*/, '')
                            .replace(/(\r\n|\n|\\n)\s*\d+[a-z]\.\s*\[Answer for sub-question \d+\]\s*/g, '')
                            .trim();
                        
                        const paragraphs = cleanedText.split(/\\n\\n|\\n\s*\\n/); 

                        paragraphs.forEach(para => {
                            if (para.trim()) {
                                const lines = para.split(/\\n/);
                                
                                // THIS IS THE CORRECTED LOGIC BLOCK
                                const children = lines.flatMap((line, index) => {
                                    const trimmedLine = line.trim();
                                    const runs = [];

                                    if (trimmedLine) {
                                        runs.push(new TextRun(trimmedLine));
                                    }

                                    if (index < lines.length - 1) {
                                        runs.push(new TextRun({ break: 1 }));
                                    }
                                    
                                    return runs;
                                });

                                if(children.length > 0) {
                                    docChildren.push(new Paragraph({ children, spacing: { after: 100 } }));
                                }
                            }
                        });
                    });
                }
            }

            // --- Document Assembly with Header/Footer ---
            const doc = new Document({
                sections: [{
                    headers: {
                        default: new Header({
                            children: [new Paragraph({
                                text: `Subject: ${subject}`,
                                alignment: AlignmentType.RIGHT,
                            })],
                        }),
                    },
                    footers: {
                        default: new Footer({
                            children: [new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun("Page "),
                                    new TextRun({ children: [PageNumber.CURRENT] }),
                                    new TextRun(" of "),
                                    new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
                                ],
                            })],
                        }),
                    },
                    children: docChildren,
                }],
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, fileName);

        } catch (error) {
            console.error('Failed to export DOCX:', error);
            alert('Could not export to DOCX. Please try again.');
        } finally {
            setIsExportingDocx(false);
        }
    };

    if (!generatedData) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 text-center">
                <AlertTriangle className="mx-auto w-16 h-16 text-yellow-400" />
                <h1 className="mt-4 text-2xl font-bold text-gray-800">No Questions Found</h1>
                <p className="mt-2 text-gray-600">
                    Please generate a new set of questions first.
                </p>
                <button
                    onClick={() => navigate('/exams/generate')}
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
                                <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Objectives</h3>
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
                                <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Essay Part</h3>
                                <p className="text-lg font-medium text-gray-700 mb-4">Section B (Theory)</p>
                                <div className="space-y-5">
                                    {generatedData.essays.map((essay, idx) => {
                                        const qNum = idx + 1;
                                        if (essay.sub_questions?.length > 0) {
                                            const allNested = [essay.question, ...essay.sub_questions];
                                            const firstQuestionLower = essay.question.toLowerCase().trim();
                                            const isGenericHeader = firstQuestionLower.startsWith('question') || firstQuestionLower.startsWith('essay');
                                            const questionsToRender = (isGenericHeader && allNested.length > 1) ? allNested.slice(1) : allNested;
                                            return (
                                                <div key={`essay-nested-${idx}`} className="ml-6 mt-2 space-y-1">
                                                    {questionsToRender.map((sub, subIdx) => {
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
                                {generatedData.answers.filter(a => a.type === "objective").length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-lg font-semibold text-gray-600 mb-2">Objectives Answers</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                            {generatedData.answers.filter(a => a.type === "objective").map((ans, idx) => (
                                                <div key={`ans-obj-${idx}`} className="p-2 bg-green-50 rounded border border-green-200 text-center">
                                                    <p className="text-sm text-green-900">
                                                        <span className="font-bold">{idx + 1}. </span>
                                                        <span>{ans.answer.toUpperCase()}</span>
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {generatedData.answers.filter(a => a.type === "essay").length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-lg font-semibold text-gray-600 mb-2">Essay Answers</h4>
                                        <div className="space-y-3">
                                            {generatedData.answers.filter(a => a.type === "essay").map((ans, idx) => {
                                                let formattedAnswer = ans.answer.replace(/\\n/g, '\n');
                                                formattedAnswer = formattedAnswer.replace(/\s+\d+[a-z]\.\s*\[Answer for sub-question \d+\]\s*$/, '').trim();
                                                return (
                                                    <div key={`ans-essay-${idx}`} className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded whitespace-pre-wrap">
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