IP Address Ranges
=================

The IPRanges directory contains IP address ranges and geo information.

    {
      "locId" : "17",
      "endIpNum" : "16777471",
      "startIpNum" : "16777216", 
      "geo" : [ -27, 133 ] 
    }


Find the location of 82.10.30.40
--------------------------------

    let x = ((82*256 + 10)*256 + 30)*256 + 40
    for loc in ip_ranges
      filter loc.startIpNum <= x && x <= loc.endIpNum
    return { "loc" : loc, "ip" : x }

You might want to add an index using the shell (NOT YET IMPLEMENTED)

    db.ip_ranges.ensureSkiplist("startIpNum")
    db.ip_ranges.ensureSkiplist("endIpNum")
