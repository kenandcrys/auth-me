const { validationResult } = require('express-validator');

//middleware for formatting errors from express validator middleware

const handleValidationErrors = (req, _res, next) => {
    console.log("handleValidationErrors")
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        const errors = {};
        validationErrors
        .array()
        .forEach(error => errors[error.param] = error.msg);

        const err = Error("Bad Request.");
        err.errors = errors;
        err.status = 404;
        err.title = "Bad Request."
        next(err);
    };

    next();
}


module.exports = {
    handleValidationErrors
};
