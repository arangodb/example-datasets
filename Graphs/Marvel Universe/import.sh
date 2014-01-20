#!/bin/bash

arangosh --quiet <<EOF
  var db = require("org/arangodb").db;
  var Graph = require("org/arangodb/graph").Graph;

  db._drop("marvel_vertices");
  db._drop("marvel_edges");
  try { db._graphs.remove("marvel_heros"); } catch (err) {}

  new Graph("marvel_heros", "marvel_vertices", "marvel_edges"); 
EOF

arangorestore dump
