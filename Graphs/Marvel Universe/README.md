This dataset is taken from http://exposedata.com/marvel/.
The [http://exposedata.com/marvel/data/source.csv](Cleaned Source File) is contained in this
repository as `hero-comic-network.csv`.

Before you start please make sure you do not have collections named:
**marvel_vertices**, **marvel_edges**
and you do not have a graph called
**marvel_heros** 
These will be overwritten by the importer.


To import the data execute the following on your bash:

```Bash
 unix> ./import.sh
```

You will then have the following two collections:
* **marvel_vertices** Containing all Movies, Actors, Directores etc. and Genres of movies that can be used for traversal.
* **marvel_edges** Containing the relations between the vertices, who-acts-where, movie-has-genre etc.

Furthermore you have the graph **marvel_heros** using both collections.

The above import uses dumps of the collections. In order to recreate the collections from
the source file `hero-comic-network.csv`, you can use

```Bash
 unix> cat import.js | arangosh
 unix> arangodump --collection marvel_edges --collection marvel_vertices
```
