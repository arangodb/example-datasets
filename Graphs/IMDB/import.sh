#!/bin/bash

${ARANGODB_BIN}arangosh --quiet <<EOF
  var db = require('@arangodb').db;
  var gm = require('@arangodb/general-graph');

  db._drop('imdb_vertices');
  db._drop('imdb_edges');

  try {
    // db._graphs.remove('imdb');
    gm._drop('imdb', true);
  } catch (err) {}

  var g = gm._create('imdb');
  g._addVertexCollection('imdb_vertices');
  var rel = gm._relation('imdb_edges', 'imdb_vertices', 'imdb_vertices')
  g._extendEdgeDefinitions(rel);
EOF

${ARANGODB_BIN}arangorestore dump
