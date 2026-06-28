import { Service } from "@angular/core";

@Service()
export class NgxWigFilterStylesService {
  public filter(htmlString: string): string {
    // Parse the HTML string into a DOM object
    const parser: DOMParser = new DOMParser();
    const doc: Document = parser.parseFromString(htmlString, "text/html");

    // Remove all style attributes from all elements
    const elementsWithStyle: NodeListOf<Element> =
      doc.querySelectorAll("[style]");
    elementsWithStyle.forEach((el: Element) => el.removeAttribute("style"));

    // Remove all <style> elements
    const styleElements: NodeListOf<HTMLStyleElement> =
      doc.querySelectorAll("style");
    styleElements.forEach((el: HTMLStyleElement) =>
      el.parentNode?.removeChild(el)
    );

    // Get the inner HTML of the body element
    const bodyInnerHTML: string = doc.body.innerHTML;

    return bodyInnerHTML;
  }
}
