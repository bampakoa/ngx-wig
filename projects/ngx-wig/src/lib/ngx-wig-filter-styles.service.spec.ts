import { TestBed } from '@angular/core/testing';
import { NgxWigFilterStylesService } from './ngx-wig-filter-styles.service';

describe('NgxWigFilterStylesService', () => {
  let service: NgxWigFilterStylesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxWigFilterStylesService);
  });

  it('should create an instance', () => {
    expect(service).toBeTruthy();
  });

  it('should remove style attributes from HTML string', () => {
    const htmlString = '<div style="color: red;">Hello, world!</div>';
    const expectedOutput = '<div>Hello, world!</div>';
    expect(service.filter(htmlString)).toEqual(expectedOutput);
  });

  it('should remove style elements from HTML string', () => {
    const htmlString = '<style>.red { color: red; }</style><div>Hello, world!</div>';
    const expectedOutput = '<div>Hello, world!</div>';
    expect(service.filter(htmlString)).toEqual(expectedOutput);
  });

  it('should handle empty HTML string', () => {
    const htmlString = '';
    const expectedOutput = '';
    expect(service.filter(htmlString)).toEqual(expectedOutput);
  });
});