import { TestBed } from '@angular/core/testing';
import { NgxWigFilterService } from './ngx-wig-filter.service';

describe('NgxWigFilterService', () => {
  let service: NgxWigFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxWigFilterService);
  });

  it('should create an instance', () => {
    expect(service).toBeTruthy();
  });

  it('should return the same content when filtering', () => {
    const content = 'Hello, world!';
    expect(service.filter(content)).toEqual(content);
  });
});
