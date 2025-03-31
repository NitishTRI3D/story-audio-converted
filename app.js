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
const voiceSelect = document.getElementById('voiceSelect');

// Event Listeners
fileInput.addEventListener('change', handleFileSelect);
convertButton.addEventListener('click', convertToAudio);
downloadButton.addEventListener('click', downloadAudio);

// Load available voices when the page loads
window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);

// If voices are already available, load them
document.addEventListener('DOMContentLoaded', () => {
    if (window.speechSynthesis) {
        loadVoices();
    }
});

let extractedText = '';

// Function to load available voices
function loadVoices() {
    // Clear existing options
    voiceSelect.innerHTML = '';
    
    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    
    // Add voices to select dropdown
    voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
    });
}

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

// Convert text to audio using browser's SpeechSynthesis API
function convertToAudio() {
    if (!extractedText) {
        errorContainer.textContent = 'No text content to convert.';
        return;
    }
    
    // Check if browser supports speech synthesis
    if (!window.speechSynthesis) {
        errorContainer.textContent = 'Your browser does not support speech synthesis.';
        return;
    }
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(extractedText);
    
    // Get available voices and set selected voice
    const voices = speechSynthesis.getVoices();
    const selectedVoiceIndex = voiceSelect.value;
    
    if (selectedVoiceIndex && voices.length > 0) {
        utterance.voice = voices[selectedVoiceIndex];
    }
    
    // Create a blob URL for the audio player (for future implementation)
    // For now, we'll just play the audio directly
    
    // Show the audio section
    audioSection.style.display = 'block';
    
    // Display a loading message
    const originalButtonText = convertButton.textContent;
    convertButton.textContent = 'Converting...';
    convertButton.disabled = true;
    
    // Start speaking
    speechSynthesis.speak(utterance);
    
    // When synthesis ends
    utterance.onend = function() {
        convertButton.textContent = originalButtonText;
        convertButton.disabled = false;
    };
    
    // Listen for errors
    utterance.onerror = function(event) {
        errorContainer.textContent = 'Error occurred during speech synthesis: ' + event.error;
        convertButton.textContent = originalButtonText;
        convertButton.disabled = false;
    };
}

// Variable to store audio blob
let audioBlob = null;

// Download audio file
function downloadAudio() {
    if (!extractedText) {
        errorContainer.textContent = 'No text content to convert to audio.';
        return;
    }
    
    // For now, we'll create a simple text file with the content
    // In a future update, we can implement actual audio recording/saving
    
    // Create a blob from the text content
    const textBlob = new Blob([extractedText], { type: 'text/plain' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(textBlob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = 'storybook_text.txt'; // Default filename
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Release the URL object
    URL.revokeObjectURL(url);
}
