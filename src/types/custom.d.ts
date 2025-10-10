// Project-local ambient declarations for packages without types

declare module 'react-quill' {
    import * as React from 'react';
    const ReactQuill: React.ComponentType<Record<string, unknown>>;
    export default ReactQuill;
}

declare module 'file-saver' {
    export function saveAs(
        data: Blob | File | string,
        filename?: string,
        options?: Record<string, unknown>
    ): void;
}

declare module 'html-to-docx' {
    const htmlToDocx: (
        html: string,
        options?: Record<string, unknown>,
        other?: unknown
    ) => Promise<Uint8Array | ArrayBuffer>;
    export default htmlToDocx;
}

declare module 'pdfmake/build/pdfmake' {
    interface PdfGenerator {
        download: (filename?: string) => void;
        open: () => void;
        print: () => void;
    }

    const pdfMake: {
        vfs?: Record<string, unknown>;
        createPdf: (def: unknown) => PdfGenerator;
    };
    export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
    const pdfFonts: { pdfMake?: { vfs?: Record<string, unknown> } };
    export default pdfFonts;
}

declare module 'html-to-pdfmake' {
    const htmlToPdfmake: (html: string) => unknown;
    export default htmlToPdfmake;
}
