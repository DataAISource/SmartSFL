import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SpeechRecognitionService } from '../../Services/speechregonition/speech-recognition.service';
import { ChatbotServieService } from '../../Services/chatbot/chatbot-servie.service';
interface Folder {
  name: string;
  pdfList: { name: string, content: SafeResourceUrl }[];
  isOpen: boolean; // Add isOpen propert




}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  isRecording: boolean = false;
  transcriptData: string = '';
  isOpen: boolean = false;
  message: string = '';
  messages: { text: string, from: string }[] = [];

  recognizedText: string = '';
  speech!: string;
  newFolderName: string = '';
  folders: Folder[] = [];

  showFolderDialog: boolean = false;



  pdfContent: SafeResourceUrl | null = null;
  showRecorderBox: boolean = false;
  userMessage: string = '';

  isMicrophonePopupOpen = false;


  pdfList: { name: string, content: SafeResourceUrl }[] = []; // Array to store uploaded PDFs

  constructor(private sanitizer: DomSanitizer, public service: SpeechRecognitionService, private ChatbotService: ChatbotServieService) {
    this.service.init()
  }


  handlePdfInput(event: Event, folder: Folder) {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type === "application/pdf") {
          const reader = new FileReader();
          reader.onload = () => {
            const pdfContent: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(reader.result as string);
            folder.pdfList.push({ name: file.name, content: pdfContent });
            // this.pdfList.push({ name: file.name, content: pdfContent });
          };
          reader.readAsDataURL(file);
        } else {
          console.error("Please select a PDF file.");
        }
      }
    }
  }
  toggleFolder(folder: Folder) {
    folder.isOpen = !folder.isOpen;
  }
  openPdfFileManagerForFolder(folder: Folder) {
    const pdfInput = document.createElement('input');
    pdfInput.type = 'file';
    pdfInput.multiple = true;
    pdfInput.accept = 'application/pdf';
    pdfInput.addEventListener('change', (event) => this.handlePdfInput(event, folder));
    pdfInput.click();
  }

  showPdfContent(pdf: { name: string, content: SafeResourceUrl }) {
    console.log("Displaying PDF content:", pdf.content);
    this.pdfContent = pdf.content;
  }
  closePdfViewer() {
    this.pdfContent = null; // Clear the pdfContent to close the PDF viewer
  }
  openChat() {
    this.isOpen = true;
  }

  closeChat() {
    this.isOpen = false;
  }

  startSpeechRecognition() {
    // Logic to start speech recognition
    console.log("Start speech recognition");
    this.showRecorderBox = true;
    this.isMicrophonePopupOpen = !this.isMicrophonePopupOpen;
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }

  }

  startRecording() {
    this.service.start();
    this.isRecording = true;

  }

  stopRecording() {
    this.service.stop();
    this.isRecording = false;
    this.recognizedText = this.service.text.trim();
    if (this.recognizedText !== '') {
      this.sendMessage(this.recognizedText);
    }
    this.service.text = '';

  }

  toggleSpeechRecognition() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  sendMessage(text: string) {
    console.log('Recognized text:', text);
    var transcript = localStorage.getItem('transcript');
    this.speech = transcript ? transcript : ""
    this.messages.push({ text: this.speech, from: 'user' });  // Call the chatbot API to send the recognized text as a message
    this.ChatbotService.sendMessage(this.speech).subscribe((response: any) => {
      console.log('Chatbot API Response:', response);
      // Add the chatbot's response to the messages array
      const botResponse = { text: response.Answer, from: 'bot' };
      this.messages.push(botResponse);
    }, (error: any) => {
      console.error('Chatbot API Error:', error);
    });
  }

  sendMessageToAPI() {
    console.log('userMessage:', this.message); // Use the message variable
    // Check if message is defined before sending
    if (this.message.trim() !== '') {
      // Add user's message content to messages array
      this.messages.push({ text: this.message, from: 'user' });

      // Call the API to send the message and handle the response
      this.ChatbotService.sendMessage(this.message).subscribe((response: any) => {
        console.log('API Response:', response);
        // Add bot's response content to messages array
        this.messages.push({ text: response.Answer, from: 'bot' }); // Use 'Answer' field for bot's response
        // Handle the API response here
      }, (error: any) => {
        console.error('API Error:', error);
        // Handle the error here
      });

      // Clear message after sending
      this.message = '';
    }
  }

  handleChatbotResponse() {
    // Mocking chatbot response (replace this with actual logic)
    const chatbotResponse = "This is a chatbot response.";
    // Add chatbot response to messages array
    this.messages.push({ text: chatbotResponse, from: 'bot' });
  }

  openFolderDialog() {
    this.showFolderDialog = true;
  }

  closeFolderDialog() {
    this.showFolderDialog = false;
    this.newFolderName = ''; // Clear the folder name input field
  }
  createFolder() {
    if (this.newFolderName.trim() !== '') {
      const newFolder: Folder = { name: this.newFolderName, pdfList: [], isOpen: false };
      this.folders.push(newFolder);
      this.closeFolderDialog();
    }
  }


}