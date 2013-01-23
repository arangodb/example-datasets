/*jslint indent: 2, nomen: true, maxlen: 100, sloppy: true, vars: true, white: true, plusplus: true */
/*global require, arango, db, edges, Module */

var arangodb = require("org/arangodb");
var printf = require("internal").printf;

function main (args) {
  var addBook;
  var addPerson;
  var argv;
  var edg;
  var extractYear;
  var filterYear;
  var i;
  var inc;
  var iterator;
  var noBooks;
  var noPersons;
  var noProceedings;
  var out;
  var peopleAttributes;

  if (arguments.length === 1) {
    argv = args;
  }
  else {
    argv = ["main"];

    for (i = 0;  i < arguments.length;  ++i) {
      argv.push(arguments[i]);
    }
  }

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

  out.ensureUniqueConstraint("name");

  // check the output collection for relationship
  edg = arangodb.db._collection(argv[3]);

  if (edg === null) {
    edg = arangodb.db._createEdgeCollection(argv[3]);
  }

  // .........................................................................
  // creates a new person
  // .........................................................................

  addPerson = function (person) {
    var found = out.firstExample({ name: person });

    if (found === null) {
      noPersons++;
      printf("%d person: %s\n", noPersons, person);

      found = out.save({
        type: "person",
        name: person
      });
    }

    return found;
  };

  // .........................................................................
  // create the book
  // .........................................................................

  addBook = function (type, key, book, year) {
    var found;

    try {
      found = out.document(key);
    }
    catch (err) {
      noBooks++;
      printf("%d %s: %s\n", noBooks, type, book);

      found = out.save({ 
        type: type, 
        _key: key, 
        title: book,
        year: year
      });
    }

    return found;
  };

  // .........................................................................
  // iterator for dblp collection: create persons and books
  // .........................................................................

  // relevant person attributes
  peopleAttributes = [ "author", "editor", "publisher" ];

  extractYear = function (d) {
    if (d.hasOwnProperty("year")) {
      if (d.year instanceof Array && 0 < d.year.length) {
        return Math.min.apply(Math.min, d.year.map(Number));
      }

      return Number(d.year);
    }

    return null;
  };

  filterYear = function(year) {
    return true;
  };

  iterator = function (d, pos) {
    var type;
    var book;
    var i;
    var j;
    var year;
    var name;

    if ((pos + 1) % 1000 === 0) {
      printf("processing article %d\n", pos + 1);
    }

    // create the book
    type = d.type;

    if (type !== "article" && type !== "inproceedings"
        && type !== "proceedings" && type !== "incollection") {
      return;
    }

    year = extractYear(d);

    if (! filterYear(year)) {
      return;
    }

    book = addBook(type, d._key, d.title, year);

    // create all edges
    for (i = 0;  i < peopleAttributes.length;  ++i) {
      var key = peopleAttributes[i];

      if (d.hasOwnProperty(key)) {
        var val = d[key];
        var person;

        if (val instanceof Array) {
          for (j = 0;  j < val.length;  ++j) {
            name = val[j];

            person = addPerson(name);

            if (person !== null) {
              edg.save(book._id, person._id, {
                '$label': key,
                year: year
              });
            }
          }
        }
        else {
          name = val;

          person = addPerson(name);

          if (person !== null) {
            edg.save(book._id, person._id, {
              '$label': key,
              year: year
            });
          }
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
    var year;

    if ((pos + 1) % 1000 === 0) {
      printf("processing article %d\n", pos + 1);
    }

    // create the book
    type = d.type;

    // only use inproceedings
    if (type !== "inproceedings" || ! d.hasOwnProperty("crossref")) {
      return;
    }

    year = extractYear(d);

    if (! filterYear(year)) {
      return;
    }

    // find the proceedings
    try {
      book = out.document(d._key);
    }
    catch (err) {
      return;
    }

    for (i = 0;  i < d.crossref.length;  ++i) {
      var cr = d.crossref[i];

      try {
        proceeding = out.document(cr);

        if (proceeding.type !== "proceedings") {
          noProceedings++;
          printf("%d: %s in %s\n", noProceedings, book.title, proceeding.title);
          edg.save(book._key, proceeding._key, { '$label': "proceedings" });
        }
      }
      catch (err1) {
        printf("crossref '%s' failed: %s", cr, String(err1));
      }
    }
  };

  noProceedings = 0;

  inc.iterate(iterator);

  return 0;
}
