/**
 * Clear All Formatting Utility for sOffice Docs.
 * Resets selected runs and paragraphs back to baseline Normal style.
 *
 * Author: Bùi Thành Ninh <https://soffice.caqa.io.vn>
 */

export interface ClearFormatPlan {
  removeMarks: string[];
  resetParagraphAttrs: Record<string, unknown>;
}

export const ClearFormatting = {
  getDefaultClearPlan(): ClearFormatPlan {
    return {
      removeMarks: [
        'bold',
        'italic',
        'underline',
        'strike',
        'highlight',
        'textColor',
        'fontFamily',
        'fontSize',
        'link',
        'superscript',
        'subscript',
      ],
      resetParagraphAttrs: {
        align: 'left',
        indent: 0,
        lineSpacing: 1.15,
        spaceBefore: 0,
        spaceAfter: 4,
        shadingColor: null,
      },
    };
  },
};