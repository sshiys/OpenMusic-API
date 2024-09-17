const ClientError = require('../exceptions/ClientError');

// Maps database result to a simplified model for albums
const mapDBToModel = (rows) => rows.map(({ id, name, year }) => ({
    id,
    name,
    year,
}));

// Maps database result to a detailed model for songs
const mapDBToModelDetail = ({
    id,
    title,
    year,
    performer,
    genre,
    duration,
    album_id,
}) => ({
    id,
    title,
    year,
    performer,
    genre,
    duration,
    albumId: album_id,
});

// Centralized error handler
const errorHandler = (error, h) => {
    if (error instanceof ClientError) {
        const response = h.response({
            status: 'fail',
            message: error.message,
        });
        response.code(error.statusCode);
        return response;
    }

    // Handle server errors
    const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
    });
    response.code(500);
    
    // Log the error with stack trace for debugging
    console.error('Server Error:', error);

    return response;
};

// Export functions as an object for better organization
module.exports = {
    mapDBToModel,
    mapDBToModelDetail,
    errorHandler,
};