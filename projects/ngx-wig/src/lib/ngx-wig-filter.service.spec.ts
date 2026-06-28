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

  describe('_cleanWordHtml', () => {
    it('should clean Word HTML and convert underline spans to <u>', () => {
      const html = `<span style="text-decoration: underline;">Underlined text</span>`;
      const result = service['_cleanWordHtml'](html);
      expect(result).toContain('<u>Underlined text</u>');
    });

    it('should remove unwanted tags like <style>, <script>, and comments', () => {
      const html = `
      <style>.test { color: red; }</style>
      <script>alert('test');</script>
      <!-- Comment -->
      <p>Content</p>
    `;
      const result = service['_cleanWordHtml'](html);
      expect(result).toContain('<p>Content</p>');
      expect(result).not.toContain('<style>');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<!-- Comment -->');
    });

    it('should convert <u-mark> tags to <u>', () => {
      const html = `<u-mark>Text</u-mark>`;
      const result = service['_cleanWordHtml'](html);
      expect(result).toContain('<u>Text</u>');
    });

    it('should convert Word lists to <ul>/<ol> and <li>', () => {
      const html = `<p>• Bullet A</p><p>1. Item one</p>`;
      const result = service['_cleanWordHtml'](html);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>Bullet A</li>');
      expect(result).toContain('<ol>');
      expect(result).toContain('<li>Item one</li>');
    });

    it('should convert links to open in a new tab', () => {
      const html = `<a href="https://example.com">Example</a>`;
      const result = service['_cleanWordHtml'](html);
      expect(result).toContain('<a href="https://example.com" target="_blank">Example</a>');
    });
  });
});
