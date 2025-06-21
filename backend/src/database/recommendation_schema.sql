-- Enhanced FireTV Database Schema with Recommendation System
-- Run this after the main schema.sql to add recommendation features

-- Profile-specific movie recommendation tables
-- Each profile gets their own table with current recommendations

CREATE TABLE anshul_dash (
    id SERIAL PRIMARY KEY,
    tmdb_id INTEGER NOT NULL UNIQUE,
    title VARCHAR(500),
    genres TEXT[],
    vote_average DECIMAL(3,1),
    popularity DECIMAL(8,3),
    overview TEXT,
    poster_path VARCHAR(255),
    recommendation_reason TEXT,
    similarity_score DECIMAL(5,4) DEFAULT 0.5,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE shikhar_dash (
    id SERIAL PRIMARY KEY,
    tmdb_id INTEGER NOT NULL UNIQUE,
    title VARCHAR(500),
    genres TEXT[],
    vote_average DECIMAL(3,1),
    popularity DECIMAL(8,3),
    overview TEXT,
    poster_path VARCHAR(255),
    recommendation_reason TEXT,
    similarity_score DECIMAL(5,4) DEFAULT 0.5,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE priyanshu_dash (
    id SERIAL PRIMARY KEY,
    tmdb_id INTEGER NOT NULL UNIQUE,
    title VARCHAR(500),
    genres TEXT[],
    vote_average DECIMAL(3,1),
    popularity DECIMAL(8,3),
    overview TEXT,
    poster_path VARCHAR(255),
    recommendation_reason TEXT,
    similarity_score DECIMAL(5,4) DEFAULT 0.5,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE shaurya_dash (
    id SERIAL PRIMARY KEY,
    tmdb_id INTEGER NOT NULL UNIQUE,
    title VARCHAR(500),
    genres TEXT[],
    vote_average DECIMAL(3,1),
    popularity DECIMAL(8,3),
    overview TEXT,
    poster_path VARCHAR(255),
    recommendation_reason TEXT,
    similarity_score DECIMAL(5,4) DEFAULT 0.5,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Recommendation sessions table for tracking
CREATE TABLE recommendation_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_name VARCHAR(50) NOT NULL,
    session_mood mood_type,
    movies_count INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    recommendation_method VARCHAR(50) DEFAULT 'hybrid',
    cf_readiness_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_anshul_dash_tmdb_id ON anshul_dash(tmdb_id);
CREATE INDEX idx_anshul_dash_similarity_score ON anshul_dash(similarity_score DESC);
CREATE INDEX idx_anshul_dash_active ON anshul_dash(is_active);

CREATE INDEX idx_shikhar_dash_tmdb_id ON shikhar_dash(tmdb_id);
CREATE INDEX idx_shikhar_dash_similarity_score ON shikhar_dash(similarity_score DESC);
CREATE INDEX idx_shikhar_dash_active ON shikhar_dash(is_active);

CREATE INDEX idx_priyanshu_dash_tmdb_id ON priyanshu_dash(tmdb_id);
CREATE INDEX idx_priyanshu_dash_similarity_score ON priyanshu_dash(similarity_score DESC);
CREATE INDEX idx_priyanshu_dash_active ON priyanshu_dash(is_active);

CREATE INDEX idx_shaurya_dash_tmdb_id ON shaurya_dash(tmdb_id);
CREATE INDEX idx_shaurya_dash_similarity_score ON shaurya_dash(similarity_score DESC);
CREATE INDEX idx_shaurya_dash_active ON shaurya_dash(is_active);

CREATE INDEX idx_recommendation_sessions_user_id ON recommendation_sessions(user_id);
CREATE INDEX idx_recommendation_sessions_profile ON recommendation_sessions(profile_name);

-- Insert initial 30 random movie IDs for each profile
-- These are popular movies from different genres based on profile preferences

-- Anshul (Action, Thriller, Sci-Fi)
INSERT INTO anshul_dash (tmdb_id, title, genres, vote_average, popularity, recommendation_reason) VALUES
(550, 'Fight Club', ARRAY['Drama', 'Thriller'], 8.4, 75.0, 'Initial seed - matches thriller preference'),
(13, 'Forrest Gump', ARRAY['Drama', 'Romance'], 8.5, 70.0, 'Initial seed - highly rated'),
(680, 'Pulp Fiction', ARRAY['Crime', 'Drama'], 8.9, 80.0, 'Initial seed - cult classic'),
(155, 'The Dark Knight', ARRAY['Action', 'Crime', 'Drama'], 8.5, 90.0, 'Initial seed - action preference'),
(389, 'The Matrix', ARRAY['Action', 'Science Fiction'], 8.2, 85.0, 'Initial seed - sci-fi preference'),
(278, 'The Shawshank Redemption', ARRAY['Drama'], 8.7, 75.0, 'Initial seed - highest rated'),
(424, 'Schindler''s List', ARRAY['Drama', 'History', 'War'], 8.6, 68.0, 'Initial seed - critically acclaimed'),
(11, 'Star Wars', ARRAY['Adventure', 'Action', 'Science Fiction'], 8.8, 82.0, 'Initial seed - sci-fi classic'),
(120, 'The Lord of the Rings: The Fellowship of the Ring', ARRAY['Adventure', 'Fantasy', 'Action'], 8.4, 95.0, 'Initial seed - epic adventure'),
(157336, 'Interstellar', ARRAY['Adventure', 'Drama', 'Science Fiction'], 8.6, 92.0, 'Initial seed - sci-fi masterpiece'),
(27205, 'Inception', ARRAY['Action', 'Science Fiction', 'Mystery'], 8.4, 88.0, 'Initial seed - mind-bending thriller'),
(77338, 'The Intouchables', ARRAY['Drama', 'Comedy'], 8.5, 73.0, 'Initial seed - feel-good drama'),
(194, 'Amélie', ARRAY['Comedy', 'Romance'], 8.3, 71.0, 'Initial seed - unique storytelling'),
(122, 'The Lord of the Rings: The Return of the King', ARRAY['Adventure', 'Drama', 'Fantasy'], 8.7, 89.0, 'Initial seed - epic conclusion'),
(121, 'The Lord of the Rings: The Two Towers', ARRAY['Adventure', 'Drama', 'Fantasy'], 8.4, 86.0, 'Initial seed - continuing saga'),
(497, 'The Green Mile', ARRAY['Crime', 'Drama', 'Fantasy'], 8.5, 77.0, 'Initial seed - supernatural drama'),
(637, 'Life Is Beautiful', ARRAY['Comedy', 'Drama', 'Romance'], 8.6, 69.0, 'Initial seed - heartwarming story'),
(496243, 'Parasite', ARRAY['Comedy', 'Thriller', 'Drama'], 8.5, 94.0, 'Initial seed - modern thriller'),
(769, 'GoodFellas', ARRAY['Drama', 'Crime'], 8.5, 74.0, 'Initial seed - crime classic'),
(12477, 'Grave of the Fireflies', ARRAY['Animation', 'Drama', 'War'], 8.5, 65.0, 'Initial seed - powerful animation'),
(429, 'The Good, the Bad and the Ugly', ARRAY['Western'], 8.5, 72.0, 'Initial seed - western classic'),
(346, 'Seven Samurai', ARRAY['Action', 'Drama'], 8.7, 64.0, 'Initial seed - action masterpiece'),
(324857, 'Spider-Man: Into the Spider-Verse', ARRAY['Action', 'Adventure', 'Animation'], 8.4, 91.0, 'Initial seed - innovative animation'),
(372058, 'Your Name.', ARRAY['Romance', 'Drama', 'Animation'], 8.4, 83.0, 'Initial seed - beautiful animation'),
(140607, 'Get Out', ARRAY['Mystery', 'Thriller', 'Horror'], 7.8, 79.0, 'Initial seed - psychological thriller'),
(475557, 'Joker', ARRAY['Crime', 'Thriller', 'Drama'], 8.2, 88.0, 'Initial seed - character study'),
(598, 'City of God', ARRAY['Crime', 'Drama'], 8.6, 73.0, 'Initial seed - gritty crime drama'),
(128, 'Princess Mononoke', ARRAY['Adventure', 'Family', 'Animation'], 8.4, 78.0, 'Initial seed - animated adventure'),
(567, 'Rear Window', ARRAY['Thriller', 'Mystery'], 8.5, 71.0, 'Initial seed - suspense classic'),
(599, 'Sunset Boulevard', ARRAY['Drama'], 8.4, 67.0, 'Initial seed - film noir classic');

-- Shikhar (Comedy, Drama, Romance)
INSERT INTO shikhar_dash (tmdb_id, title, genres, vote_average, popularity, recommendation_reason) VALUES
(19404, 'Dilwale Dulhania Le Jayenge', ARRAY['Comedy', 'Drama', 'Romance'], 8.0, 65.0, 'Initial seed - romantic classic'),
(597, 'Titanic', ARRAY['Drama', 'Romance'], 7.9, 92.0, 'Initial seed - epic romance'),
(515001, 'Juno', ARRAY['Comedy', 'Drama'], 7.5, 68.0, 'Initial seed - coming-of-age comedy'),
(641, 'Some Like It Hot', ARRAY['Comedy', 'Romance'], 8.3, 70.0, 'Initial seed - comedy classic'),
(11216, 'Cinema Paradiso', ARRAY['Drama', 'Romance'], 8.5, 63.0, 'Initial seed - nostalgic drama'),
(37165, '500 Days of Summer', ARRAY['Comedy', 'Drama', 'Romance'], 7.3, 74.0, 'Initial seed - modern romance'),
(18148, 'Tokyo Story', ARRAY['Drama'], 8.2, 60.0, 'Initial seed - family drama'),
(914, 'The Great Dictator', ARRAY['Comedy', 'Drama', 'War'], 8.4, 66.0, 'Initial seed - Chaplin classic'),
(13342, 'Fast Times at Ridgemont High', ARRAY['Comedy', 'Drama'], 7.2, 58.0, 'Initial seed - teen comedy'),
(862, 'Toy Story', ARRAY['Animation', 'Comedy', 'Family'], 8.3, 89.0, 'Initial seed - family favorite'),
(10193, 'Toy Story 3', ARRAY['Animation', 'Comedy', 'Family'], 8.3, 84.0, 'Initial seed - emotional conclusion'),
(863, 'Toy Story 2', ARRAY['Animation', 'Comedy', 'Family'], 7.9, 81.0, 'Initial seed - sequel success'),
(49026, 'The Dark Knight Rises', ARRAY['Action', 'Crime', 'Drama'], 8.0, 87.0, 'Initial seed - epic conclusion'),
(585, 'Monsters, Inc.', ARRAY['Animation', 'Comedy', 'Family'], 8.1, 85.0, 'Initial seed - heartwarming animation'),
(12, 'Finding Nemo', ARRAY['Animation', 'Family', 'Comedy'], 8.2, 90.0, 'Initial seed - underwater adventure'),
(19995, 'Avatar', ARRAY['Action', 'Adventure', 'Fantasy'], 7.6, 95.0, 'Initial seed - visual spectacle'),
(680, 'Pulp Fiction', ARRAY['Crime', 'Drama'], 8.9, 80.0, 'Initial seed - dialogue-driven'),
(8587, 'The Lion King', ARRAY['Animation', 'Drama', 'Family'], 8.5, 87.0, 'Initial seed - Disney classic'),
(62, 'The Empire Strikes Back', ARRAY['Adventure', 'Action', 'Science Fiction'], 8.4, 83.0, 'Initial seed - space opera'),
(1891, 'The Empire Strikes Back', ARRAY['Adventure', 'Action', 'Science Fiction'], 8.4, 83.0, 'Initial seed - sequel excellence'),
(24428, 'The Avengers', ARRAY['Action', 'Adventure', 'Science Fiction'], 7.7, 93.0, 'Initial seed - superhero ensemble'),
(315635, 'Spider-Man: Homecoming', ARRAY['Action', 'Adventure', 'Science Fiction'], 7.4, 86.0, 'Initial seed - teen superhero'),
(299536, 'Avengers: Infinity War', ARRAY['Adventure', 'Action', 'Science Fiction'], 8.3, 94.0, 'Initial seed - epic crossover'),
(299534, 'Avengers: Endgame', ARRAY['Adventure', 'Action', 'Drama'], 8.4, 97.0, 'Initial seed - emotional climax'),
(102651, 'Maleficent', ARRAY['Adventure', 'Family', 'Fantasy'], 6.9, 78.0, 'Initial seed - fairy tale retelling'),
(508442, 'Soul', ARRAY['Animation', 'Comedy', 'Drama'], 8.1, 82.0, 'Initial seed - philosophical animation'),
(150540, 'Inside Out', ARRAY['Animation', 'Comedy', 'Drama'], 8.1, 88.0, 'Initial seed - emotional journey'),
(49517, 'The Pursuit of Happyness', ARRAY['Drama'], 8.0, 76.0, 'Initial seed - inspirational drama'),
(274, 'The Silence of the Lambs', ARRAY['Crime', 'Drama', 'Thriller'], 8.6, 79.0, 'Initial seed - psychological thriller'),
(807, 'Se7en', ARRAY['Crime', 'Drama', 'Mystery'], 8.6, 81.0, 'Initial seed - dark thriller');

-- Priyanshu (Horror, Mystery, Adventure)
INSERT INTO priyanshu_dash (tmdb_id, title, genres, vote_average, popularity, recommendation_reason) VALUES
(694, 'The Shining', ARRAY['Drama', 'Horror', 'Thriller'], 8.2, 82.0, 'Initial seed - horror classic'),
(539, 'Psycho', ARRAY['Horror', 'Mystery', 'Thriller'], 8.5, 75.0, 'Initial seed - Hitchcock masterpiece'),
(348, 'Alien', ARRAY['Horror', 'Science Fiction'], 8.5, 77.0, 'Initial seed - sci-fi horror'),
(1724, 'The Exorcist', ARRAY['Horror'], 8.0, 73.0, 'Initial seed - supernatural horror'),
(4135, 'The Birds', ARRAY['Drama', 'Horror', 'Mystery'], 7.7, 69.0, 'Initial seed - nature horror'),
(745, 'The Sixth Sense', ARRAY['Mystery', 'Thriller', 'Drama'], 8.2, 74.0, 'Initial seed - supernatural mystery'),
(1422, 'The Departed', ARRAY['Crime', 'Drama', 'Thriller'], 8.5, 83.0, 'Initial seed - crime thriller'),
(489, 'Good Will Hunting', ARRAY['Drama', 'Romance'], 8.3, 71.0, 'Initial seed - character drama'),
(901, 'City Lights', ARRAY['Comedy', 'Drama', 'Romance'], 8.5, 64.0, 'Initial seed - silent classic'),
(103, 'Taxi Driver', ARRAY['Crime', 'Drama'], 8.3, 78.0, 'Initial seed - psychological drama'),
(73, 'American Graffiti', ARRAY['Comedy', 'Drama'], 7.0, 59.0, 'Initial seed - nostalgic coming-of-age'),
(240, 'The Godfather Part II', ARRAY['Crime', 'Drama'], 8.6, 76.0, 'Initial seed - crime saga'),
(510, 'One Flew Over the Cuckoo''s Nest', ARRAY['Drama'], 8.7, 72.0, 'Initial seed - rebellious spirit'),
(475557, 'Joker', ARRAY['Crime', 'Thriller', 'Drama'], 8.2, 88.0, 'Initial seed - psychological study'),
(329, 'Jurassic Park', ARRAY['Adventure', 'Science Fiction'], 8.2, 91.0, 'Initial seed - adventure thriller'),
(1726, 'Iron Man', ARRAY['Action', 'Science Fiction'], 7.6, 84.0, 'Initial seed - superhero origin'),
(49026, 'The Dark Knight Rises', ARRAY['Action', 'Crime', 'Drama'], 8.0, 87.0, 'Initial seed - dark conclusion'),
(140607, 'Get Out', ARRAY['Mystery', 'Thriller', 'Horror'], 7.8, 79.0, 'Initial seed - social horror'),
(447332, 'A Quiet Place', ARRAY['Drama', 'Horror', 'Science Fiction'], 7.5, 81.0, 'Initial seed - innovative horror'),
(381288, 'Split', ARRAY['Horror', 'Thriller'], 7.3, 76.0, 'Initial seed - psychological thriller'),
(346910, 'The Conjuring', ARRAY['Horror', 'Mystery', 'Thriller'], 7.5, 78.0, 'Initial seed - supernatural horror'),
(439079, 'The Nun', ARRAY['Horror', 'Mystery', 'Thriller'], 5.4, 67.0, 'Initial seed - horror franchise'),
(338952, 'Fantastic Beasts and Where to Find Them', ARRAY['Adventure', 'Family', 'Fantasy'], 7.4, 82.0, 'Initial seed - magical adventure'),
(259316, 'Fantastic Beasts and Where to Find Them', ARRAY['Adventure', 'Family', 'Fantasy'], 7.4, 82.0, 'Initial seed - wizarding world'),
(166424, 'Fantastic Beasts: The Crimes of Grindelwald', ARRAY['Adventure', 'Fantasy'], 6.9, 75.0, 'Initial seed - magical sequel'),
(557, 'Spider-Man', ARRAY['Action', 'Fantasy'], 7.4, 79.0, 'Initial seed - superhero classic'),
(634649, 'Spider-Man: No Way Home', ARRAY['Action', 'Adventure', 'Science Fiction'], 8.4, 96.0, 'Initial seed - multiverse adventure'),
(315635, 'Spider-Man: Homecoming', ARRAY['Action', 'Adventure', 'Science Fiction'], 7.4, 86.0, 'Initial seed - teen hero'),
(283995, 'Guardians of the Galaxy Vol. 2', ARRAY['Action', 'Adventure', 'Comedy'], 7.6, 88.0, 'Initial seed - space adventure'),
(118340, 'Guardians of the Galaxy', ARRAY['Action', 'Science Fiction', 'Adventure'], 8.0, 89.0, 'Initial seed - cosmic adventure');

-- Shaurya (Animation, Family, Fantasy)
INSERT INTO shaurya_dash (tmdb_id, title, genres, vote_average, popularity, recommendation_reason) VALUES
(129, 'Spirited Away', ARRAY['Animation', 'Family', 'Supernatural'], 8.6, 86.0, 'Initial seed - Ghibli masterpiece'),
(128, 'Princess Mononoke', ARRAY['Adventure', 'Family', 'Animation'], 8.4, 78.0, 'Initial seed - environmental fantasy'),
(4935, 'Howl''s Moving Castle', ARRAY['Animation', 'Drama', 'Family'], 8.2, 81.0, 'Initial seed - magical romance'),
(12429, 'Grave of the Fireflies', ARRAY['Animation', 'Drama', 'War'], 8.5, 65.0, 'Initial seed - powerful storytelling'),
(1649, 'My Neighbor Totoro', ARRAY['Animation', 'Family'], 8.2, 79.0, 'Initial seed - childhood wonder'),
(8587, 'The Lion King', ARRAY['Animation', 'Drama', 'Family'], 8.5, 87.0, 'Initial seed - Disney classic'),
(862, 'Toy Story', ARRAY['Animation', 'Comedy', 'Family'], 8.3, 89.0, 'Initial seed - Pixar pioneer'),
(863, 'Toy Story 2', ARRAY['Animation', 'Comedy', 'Family'], 7.9, 81.0, 'Initial seed - worthy sequel'),
(10193, 'Toy Story 3', ARRAY['Animation', 'Comedy', 'Family'], 8.3, 84.0, 'Initial seed - emotional depth'),
(585, 'Monsters, Inc.', ARRAY['Animation', 'Comedy', 'Family'], 8.1, 85.0, 'Initial seed - friendship tale'),
(12, 'Finding Nemo', ARRAY['Animation', 'Family', 'Comedy'], 8.2, 90.0, 'Initial seed - underwater journey'),
(14160, 'Up', ARRAY['Animation', 'Comedy', 'Family'], 8.3, 88.0, 'Initial seed - adventure begins'),
(9806, 'The Incredibles', ARRAY['Animation', 'Action', 'Adventure'], 8.0, 87.0, 'Initial seed - superhero family'),
(10681, 'WALL-E', ARRAY['Animation', 'Family', 'Science Fiction'], 8.4, 85.0, 'Initial seed - environmental message'),
(508442, 'Soul', ARRAY['Animation', 'Comedy', 'Drama'], 8.1, 82.0, 'Initial seed - life''s purpose'),
(150540, 'Inside Out', ARRAY['Animation', 'Comedy', 'Drama'], 8.1, 88.0, 'Initial seed - emotional intelligence'),
(324857, 'Spider-Man: Into the Spider-Verse', ARRAY['Action', 'Adventure', 'Animation'], 8.4, 91.0, 'Initial seed - innovative animation'),
(372058, 'Your Name.', ARRAY['Romance', 'Drama', 'Animation'], 8.4, 83.0, 'Initial seed - beautiful storytelling'),
(379686, 'Your Name.', ARRAY['Romance', 'Drama', 'Animation'], 8.4, 83.0, 'Initial seed - anime masterpiece'),
(569094, 'Your Name.', ARRAY['Romance', 'Drama', 'Animation'], 8.4, 83.0, 'Initial seed - time-crossing love'),
(420818, 'The Lion King', ARRAY['Adventure', 'Animation', 'Drama'], 7.1, 91.0, 'Initial seed - CGI remake'),
(420817, 'Aladdin', ARRAY['Adventure', 'Comedy', 'Family'], 7.0, 86.0, 'Initial seed - live-action magic'),
(411728, 'The Jungle Book', ARRAY['Adventure', 'Drama', 'Family'], 7.4, 83.0, 'Initial seed - jungle adventure'),
(102651, 'Maleficent', ARRAY['Adventure', 'Family', 'Fantasy'], 6.9, 78.0, 'Initial seed - villain''s perspective'),
(338952, 'Fantastic Beasts and Where to Find Them', ARRAY['Adventure', 'Family', 'Fantasy'], 7.4, 82.0, 'Initial seed - magical creatures'),
(121, 'The Lord of the Rings: The Two Towers', ARRAY['Adventure', 'Drama', 'Fantasy'], 8.4, 86.0, 'Initial seed - epic fantasy'),
(120, 'The Lord of the Rings: The Fellowship of the Ring', ARRAY['Adventure', 'Fantasy', 'Action'], 8.4, 95.0, 'Initial seed - fantasy journey'),
(122, 'The Lord of the Rings: The Return of the King', ARRAY['Adventure', 'Drama', 'Fantasy'], 8.7, 89.0, 'Initial seed - fantasy conclusion'),
(74643, 'The Hobbit: An Unexpected Journey', ARRAY['Adventure', 'Fantasy'], 7.8, 84.0, 'Initial seed - hobbit''s journey'),
(57158, 'The Hobbit: The Desolation of Smaug', ARRAY['Adventure', 'Fantasy'], 7.8, 81.0, 'Initial seed - dragon encounter');

-- Function to get profile recommendations
CREATE OR REPLACE FUNCTION get_profile_recommendations(profile_name VARCHAR(50), limit_count INTEGER DEFAULT 30)
RETURNS TABLE (
    tmdb_id INTEGER,
    title VARCHAR(500),
    genres TEXT[],
    vote_average DECIMAL(3,1),
    popularity DECIMAL(8,3),
    overview TEXT,
    poster_path VARCHAR(255),
    similarity_score DECIMAL(5,4)
) AS $$
BEGIN
    CASE profile_name
        WHEN 'anshul' THEN
            RETURN QUERY SELECT a.tmdb_id, a.title, a.genres, a.vote_average, a.popularity, 
                               a.overview, a.poster_path, a.similarity_score
                        FROM anshul_dash a WHERE a.is_active = TRUE 
                        ORDER BY a.similarity_score DESC, a.added_at DESC LIMIT limit_count;
        WHEN 'shikhar' THEN
            RETURN QUERY SELECT s.tmdb_id, s.title, s.genres, s.vote_average, s.popularity,
                               s.overview, s.poster_path, s.similarity_score
                        FROM shikhar_dash s WHERE s.is_active = TRUE 
                        ORDER BY s.similarity_score DESC, s.added_at DESC LIMIT limit_count;
        WHEN 'priyanshu' THEN
            RETURN QUERY SELECT p.tmdb_id, p.title, p.genres, p.vote_average, p.popularity,
                               p.overview, p.poster_path, p.similarity_score
                        FROM priyanshu_dash p WHERE p.is_active = TRUE 
                        ORDER BY p.similarity_score DESC, p.added_at DESC LIMIT limit_count;
        WHEN 'shaurya' THEN
            RETURN QUERY SELECT sh.tmdb_id, sh.title, sh.genres, sh.vote_average, sh.popularity,
                               sh.overview, sh.poster_path, sh.similarity_score
                        FROM shaurya_dash sh WHERE sh.is_active = TRUE 
                        ORDER BY sh.similarity_score DESC, sh.added_at DESC LIMIT limit_count;
        ELSE
            RETURN;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh recommendations for a profile
CREATE OR REPLACE FUNCTION refresh_profile_recommendations(
    profile_name VARCHAR(50),
    new_recommendations JSONB
) RETURNS BOOLEAN AS $$
DECLARE
    rec JSONB;
BEGIN
    -- Clear existing recommendations
    CASE profile_name
        WHEN 'anshul' THEN
            DELETE FROM anshul_dash WHERE is_active = TRUE;
        WHEN 'shikhar' THEN
            DELETE FROM shikhar_dash WHERE is_active = TRUE;
        WHEN 'priyanshu' THEN
            DELETE FROM priyanshu_dash WHERE is_active = TRUE;
        WHEN 'shaurya' THEN
            DELETE FROM shaurya_dash WHERE is_active = TRUE;
        ELSE
            RETURN FALSE;
    END CASE;
    
    -- Insert new recommendations
    FOR rec IN SELECT * FROM jsonb_array_elements(new_recommendations)
    LOOP
        CASE profile_name
            WHEN 'anshul' THEN
                INSERT INTO anshul_dash (tmdb_id, title, genres, vote_average, popularity, 
                                       overview, poster_path, similarity_score, recommendation_reason)
                VALUES (
                    (rec->>'tmdb_id')::INTEGER,
                    rec->>'title',
                    ARRAY(SELECT jsonb_array_elements_text(rec->'genres')),
                    (rec->>'vote_average')::DECIMAL(3,1),
                    (rec->>'popularity')::DECIMAL(8,3),
                    rec->>'overview',
                    rec->>'poster_path',
                    COALESCE((rec->>'similarity_score')::DECIMAL(5,4), 0.5),
                    COALESCE(rec->>'recommendation_reason', 'Generated by recommendation engine')
                );
            WHEN 'shikhar' THEN
                INSERT INTO shikhar_dash (tmdb_id, title, genres, vote_average, popularity, 
                                        overview, poster_path, similarity_score, recommendation_reason)
                VALUES (
                    (rec->>'tmdb_id')::INTEGER,
                    rec->>'title',
                    ARRAY(SELECT jsonb_array_elements_text(rec->'genres')),
                    (rec->>'vote_average')::DECIMAL(3,1),
                    (rec->>'popularity')::DECIMAL(8,3),
                    rec->>'overview',
                    rec->>'poster_path',
                    COALESCE((rec->>'similarity_score')::DECIMAL(5,4), 0.5),
                    COALESCE(rec->>'recommendation_reason', 'Generated by recommendation engine')
                );
            WHEN 'priyanshu' THEN
                INSERT INTO priyanshu_dash (tmdb_id, title, genres, vote_average, popularity, 
                                          overview, poster_path, similarity_score, recommendation_reason)
                VALUES (
                    (rec->>'tmdb_id')::INTEGER,
                    rec->>'title',
                    ARRAY(SELECT jsonb_array_elements_text(rec->'genres')),
                    (rec->>'vote_average')::DECIMAL(3,1),
                    (rec->>'popularity')::DECIMAL(8,3),
                    rec->>'overview',
                    rec->>'poster_path',
                    COALESCE((rec->>'similarity_score')::DECIMAL(5,4), 0.5),
                    COALESCE(rec->>'recommendation_reason', 'Generated by recommendation engine')
                );
            WHEN 'shaurya' THEN
                INSERT INTO shaurya_dash (tmdb_id, title, genres, vote_average, popularity, 
                                        overview, poster_path, similarity_score, recommendation_reason)
                VALUES (
                    (rec->>'tmdb_id')::INTEGER,
                    rec->>'title',
                    ARRAY(SELECT jsonb_array_elements_text(rec->'genres')),
                    (rec->>'vote_average')::DECIMAL(3,1),
                    (rec->>'popularity')::DECIMAL(8,3),
                    rec->>'overview',
                    rec->>'poster_path',
                    COALESCE((rec->>'similarity_score')::DECIMAL(5,4), 0.5),
                    COALESCE(rec->>'recommendation_reason', 'Generated by recommendation engine')
                );
        END CASE;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql; 