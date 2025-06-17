"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProduction = exports.isDevelopment = exports.createError = exports.unique = exports.groupBy = exports.getRatingScore = exports.getMoodScore = exports.capitalizeFirst = exports.sanitizeString = exports.createPaginationResponse = exports.getPaginationParams = exports.daysBetween = exports.isToday = exports.formatDate = exports.isValidMovieRating = exports.isValidMoodType = void 0;
const types_1 = require("../types");
// Validate enum values
const isValidMoodType = (mood) => {
    return Object.values(types_1.MoodType).includes(mood);
};
exports.isValidMoodType = isValidMoodType;
const isValidMovieRating = (rating) => {
    return Object.values(types_1.MovieRating).includes(rating);
};
exports.isValidMovieRating = isValidMovieRating;
// Date utilities
const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};
exports.formatDate = formatDate;
const isToday = (date) => {
    const today = new Date();
    return (0, exports.formatDate)(date) === (0, exports.formatDate)(today);
};
exports.isToday = isToday;
const daysBetween = (date1, date2) => {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
};
exports.daysBetween = daysBetween;
// Pagination utilities
const getPaginationParams = (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};
exports.getPaginationParams = getPaginationParams;
const createPaginationResponse = (data, total, page, limit) => {
    return {
        data,
        pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit),
            has_next: page * limit < total,
            has_prev: page > 1
        }
    };
};
exports.createPaginationResponse = createPaginationResponse;
// String utilities
const sanitizeString = (str) => {
    return str.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
};
exports.sanitizeString = sanitizeString;
const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
exports.capitalizeFirst = capitalizeFirst;
// Mood analysis utilities
const getMoodScore = (mood) => {
    const moodScores = {
        [types_1.MoodType.SAD]: 1,
        [types_1.MoodType.JUST_FINE]: 2,
        [types_1.MoodType.NEUTRAL]: 3,
        [types_1.MoodType.CHEERFUL]: 4,
        [types_1.MoodType.VERY_HAPPY]: 5
    };
    return moodScores[mood] || 3;
};
exports.getMoodScore = getMoodScore;
const getRatingScore = (rating) => {
    const ratingScores = {
        [types_1.MovieRating.DISLIKED]: 1,
        [types_1.MovieRating.GOOD]: 2,
        [types_1.MovieRating.LOVED]: 3
    };
    return ratingScores[rating] || 2;
};
exports.getRatingScore = getRatingScore;
// Array utilities
const groupBy = (array, key) => {
    return array.reduce((groups, item) => {
        const groupKey = String(item[key]);
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(item);
        return groups;
    }, {});
};
exports.groupBy = groupBy;
const unique = (array) => {
    return [...new Set(array)];
};
exports.unique = unique;
// Error utilities
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};
exports.createError = createError;
// Environment utilities
const isDevelopment = () => {
    return process.env.NODE_ENV === 'development';
};
exports.isDevelopment = isDevelopment;
const isProduction = () => {
    return process.env.NODE_ENV === 'production';
};
exports.isProduction = isProduction;
//# sourceMappingURL=helpers.js.map