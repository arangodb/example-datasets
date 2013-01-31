/*jslint indent: 2, nomen: true, maxlen: 100, sloppy: true, vars: true, white: true, regexp: true plusplus: true */
/*global require, exports, module */

var actions = require("org/arangodb/actions");
var graph = require("org/arangodb/graph");
var traversal = require("org/arangodb/graph/traversal");
var console = require("console");

var Graph = graph.Graph;
var Traverser = traversal.Traverser;

// -----------------------------------------------------------------------------
// --SECTION--                                                 private functions
// -----------------------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////
/// @brief coauthor visitor
////////////////////////////////////////////////////////////////////////////////

function coauthorVisitor (maxlen) {
  return function (config, result, vertex, path) {
    var name = vertex.name;
    var len = path.vertices.length;
    var pos;

    if (result.positions.hasOwnProperty(name)) {
      pos = result.positions[name];
    }
    else {
      pos = result.vertices.length;

      if (maxlen <= pos) {
	return;
      }

      result.positions[name] = pos;
      result.vertices.push({ name: name, depth: len - 1 });
    }

    if (1 < len) {
      var peer = path.vertices[len - 2];
      var pname = peer.name;

      if (result.positions.hasOwnProperty(pname)) {
	var edge = path.edges[len - 2];
	var ppos = result.positions[pname];
	var year = edge.year;

	result.links.push({ source: pos, target: ppos, year: year, count: edge.count });

	if (result.minYear === 0 || result.minYear > year) {
	  result.minYear = year;
	}

	if (result.maxYear === 0 || result.maxYear < year) {
	  result.maxYear = year;
	}
      }
    }
  };
}

////////////////////////////////////////////////////////////////////////////////
/// @brief traverses the coauthor graph
////////////////////////////////////////////////////////////////////////////////

function coauthorTraverse (graph, start, depth, maxlen) {
  var config = {
    datasource: traversal.collectionDatasourceFactory(graph._edges),
    strategy: Traverser.BREADTH_FIRST,
    expander: traversal.anyExpander,
    filter: traversal.maxDepthFilter,
    maxDepth: depth,
    uniqueness: { edges: Traverser.UNIQUE_GLOBAL, vertices: Traverser.UNIQUE_NONE },
    visitor: coauthorVisitor(maxlen)
  };

  var traverser = new Traverser(config);

  var result = { positions: {}, vertices: [], links: [], minYear: 0, maxYear: 0 };
  var first = graph._vertices.firstExample({ name: start });

  if (first !== null) {
    traverser.traverse(result, first);
  }

  return {
    start: start,
    depth: depth,
    minYear: result.minYear,
    maxYear: result.maxYear,
    vertices: result.vertices,
    links: result.links };
}

////////////////////////////////////////////////////////////////////////////////
/// @brief coauthor visitor
////////////////////////////////////////////////////////////////////////////////

function dblpVisitor (maxlen) {
  return function (config, result, vertex, path) {
    var key = vertex._key;
    var len = path.vertices.length;
    var pos;

    if (result.positions.hasOwnProperty(key)) {
      pos = result.positions[key];
    }
    else {
      pos = result.vertices.length;

      if (maxlen <= pos) {
	return;
      }

      result.positions[key] = pos;

      if (vertex.type === "person") {
	result.vertices.push({
	  type: vertex.type,
	  key: key,
	  text: vertex.name,
	  depth: len - 1
	});
      }
      else {
	result.vertices.push({
	  type: vertex.type,
	  key: key,
	  text: vertex.title,
	  depth: len - 1
	});
      }
    }

    if (1 < len) {
      var peer = path.vertices[len - 2];
      var pkey = peer._key;

      if (result.positions.hasOwnProperty(pkey)) {
	var edge = path.edges[len - 2];
	var ppos = result.positions[pkey];

	result.links.push({ source: pos, target: ppos, type: edge.$label });
      }
    }
  };
}

////////////////////////////////////////////////////////////////////////////////
/// @brief traverses the dblp graph
////////////////////////////////////////////////////////////////////////////////

function dblpTraverse (graph, start, depth, maxlen) {
  var config = {
    datasource: traversal.collectionDatasourceFactory(graph._edges),
    strategy: Traverser.DEPTH_FIRST,
    expander: traversal.anyExpander,
    filter: traversal.maxDepthFilter,
    maxDepth: depth,
    uniqueness: { edges: Traverser.UNIQUE_GLOBAL, vertices: Traverser.UNIQUE_NONE },
    visitor: dblpVisitor(maxlen)
  };

  var traverser = new Traverser(config);

  var result = { positions: {}, vertices: [], links: [], minYear: 0, maxYear: 0 };
  var first = graph._vertices.document(start);

  if (first !== null) {
    traverser.traverse(result, first);
  }

  return {
    start: start,
    depth: depth,
    vertices: result.vertices,
    links: result.links };
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
/// - maxlen: maximal number of vertices to return.
/// - vertices: The list of vertices. A vertex has one attribute, the name of
///             the author.
/// - links: The coauthor relation. A link has the attributes `from`, `to`,
///          `year`, and `count`. `from` and `to` are positions in `vertices`.
////////////////////////////////////////////////////////////////////////////////

exports.coauthor = function (req, res) {
  var gname = req.parameters.graph || "coauthor";
  var sname = req.parameters.start;
  var depth = 2;
  var start;
  var graph;
  var result;
  var maxlen = 200;

  if (req.parameters.hasOwnProperty("depth")) {
    depth = parseInt(req.parameters.depth,10);
  }

  if (req.parameters.hasOwnProperty("maxlen")) {
    maxlen = parseInt(req.parameters.maxlen,10);
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

    start = a.name;
  }
  else {
    start = sname;
  }

  // traverse
  result = coauthorTraverse(graph, start, depth, maxlen);

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
///   "text" : "John Boates" 
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
///   "text" : "Implementation relations and test generation for systems with distributed interfaces."
/// }
/// @endcode
////////////////////////////////////////////////////////////////////////////////

exports.dblp = function (req, res) {
  var gname = req.parameters.graph || "dblp";
  var sname = req.parameters.start;
  var depth = 3;
  var start;
  var graph;
  var result;
  var maxlen = 200;

  if (req.parameters.hasOwnProperty("depth")) {
    depth = parseInt(req.parameters.depth,10);
  }

  if (req.parameters.hasOwnProperty("maxlen")) {
    maxlen = parseInt(req.parameters.maxlen,10);
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
    start = graph._vertices.any()._key;
  }
  else {
    start = sname;
  }

  // traverse
  result = dblpTraverse(graph, start, depth, maxlen);

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
