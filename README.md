Fake user data
==============

The "RandumUsers" directory contains files with random users. 

    {
      "name": {
	"first": "Diedre",
	"last": "Clinton"
      },
      "gender": "female",
      "birthday": "1959-11-06",
      "contact": {
	"address": {
	  "street": "2 Fraser Ave",
	  "zip": "81223",
	  "city": "Cotopaxi",
	  "state":"CO"
	},
	"email": ["diedre.clinton@nosql-matters.org",
		  "clinton@nosql-matters.org",
		  "diedre@nosql-matters.org"],
	"region": "719",
	"phone": ["719-7055896"]
      },
      "likes": ["swimming"],
      "memberSince":"2009-03-14"
    }


Importing the data
------------------

In order to import these users, use:

    ./arangoimp --file names_XXX.json --collection=users --create-collection=true --type=json

where XXX is 100, 1000, 10000, 100000, 200000, 300000.


IP Address Ranges
=================

The IPRanges directory contains IP address ranges and geo information.

    {
      "locId" : "17",
      "endIpNum" : "16777471",
      "startIpNum" : "16777216", 
      "geo" : [ -27, 133 ] 
    }


Importing the data
------------------

In order to import these locations, use:

    ./arangoimp --file geoblocks.json --collection=ip_ranges --create-collection=true --type=json
