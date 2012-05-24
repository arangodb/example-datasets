Airports
========

The Airports directory contains a list of airports with geo information. There
are roughly 44000 airports.

    "id","ident","type","name","latitude_deg","longitude_deg","elevation_ft","continent","iso_country","iso_region","municipality","scheduled_service","gps_code","iata_code","local_code","home_link","wikipedia_link","keywords"
    6523,"00A","heliport","Total Rf Heliport",40.07080078125,-74.9336013793945,11,"NA","US","US-PA","Bensalem","no","00A",,"00A",,,


Find all airports near a location
---------------------------------

Find first 5 ranges near Cologne (latitude = 50N, longitude = 6E):

    ....

The simple query looks like

    db.airports.near(50,6).distance().limit(5).toArray()
    db.airports.near(50,6).distance().limit(5).toArray().map(function(d) { return { name: d.name, distance: d.distance } })

You need an geo-index for this query:

    db.airports.ensureGeoIndex("latitude_deg", "longitude_deg")
