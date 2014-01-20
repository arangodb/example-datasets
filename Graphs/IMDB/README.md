This dataset is taken from the IMDB service http://www.imdb.com.

Before you start please make sure you do not have collections named:
**imdb_vertices**, **imdb_edges**
and you do not have a graph called
**imdb** 
These will be overwritten by the importer.


To import the data execute the following on your bash:

```Bash
 unix> ./import.sh
```

You will then have the following two collections:
* **imdb_vertices** Containing all Movies, Actors, Directores etc. and Genres of movies that can be used for traversal.
* **imdb_edges** Containing the relations between the vertices, who-acts-where, movie-has-genre etc.

Furthermore you have the graph **imdb** using both collections.

The above import uses dumps of the collections. In order to recreate the collections from
the source file `hero-comic-network.csv`, you can use

```Bash
 unix> cat import.js | arangosh
 unix> arangodump --collection imdb_edges --collection imdb_vertices
```
