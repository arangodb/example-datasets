/*jslint indent: 2, nomen: true, maxlen: 100, sloppy: true, vars: true, white: true, plusplus: true */
/*global require, arango, db, edges, Module */

var arangodb = require("org/arangodb");
var printf = require("internal").printf;

function main (argv) {
  var addBook;
  var addPerson;
  var edg;
  var inc;
  var iterator;
  var noBooks;
  var noPersons;
  var noProceedings;
  var out;
  var peopleAttributes;

  if (argv.length !== 4) {
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

  out.ensureUniqueConstraint("type", "$id");

  // check the output collection for relationship
  edg = arangodb.db._collection(argv[3]);

  if (edg === null) {
    edg = arangodb.db._createEdgeCollection(argv[3]);
  }

  // .........................................................................
  // creates a new person
  // .........................................................................

  addPerson = function (person) {
    var found = out.firstExample({ type: "person", '$id': person });

    if (found === null) {
      noPersons++;
      printf("%d person: %s\n", noPersons, person);
      found = out.save({
	type: "person",
	'$id': person
      });
    }

    return found;
  };

  // .........................................................................
  // create the book
  // .........................................................................

  addBook = function (type, key, book, year) {
    var found = out.firstExample({ type: type, '$id': key });

    if (found === null) {
      noBooks++;
      printf("%d %s: %s\n", noBooks, type, book);
      found = out.save({ 
	type: type, 
	'$id': key, 
	title: book,
	year: year
      });
    }

    return found;
  };

  // relevant person attributes
  peopleAttributes = [ "author", "editor", "publisher" ];

  // .........................................................................
  // iterator for dblp collection: create persons and books
  // .........................................................................

  iterator = function (d, pos) {
    var type;
    var book;
    var i;
    var j;
    var year;

    if ((pos + 1) % 1000 === 0) {
      printf("processing article %d\n", pos + 1);
    }

    // create the book
    type = d.type;

    if (type !== "article" && type !== "inproceedings"
        && type !== "proceedings" && type !== "incollection") {
      return;
    }

    year = null;

    if (d.hasOwnProperty("year")) {
      if (d.year instanceof Array && 0 < d.year.length) {
	year = Math.min.apply(Math.min, d.year);
      }
      else {
	year = d.year;
      }
    }

    book = addBook(type, d.key, d.title, year);

    // create all edges
    for (i = 0;  i < peopleAttributes.length;  ++i) {
      var key = peopleAttributes[i];

      if (d.hasOwnProperty(key)) {
	var val = d[key];
	var person;

	if (val instanceof Array) {
	  for (j = 0;  j < val.length;  ++j) {
	    person = addPerson(val[j]);
	    edg.save(book._id, person._id, {
	      '$label': key,
	      year: year
	    });

	  }
	}
	else {
	  person = addPerson(val);
	  edg.save(book._id, person._id, {
	    '$label': key,
	    year: year
	  });
	}
      }
    }
  };

  noBooks = 0;
  noPersons = 0;

  inc.iterate(iterator);

  // .........................................................................
  // iterator for dblp collection: create proceedings
  // .........................................................................

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
    book = out.firstExample({ type: type, '$id': d.key });

    if (book === null) {
      return;
    }

    for (i = 0;  i < d.crossref.length;  ++i) {
      var cr = d.crossref[i];

      proceeding = out.firstExample({ type: "proceedings", '$id': cr });

      if (proceeding !== null) {
	noProceedings++;
	printf("%d: %s in %s\n", noProceedings, book.title, proceeding.title);
	edg.save(book._id, proceeding._id, { '$label': "proceedings" });
      }
    }
  };

  noProceedings = 0;

  inc.iterate(iterator);

  return 0;
}
