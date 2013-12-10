(function() {
  var internal = require("internal");
  var console = require("console");
  var db = internal.db;
  var _ = require("underscore");
 
  var vName = "marvel_vertices";
  var eName = "marvel_edges";
  var gName = "marvel_heros";
  var Graph = require("org/arangodb/graph").Graph;
  var g;
  try {
    g = new Graph(gName);
    g.drop();
  } catch (e) {

  }
  g = new Graph(gName, vName, eName);
  
  var toKey = function(d) {
    return d.toLowerCase().replace(/[^a-zA-Z0-9:_-]/g, "");
  };

  var storeVertex = function(entry) {
    var key = toKey(entry);
    if (g.getVertex(key)) {
      return key;
    }
    
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
    g.addVertex(key, vertex);
    return key;
  };

  var storeEdge = function(d) {
    if (d.length !== 2) {
      console.log(d);
      return;
    }
    d = _.map(d, function(entry) {
      return vName + "/" + storeVertex(entry);
    });
    var from = d[0];
    var to = d[1];

    g.addEdge(from, to, null);
  };

  var verticesCollection = db._collection(vName);
  verticesCollection.ensureFulltextIndex("realName", 3);
  verticesCollection.ensureFulltextIndex("name", 3);

  internal.processCsvFile("source.csv", storeEdge);
}());
