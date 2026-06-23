import { Service } from '@angular/core';

@Service()
export class NgxWigFilterService {
  constructor() {}
  public filter(content: string): string {
    return this._cleanWordHtml(content);
  }

  /**
   * Cleans up HTML pasted from Word, converting bullet/numbered lists and removing redundant tags/styles.
   */
  private _cleanWordHtml(html: string): string {
    // --- 1. Collect underline classes from <style> blocks ---
    const underlineClasses: string[] = this._getUnderlineClassesFromStyles(html);

    // --- 2. Mark underlined spans by class or inline style ---
    html = this._markUnderlineSpans(html, underlineClasses);

    // --- 3. Remove unwanted tags, attributes, and whitespace ---
    html = this._stripWordMetaAndJunk(html);

    // --- 4. Convert <u-mark> to <u> (if any left from previous versions) ---
    html = html.replace(/<u-mark>([\s\S]*?)<\/u-mark>/gi, '<u>$1</u>');

    // --- 5. Convert Word lists to <ul>/<ol> and <li> ---
    html = this._convertWordLists(html);

    // --- 6. Convert links to open in new tab ---
    html = html.replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, '<a href="$1" target="_blank">$2</a>');

    // --- 7. Handle any remaining s2/s3 underlined spans (Apple/Word) ---
    html = html.replace(/<span([^>]*)class=["'][^"']*s2[^"']*["']([^>]*)>([\s\S]*?)<\/span>/gi, (m, p1, p2, p3) => `<u>${p3}</u>`);
    html = html.replace(/<span([^>]*)class=["'][^"']*s3[^"']*["']([^>]*)>([\s\S]*?)<\/span>/gi, (m, p1, p2, p3) => `<u>${p3}</u>`);
    // --- 8. Handle <a><u>...</u></a> for underlined links ---
    html = html.replace(/<a ([^>]+)><u>([\s\S]*?)<\/u><\/a>/gi, function(_m, p1, p2) { return `<a ${p1}><u>${p2}</u></a>`; });

    return html;
  }

  // --- Helper: Extract underline classes from <style> blocks ---
  private _getUnderlineClassesFromStyles(html: string): string[] {
    const underlineClasses: string[] = [];
    const styleBlocks = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
    styleBlocks.forEach(styleBlock => {
      const classMatches = styleBlock.match(/\.(\w+)\s*\{[^}]*text-decoration\s*:\s*underline[^}]*\}/gi) || [];
      classMatches.forEach(cls => {
        const m = cls.match(/\.(\w+)/);
        if (m && m[1]) underlineClasses.push(m[1]);
      });
    });
    return underlineClasses;
  }

  // --- Helper: Mark underlined spans by class or inline style ---
  private _markUnderlineSpans(html: string, underlineClasses: string[]): string {
    if (underlineClasses.length > 0) {
      html = html.replace(/<span([^>]*)class=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/span>/gi, (match, p1, classAttr: string, p3, content) => {
        const classes = classAttr.split(/\s+/);
        if (classes.some(cls => underlineClasses.includes(cls)) && classes.every(cls => underlineClasses.includes(cls) || cls === 's2' || cls === 's3')) {
          return `<u>${content}</u>`;
        }
        return match;
      });
    }
    html = html.replace(/<span([^>]*)style=["'][^"']*text-decoration\s*:\s*underline;?[^"']*["']([^>]*)>([\s\S]*?)<\/span>/gi, '<u>$3</u>');
    return html;
  }

  // --- Helper: Remove meta, style, script, o:p, comments, mso, class/style attrs, empty spans, nbsp, empty <p> ---
  private _stripWordMetaAndJunk(html: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Remove unwanted tags: meta, style, script, o:p (both paired and self-closing)
    const tagsToRemove = ['meta', 'style', 'script'];
    for (const tag of tagsToRemove) {
      tempDiv.querySelectorAll(tag).forEach(el => el.remove());
    }

    // Remove comments
    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_COMMENT, null);
    const commentsToRemove: Comment[] = [];
    while (walker.nextNode()) {
      commentsToRemove.push(walker.currentNode as Comment);
    }
    for (const comment of commentsToRemove) {
      comment.parentNode?.removeChild(comment);
    }

    // Remove mso- styles
    for (const el of Array.from(tempDiv.querySelectorAll('[style]'))) {
      const original = el.getAttribute('style') ?? '';
      const filtered = original
        .split(';')
        .map(rule => rule.trim())
        .filter(rule => !/^mso-[\w-]+:/i.test(rule))
        .join('; ');
      el.setAttribute('style', filtered);
    }

    // Remove class and style attributes
    tempDiv.querySelectorAll('[class]').forEach(el => el.removeAttribute('class'));
    tempDiv.querySelectorAll('[style]').forEach(el => {
      if (!el.getAttribute('style')) el.removeAttribute('style');
    });

    // Remove empty <span> and <p> tags
    tempDiv.querySelectorAll('span').forEach(el => {
      if (el.textContent?.trim() === '') el.remove();
    });
    tempDiv.querySelectorAll('p').forEach(el => {
      if (el.textContent?.trim() === '') el.remove();
    });

    // Replace &nbsp; with space
    html = tempDiv.innerHTML.replace(/&nbsp;/g, ' ');

    return html;
  }

  // --- Helper: Convert Word lists to <ul>/<ol> and <li> ---
  private _convertWordLists(html: string): string {
    // 1. Mark bullets and numbers as <li data-list-type="ul"> or <li data-list-type="ol">
    html = this._convertBulletsToListItems(html);

    // 2. Group consecutive <li> of the same type into <ul> or <ol>
    html = html.replace(/((<li data-list-type="(ul|ol)">[\s\S]*?<\/li>\s*)+)/gi, (match) => {
      // Find the type of the first <li> in this group
      const typeMatch = match.match(/<li data-list-type="(ul|ol)">/);
      if (!typeMatch) return match;
      const type = typeMatch[1];
      // Now, split the group into consecutive runs of the same type
      const liRegex = /<li data-list-type="(ul|ol)">([\s\S]*?)<\/li>/g;
      let result = '';
      let currentType = null;
      let buffer = '';
      let m;
      while ((m = liRegex.exec(match)) !== null) {
        if (!currentType) {
          currentType = m[1];
          buffer = `<li>${m[2]}</li>`;
        } else if (m[1] === currentType) {
          buffer += `<li>${m[2]}</li>`;
        } else {
          result += currentType === 'ul' ? `<ul>${buffer}</ul>` : `<ol>${buffer}</ol>`;
          currentType = m[1];
          buffer = `<li>${m[2]}</li>`;
        }
      }
      if (buffer) {
        result += currentType === 'ul' ? `<ul>${buffer}</ul>` : `<ol>${buffer}</ol>`;
      }
      return result;
    });
    // 3. Remove data-list-type attributes
    html = html.replace(/ data-list-type="(ul|ol)"/g, '');
    return html;
  }

  private _convertBulletsToListItems(html: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const bulletRegex = /^[\u2022\u25CF\u25A0•·]\s+/;
    const numberRegex = /^\d+\.\s+/;

    const elements = tempDiv.querySelectorAll('p, span');

    elements.forEach(el => {
      const text = el.textContent?.trim() || '';

      if (bulletRegex.test(text)) {
        const cleaned = text.replace(bulletRegex, '');
        const li = document.createElement('li');
        li.setAttribute('data-list-type', 'ul');
        li.innerHTML = el.innerHTML.replace(bulletRegex, '');
        el.replaceWith(li);
      } else if (numberRegex.test(text)) {
        const cleaned = text.replace(numberRegex, '');
        const li = document.createElement('li');
        li.setAttribute('data-list-type', 'ol');
        li.innerHTML = el.innerHTML.replace(numberRegex, '');
        el.replaceWith(li);
      }
    });

    return tempDiv.innerHTML;
  }
}
