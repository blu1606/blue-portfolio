const MarkdownIt = require('markdown-it');
const sanitizeHtml = require('sanitize-html');

const markdown = new MarkdownIt();

// config sanitize-html to just display the safe tag and attribute
const sanitizeOptions = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'video', 'iframe']),
    allowedAttributes: {
        'a': ['href', 'name', 'target'],
        'img': ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
        'iframe': ['src', 'frameborder', 'allow', 'allowfullscreen', 'width', 'height'],
        '*': ['style'] // allow style for further customized format
    }
}

const processMarkdown = (markdownContent) => {
    // 1. convert markdown to html 
    const rawHtml = markdown.render(markdownContent)
    // 2. sanitize HTML to prevent the XSS attack
    const sanitizedHtml = sanitizeHtml(rawHtml, sanitizeOptions)
    return sanitizeHtml;
}

module.exports = { processMarkdown };