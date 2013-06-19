# Generate sha256 hashes of password strings

crypto = require 'crypto'

exports.phash = (s) ->
  crypto.createHash('sha256').update(s).digest('hex')