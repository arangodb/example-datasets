var fs=require("fs");
(function() {
  var console = require("console");
  var internal = require("internal");
  var db = internal.db;
 
  var vName = "imdb_vertices";
  var eName = "imdb_edges";
  var gName = "imdb";
  var gm = require('@arangodb/general-graph');
  var g;
  try {
    db._drop(vName);
  } catch (e) { }
  try {
    db._drop(eName);
  } catch (e) { }
  try {
    gm._drop(gName);
  } catch (e) { }
  db._create(vName);
  db._createEdgeCollection(eName);
  g = gm._create(gName);
  g._addVertexCollection(vName);
  var rel = gm._relation(eName, vName, vName);
  g._extendEdgeDefinitions(rel);
  g = gm._graph(gName);
  var genres = {};
  
  var toKey = function(d) {
    return d.toLowerCase().replace(" ", "-");
  };

  var storeVertex = function(d) {
    if (d.releaseDate) {
      var datF = new Date(d.releaseDate).toISOString().slice(0, 4);
      datF = Math.floor(datF / 10) * 10;
      datS = datF + 10;
      var dat = datF + "-" + datS;
      d.released = dat;
    }
    g[vName].save(d);
    if (d.genre) {
      var gK = toKey(d.genre);
      if (!genres[gK]) {
        genres[gK] = true;
        g[vName].save({_key: gK, label: d.genre, type: "Genre"});
      }
      g[eName].save({
        _from: vName + "/" + gK,
        _to: vName + "/" + d._key,
        $label: "has_movie"
      });
    }
  };

  var storeEdge = function(d) {
    d._from = vName + "/" + d._from;
    d._to = vName + "/" + d._to;

    try {
      g[eName].save(d);
    } catch (e) {
      console.log("Failed:", d._from, "->", d._to);
    }
  };

  var verticesCollection = db._collection(vName);
  // Leave index creation up to the user, who may prefer an ArangoSearch View
  //verticesCollection.ensureFulltextIndex("description", 3);
  //verticesCollection.ensureFulltextIndex("title", 3);
  //verticesCollection.ensureFulltextIndex("name", 3);
  //verticesCollection.ensureFulltextIndex("birthplace", 3);

  internal.processJsonFile(fs.join(__dirname, "nodes.json"), storeVertex);
  internal.processJsonFile(fs.join(__dirname, "edges.json"), storeEdge);
}());
