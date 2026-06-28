import { Service } from '@angular/core';

@Service()
export class NgxWigFilterStylesService {
  filter(htmlString: string) {
    // Parse the HTML string into a DOM object
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Remove all style attributes from all elements
    const elementsWithStyle = doc.querySelectorAll('[style]');
    elementsWithStyle.forEach(el => el.removeAttribute('style'));

    // Remove all <style> elements
    const styleElements = doc.querySelectorAll('style');
    styleElements.forEach(el => el.parentNode?.removeChild(el));

    // Get the inner HTML of the body element
    const bodyInnerHTML = doc.body.innerHTML;

    return bodyInnerHTML;
  }
}
