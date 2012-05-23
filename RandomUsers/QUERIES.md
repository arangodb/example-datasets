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


Count the number of users called Diedre
---------------------------------------

    let clinton = (for u in users filter u.name.first == "Diedre" return 1)
    return length(clinton)

You might want to add an index using the shell

    db.users.ensureHashIndex("name.first");


Last names of users called Diedre
---------------------------------

  for u in users filter u.name.first == "Diedre" return u.name.last

You might want to add an index using the shell

    db.users.ensureHashIndex("name.first");


Find out how many users live in each city
-----------------------------------------

    for u in users
      collect city = u.contact.address.city into g
      return { "city" : city, "users" : length(g) }
