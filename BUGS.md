BUGS:
=====

* you can add a function/verb on top of one that already exists
  * what about properties, do they get clobbered?

TODO:
=====

* Fix remaining eslint errors
* Fix circular require problems
* clean up logging
* change relatedObjects to extraMatchObjects

IDEA:
=====

* instead of serializing to and saving BSON to disk, save to regular files and commit to a git repo!
  * just for verbs and functions
  * save and commit on function/verb save
  * post commit git hook could cause server to reload functions/verbs from disk allowing external editing
