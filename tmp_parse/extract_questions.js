const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const files = [
    { file: '../ADR-Ananewsi-Basiki.docx', category: 'Βασικό', id: 'basiko' },
    { file: '../ADR-Ananewsi-Ekriktika ΚΛΑΣΗ 1.docx', category: 'Εκρηκτικά (Κλάση 1)', id: 'ekriktika' },
    { file: '../ADR-Ananewsi-Radienerga ΚΛΑΣΗ 7.docx', category: 'Ραδιενεργά (Κλάση 7)', id: 'radienerga' },
    { file: '../ADR-Ananewsi-Vytia.docx', category: 'Βυτία (Δεξαμενές)', id: 'vytia' }
];

function parseQuestions(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    const questions = [];
    let currentQ = null;
    let currentOptions = [];
    let chapterName = '';
    let i = 0;
    
    while (i < lines.length) {
        const line = lines[i];
        
        // Detect chapter headings
        if (line.startsWith('ΚΕΦΑΛΑΙΟ') || line.startsWith('Κεφάλαιο') || line.toUpperCase().includes('ΚΕΦΑΛΑΙΟ')) {
            chapterName = line;
            i++;
            continue;
        }
        
        // Detect question number - a line that's just a number
        if (/^\d+$/.test(line)) {
            // Save previous question
            if (currentQ && currentOptions.length > 0) {
                questions.push({ ...currentQ, options: currentOptions, chapter: chapterName });
            }
            
            // Start new question
            const qNum = parseInt(line);
            let qText = '';
            i++;
            
            // Collect question text until we hit α, β, γ
            while (i < lines.length) {
                const nextLine = lines[i];
                if (nextLine === 'α' || nextLine === 'β' || nextLine === 'γ') break;
                qText += (qText ? ' ' : '') + nextLine;
                i++;
            }
            
            currentQ = { num: qNum, question: qText };
            currentOptions = [];
            continue;
        }
        
        // Detect option start (α, β, γ)
        if ((line === 'α' || line === 'β' || line === 'γ') && currentQ) {
            const optLetter = line;
            let optText = '';
            let isCorrect = false;
            i++;
            
            // Collect option text until Σ or Λ
            while (i < lines.length) {
                const nextLine = lines[i];
                if (nextLine === 'Σ' || nextLine === 'Λ') {
                    isCorrect = nextLine === 'Σ';
                    i++;
                    break;
                }
                // If next line is another option
                if (nextLine === 'α' || nextLine === 'β' || nextLine === 'γ') break;
                // If it's a question number
                if (/^\d+$/.test(nextLine)) break;
                // If it's a chapter heading
                if (nextLine.toUpperCase().includes('ΚΕΦΑΛΑΙΟ')) break;
                
                optText += (optText ? ' ' : '') + nextLine;
                i++;
            }
            
            if (optText) {
                currentOptions.push({ letter: optLetter, text: optText, correct: isCorrect });
            }
            continue;
        }
        
        i++;
    }
    
    // Don't forget last question
    if (currentQ && currentOptions.length > 0) {
        questions.push({ ...currentQ, options: currentOptions, chapter: chapterName });
    }
    
    return questions;
}

async function main() {
    const allData = {};
    
    for (const { file, category, id } of files) {
        const result = await mammoth.extractRawText({ path: file });
        const text = result.value;
        const questions = parseQuestions(text);
        
        // Group by chapter
        const byChapter = {};
        for (const q of questions) {
            if (!byChapter[q.chapter]) byChapter[q.chapter] = [];
            // Only include questions that have exactly one correct answer
            const correctCount = q.options.filter(o => o.correct).length;
            if (correctCount === 1 && q.options.length >= 2) {
                byChapter[q.chapter].push({
                    id: `${id}_${q.num}`,
                    question: q.question,
                    options: q.options.map(o => ({ text: o.text, correct: o.correct }))
                });
            }
        }
        
        allData[id] = {
            category,
            chapters: byChapter,
            allQuestions: questions.filter(q => {
                const correctCount = q.options.filter(o => o.correct).length;
                return correctCount === 1 && q.options.length >= 2;
            }).map(q => ({
                id: `${id}_${q.num}`,
                question: q.question,
                chapter: q.chapter,
                options: q.options.map(o => ({ text: o.text, correct: o.correct }))
            }))
        };
        
        console.log(`${category}: ${allData[id].allQuestions.length} questions`);
    }
    
    // Save to JSON
    fs.writeFileSync('../questions_data.json', JSON.stringify(allData, null, 2), 'utf8');
    console.log('\nSaved to questions_data.json');
    
    // Summary
    for (const [id, data] of Object.entries(allData)) {
        console.log(`\n${data.category}:`);
        for (const [ch, qs] of Object.entries(data.chapters)) {
            console.log(`  ${ch}: ${qs.length} questions`);
        }
    }
}

main().catch(console.error);
