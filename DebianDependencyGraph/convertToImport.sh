#!/bin/bash

# this shell script "converts" the arangodump compatible format into something arangoimp can use.

mkdir import
for i in *data*; do
    COLNAME=`echo $i|sed "s;_.*;;"`
    if test -n "${COLNAME}"; then
        echo $COLNAME
        cat  $i |sed -e 's;^{"type":2300,"data":;;'  -e "s;}$;;"  > import/${COLNAME}.json
    fi
done

cat _graphs_*.data.json |sed -e 's;^{"type":2300,"data":;;'  -e "s;}$;;"  > import/graph_definition.json
