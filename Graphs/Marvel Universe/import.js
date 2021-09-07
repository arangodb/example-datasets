(function () {
  var internal = require("internal");
  var console = require("console");
  var db = internal.db;
  var _ = require("underscore");

  var vName = "marvel_vertices";
  var eName = "marvel_edges";
  var gName = "marvel_heros";
  var gm = require("@arangodb/general-graph");
  var g;

  try {
    gm._drop(gName, true);
  } catch (e) {
    print(e);
  }

  try {
    var edgeDefinition = gm._relation(eName, [vName], [vName]);
    g = gm._create(gName, [edgeDefinition]);
    var verticesCollection = db._collection(vName);
    verticesCollection.ensureFulltextIndex("realName", 3);
    verticesCollection.ensureFulltextIndex("name", 3);
  } catch (e) {
    print(e);
  }
  g = gm._graph(gName);

  var toKey = function (d) {
    return d.toLowerCase().replace(/[^a-zA-Z0-9:_-]/g, "");
  };

  var storeVertex = function (entry) {
    var key = toKey(entry);

    var vertex = {
      _key: key
    };
    var parts = entry.split("/");
    if (parts.length === 2) {
      vertex.name = parts[0];
      vertex.realName = parts[1];
    } else {
      vertex.name = entry;
    }
    let v;

    let found = false;
    try {
      let x = db._document(vName + "/" + key)
      found = true;
    } catch (ignore) {
      // not found
      found = false;
    }

    if (!found) {
      // doc already inserted
      try {
        v = g[vName].save({
          _key: key,
          name: vertex.name,
          realName: vertex.realName
        });
      } catch (e) {
        print(e);
      }

      return v._key;
    }
    return key;
  };

  var storeEdge = function (d) {
    if (d.length !== 2) {
      console.log(d);
      return;
    }
    d = _.map(d, function (entry) {
      return vName + "/" + storeVertex(entry);
    });
    var from = d[0];
    var to = d[1];

    g[eName].save(from, to, {});
  };

  print("Importing data now ... ");
  internal.processCsvFile("hero-comic-network.csv", storeEdge);
  print("Done!");
}());
