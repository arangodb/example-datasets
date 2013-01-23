/*jslint indent: 2, nomen: true, maxlen: 100, sloppy: true, vars: true, white: true, plusplus: true */
/*global require, arango, db, edges, Module */

var arangodb = require("org/arangodb");
var printf = require("internal").printf;

function main () {
  var argv;
  var coauthor;
  var cursor;
  var edges;
  var i;
  var noPersons;
  var vertices;

  if (arguments.length === 1) {
    argv = arguments[0];
  }
  else {
    argv = ["main"];

    for (i = 0;  i < arguments.length;  ++i) {
      argv.push(arguments[i]);
    }
  }

  if (argv.length !== 4) {
    printf("usage: create-coauthor-graph <dblp-vertices> <dblp-edges> <coauthor-edges>\n");
    return;
  }

  // check the input collection
  vertices = arangodb.db._collection(argv[1]);

  if (vertices === null) {
    printf("unknown dblp-vertices collection '%s'\n", argv[1]);
    return;
  }

  // check the output collection for persons
  edges = arangodb.db._collection(argv[2]);

  if (edges === null) {
    printf("unknown dblp-edges collection '%s'\n", argv[2]);
    return;
  }

  // check the output collection for relationship
  coauthor = arangodb.db._collection(argv[3]);

  if (coauthor === null) {
    coauthor = arangodb.db._createEdgeCollection(argv[3]);
  }

  cursor = vertices.all();
  noPersons = 0;

  while (cursor.hasNext()) {
    var count;
    var e;
    var f;
    var i;
    var j;
    var m;
    var n;
    var start = cursor.next();
    var total;
    var year;

    if (start.type !== "person") {
      continue;
    }

    e = edges.inEdges(start._id);

    count = {};
    year = 0;
    books = {};

    for (i = 0;  i < e.length;  ++i) {
      n = e[i];

      // n contains a book or article, check that start is an author
      if (n['$label'] === "author") {
        f = edges.outEdges(n._from);

        for (j = 0;  j < f.length;  ++j) {
          m = f[j];

          // m contains an author again, only enter one side of the relation
          if (start._id < m._to && m['$label'] === "author") {
            var id = m._to;
            var y;

            if (count.hasOwnProperty(id)) {
              count[id]++;
              books[id].push(m._from);
            }
            else {
              count[id] = 1;
              books[id] = [ m._from ];
            }

            if (m.hasOwnProperty("year")) {
              y = Number(m.year);

              if (year === 0 || y < year) {
                year = y;
              }
            }
          }
        }
      }
    }

    total = 0;

    for (j in count) {
      if (count.hasOwnProperty(j)) {
        coauthor.save(start._id, j, {
          '$label': 'coauthor',
          count: count[j],
          books: books[j],
          year: year
        });

        total += count[j];
      }
    }

    noPersons++;
    printf("%d next %s (total %d, year %d)\n", noPersons, start.name, total, year);
  }
}
