const jwt = require('jsonwebtoken');

// Creates a signed JWT containing the user's id and role.
// Role is embedded so middleware can restrict admin-only routes
// without an extra DB lookup on every request.
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

module.exports = generateToken;