import { TestBed } from '@angular/core/testing';

import { ChatbotServieService } from './chatbot-servie.service';

describe('ChatbotServieService', () => {
  let service: ChatbotServieService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatbotServieService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
