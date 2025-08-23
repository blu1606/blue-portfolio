const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { BadRequestError } = require('common/core/error.response');

const ajv = new Ajv();
addFormats(ajv);

const validateRequest = (schema) => {
  return (req, res, next) => {
    const errors = [];

    // Validate body
    if (schema.body) {
      const validate = ajv.compile(schema.body);
      const valid = validate(req.body);
      if (!valid) {
        errors.push(...validate.errors.map(err => 
          `${err.instancePath || 'body'} ${err.message}`
        ));
      }
    }

    // Validate params
    if (schema.params) {
      const validate = ajv.compile(schema.params);
      const valid = validate(req.params);
      if (!valid) {
        errors.push(...validate.errors.map(err => 
          `params.${err.instancePath.slice(1)} ${err.message}`
        ));
      }
    }

    // Validate query
    if (schema.query) {
      const validate = ajv.compile(schema.query);
      const valid = validate(req.query);
      if (!valid) {
        errors.push(...validate.errors.map(err => 
          `query.${err.instancePath.slice(1)} ${err.message}`
        ));
      }
    }

    if (errors.length > 0) {
      throw new BadRequestError(`Validation failed: ${errors.join(', ')}`);
    }

    next();
  };
};

module.exports = { validateRequest };