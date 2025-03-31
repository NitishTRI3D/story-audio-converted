// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.12.313/pdf.worker.min.js';

// DOM Elements
const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('file-name');
const errorContainer = document.getElementById('error-container');
const contentSection = document.getElementById('content-section');
const textContent = document.getElementById('text-content');
const convertButton = document.getElementById('convertButton');
const audioSection = document.getElementById('audio-section');
const audioPlayer = document.getElementById('audio-player');
const downloadButton = document.getElementById('downloadButton');

// Event Listeners
fileInput.addEventListener('change', handleFileSelect);
convertButton.addEventListener('click', convertToAudio);
downloadButton.addEventListener('click', downloadAudio);

let extractedText = '';

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    fileNameDisplay.textContent = file.name;
    errorContainer.textContent = '';
    contentSection.style.display = 'none';
    audioSection.style.display = 'none';
    
    // Check file extension
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (fileExtension !== 'pdf' && fileExtension !== 'txt') {
        errorContainer.textContent = 'Please select a PDF or TXT file.';
        return;
    }
    
    // Process file based on type
    if (fileExtension === 'pdf') {
        processPdfFile(file);
    } else {
        processTxtFile(file);
    }
}

// Process PDF files
function processPdfFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
        const typedArray = new Uint8Array(event.target.result);
        
        // Load the PDF document
        pdfjsLib.getDocument(typedArray).promise.then(function(pdf) {
            extractedText = '';
            
            // Get all pages text
            let pagePromises = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                pagePromises.push(getPageText(pdf, i));
            }
            
            Promise.all(pagePromises).then(function(pagesText) {
                extractedText = pagesText.join('\n\n');
                displayContent(extractedText);
            });
        }).catch(function(error) {
            errorContainer.textContent = 'Error reading PDF: ' + error.message;
        });
    };
    
    reader.readAsArrayBuffer(file);
}

// Extract text from a PDF page
function getPageText(pdf, pageNumber) {
    return pdf.getPage(pageNumber).then(function(page) {
        return page.getTextContent().then(function(textContent) {
            return textContent.items.map(item => item.str).join(' ');
        });
    });
}

// Process TXT files
function processTxtFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
        extractedText = event.target.result;
        displayContent(extractedText);
    };
    
    reader.onerror = function() {
        errorContainer.textContent = 'Error reading text file.';
    };
    
    reader.readAsText(file);
}

// Display content in the UI
function displayContent(text) {
    textContent.textContent = text;
    contentSection.style.display = 'block';
}

// Convert text to audio (placeholder for now)
function convertToAudio() {
    if (!extractedText) {
        errorContainer.textContent = 'No text content to convert.';
        return;
    }
    
    // In a future phase, we will integrate with TTS APIs
    // For now, just display a message about future functionality
    alert('Text-to-speech conversion will be implemented in the next phase.');
    
    // Placeholder for future implementation
    // audioSection.style.display = 'block';
}

// Download audio file (placeholder for now)
function downloadAudio() {
    alert('Download functionality will be available in the next phase.');
}
