import { defaultConfigLibXMLConfig } from '@commons/constants';
import { Logger } from '@nestjs/common';
import { arrayNotEmpty, isEmpty } from 'class-validator';
import { Document, Element, parseHtml, parseXml } from 'libxmljs2';

// Declare value() method for Node interface
declare module 'libxmljs2' {
  interface Node {
    value(): string;
  }
}

export interface ParserConfig {
  type: 'html' | 'xml';
  encoding?:
    | 'HTML'
    | 'ASCII'
    | 'UTF-8'
    | 'UTF-16'
    | 'ISO-Latin-1'
    | 'ISO-8859-1';
  whitespace?: boolean;
  selfCloseEmpty?: boolean;
  declaration?: boolean;
}

export class DocumentParser {
  private readonly logger = new Logger(DocumentParser.name);
  private document: Document | null = null;
  private config: ParserConfig;

  // List of valid HTML5 tags
  private static readonly validHtmlTags = new Set([
    // Document metadata
    'html',
    'head',
    'title',
    'base',
    'link',
    'meta',
    'style',

    // Content sectioning
    'body',
    'article',
    'section',
    'nav',
    'aside',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'header',
    'footer',
    'address',
    'main',

    // Text content
    'p',
    'hr',
    'pre',
    'blockquote',
    'ol',
    'ul',
    'li',
    'dl',
    'dt',
    'dd',
    'figure',
    'figcaption',
    'div',

    // Inline text semantics
    'a',
    'em',
    'strong',
    'small',
    'cite',
    'q',
    'dfn',
    'abbr',
    'ruby',
    'rt',
    'rp',
    'data',
    'time',
    'code',
    'var',
    'samp',
    'kbd',
    'sub',
    'sup',
    'i',
    'b',
    'u',
    'mark',
    'bdi',
    'bdo',
    'span',
    'br',
    'wbr',

    // Image and multimedia
    'img',
    'audio',
    'video',
    'source',
    'track',
    'map',
    'area',
    'picture',

    // Embedded content
    'iframe',
    'embed',
    'object',
    'param',
    'canvas',
    'noscript',

    // Scripting
    'script',

    // Table content
    'table',
    'caption',
    'colgroup',
    'col',
    'tbody',
    'thead',
    'tfoot',
    'tr',
    'td',
    'th',

    // Forms
    'form',
    'label',
    'input',
    'button',
    'select',
    'datalist',
    'optgroup',
    'option',
    'textarea',
    'output',
    'progress',
    'meter',
    'fieldset',
    'legend',

    // Interactive elements
    'details',
    'summary',
    'dialog',
  ]);

  constructor(config?: Partial<ParserConfig>) {
    this.config = {
      type: 'html',
      encoding: 'UTF-8',
      whitespace: false,
      selfCloseEmpty: true,
      declaration: false,
      ...config,
    };
  }

  get currentDocument() {
    return this.document;
  }

  /**
   * Clean style attributes from HTML content
   * @param content Raw HTML content
   * @returns HTML content with cleaned style attributes
   */
  private cleanStyleAttributes(content: string): string {
    return content.replace(/\s+style="[^"]*"/g, '');
  }

  /**
   * Validate and clean HTML content to only include valid HTML5 tags
   * @param content Raw HTML content
   * @returns Cleaned HTML content with only valid tags
   */
  private validateAndCleanHtmlTags(content: string): string {
    try {
      // Parse the content using libxmljs2
      const doc = parseHtml(content);
      if (isEmpty(doc)) return content;

      // Function to recursively process nodes
      const processNode = (node: Element | Document): void => {
        // Skip if not an Element
        if (!(node instanceof Element)) {
          return;
        }

        try {
          const tagName = node.name();
          if (isEmpty(tagName)) return;

          // Check if it's a valid HTML5 tag
          if (!DocumentParser.validHtmlTags.has(tagName.toLowerCase())) {
            // If invalid tag, handle its contents
            const parent = node.parent();
            if (parent && parent instanceof Element) {
              // Get the content of the invalid tag
              const children = node.childNodes();

              // Insert each child before the invalid node
              children.forEach((child) => {
                try {
                  parent.addPrevSibling(child);
                  if (child instanceof Element) {
                    processNode(child);
                  }
                } catch (err) {
                  this.logger.warn(
                    `Warning: Failed to insert child node: ${err}`,
                  );
                }
              });

              // Remove the invalid node
              try {
                node.remove();
              } catch (err) {
                this.logger.warn(
                  `Warning: Failed to remove invalid node: ${err}`,
                );
              }
            }
          } else {
            // Process children of valid tags
            const children = [...node.childNodes()];
            children.forEach((child) => {
              if (child instanceof Element) {
                processNode(child);
              }
            });
          }
        } catch (err) {
          this.logger.warn(`Warning: Failed to process node: ${err}`);
        }
      };

      // Process all elements in the document
      try {
        const rootElement = doc.root();
        if (rootElement) {
          processNode(rootElement);
          // Process all remaining elements
          const elements = rootElement.find('//*');
          elements.forEach((element) => {
            if (element instanceof Element) {
              processNode(element);
            }
          });
        }

        // Extract only the content inside body, excluding html and body tags
        const bodyContent = doc.get('//body');
        if (bodyContent && bodyContent instanceof Element) {
          // Get the inner content of body
          return bodyContent
            .childNodes()
            .map((node) => node.toString())
            .join('')
            .trim();
        }
      } catch (err) {
        this.logger.warn(`Warning: Failed to process document: ${err}`);
        return content;
      }

      // Fallback to original content if extraction fails
      return content;
    } catch (err) {
      this.logger.warn(`Warning: Failed to parse HTML: ${err}`);
      return content;
    }
  }

