login = ->
  event: 'login'
  title: 'Login'
  inputs: [
    {type: 'text', name: 'username', label: 'Username'},
    {type: 'password', name: 'password', label: 'Password'}
  ]
  submit: 'Login'

createAccount = ->
  event: 'create'
  title: 'Create an Account'
  inputs: [
    {type: 'text', name: 'username', label: 'Username'},
    {type: 'password', name: 'password', label: 'Password'},
    {type: 'password', name: 'password2', label: 'Confirm Password'},
  ]
  submit: 'Create'

exports.login = login
exports.createAccount = createAccount