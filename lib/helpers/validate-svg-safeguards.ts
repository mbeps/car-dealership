export function validateSvgSafeguards(bytes: Buffer): void {
  const content = bytes.toString("utf8");
  if (!content) {
    throw new Error("SVG content is empty.");
  }

  if (content.includes("\u0000")) {
    throw new Error("SVG contains invalid binary content.");
  }

  if (!/<svg[\s>]/i.test(content)) {
    throw new Error("SVG root element is missing.");
  }

  const blockedPatterns = [
    /<script[\s>]/i,
    /on[a-z]+\s*=/i,
    /javascript:/i,
    /<foreignObject[\s>]/i,
    /<iframe[\s>]/i,
    /<object[\s>]/i,
    /<embed[\s>]/i,
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(content)) {
      throw new Error("SVG contains blocked content.");
    }
  }
}
