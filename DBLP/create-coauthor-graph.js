/*jslint indent: 2, nomen: true, maxlen: 100, sloppy: true, vars: true, white: true, plusplus: true */
/*global require, arango, db, edges, Module */

var arangodb = require("org/arangodb");
var printf = require("internal").printf;

function main (argv) {
  var coauthor;
  var cursor;
  var edges;
  var vertices;
  var noPersons;

  if (argv.length !== 4) {
    printf("usage: create-persons <dblp-vertices> <dblp-edges> <coauthor-edges>\n");
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

    if (start.type !== "person") {
      continue;
    }

    e = edges.inEdges(start._id);

    count = {};

    for (i = 0;  i < e.length;  ++i) {
      n = e[i];

      if (start._id !== n._from && n['$label'] === "author") {
	f = edges.outEdges(n._from);

	for (j = 0;  j < f.length;  ++j) {
	  m = f[j];

	  if (start._id < m._to && m['$label'] === "author") {
	    var id = m._to;

	    if (count.hasOwnProperty(id)) {
	      count[id]++;
	    }
	    else {
	      count[id] = 1;
	    }
	  }
	}
      }
    }

    total = 0;

    for (j in count) {
      if (count.hasOwnProperty(j)) {
	coauthor.save(start._id, j, {
	  type: 'coauthor',
	  count: count[j]
	});

	total += count[j];
      }
    }

    noPersons++;
    printf("%d next %s (total %d)\n", noPersons, start['$id'], total);
  }
}
