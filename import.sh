#!/bin/bash

### Tested with OSX brew installation arangodb v3.4.7
BASE=""
ARANGOSH_PARAM="--server.password ''"

### Older versions
#BASE="/tmp/demo/bin/"
#ARANGOSH_PARAM="-s"

ARANGOIMP="${BASE}arangoimp"
ARANGOSH="${BASE}arangosh ${ARANGOSH_PARAM}"

while [ 0 -lt "$#" ];  do
  case "$1" in
    "--arangoimp")
      ARANGOIMP="$2"
      shift
      ;;

    "--arangosh")
      ARANGOSH="$2"
      shift
      ;;

    *)
      echo "$0: unknown option '$1'"
      exit 1
      ;;
  esac

  shift
done

echo "Importing 10000 fake users into 'users'"
echo "======================================="
(echo 'db._drop("users");' | eval $ARANGOSH) || exit 1
$ARANGOIMP --server.password "" --file RandomUsers/names_10000.json --collection=users --create-collection=true --type=json || exit 1
(echo 'db.users.ensureHashIndex("name.first"); db.users.ensureHashIndex("name.last");' | eval $ARANGOSH) || exit 1
(echo 'db.users.ensureHashIndex("contact.address.city"); db.users.ensureHashIndex("contact.address.zip");' | eval $ARANGOSH) || exit 1
echo
echo

echo "Importing cities into 'cities'"
echo "=============================="
(echo 'db._drop("cities");' | eval $ARANGOSH) || exit 1
$ARANGOIMP --server.password "" --file Cities/GeoLiteCity.csv --collection=cities --create-collection=true --type=csv || exit 1
(echo 'db.users.ensureGeoIndex("latitude", "longitude");' | eval $ARANGOSH) || exit 1
(echo 'db.users.ensureHashIndex("city");' | eval $ARANGOSH) || exit 1
echo
echo

echo "Importing countries into 'countries'"
echo "===================================="
(echo 'db._drop("countries");' | eval $ARANGOSH) || exit 1
$ARANGOIMP --server.password "" --file Countries/countries.csv --collection=countries --create-collection=true --type=csv || exit 1
(echo 'db.users.ensureHashIndex("name");' | eval $ARANGOSH) || exit 1
echo
echo

echo "Importing regions into 'regions'"
echo "================================"
(echo 'db._drop("regions");' | eval $ARANGOSH) || exit 1
$ARANGOIMP --server.password "" --file Regions/regions.csv --collection=regions --create-collection=true --type=csv || exit 1
(echo 'db.users.ensureHashIndex("name");' | eval $ARANGOSH) || exit 1
echo
echo

echo "Importing McDonalds France into 'mcdonalds'"
echo "==========================================="
(echo 'db._drop("mcdonalds");' | eval $ARANGOSH) || exit 1
$ARANGOIMP --server.password "" --file McDonalds/france.csv --collection=mcdonalds --create-collection=true --type=csv || exit 1
(echo 'db.users.ensureGeoIndex("lat", "long");' | eval $ARANGOSH) || exit 1
echo
echo

echo "Importing German Counties into 'bezirke'"
echo "========================================"
(echo 'db._drop("bezirke");' | eval $ARANGOSH) || exit 1
$ARANGOIMP --server.password "" --file Bezirke/bezirke.csv --collection=bezirke --create-collection=true --type=csv || exit 1
(echo 'db.users.ensureGeoIndex("lat", "long");' | eval $ARANGOSH) || exit 1
(echo 'db.users.ensureHashIndex("FULL_NAME_RO");' | eval $ARANGOSH) || exit 1
echo
echo

echo "Importing Airports into 'airports'"
echo "=================================="
(echo 'db._drop("airports");' | eval $ARANGOSH) || exit 1
$ARANGOIMP --server.password "" --file Airports/airports.csv --collection=airports --create-collection=true --type=csv || exit 1
(echo 'db.users.ensureGeoIndex("latitude_deg", "longitude_deg");' | eval $ARANGOSH) || exit 1
(echo 'db.users.ensureHashIndex("name");' | eval $ARANGOSH) || exit 1
echo
echo

echo "Importing NerdPursuit into 'nerds'"
echo "=================================="
(echo 'db._drop("nerds");' | eval $ARANGOSH) || exit 1
(cd NerdPursuit && ./nerd_pursuit_compress.sh)
(cd NerdPursuit && $ARANGOIMP --server.password "" --file nerd_pursuit_compressed.json --collection=nerds --create-collection=true --type=json) || exit 1
echo
echo
