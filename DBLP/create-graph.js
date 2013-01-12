/*jslint indent: 2, nomen: true, maxlen: 100, sloppy: true, vars: true, white: true, plusplus: true */
/*global require, arango, db, edges, Module */

var arangodb = require("org/arangodb");
var console = require("console");
var printf = require("internal").printf;

function main (argv) {
  var addBook;
  var addPerson;
  var argc = argv.length;
  var edg;
  var inc;
  var iterator;
  var noBooks;
  var noPersons;
  var out;
  var peopleAttributes;

  if (argc !== 4) {
    printf("usage: create-persons <dblp> <graph> <relation>\n");
    return;
  }

  // check the input collection
  inc = arangodb.db._collection(argv[1]);

  if (inc === null) {
    printf("unknown dblp input collection '%s'\n", argv[1]);
    return;
  }

  // check the output collection for persons
  out = arangodb.db._collection(argv[2]);

  if (out === null) {
    out = arangodb.db._createDocumentCollection(argv[2]);
  }

  out.ensureUniqueConstraint("type", "key");

  // check the output collection for relationship
  edg = arangodb.db._collection(argv[3]);

  if (edg === null) {
    edg = arangodb.db._createEdgeCollection(argv[3]);
  }

  // creates a new person
  addPerson = function (person) {
    var found = out.firstExample({ type: "person", key: person });

    if (found === null) {
      noPersons++;
      printf("%d person: %s\n", noPersons, person);
      found = out.save({ type: "person", key: person });
    }

    return found;
  };

  // create the book
  addBook = function (type, key, book) {
    var found = out.firstExample({ type: type, key: key });

    if (found === null) {
      noBooks++;
      printf("%d %s: %s\n", noBooks, type, book);
      found = out.save({ type: type, key: key, title: book });
    }

    return found;
  };

  // relevant person attributes
  peopleAttributes = [ "author", "editor", "publisher" ];

  // iterator for dblp collection
  iterator = function (d, pos) {
    var type;
    var book;
    var i;
    var j;

    if ((pos + 1) % 1000 === 0) {
      printf("processing article %d\n", pos + 1);
    }

    // create the book
    type = d.type;

    if (type !== "article" && type !== "inproceedings"
        && type !== "proceedings" && type !== "incollection") {
      return;
    }

    book = addBook(type, d.key, d.title);

    // create all persons
    for (i = 0;  i < peopleAttributes.length;  ++i) {
      var key = peopleAttributes[i];

      if (d.hasOwnProperty(key)) {
	var val = d[key];
	var person;

	if (val instanceof Array) {
	  for (j = 0;  j < val.length;  ++j) {
	    person = addPerson(val[j]);
	    edg.save(book._id, person._id, { type: key });

	  }
	}
	else {
	  person = addPerson(val);
	  edg.save(book._id, person._id, { type: key });
	}
      }
    }
  };

  noBooks = 0;
  noPersons = 0;

  // inc.iterate(iterator);

  // proceeding
  iterator = function (d, pos) {
    var type;
    var book;
    var proceeding;
    var i;

    if ((pos + 1) % 1000 === 0) {
      printf("processing article %d\n", pos + 1);
    }

    // create the book
    type = d.type;

    // only use inproceedings
    if (type !== "inproceedings" || ! d.hasOwnProperty("crossref")) {
      return;
    }

    // find the proceedings
    book = out.firstExample({ type: type, key: d.key });

    if (book === null) {
      return;
    }

    for (i = 0;  i < d.crossref.length;  ++i) {
      var cr = d.crossref[i];

      proceeding = out.firstExample({ type: "proceedings", key: cr });

      if (proceeding !== null) {
	printf("%s in %s\n", book.title, proceeding.title);
	edg.save(book._id, proceeding._id, { type: "proceedings" });
      }
    }
  };

  // now handle the proceeding
  inc.iterate(iterator);

  return 0;
}
