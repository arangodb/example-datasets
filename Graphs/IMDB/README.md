# IMDB Movies and Actors Graph Dataset

This dataset is taken from the Internet Movie Database <http://www.imdb.com>.

The dataset has two collections:
- **imdb_vertices**:
  Containing all Movies, Actors, Directors etc. and Genres of movies that can
  be used for traversal.
- **imdb_edges**:
  Containing the relations between the vertices, who-acts-where,
  movie-has-genre etc.

Furthermore, it comes with a named graph **imdb** using both collections.

## Remarks

The attributes `birthday` and `lastModified` are Unix timestamps in milliseconds,
but they are stored as strings. `releaseDate` is stored as number.

## Restore from dump

To restore the data from the dump into a new database `IMDB`, execute the
following on your bash:

```bash
 unix> arangorestore --server.endpoint tcp://<host>:<port> --server.database IMDB --create-database --include-system-collections
```

To restore the dump with default settings you may run the following instead:

```bash
 unix> ./import.sh
```

## Import from source files

Before you start, please make sure you do not have **collections** named:
- **imdb_vertices**
- **imdb_edges**
and that you do not have a **graph** called:
- **imdb**

These will be overwritten by the importer!

To import the data from the `nodes.json` and `edges.json` source files into the
`_system` collection, run this on your bash:

```bash
 unix> arangosh --server.endpoint tcp://<host>:<port> --javascript.execute ./import.js
```

## Create new dump

To create a new dump of the imported data including the two collections and
the graph, run:

```bash
 unix> arangodump --server.endpoint tcp://<host>:<port> --server.database <database> --include-system-collections --collection _graphs --collection imdb_vertices --collection imdb_edges --compress-output false --envelope true
```
