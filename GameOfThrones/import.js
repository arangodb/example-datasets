// Create and switch to a fresh database
const database = "GameOfThrones"
try {
  db._dropDatabase(database);
} catch(e) {}
db._createDatabase(database);
db._useDatabase(database);

// Create vertex and edge collections
let chars = db._create("Characters");
let traits = db._create("Traits");
let childof = db._createEdgeCollection("ChildOf");
let locs = db._create("Locations");

// Import documents to collections
const internal = require("internal")
chars.save(internal.load(__dirname + "/Characters.json"));
traits.save(internal.load(__dirname + "/Traits.json"));
childof.save(internal.load(__dirname + "/ChildOf.json"));
locs.save(internal.load(__dirname + "/Locations.json"));

// Add geospatial index for coordinate attribute of Locations
locs.ensureIndex({ type: "geo", fields: ["coordinate"] });

// Create named graph for visualization purposes (optional)
const graph_module = require("@arangodb/general-graph");
let graph = graph_module._create("GameOfThrones");
let rel = graph_module._relation("ChildOf", ["Characters"], ["Characters"]);
graph._extendEdgeDefinitions(rel);
