This dataset is taken from http://exposedata.com/marvel/.
The [http://exposedata.com/marvel/data/source.csv](Cleaned Source File) is contained in this repository.

Before you start please make sure you do not have collections named:
**marvel_vertices**, **marvel_edges**
and you do not have a graph called
**marvel_heros** 
These will be overwritten by the importer.


To import the data execute the following on your bash:

```Bash
 unix> cat import.js | arangosh
```
You will then have the following two collections:
* **marvel_vertices** Containing all Movies, Actors, Directores etc. and Genres of movies that can be used for traversal.
* **marvel_edges** Containing the relations between the vertices, who-acts-where, movie-has-genre etc.

Furthermore you have the graph **marvel_heros** using both collections.