  /**
   * Load and parse raw HTML/XML content
   * @param rawContent Raw HTML/XML string content
   * @returns DocumentParser instance for chaining
   * @throws Error if parsing fails
   */
  public load(rawContent: string): DocumentParser {
    try {
      let cleanedContent = rawContent;

      if (this.config.type === 'html') {
        // First clean style attributes
        cleanedContent = this.cleanStyleAttributes(cleanedContent);
        // Then validate and clean HTML tags
        cleanedContent = this.validateAndCleanHtmlTags(cleanedContent);
      }

      this.document =
        this.config.type === 'html'
          ? parseHtml(cleanedContent, {
              recover: true,
              noent: true,
              nocdata: true,
              noblanks: true,
              nsclean: true,
              doctype: false,
              implied: false,
            })
          : parseXml(cleanedContent);
      return this;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to parse ${this.config.type.toUpperCase()} content: ${errorMessage}`,
      );
    }
  }

  /**
   * Get single element using XPath
   * @param xpath XPath selector
   * @param normalize Whether to normalize whitespace
   * @returns Found content or null
   */
  public getContent(xpath: string, normalize = true): string | null {
    if (!this.document) {
      throw new Error('Document not loaded. Call load() first.');
    }

    try {
      const node = this.document.get(xpath);

      if (!node) {
        return null;
      }

      // Handle different node types
      if (node instanceof Element) {
        return this.formatOutput(node.toString(defaultConfigLibXMLConfig));
      } else {
        const nodeValue =
          typeof node.value === 'function'
            ? node.value()
            : node.toString(defaultConfigLibXMLConfig);
        return this.formatOutput(nodeValue);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `Warning: Failed to get content for xpath "${xpath}": ${errorMessage}`,
      );
      return null;
    }
  }

  /**
   * Find multiple elements using XPath
   * @param xpath XPath selector
   * @param normalize Whether to normalize whitespace
   * @returns Array of found content
   */
  public findContent(xpath: string, normalize = true): string[] {
    if (isEmpty(this.document)) {
      throw new Error('Document not loaded. Call load() first.');
    }

    try {
      const nodes = this.document.find(xpath);

      if (!arrayNotEmpty(nodes)) {
        return [];
      }

      return nodes
        .map((node) => {
          if (node instanceof Element) {
            return this.formatOutput(node.toString(defaultConfigLibXMLConfig));
          } else {
            const nodeValue =
              typeof node.value === 'function'
                ? node.value()
                : node.toString(defaultConfigLibXMLConfig);
            return this.formatOutput(nodeValue);
          }
        })
        .filter(Boolean);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `Warning: Failed to find content for xpath "${xpath}": ${errorMessage}`,
      );
      return [];
    }
  }

  /**
   * Get raw document instance
   * @returns Document instance or null if not loaded
   */
  public getDocument(): Document | null {
    return this.document;
  }

  /**
   * Format output string based on configuration
   * @param text Input text
   * @returns Formatted text
   */
  private formatOutput(text: string): string {
    if (isEmpty(text)) return '';

    let output = text;
    if (!this.config.whitespace) {
      output = output.trim().replace(/\s+/g, ' ');
    }
    return output;
  }
}
