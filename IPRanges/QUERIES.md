IP Address Ranges
=================

The IPRanges directory contains IP address ranges and geo information.

    {
      "locId" : "17",
      "endIpNum" : "16777471",
      "startIpNum" : "16777216", 
      "geo" : [ -27, 133 ] 
    }


Find all ranges near a location
-------------------------------

Find first 5 ranges near Cologne (latitude = 50N, longitude = 6E):

    ....

The simple query looks like

    db.ip_ranges.near(50,6).distance().limit(5).toArray()

You need an geo-index for this query (CURRENTLY NEEDS A FEW MINUTES):

    db.ip_ranges.ensureGeoIndex("geo")


Find the location of 82.10.30.40 (NOT YET IMPLEMENTED EFFICIENTLY!)
-------------------------------------------------------------------

    let x = ((82*256 + 10)*256 + 30)*256 + 40
    for loc in ip_ranges
      filter loc.startIpNum <= x && x <= loc.endIpNum
    return { "loc" : loc, "ip" : x }

Better us

    for loc in ip_ranges
      filter loc.startIpNum <= 1376394792
        filter 1376394792 <= loc.endIpNum
    return loc

You might want to add an index using the shell

    db.ip_ranges.ensureSkiplist("startIpNum")
    db.ip_ranges.ensureSkiplist("endIpNum")
