// src/utils/search.utils.js
const { BadRequestError } = require('common/core/error.response');

const createUnaccentedRegexPattern = (str) => {
    const accentMap = {
        a: '[aáàảãạăắằẳẵặâấầẩẫậ]',
        e: '[eéèẻẽẹêếềểễệ]',
        i: '[iíìỉĩị]',
        o: '[oóòỏõọôốồổỗộơớờởỡợ]',
        u: '[uúùủũụưứừửữự]',
        y: '[yýỳỷỹỵ]',
        d: '[dđ]',
        A: '[AÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬ]',
        E: '[EÉÈẺẼẸÊẾỀỂỄỆ]',
        I: '[IÍÌỈĨỊ]',
        O: '[OÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢ]',
        U: '[UÚÙỦŨỤƯỨỪỬỮỰ]',
        Y: '[YÝỲỶỸỴ]',
        D: '[DĐ]'
    };

    let pattern = str;
    Object.keys(accentMap).forEach(char => {
        const regex = new RegExp(char, 'g');
        pattern = pattern.replace(regex, accentMap[char]);
    });
    return pattern;
}

const escapeRegexSpecialChars = (str) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const validateSearchQuery = (query) => {
    if (!query || typeof query !== 'string') {
        throw new BadRequestError('Search query is required and must be a string.');
    }
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2 || trimmedQuery.length > 100) {
        throw new BadRequestError('Search query must be between 2 and 100 characters long.');
    }
    return trimmedQuery;
};

module.exports = {
    createUnaccentedRegexPattern,
    escapeRegexSpecialChars,
    validateSearchQuery
};
