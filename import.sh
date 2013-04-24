#!/bin/bash

BASE="/tmp/demo/bin/"
ARANGOIMP="${BASE}arangoimp"
ARANGOSH="${BASE}arangosh"

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
(echo 'db._drop("users");' | $ARANGOSH -s) || exit 1
$ARANGOIMP --file RandomUsers/names_10000.json --collection=users --create-collection=true --type=json || exit 1
(echo 'db.users.ensureHashIndex("name.first"); db.users.ensureHashIndex("name.last");' | $ARANGOSH -s) || exit 1
(echo 'db.users.ensureHashIndex("contact.address.city"); db.users.ensureHashIndex("contact.address.zip");' | $ARANGOSH -s) || exit 1
echo
echo

echo "Importing cities into 'cities'"
echo "=============================="
(echo 'db._drop("cities");' | $ARANGOSH -s) || exit 1
$ARANGOIMP --file Cities/GeoLiteCity.csv --collection=cities --create-collection=true --type=csv || exit 1
(echo 'db.users.ensureGeoIndex("latitude", "longitude");' | $ARANGOSH -s) || exit 1
(echo 'db.users.ensureHashIndex("city");' | $ARANGOSH -s) || exit 1
echo
echo

echo "Importing countries into 'countries'"
echo "===================================="
(echo 'db._drop("countries");' | $ARANGOSH -s) || exit 1
$ARANGOIMP --file Countries/countries.csv --collection=countries --create-collection=true --type=csv || exit 1
(echo 'db.users.ensureHashIndex("name");' | $ARANGOSH -s) || exit 1
echo
echo

echo "Importing regions into 'regions'"
echo "================================"
(echo 'db._drop("regions");' | $ARANGOSH -s) || exit 1
$ARANGOIMP --file Regions/regions.csv --collection=regions --create-collection=true --type=csv || exit 1
(echo 'db.users.ensureHashIndex("name");' | $ARANGOSH -s) || exit 1
echo
echo

echo "Importing McDonalds France into 'mcdonalds'"
echo "==========================================="
(echo 'db._drop("mcdonalds");' | $ARANGOSH -s) || exit 1
$ARANGOIMP --file McDonalds/france.csv --collection=mcdonalds --create-collection=true --type=csv || exit 1
(echo 'db.users.ensureGeoIndex("lat", "long");' | $ARANGOSH -s) || exit 1
echo
echo

echo "Importing German Counties into 'bezirke'"
echo "========================================"
(echo 'db._drop("bezirke");' | $ARANGOSH -s) || exit 1
$ARANGOIMP --file Bezirke/bezirke.csv --collection=bezirke --create-collection=true --type=csv || exit 1
(echo 'db.users.ensureGeoIndex("lat", "long");' | $ARANGOSH -s) || exit 1
(echo 'db.users.ensureHashIndex("FULL_NAME_RO");' | $ARANGOSH -s) || exit 1
echo
echo

echo "Importing Airports into 'airports'"
echo "=================================="
(echo 'db._drop("airports");' | $ARANGOSH -s) || exit 1
$ARANGOIMP --file Airports/airports.csv --collection=airports --create-collection=true --type=csv || exit 1
(echo 'db.users.ensureGeoIndex("latitude_deg", "longitude_deg");' | $ARANGOSH -s) || exit 1
(echo 'db.users.ensureHashIndex("name");' | $ARANGOSH -s) || exit 1
echo
echo

echo "Importing NerdPursuit into 'nerds'"
echo "=================================="
(echo 'db._drop("nerds");' | $ARANGOSH -s) || exit 1
./nerd_pursuit_compress.sh
$ARANGOIMP --file nerd_pursuit_compressed.json --collection=nerds --create-collection=true --type=json || exit 1
echo
echo
