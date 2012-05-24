Cities
======

The Cities directory contains a list of cities with geo
information. There are roughly 320000 cities.

    locId,country,region,city,postalCode,latitude,longitude,metroCode,areaCode
    1,"O1","","","",0.0000,0.0000,,


Find all cities near a location
-------------------------------

Find first 5 ranges near Cologne (latitude = 50.9N, longitude = 6.95E):

    ....

The simple query looks like

    db.cities.near(50.93,6.95).limit(5).toArray()

You need an geo-index for this query:

    db.cities.ensureGeoIndex("latitude", "longitude")
