var internal = require("internal");
var console = require("console");

function printf () {
  var text = internal.sprintf.apply(internal.springf, arguments);
  internal.output(text);
}

function main (argv) {
  var argc = argv.length;
  var inc;
  var out;
  var edg;
  var addPerson;
  var iterator;
  var p;

  if (argc !== 4) {
    printf("usage: create-persons <dblp> <person> <relation>\n");
    return;
  }

  // check the input collection
  inc = internal.db._collection(argv[1]);

  if (inc === null) {
    printf("unknown dblp input collection '%s'\n", argv[1]);
    return;
  }

  // check the output collection for persons
  out = internal.db._collection(argv[2]);

  if (out === null) {
    out = internal.db._createDocumentCollection(argv[2]);
  }

  out.ensureUniqueConstraint("name");

  // check the output collection for relationship
  edg = internal.db._collection(argv[3]);

  if (edg === null) {
    edg = internal.db._createEdgeCollection(argv[3]);
  }

  edg.ensureHashIndex("author", "peer", "type", "book");

  // relevant person attributes
  p = [ "author", "editor", "publisher" ];

  // creates a new person
  addPerson = function (person) {
    var found = out.firstExample({ name: person });

    if (found === null) {
      printf("person: %s\n", person);
      out.save({ name: person });
    }
  };

  // create co-author relationship
  addCoAuthor = function (l, r, book) {
    var tmp;
    var lid;
    var rid;

    if (l < r) {
      tmp = l;
      l = r;
      r = tmp;
    }

    lid = out.firstExample({ name: l });
    rid = out.firstExample({ name: r });

    if (lid === null || rid === null) {
      return;
    }

    if (edg.firstExample({ author: l, peer: r, type: "co-author", book: book.key }) === null) {
      printf("co-author: %s + %s on %s\n", l, r, book.key);
      edg.save(lid, rid, { type: "co-author",
			   author: l,
			   peer: r,
			   book: book.key });
    }
  };

  // create publisher relationship
  addPublisher = function (author, publisher, book) {
    var lid;
    var rid;

    lid = out.firstExample({ name: author });
    rid = out.firstExample({ name: publisher });

    if (lid === null || rid === null) {
      return;
    }

    if (edg.firstExample({ author: author, peer: publisher, type: "publisher", book: book.key }) === null) {
      printf("publisher: %s publisher %s on %s\n", author, publisher, book.key);
      edg.save(lid, rid, { type: "publisher",
			   author: author,
			   peer: publisher,
			   book: book.key });
    }
  };

  // iterator for dblp collection
  iterator = function (d) {
    var authors;
    var publishers;
    var i;
    var j;

    // first create all persons
    for (i = 0;  i < p.length;  ++i) {
      var key = p[i];

      if (d.hasOwnProperty(key)) {
	var val = d[key];

	if (val instanceof Array) {
	  for (j = 0;  j < val.length;  ++j) {
	    addPerson(val[j]);
	  }
	}
	else {
	  addPerson(val);
	}
      }
    }

    // now create relationships "coauthor"
    if (d.hasOwnProperty("author")) {
      authors = d.author;

      for (i = 0;  i < authors.length;  ++i) {
	for (j = i + 1;  j < authors.length;  ++j) {
	  addCoAuthor(authors[i], authors[j], d);
	}
      }
    }

    // now create relationships "publisher"
    if (d.hasOwnProperty("author") && d.hasOwnProperty("publisher")) {
      authors = d.author;
      publishers = d.publisher;

      if (typeof publishers === "string") {
	publishers = [ publishers ];
      }

      for (i = 0;  i < authors.length;  ++i) {
	for (j = 0;  j < publishers.length;  ++j) {
	  addPublisher(authors[i], publishers[j], d);
	}
      }
    }
  };

  inc.iterate(iterator);

  return 0;
}
