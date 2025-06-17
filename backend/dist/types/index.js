"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovieRating = exports.MoodType = void 0;
// Mood Types (matching frontend)
var MoodType;
(function (MoodType) {
    MoodType["SAD"] = "sad";
    MoodType["JUST_FINE"] = "just_fine";
    MoodType["NEUTRAL"] = "neutral";
    MoodType["CHEERFUL"] = "cheerful";
    MoodType["VERY_HAPPY"] = "very_happy";
})(MoodType || (exports.MoodType = MoodType = {}));
// Movie Types (matching frontend)
var MovieRating;
(function (MovieRating) {
    MovieRating["DISLIKED"] = "disliked";
    MovieRating["GOOD"] = "good";
    MovieRating["LOVED"] = "loved"; // two thumbs up
})(MovieRating || (exports.MovieRating = MovieRating = {}));
//# sourceMappingURL=index.js.map