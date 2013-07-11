./dblp-download.sh
python dblp2json.py dblp.xml > dblp.json
arangoimp --type json --collection dblp --create-collection yes dblp.json

arangod --console:

```javascript
var internal = require("internal");
var fs = require("fs");

var a = fs.read("../ArangoDB-Data/DBLP/create-graph.js");
a += "main(\"dblp\", \"dblp_vertices\", \"dblp_edges\");"
internal.executeScript(a, null, "create-graph")

var b = fs.read("../ArangoDB-Data/DBLP/create-coauthor-graph.js");
b += "main(\"dblp_vertices\", \"dblp_edges\", \"dblp_coauthor\");"
internal.executeScript(b, null, "create-coauthor-graph")
```