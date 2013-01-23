/*jslint indent: 2, nomen: true, maxlen: 100, sloppy: true, vars: true, white: true, regexp: true plusplus: true */
/*global require, exports, module */

var actions = require("org/arangodb/actions");
var graph = require("org/arangodb/graph");
var console = require("console");

var Graph = graph.Graph;

// -----------------------------------------------------------------------------
// --SECTION--                                                 private functions
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @brief traverses the co-authors graph
////////////////////////////////////////////////////////////////////////////////

function traverse (graph, start, depth, maxlen, genVertex, genEdge) {
  var d;
  var edges;
  var i;
  var j;
  var links;
  var newVertices;
  var pos;
  var seen;
  var vertices;

  // the list of all vertices collected so far
  vertices = [ start ];

  // hash used to check position and existence
  seen = {};
  seen[start.getId()] = 0;

  // coauthor relations
  links = [];

  // start with these vertices
  newVertices = [ start ];
  pos = 1;
  d = 0;

  while (d < depth && 0 < newVertices.length && vertices.length < maxlen) {
    var children = [];

    d++;

    for (i = 0;  i < newVertices.length && vertices.length < maxlen;  ++i) {
      var next = newVertices[i];
      var nnum = seen[next.getId()];
      var peers;

      edges = next.getEdges();

      for (j = 0;  j < edges.length && vertices.length < maxlen;  ++j) {
        var edge = edges[j];
        var peer = edge.getPeerVertex(next);
        var pid = peer.getId();
        var num;

        if (seen.hasOwnProperty(pid)) {
          num = seen[pid];
        }
        else {
          num = seen[pid] = vertices.length;
          vertices.push(peer);
          children.push(peer);
        }

        links.push(genEdge(nnum, num, edge));
      }
    }

    newVertices = children;
  }

  return {
    vertices: vertices.map(genVertex),
    links: links,
    start: genVertex(start),
    depth: depth
  };
}

////////////////////////////////////////////////////////////////////////////////
/// @brief traverses the co-authors graph
////////////////////////////////////////////////////////////////////////////////

function traverse1 (graph, start, depth, maxlen) {
  var genVertex = function(vertex) {
    return { name: vertex.getProperty("name") };
  };

  var genEdge = function(from, to, edge) {
    return {
      from: from,
      to: to,
      year: edge.getProperty("year"),
      count: edge.getProperty("count")
    };
  };

  return traverse(graph, start, depth, maxlen, genVertex, genEdge);
}

////////////////////////////////////////////////////////////////////////////////
/// @brief traverses the dblp graph
////////////////////////////////////////////////////////////////////////////////

function traverse2 (graph, start, depth, maxlen) {
  var genVertex = function(vertex) {
    return vertex.properties();
  };

  var genEdge = function(from, to, edge) {
    return {
      from: from,
      to: to,
      type: edge.getLabel(),
      year: edge.getProperty("year")
    };
  };

  return traverse(graph, start, depth, maxlen, genVertex, genEdge);
}

// -----------------------------------------------------------------------------
// --SECTION--                                                  public functions
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @brief co-authors
///
/// coauthor.json?graph=<name>&start=<person>&depth=<number>
///
/// returns an object with
///
/// - start: The name of the start author.
/// - depth: The depth of the tree walk. Note that there is a cut at a 1000
///          nodes.
/// - vertices: The list of vertices. A vertex has one attribute, the name of
///             the author.
/// - links: The coauthor relation. A link has the attributes `from`, `to`,
///          `year`, and `count`. `from` and `to` are positions in `vertices`.
////////////////////////////////////////////////////////////////////////////////

exports.coauthor = function (req, res) {
  var gname = req.parameters.graph || "coauthor";
  var sname = req.start;
  var depth = 2;
  var start;
  var graph;
  var result;
  var maxlen = 1000;

  if (req.hasOwnProperty("depth")) {
    depth = parseInt(req.parameters.depth,10);
  }

  // get the underlying graph
  try {
    graph = new Graph(gname);
  }
  catch (err) {
    actions.resultError(req, res, err);
    return;
  }

  // get the start vertex
  if (sname === "" || sname === undefined) {
    var a = graph._vertices.any();

    while (a.type !== "person") {
      a = graph._vertices.any();
    }

    start = graph.getVertex(a._id);
  }
  else {
    start = graph.getVertex(sname);
  }

  if (start === null) {
    actions.resultNotFound(req, res, actions.HTTP_NOT_FOUND, "name not found");
    return;
  }

  // traverse
  result = traverse1(graph, start, depth, maxlen);

  // and return
  actions.resultOk(req, res, actions.HTTP_OK, result);
};

////////////////////////////////////////////////////////////////////////////////
/// @brief dblp
///
/// dblp.json?graph=<name>&start=<person>|<article>&depth=<number>
///
/// returns an object with
///
/// - start: The name of the start author.
/// - depth: The depth of the tree walk. Note that there is a cut at a 1000
///          nodes.
/// - vertices: The list of vertices.
/// - links: The coauthor relation. A link has the attributes `from`, `to`,
///          `year`, and `count`. `from` and `to` are positions in `vertices`.
///
/// A person/editor vertex looks like:
///
/// @code
/// {
///   "_id" : "dblp_vertices/688430067001", 
///   "_rev" : "688430067001", 
///   "_key" : "688430067001", 
///   "type" : "person", 
///   "name" : "John Boates" 
/// }
/// @endcode
///
/// An article/book/inproceedings/incollection/masterthesis/phdthesis
/// /proceedings/www vertex looks like:
///
/// @code
/// { 
///   "_id" : "dblp_vertices/journals::dc::HieronsMN12",
///   "_rev" : "580325027129",
///   "_key" : "journals::dc::HieronsMN12",
///   "year" : 2012,
///   "type" : "article",
///   "title" : "Implementation relations and test generation for systems with distributed interfaces."
/// }
/// @endcode
////////////////////////////////////////////////////////////////////////////////

exports.dblp = function (req, res) {
  var gname = req.parameters.graph || "dblp";
  var sname = req.start;
  var depth = 2;
  var start;
  var graph;
  var result;
  var maxlen = 1000;

  if (req.hasOwnProperty("depth")) {
    depth = parseInt(req.parameters.depth,10);
  }

  // get the underlying graph
  try {
    graph = new Graph(gname);
  }
  catch (err) {
    actions.resultError(req, res, err);
    return;
  }

  // get the start vertex
  if (sname === "" || sname === undefined) {
    var a = graph._vertices.any();
    start = graph.getVertex(a._id);
  }
  else {
    start = graph.getVertex(sname);

    if (start === null) {
      var a = graph._vertices.byExample({ name: sname });

      if (a !== null) {
        start = graph.getVertex(a._id);
      }
    }
  }

  if (start === null) {
    actions.resultNotFound(req, res, actions.HTTP_NOT_FOUND, "name not found");
    return;
  }

  // traverse
  result = traverse2(graph, start, depth, maxlen);

  // and return
  actions.resultOk(req, res, actions.HTTP_OK, result);
};

// -----------------------------------------------------------------------------
// --SECTION--                                                       END-OF-FILE
// -----------------------------------------------------------------------------

// Local Variables:
// mode: outline-minor
// outline-regexp: "/// @brief\\|/// @addtogroup\\|// --SECTION--\\|/// @page\\|/// @}\\|/\\*jslint"
// End:
