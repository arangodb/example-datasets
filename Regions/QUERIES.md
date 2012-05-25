for u in users
  filter u.name.first == "Lynette"
  let regs = (for r in regions
                filter r.local_code == u.contact.address.state
                  return r.name)
    return { "user" : u.name, "regions" : regs }
