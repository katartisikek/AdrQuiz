const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const files = [
    '../ADR-Ananewsi-Basiki.docx',
    '../ADR-Ananewsi-Ekriktika ΚΛΑΣΗ 1.docx',
    '../ADR-Ananewsi-Radienerga ΚΛΑΣΗ 7.docx',
    '../ADR-Ananewsi-Vytia.docx'
];

async function main() {
    for (const f of files) {
        const result = await mammoth.extractRawText({ path: f });
        const text = result.value;
        console.log(`\n\n========== ${path.basename(f)} ==========`);
        // Print first 3000 chars
        console.log(text.substring(0, 3000));
        console.log('...[total length: ' + text.length + ']');
    }
}

main().catch(console.error);
